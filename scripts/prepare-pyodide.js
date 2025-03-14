import { copyFile, readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Simple script to copy Pyodide files from node_modules to static directory
 * This avoids trying to run Pyodide in Node.js, which can be problematic
 */

async function ensureDirectoryExists(directory) {
  if (!existsSync(directory)) {
    await mkdir(directory, { recursive: true });
    console.log(`Created directory: ${directory}`);
  }
}

async function copyPyodideFiles() {
  console.log('Copying Pyodide files to static directory...');
  
  const sourceDir = 'node_modules/pyodide';
  const targetDir = 'static/pyodide';
  
  // Ensure target directory exists
  await ensureDirectoryExists(targetDir);
  
  try {
    // Get list of files in source directory
    const files = await readdir(sourceDir);
    console.log(`Found ${files.length} files to copy`);
    
    // Copy each file to target directory
    for (const file of files) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      try {
        await copyFile(sourcePath, targetPath);
        console.log(`Copied: ${file}`);
      } catch (err) {
        console.error(`Error copying ${file}:`, err.message);
      }
    }
    
    console.log('Pyodide files copied successfully');
  } catch (err) {
    console.error('Error copying Pyodide files:', err.message);
  }
}

// Create a default pyodide-lock.json file if needed
async function createDefaultLockFile() {
  const lockFilePath = 'static/pyodide/pyodide-lock.json';
  
  if (!existsSync(lockFilePath)) {
    console.log('Creating default pyodide-lock.json file');
    
    const defaultPackages = [
      'micropip',
      'numpy',
      'pandas',
      'matplotlib',
      'seaborn'
    ];
    
    const lockFileContent = defaultPackages.map(pkg => `${pkg}==latest`).join('\\n');
    
    try {
      await ensureDirectoryExists(path.dirname(lockFilePath));
      const fs = await import('fs/promises');
      await fs.writeFile(lockFilePath, lockFileContent);
      console.log('Default lock file created');
    } catch (err) {
      console.error('Error creating lock file:', err.message);
    }
  }
}

// Main execution
(async () => {
  try {
    console.log('Starting Pyodide preparation');
    await copyPyodideFiles();
    await createDefaultLockFile();
    console.log('Pyodide preparation completed successfully');
  } catch (err) {
    console.error('Pyodide preparation failed:', err.message);
    process.exit(1);
  }
})();
