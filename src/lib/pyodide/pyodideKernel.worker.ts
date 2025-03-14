import { loadPyodide, type PyodideInterface } from 'pyodide';

declare global {
	interface Window {
		stdout: string | null;
		stderr: string | null;
		pyodide: PyodideInterface;
		cells: Record<string, CellState>;
		indexURL: string;
	}
}

type CellState = {
	id: string;
	status: 'idle' | 'running' | 'completed' | 'error';
	result: any;
	stdout: string;
	stderr: string;
};

const initializePyodide = async () => {
	// Ensure Pyodide is loaded once and cached in the worker's global scope
	if (!self.pyodide) {
		self.indexURL = '/pyodide/';
		self.stdout = '';
		self.stderr = '';
		self.cells = {};

		try {
			console.log('Loading Pyodide...');
			self.pyodide = await loadPyodide({
				indexURL: self.indexURL
			});
			console.log('Pyodide loaded successfully');
			
			// Initialize micropip
			try {
				console.log('Loading micropip...');
				await self.pyodide.loadPackage('micropip');
				console.log('Micropip loaded successfully');
				
				// Configure micropip for better reliability
				await self.pyodide.runPythonAsync(`
import micropip
import sys

# Configure error handling
def setup_micropip():
    try:
        import micropip
        print("Micropip imported successfully")
        
        # Setup for package installation with better error handling
        def on_install_progress(package, msg):
            print(f"Package {package}: {msg}")
            
        # Preload a few essential packages for better experience
        packages_to_load = ['numpy', 'pandas', 'matplotlib']
        for pkg in packages_to_load:
            try:
                print(f"Pre-installing {pkg}...")
                await micropip.install(pkg, keep_going=True)
                print(f"Successfully pre-installed {pkg}")
            except Exception as e:
                print(f"Warning: Could not pre-install {pkg}: {e}")
                
    except Exception as e:
        print(f"Error in micropip setup: {e}")

# Run setup
await setup_micropip()
`);
				console.log('Micropip configured');

			} catch (err) {
				console.error('Error initializing micropip:', err);
				throw err;
			}
		} catch (err) {
			console.error('Error initializing Pyodide:', err);
			throw err;
		}
	}
};

const installPackage = async (packageName: string): Promise<boolean> => {
	try {
		console.log(`Installing package: ${packageName}`);
		await self.pyodide.runPythonAsync(`
import micropip
try:
    print(f"Attempting to install {repr("${packageName}")}")
    await micropip.install("${packageName}")
    print(f"Successfully installed {repr("${packageName}")}")
except Exception as e:
    print(f"Error installing {repr("${packageName}")}: {e}")
    try:
        # Try alternative installation
        print(f"Trying alternative installation for {repr("${packageName}")}")
        await micropip.install("${packageName}", keep_going=True)
        print(f"Alternative installation successful for {repr("${packageName}")}")
    except Exception as e2:
        print(f"Alternative installation also failed: {e2}")
        raise Exception(f"Failed to install {repr("${packageName}")}")
`);
		return true;
	} catch (error) {
		console.error(`Failed to install package ${packageName}:`, error);
		return false;
	}
};

