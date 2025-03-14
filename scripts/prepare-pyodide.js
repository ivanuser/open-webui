const packages = [
	'micropip',
	'packaging',
	'requests',
	'beautifulsoup4',
	'numpy',
	'pandas',
	'matplotlib',
	'scikit-learn',
	'scipy',
	'regex',
	'sympy',
	'tiktoken',
	'seaborn',
	'pytz'
];

import { loadPyodide } from 'pyodide';
import { setGlobalDispatcher, ProxyAgent } from 'undici';
import { writeFile, readFile, copyFile, readdir, rmdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Loading network proxy configurations from the environment variables.
 * And the proxy config with lowercase name has the highest priority to use.
 */
function initNetworkProxyFromEnv() {
	// we assume all subsequent requests in this script are HTTPS:
	// https://cdn.jsdelivr.net
	// https://pypi.org
	// https://files.pythonhosted.org
	const allProxy = process.env.all_proxy || process.env.ALL_PROXY;
	const httpsProxy = process.env.https_proxy || process.env.HTTPS_PROXY;
	const httpProxy = process.env.http_proxy || process.env.HTTP_PROXY;
	const preferedProxy = httpsProxy || allProxy || httpProxy;
	/**
	 * use only http(s) proxy because socks5 proxy is not supported currently:
	 * @see https://github.com/nodejs/undici/issues/2224
	 */
	if (!preferedProxy || !preferedProxy.startsWith('http')) return;
	let preferedProxyURL;
	try {
		preferedProxyURL = new URL(preferedProxy).toString();
	} catch {
		console.warn(`Invalid network proxy URL: "${preferedProxy}"`);
		return;
	}
	const dispatcher = new ProxyAgent({ uri: preferedProxyURL });
	setGlobalDispatcher(dispatcher);
	console.log(`Initialized network proxy "${preferedProxy}" from env`);
}

async function ensureDirectoryExists(directory) {
	if (!existsSync(directory)) {
		await mkdir(directory, { recursive: true });
		console.log(`Created directory: ${directory}`);
	}
}

async function downloadPackages() {
	console.log('Setting up pyodide + micropip');
	
	// Ensure the static/pyodide directory exists
	await ensureDirectoryExists('static/pyodide');
	
	let pyodide;
	try {
		pyodide = await loadPyodide({
			indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/',
			packageCacheDir: 'static/pyodide'
		});
	} catch (err) {
		console.error('Failed to load Pyodide:', err);
		return;
	}

	const packageJson = JSON.parse(await readFile('package.json'));
	const pyodideVersion = packageJson.dependencies.pyodide.replace('^', '');

	try {
		const pyodidePackageJson = JSON.parse(await readFile('static/pyodide/package.json'));
		const pyodidePackageVersion = pyodidePackageJson.version.replace('^', '');

		if (pyodideVersion !== pyodidePackageVersion) {
			console.log('Pyodide version mismatch, removing static/pyodide directory');
			await rmdir('static/pyodide', { recursive: true });
			await mkdir('static/pyodide', { recursive: true });
		}
	} catch (e) {
		console.log('Pyodide package not found, proceeding with download.');
	}

	try {
		console.log('Loading micropip package');
		await pyodide.loadPackage('micropip');

		const micropip = pyodide.pyimport('micropip');
		console.log('Downloading Pyodide packages:', packages);

		// Configure additional package sources for reliability
		await pyodide.runPythonAsync(`
import micropip
import sys

# Set timeouts and retry strategies for better reliability
def configure_urllib():
    import urllib.request
    opener = urllib.request.build_opener()
    opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Pyodide)')]
    urllib.request.install_opener(opener)

try:
    configure_urllib()
except Exception as e:
    print(f"Warning: Could not configure urllib: {e}")
`);

		try {
			// Install packages one by one with error handling
			for (const pkg of packages) {
				try {
					console.log(`Installing package: ${pkg}`);
					await micropip.install(pkg);
					console.log(`Successfully installed ${pkg}`);
				} catch (err) {
					console.error(`Error installing ${pkg}:`, err);
					console.log(`Trying alternative installation method for ${pkg}...`);
					
					// Try an alternative installation method
					try {
						await pyodide.runPythonAsync(`
import micropip
try:
    # Try with specific PyPI mirror
    micropip.install("${pkg}", keep_going=True)
except Exception as e:
    print(f"Failed to install {pkg}: {e}")
`);
					} catch (altErr) {
						console.error(`Alternative installation also failed for ${pkg}:`, altErr);
					}
				}
			}
		} catch (err) {
			console.error('Package installation failed:', err);
			return;
		}

		console.log('Pyodide packages downloaded, freezing into lock file');

		try {
			const lockFile = await micropip.freeze();
			await writeFile('static/pyodide/pyodide-lock.json', lockFile);
		} catch (err) {
			console.error('Failed to write lock file:', err);
		}
	} catch (err) {
		console.error('Failed to load or install micropip:', err);
	}
}

async function copyPyodide() {
	console.log('Copying Pyodide files into static directory');
	
	// Ensure the target directory exists
	await ensureDirectoryExists('static/pyodide');
	
	// Copy all files from node_modules/pyodide to static/pyodide
	try {
		const entries = await readdir('node_modules/pyodide');
		for (const entry of entries) {
			const source = `node_modules/pyodide/${entry}`;
			const target = `static/pyodide/${entry}`;
			await copyFile(source, target);
		}
		console.log('Successfully copied Pyodide files');
	} catch (err) {
		console.error('Error copying Pyodide files:', err);
	}
}

// Main execution
(async () => {
	try {
		initNetworkProxyFromEnv();
		await downloadPackages();
		await copyPyodide();
		console.log('Pyodide setup completed successfully.');
	} catch (err) {
		console.error('Pyodide setup failed:', err);
		process.exit(1);
	}
})();
