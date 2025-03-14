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

		self.pyodide = await loadPyodide({
			indexURL: self.indexURL
		});
		
		// Configure micropip for better package installation
		await self.pyodide.runPythonAsync(`
import micropip
import sys

# Set up better error handling for package installation
def configure_micropip():
    try:
        # Try to add alternative indices for redundancy
        # This is wrapped in a function to handle imports cleanly
        micropip.install('packaging')
    except Exception as e:
        print(f"Warning: Initial micropip setup error: {e}")

try:
    configure_micropip()
except Exception as e:
    print(f"Warning: Could not configure micropip: {e}")
`);
	}
};

const installPackage = async (packageName: string): Promise<boolean> => {
	try {
		await self.pyodide.runPythonAsync(`
import micropip
try:
    micropip.install('${packageName}', keep_going=True)
    print(f"Successfully installed {packageName}")
except Exception as e:
    print(f"Error installing {packageName}: {e}")
    # Try fallback method
    try:
        micropip.install('${packageName}', index_urls=["https://pypi.org/pypi/{package_name}/json"])
        print(f"Successfully installed {packageName} using fallback method")
    except Exception as e2:
        print(f"All installation methods failed for {packageName}: {e2}")
        raise RuntimeError(f"Could not install {packageName}")
`);
		return true;
	} catch (error) {
		console.error(`Failed to install package ${packageName}:`, error);
		return false;
	}
};

const executeCode = async (id: string, code: string) => {
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

	try {
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
		const knownPackages = ['numpy', 'pandas', 'matplotlib', 'seaborn', 'scikit-learn', 'scipy'];
		
		// Try to pre-install packages that are imported in the code
		for (const pkg of potentialPackages) {
			if (knownPackages.includes(pkg)) {
				self.postMessage({ type: 'stdout', id, package: true, message: `[package] Checking/installing ${pkg}...` });
				await installPackage(pkg);
			}
		}

		// Dynamically load required packages based on imports in the Python code
		await self.pyodide.loadPackagesFromImports(code, {
			messageCallback: (msg: string) => {
				self.postMessage({ type: 'stdout', id, package: true, message: `[package] ${msg}` });
			},
			errorCallback: (msg: string) => {
				self.postMessage({ type: 'stderr', id, package: true, message: `[package] ${msg}` });
			}
		});

		// Execute the Python code
		const result = await self.pyodide.runPythonAsync(code);
		self.cells[id].result = result;
		self.cells[id].status = 'completed';
	} catch (error) {
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
			await initializePyodide();
			self.postMessage({ type: 'initialized' });
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
