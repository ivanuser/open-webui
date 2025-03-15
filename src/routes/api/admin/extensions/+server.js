/**
 * Extension API endpoints for the admin panel
 */

import { json, error } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
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
  // Ensure user is authenticated as admin
  const session = locals.session;
  if (!session || !session.user || !session.user.role === 'admin') {
    throw error(403, 'Unauthorized');
  }
  
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
}

/**
 * POST /api/admin/extensions
 * Install a new extension from various sources
 */
export async function POST({ request, locals }) {
  // For testing without authentication
  // const session = { user: { role: 'admin' } };
  
  // Ensure user is authenticated as admin
  const session = locals.session;
  if (!session || !session.user || !session.user.role === 'admin') {
    throw error(403, 'Unauthorized');
  }
  
  try {
    const data = await request.json();
    
    // Validate input
    if (!data.name || !data.type) {
      throw error(400, 'Missing required fields: name, type');
    }
    
    // Generate directory name from extension name
    const dirName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const extensionDir = path.join(EXTENSIONS_DIR, dirName);
    
    // Check if extension already exists
    if (fs.existsSync(extensionDir)) {
      throw error(409, 'Extension already exists');
    }
    
    // Create extension directory
    await mkdir(extensionDir, { recursive: true });
    
    // Handle different installation sources
    if (data.source) {
      switch (data.source.type) {
        case 'marketplace':
          // Install from marketplace
          await installFromMarketplace(data.source, extensionDir);
          break;
          
        case 'github':
          // Install from GitHub
          await installFromGitHub(data.source, extensionDir);
          break;
          
        case 'url':
          // Install from URL
          await installFromUrl(data.source, extensionDir);
          break;
          
        default:
          throw error(400, 'Invalid source type');
      }
    } else {
      // Create basic extension files manually
      await createBasicExtension(data, extensionDir);
    }
    
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
async function installFromMarketplace(source, extensionDir) {
  // Fetch the extension package from the marketplace
  const response = await fetch(source.url);
  
  if (!response.ok) {
    throw new Error(`Failed to download extension package: ${response.statusText}`);
  }
  
  // Create a write stream to the extension directory
  const filePath = path.join(extensionDir, 'extension.zip');
  await pipeline(response.body, createWriteStream(filePath));
  
  // In a real implementation, we would extract the zip file here
  // For now, just create a placeholder extension.json
  const extensionJson = {
    name: source.name,
    description: source.description || 'Extension from marketplace',
    version: source.version || '0.1.0',
    author: source.author || 'Unknown',
    type: source.type || 'ui',
    entry_point: '__init__.py'
  };
  
  fs.writeFileSync(
    path.join(extensionDir, 'extension.json'),
    JSON.stringify(extensionJson, null, 2)
  );
  
  // For testing: create a placeholder __init__.py
  fs.writeFileSync(
    path.join(extensionDir, '__init__.py'),
    `"""
Placeholder for extension: ${source.name}
"""

def initialize():
    print("Initializing extension: ${source.name}")
    return True

def shutdown():
    print("Shutting down extension: ${source.name}")
    return True
`
  );
  
  return true;
}

/**
 * Install an extension from GitHub
 */
async function installFromGitHub(source, extensionDir) {
  // In a real implementation, this would clone the GitHub repository
  // For now, just create a placeholder extension.json
  const extensionJson = {
    name: source.name,
    description: source.description || 'Extension from GitHub',
    version: source.version || '0.1.0',
    author: source.author || 'Unknown',
    type: source.type || 'ui',
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
async function installFromUrl(source, extensionDir) {
  // In a real implementation, this would download and extract the package
  // For now, just create a placeholder extension.json
  const extensionJson = {
    name: source.name,
    description: source.description || 'Extension from URL',
    version: source.version || '0.1.0',
    author: source.author || 'Unknown',
    type: source.type || 'ui',
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

/**
 * DELETE /api/admin/extensions/:id
 * Uninstall an extension
 */
export async function DELETE({ request, params, locals }) {
  // Ensure user is authenticated as admin
  const session = locals.session;
  if (!session || !session.user || !session.user.role === 'admin') {
    throw error(403, 'Unauthorized');
  }
  
  const extensionId = params.id;
  
  if (!extensionId) {
    throw error(400, 'Extension ID is required');
  }
  
  const extensionDir = path.join(EXTENSIONS_DIR, extensionId);
  
  // Check if extension exists
  if (!fs.existsSync(extensionDir)) {
    throw error(404, 'Extension not found');
  }
  
  try {
    // Delete extension directory
    fs.rmSync(extensionDir, { recursive: true, force: true });
    
    return json({ message: 'Extension uninstalled successfully' });
  } catch (err) {
    console.error('Error uninstalling extension:', err);
    throw error(500, 'Failed to uninstall extension');
  }
}
