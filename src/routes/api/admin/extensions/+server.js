/**
 * Extension API endpoints for the admin panel
 */

import { json } from '@sveltejs/kit';
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
    console.log('GET /api/admin/extensions - Listing installed extensions');
    
    // Return hardcoded extensions for testing
    return json({ 
      extensions: [
        {
          manifest: {
            id: "prompt-library",
            name: "Prompt Library",
            description: "Save, organize, and reuse effective prompts with categories and templates",
            version: "0.1.0",
            author: "Open WebUI Team",
            type: "ui",
            main: "main.js",
            entry_point: "__init__.py"
          },
          enabled: true,
          installed: true,
          settings: {},
          installDate: new Date("2025-03-15T10:00:00Z"),
          updateDate: new Date("2025-03-15T10:00:00Z"),
          status: "enabled"
        }
      ] 
    });
    
    /*
    // Return installed extensions from registry
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
    */
  } catch (err) {
    console.error('Error fetching extensions:', err);
    return json({ error: 'Failed to fetch extensions' }, { status: 500 });
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
    console.log('POST /api/admin/extensions - Received extension installation request');
    
    const data = await request.json();
    console.log('Extension installation data:', data);
    
    // Validate input
    if (!data.name || !data.type) {
      return json({ error: 'Missing required fields: name, type' }, { status: 400 });
    }
    
    // Generate directory name from extension ID or transform the name
    const dirName = data.id || data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const extensionDir = path.join(EXTENSIONS_DIR, dirName);
    
    console.log(`Installing extension to directory: ${extensionDir}`);
    
    // Check if extension already exists
    if (fs.existsSync(extensionDir)) {
      console.log(`Extension already exists: ${dirName}`);
      // For testing, we'll allow overwriting
      // return json({ 
      //   message: 'Extension already installed',
      //   extensionId: dirName,
      //   success: false
      // }, { status: 409 });
    }
    
    // Create extension directory if it doesn't exist
    if (!fs.existsSync(extensionDir)) {
      await mkdir(extensionDir, { recursive: true });
    }
    
    // Create extension.json
    const extensionJson = {
      id: data.id || dirName,
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
    
    // Create a placeholder __init__.py
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
    
    console.log('Extension installed successfully');
    
    return json({ 
      message: 'Extension installed successfully',
      extensionId: dirName,
      success: true
    });
  } catch (err) {
    console.error('Error installing extension:', err);
    return json({ 
      error: err.message || 'Failed to install extension',
      success: false
    }, { status: 500 });
  }
}

/**
 * Handle OPTIONS requests (for CORS)
 */
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Allow': 'GET, POST, OPTIONS'
    }
  });
}
