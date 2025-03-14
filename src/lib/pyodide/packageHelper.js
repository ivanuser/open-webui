/**
 * This file provides utilities for installing Python packages in Pyodide
 * with improved error handling and fallback mechanisms
 */

/**
 * Installs a Python package with improved error handling and multiple fallbacks
 * @param {Object} pyodide - The Pyodide instance
 * @param {string} packageName - The name of the package to install
 */
export async function installPackage(pyodide, packageName) {
  const micropip = pyodide.pyimport('micropip');
  
  // Try different installation strategies
  const strategies = [
    // Strategy 1: Direct installation
    async () => {
      try {
        await micropip.install(packageName);
        return true;
      } catch (e) {
        console.warn(`Failed to install ${packageName} using direct installation: ${e}`);
        return false;
      }
    },
    
    // Strategy 2: Use PyPI via proxy
    async () => {
      try {
        await pyodide.runPythonAsync(`
import micropip
micropip.install("${packageName}", index_urls=["/pypi/{package_name}/json"])
        `);
        return true;
      } catch (e) {
        console.warn(`Failed to install ${packageName} using PyPI proxy: ${e}`);
        return false;
      }
    },
    
    // Strategy 3: Use CDN fallback
    async () => {
      try {
        // Some packages have wheel distributions at these CDNs
        await pyodide.runPythonAsync(`
import micropip
micropip.install("${packageName}", index_urls=[
    "https://cdn.jsdelivr.net/pypi/${packageName}/json",
    "https://files.pythonhosted.org/packages/py3/${packageName[0]}/${packageName}/"
])
        `);
        return true;
      } catch (e) {
        console.warn(`Failed to install ${packageName} using CDN fallback: ${e}`);
        return false;
      }
    }
  ];
  
  // Try each strategy in sequence
  for (const strategy of strategies) {
    if (await strategy()) {
      console.log(`Successfully installed ${packageName}`);
      return true;
    }
  }
  
  // If we get here, all strategies failed
  throw new Error(`Failed to install ${packageName} after trying all strategies`);
}

/**
 * Installs predefined packages often used in data science
 * @param {Object} pyodide - The Pyodide instance 
 */
export async function installDataSciencePackages(pyodide) {
  // Install core packages first
  const corePackages = ['numpy', 'pandas', 'matplotlib'];
  
  try {
    for (const pkg of corePackages) {
      await installPackage(pyodide, pkg);
    }
    
    // Now try installing seaborn which depends on the core packages
    await installPackage(pyodide, 'seaborn');
    
    return true;
  } catch (e) {
    console.error('Failed to install data science packages:', e);
    return false;
  }
}
