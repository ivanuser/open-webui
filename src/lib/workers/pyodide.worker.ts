import { loadPyodide, type PyodideInterface } from 'pyodide';

declare global {
	interface Window {
		stdout: string | null;
		stderr: string | null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		result: any;
		pyodide: PyodideInterface;
		packages: string[];
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	}
}

async function loadPyodideAndPackages(packages: string[] = []) {
	self.stdout = null;
	self.stderr = null;
	self.result = null;

	try {
		// First, attempt to load Pyodide
		console.log('Loading Pyodide...');
		self.pyodide = await loadPyodide({
			indexURL: '/pyodide/',
			stdout: (text) => {
				console.log('Python output:', text);
				if (self.stdout) {
					self.stdout += `${text}\n`;
				} else {
					self.stdout = `${text}\n`;
				}
			},
			stderr: (text) => {
				console.error('Python error:', text);
				if (self.stderr) {
					self.stderr += `${text}\n`;
				} else {
					self.stderr = `${text}\n`;
				}
			}
		});
		console.log('Pyodide loaded successfully');

		// Ensure we have a mount directory for file operations
		let mountDir = '/mnt';
		self.pyodide.FS.mkdirTree(mountDir);

		// Load micropip for package management
		console.log('Loading micropip...');
		try {
			await self.pyodide.loadPackage('micropip');
			console.log('Micropip loaded successfully');
		} catch (err) {
			console.error('Error loading micropip:', err);
			if (self.stderr) {
				self.stderr += `\nError loading micropip: ${err.toString()}\n`;
			} else {
				self.stderr = `\nError loading micropip: ${err.toString()}\n`;
			}
			throw err;
		}

		// Configure micropip
		await self.pyodide.runPythonAsync(`
			import micropip
			print("Micropip imported successfully")
			
			# Configure micropip to retry on failure
			try:
				# Setup error handling for package installation
				import sys
				def pip_error_handler(e):
					print(f"Warning during package installation: {e}")
				
				micropip._post_install_hooks.append(pip_error_handler)
				print("Micropip configured with error handling")
			except Exception as e:
				print(f"Error configuring micropip: {e}")
		`);

		// Install requested packages if any
		if (packages && packages.length > 0) {
			console.log('Installing packages:', packages);
			
			// Install packages one by one with error handling
			for (const pkg of packages) {
				try {
					console.log(`Installing ${pkg}...`);
					
					// Try multiple installation methods
					await self.pyodide.runPythonAsync(`
						import micropip
						try:
							print(f"Attempting to install {repr("${pkg}")}")
							await micropip.install("${pkg}")
							print(f"Successfully installed {repr("${pkg}")}")
						except Exception as e:
							print(f"Error installing {repr("${pkg}")}: {e}")
							try:
								# Try alternative installation
								print(f"Trying alternative installation for {repr("${pkg}")}")
								await micropip.install("${pkg}", keep_going=True)
								print(f"Alternative installation successful for {repr("${pkg}")}")
							except Exception as e2:
								print(f"Alternative installation also failed: {e2}")
								raise Exception(f"Failed to install {repr("${pkg}")}")
					`);
				} catch (err) {
					console.error(`Error installing ${pkg}:`, err);
					// Continue with other packages even if one fails
				}
			}
		}
		
		// Setup matplotlib if needed
		if (packages.includes('matplotlib')) {
			await setupMatplotlib();
		}

	} catch (err) {
		console.error('Error in loadPyodideAndPackages:', err);
		if (self.stderr) {
			self.stderr += `\nError loading Pyodide or packages: ${err.toString()}\n`;
		} else {
			self.stderr = `\nError loading Pyodide or packages: ${err.toString()}\n`;
		}
	}
}

async function setupMatplotlib() {
	try {
		// Override plt.show() to return base64 image
		await self.pyodide.runPythonAsync(`
import base64
import os
from io import BytesIO

# Configure non-interactive backend for matplotlib
os.environ["MPLBACKEND"] = "AGG"

try:
    import matplotlib.pyplot
    
    _old_show = matplotlib.pyplot.show
    
    def show(*, block=None):
        buf = BytesIO()
        matplotlib.pyplot.savefig(buf, format="png")
        buf.seek(0)
        # encode to a base64 str
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        matplotlib.pyplot.clf()
        buf.close()
        print(f"data:image/png;base64,{img_str}")
    
    matplotlib.pyplot.show = show
    print("Matplotlib configured for image output")
except ImportError as e:
    print(f"Could not configure matplotlib: {e}")
except Exception as e:
    print(f"Error setting up matplotlib: {e}")
`);
	} catch (err) {
		console.error('Error setting up matplotlib:', err);
	}
}

self.onmessage = async (event) => {
	const { id, code, ...context } = event.data;

	console.log('Received message:', event.data);

	// The worker copies the context in its own "memory" (an object mapping name to values)
	for (const key of Object.keys(context)) {
		self[key] = context[key];
	}

	// Make sure loading is done
	try {
		await loadPyodideAndPackages(self.packages);
		
		// Check for imports in the code
		if (code.includes('import')) {
			// Pre-install common packages that might be imported
			const importMatches = code.match(/import\s+([a-zA-Z0-9_.]+)|from\s+([a-zA-Z0-9_.]+)\s+import/g);
			
			if (importMatches) {
				const commonPackages = {
					'numpy': 'numpy',
					'pandas': 'pandas', 
					'matplotlib': 'matplotlib',
					'seaborn': 'seaborn',
					'scipy': 'scipy',
					'sklearn': 'scikit-learn'
				};
				
				const packagesToInstall = [];
				
				for (const match of importMatches) {
					for (const [importName, packageName] of Object.entries(commonPackages)) {
						if (match.includes(importName) && !self.packages.includes(packageName)) {
							packagesToInstall.push(packageName);
						}
					}
				}
				
				if (packagesToInstall.length > 0) {
					console.log('Installing packages needed for imports:', packagesToInstall);
					await loadPyodideAndPackages(packagesToInstall);
				}
			}
		}
		
		// Execute the code
		self.result = await self.pyodide.runPythonAsync(code);
		
		// Process the result
		self.result = processResult(self.result);
		console.log('Python result:', self.result);
	} catch (error) {
		console.error('Error executing Python code:', error);
		self.stderr = error.toString();
	}

	self.postMessage({ id, result: self.result, stdout: self.stdout, stderr: self.stderr });
};

function processResult(result: any): any {
	// Catch and always return JSON-safe string representations
	try {
		if (result == null) {
			// Handle null and undefined
			return null;
		}
		if (typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
			// Handle primitive types directly
			return result;
		}
		if (typeof result === 'bigint') {
			// Convert BigInt to a string for JSON-safe representation
			return result.toString();
		}
		if (Array.isArray(result)) {
			// If it's an array, recursively process items
			return result.map((item) => processResult(item));
		}
		if (typeof result.toJs === 'function') {
			// If it's a Pyodide proxy object (e.g., Pandas DF, Numpy Array), convert to JS and process recursively
			return processResult(result.toJs());
		}
		if (typeof result === 'object') {
			// Convert JS objects to a recursively serialized representation
			const processedObject: { [key: string]: any } = {};
			for (const key in result) {
				if (Object.prototype.hasOwnProperty.call(result, key)) {
					processedObject[key] = processResult(result[key]);
				}
			}
			return processedObject;
		}
		// Stringify anything that's left (e.g., Proxy objects that cannot be directly processed)
		return JSON.stringify(result);
	} catch (err) {
		// In case something unexpected happens, we return a stringified fallback
		return `[processResult error]: ${err.message || err.toString()}`;
	}
}

export default {};