const executeCode = async (id: string, code: string) => {
	try {
		if (!self.pyodide) {
			await initializePyodide();
		}

		// Update the cell state to "running"
		self.cells[id] = {
			id,
			status: 'running',
			result: null,
			stdout: '',
			stderr: ''
		};

		// Redirect stdout/stderr to stream updates
		self.pyodide.setStdout({
			batched: (msg: string) => {
				self.cells[id].stdout += msg;
				self.postMessage({ type: 'stdout', id, message: msg });
			}
		});
		self.pyodide.setStderr({
			batched: (msg: string) => {
				self.cells[id].stderr += msg;
				self.postMessage({ type: 'stderr', id, message: msg });
			}
		});

		// Pre-check for imports in the code
		const importRegex = /\bimport\s+([a-zA-Z0-9_.,\s]+)|\bfrom\s+([a-zA-Z0-9_.]+)\s+import/g;
		const matches = Array.from(code.matchAll(importRegex));
		const potentialPackages = new Set<string>();
		
		for (const match of matches) {
			const importNames = match[1] || match[2];
			if (importNames) {
				// Extract potential package names and clean them
				importNames.split(',').forEach(name => {
					const cleaned = name.trim().split('.')[0].split(' ')[0];
					if (cleaned && !cleaned.startsWith('_')) {
						potentialPackages.add(cleaned);
					}
				});
			}
		}
		
		// Common packages that might need installation
		const packageMap: Record<string, string> = {
			'numpy': 'numpy',
			'pandas': 'pandas',
			'matplotlib': 'matplotlib',
			'seaborn': 'seaborn',
			'scipy': 'scipy',
			'sklearn': 'scikit-learn'
		};
		
		// Try to pre-install packages that are imported in the code
		for (const pkg of potentialPackages) {
			if (packageMap[pkg]) {
				self.postMessage({ type: 'stdout', id, package: true, message: `[package] Checking/installing ${pkg}...` });
				await installPackage(packageMap[pkg]);
			}
		}

		// Configure matplotlib if it appears to be used
		if (potentialPackages.has('matplotlib')) {
			await self.pyodide.runPythonAsync(`
import os
os.environ["MPLBACKEND"] = "AGG"

try:
    import matplotlib.pyplot as plt
    
    # Override plt.show() to return base64 image
    import base64
    from io import BytesIO
    
    def show(*, block=None):
        buf = BytesIO()
        plt.savefig(buf, format="png")
        buf.seek(0)
        # encode to a base64 str
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        plt.clf()
        buf.close()
        print(f"data:image/png;base64,{img_str}")
    
    plt.show = show
except Exception as e:
    print(f"Error configuring matplotlib: {e}")
`);
		}

		// Dynamically load any remaining required packages
		try {
			await self.pyodide.loadPackagesFromImports(code, {
				messageCallback: (msg: string) => {
					self.postMessage({ type: 'stdout', id, package: true, message: `[package] ${msg}` });
				},
				errorCallback: (msg: string) => {
					self.postMessage({ type: 'stderr', id, package: true, message: `[package] ${msg}` });
				}
			});
		} catch (error) {
			console.error('Error loading packages from imports:', error);
			self.postMessage({ 
				type: 'stderr', 
				id, 
				package: true, 
				message: `[package] Error loading packages: ${error.toString()}` 
			});
			// Continue execution anyway - the error might be non-critical
		}

		// Execute the Python code
		const result = await self.pyodide.runPythonAsync(code);
		self.cells[id].result = result;
		self.cells[id].status = 'completed';
	} catch (error) {
		console.error('Error executing code:', error);
		self.cells[id].status = 'error';
		self.cells[id].stderr += `\n${error.toString()}`;
	} finally {
		// Notify parent thread when execution completes
		self.postMessage({
			type: 'result',
			id,
			state: self.cells[id]
		});
	}
};

// Handle messages from the main thread
self.onmessage = async (event) => {
	const { type, id, code, ...args } = event.data;

	switch (type) {
		case 'initialize':
			try {
				await initializePyodide();
				self.postMessage({ type: 'initialized' });
			} catch (error) {
				console.error('Initialization error:', error);
				self.postMessage({ 
					type: 'error', 
					error: error.toString(),
					message: 'Failed to initialize Pyodide environment'
				});
			}
			break;

		case 'execute':
			if (id && code) {
				await executeCode(id, code);
			}
			break;

		case 'getState':
			self.postMessage({
				type: 'kernelState',
				state: self.cells
			});
			break;

		case 'terminate':
			// Explicitly clear the worker for cleanup
			for (const key in self.cells) delete self.cells[key];
			self.close();
			break;

		default:
			console.error(`Unknown message type: ${type}`);
	}
};
