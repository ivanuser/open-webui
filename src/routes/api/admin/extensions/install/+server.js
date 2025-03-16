/**
 * Extension Installation API
 * POST /api/admin/extensions/install
 * 
 * A simplified endpoint for extension installation
 */

import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { mkdir } from 'fs/promises';

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
 * POST /api/admin/extensions/install
 * Install a new extension
 */
export async function POST({ request }) {
  try {
    console.log('Received installation request');
    
    // Parse the request body
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
