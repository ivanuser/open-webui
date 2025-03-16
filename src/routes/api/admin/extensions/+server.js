/**
 * Extension API endpoints for the admin panel
 */

import { json, error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { extensions } from '$lib/extensions/api/registry';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extensions directory
const EXTENSIONS_DIR = path.join(process.cwd(), 'extensions');

// Ensure extensions directory exists
try {
  if (!fs.existsSync(EXTENSIONS_DIR)) {
    fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
  }
} catch (err) {
  console.error('Error creating extensions directory:', err);
}

/**
 * GET /api/admin/extensions
 * Get all extensions
 */
export async function GET({ request, locals }) {
  // For testing without authentication
  // const session = { user: { role: 'admin' } };
  
  // Ensure user is authenticated as admin
  // Comment this out for testing
  // const session = locals.session;
  // if (!session || !session.user || !session.user.role === 'admin') {
  //   throw error(403, 'Unauthorized');
  // }
  
  try {
    // Return installed extensions
    const extensionsList = Array.from(extensions.values()).map(ext => ({
      id: ext.manifest.id,
      name: ext.manifest.name,
      description: ext.manifest.description,
      version: ext.manifest.version,
      author: ext.manifest.author,
      type: ext.manifest.type,
      status: ext.status
    }));
    
    return json({ extensions: extensionsList });
  } catch (err) {
    console.error('Error fetching extensions:', err);
    throw error(500, 'Failed to fetch extensions');
  }
}

/**
 * POST /api/admin/extensions
 * Install a new extension from various sources
 */
export async function POST({ request, locals }) {
  // For testing without authentication
  // const session = { user: { role: 'admin' } };
  
  // Ensure user is authenticated as admin
  // Temporarily disable authentication for testing
  // const session = locals.session;
  // if (!session || !session.user || !session.user.role === 'admin') {
  //   throw error(403, 'Unauthorized');
  // }
  
  try {
    console.log('Received extension installation request');
    
    const data = await request.json();
    console.log('Extension installation data:', data);
    
    // Validate input
    if (!data.name || !data.type) {
      throw error(400, 'Missing required fields: name, type');
    }
    
    // Generate directory name from extension ID or transform the name
    const dirName = data.source?.id || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const extensionDir = path.join(EXTENSIONS_DIR, dirName);
    
    console.log(`Installing extension to directory: ${extensionDir}`);
    
    // Check if extension already exists
    if (fs.existsSync(extensionDir)) {
      console.log(`Extension already exists: ${dirName}`);
      // For testing, we'll allow overwriting
      // return json({ 
      //   message: 'Extension already installed',
      //   extensionId: dirName 
      // });
    }
    
    // Create extension directory if it doesn't exist
    if (!fs.existsSync(extensionDir)) {
      await mkdir(extensionDir, { recursive: true });
    }
    
    // Handle different installation sources
    if (data.source) {
      switch (data.source.type) {
        case 'marketplace':
          // Install from marketplace
          await installFromMarketplace(data, extensionDir);
          break;
          
        case 'github':
          // Install from GitHub
          await installFromGitHub(data, extensionDir);
          break;
          
        case 'url':
          // Install from URL
          await installFromUrl(data, extensionDir);
          break;
          
        default:
          throw error(400, 'Invalid source type');
      }
    } else {
      // Create basic extension files manually
      await createBasicExtension(data, extensionDir);
    }
    
    console.log(`Extension installed successfully: ${dirName}`);
    
    return json({ 
      message: 'Extension installed successfully',
      extensionId: dirName
    });
  } catch (err) {
    console.error('Error installing extension:', err);
    throw error(500, err.message || 'Failed to install extension');
  }
}

/**
 * Install an extension from the marketplace
 */
async function installFromMarketplace(data, extensionDir) {
  console.log('Installing extension from marketplace');
  console.log(`Data:`, data);
  
  try {
    // Create extension.json
    const extensionJson = {
      id: data.source.id,
      name: data.name,
      description: data.description || 'Extension from marketplace',
      version: data.version || '0.1.0',
      author: data.author || 'Unknown',
      type: data.type || 'ui',
      entry_point: '__init__.py'
    };
    
    console.log('Writing extension.json:', extensionJson);
    
    fs.writeFileSync(
      path.join(extensionDir, 'extension.json'),
      JSON.stringify(extensionJson, null, 2)
    );
    
    // For testing: create a placeholder __init__.py
    fs.writeFileSync(
      path.join(extensionDir, '__init__.py'),
      `"""
${data.name}: ${data.description || 'Extension from marketplace'}
Version: ${data.version || '0.1.0'}
Author: ${data.author || 'Unknown'}
"""

def initialize():
    print("Initializing extension: ${data.name}")
    return True

def shutdown():
    print("Shutting down extension: ${data.name}")
    return True
`
    );
    
    // In a real implementation, we would download and extract the package
    // For now, we'll just log the URL we would download from
    if (data.source.url) {
      console.log(`Would download extension from: ${data.source.url}`);
    }
    
    console.log('Extension files created successfully');
    
    return true;
  } catch (err) {
    console.error('Error installing from marketplace:', err);
    throw new Error(`Failed to install from marketplace: ${err.message}`);
  }
}

/**
 * Install an extension from GitHub
 */
async function installFromGitHub(data, extensionDir) {
  // In a real implementation, this would clone the GitHub repository
  // For now, just create a placeholder extension.json
  const extensionJson = {
    name: data.name,
    description: data.description || 'Extension from GitHub',
    version: data.version || '0.1.0',
    author: data.author || 'Unknown',
    type: data.type || 'ui',
    entry_point: '__init__.py'
  };
  
  fs.writeFileSync(
    path.join(extensionDir, 'extension.json'),
    JSON.stringify(extensionJson, null, 2)
  );
  
  return true;
}

/**
 * Install an extension from a URL
 */
async function installFromUrl(data, extensionDir) {
  // In a real implementation, this would download and extract the package
  // For now, just create a placeholder extension.json
  const extensionJson = {
    name: data.name,
    description: data.description || 'Extension from URL',
    version: data.version || '0.1.0',
    author: data.author || 'Unknown',
    type: data.type || 'ui',
    entry_point: '__init__.py'
  };
  
  fs.writeFileSync(
    path.join(extensionDir, 'extension.json'),
    JSON.stringify(extensionJson, null, 2)
  );
  
  return true;
}

/**
 * Create a basic extension with the provided data
 */
async function createBasicExtension(data, extensionDir) {
  // Create extension.json
  const extensionJson = {
    name: data.name,
    description: data.description || 'Custom extension',
    version: data.version || '0.1.0',
    author: data.author || 'Unknown',
    type: data.type,
    entry_point: '__init__.py'
  };
  
  fs.writeFileSync(
    path.join(extensionDir, 'extension.json'),
    JSON.stringify(extensionJson, null, 2)
  );
  
  // Create a basic __init__.py
  fs.writeFileSync(
    path.join(extensionDir, '__init__.py'),
    `"""
${data.name}: ${data.description || 'Custom extension'}
"""

def initialize():
    print("Initializing extension: ${data.name}")
    return True

def shutdown():
    print("Shutting down extension: ${data.name}")
    return True
`
  );
  
  return true;
}
