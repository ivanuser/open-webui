/**
 * Extension API endpoints for managing specific extensions
 */

import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extensions } from '$lib/extensions/api/registry';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extensions directory
const EXTENSIONS_DIR = path.join(process.cwd(), 'extensions');

/**
 * GET /api/admin/extensions/:id
 * Get extension details
 */
export async function GET({ request, params }) {
  try {
    const extensionId = params.id;
    
    if (!extensionId) {
      return json({ error: 'Extension ID is required' }, { status: 400 });
    }
    
    // First check if extension exists in registry
    /*
    const extension = extensions.get(extensionId);
    
    if (extension) {
      return json({
        id: extension.manifest.id,
        name: extension.manifest.name,
        description: extension.manifest.description,
        version: extension.manifest.version,
        author: extension.manifest.author,
        type: extension.manifest.type,
        status: extension.status
      });
    }
    */
    
    // Otherwise check if extension directory exists
    const extensionDir = path.join(EXTENSIONS_DIR, extensionId);
    
    if (!fs.existsSync(extensionDir)) {
      return json({ error: 'Extension not found' }, { status: 404 });
    }
    
    // Try to read extension.json or manifest.json
    let manifest = null;
    
    if (fs.existsSync(path.join(extensionDir, 'extension.json'))) {
      const extensionJson = fs.readFileSync(path.join(extensionDir, 'extension.json'), 'utf-8');
      manifest = JSON.parse(extensionJson);
    } else if (fs.existsSync(path.join(extensionDir, 'manifest.json'))) {
      const manifestJson = fs.readFileSync(path.join(extensionDir, 'manifest.json'), 'utf-8');
      manifest = JSON.parse(manifestJson);
    } else {
      return json({ error: 'Extension manifest not found' }, { status: 404 });
    }
    
    return json({
      id: manifest.id || extensionId,
      name: manifest.name,
      description: manifest.description,
      version: manifest.version,
      author: manifest.author,
      type: manifest.type,
      status: 'installed'
    });
  } catch (err) {
    console.error(`Error getting extension details:`, err);
    return json({ error: err.message || 'Failed to get extension details' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/extensions/:id/enable
 * Enable or disable an extension
 */
export async function PUT({ request, params }) {
  try {
    const extensionId = params.id;
    
    if (!extensionId) {
      return json({ error: 'Extension ID is required' }, { status: 400 });
    }
    
    // Parse the request body
    const data = await request.json();
    
    if (!data.action || (data.action !== 'enable' && data.action !== 'disable')) {
      return json({ error: 'Invalid action, must be "enable" or "disable"' }, { status: 400 });
    }
    
    // Check if extension exists
    const extensionDir = path.join(EXTENSIONS_DIR, extensionId);
    
    if (!fs.existsSync(extensionDir)) {
      return json({ error: 'Extension not found' }, { status: 404 });
    }
    
    // Create or update the config file
    const configPath = path.join(extensionDir, 'config.json');
    let config = { enabled: data.action === 'enable' };
    
    if (fs.existsSync(configPath)) {
      try {
        const configJson = fs.readFileSync(configPath, 'utf-8');
        const existingConfig = JSON.parse(configJson);
        config = { ...existingConfig, enabled: data.action === 'enable' };
      } catch (e) {
        console.error(`Error reading config for extension ${extensionId}:`, e);
      }
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    return json({
      message: `Extension ${data.action === 'enable' ? 'enabled' : 'disabled'} successfully`,
      extensionId,
      enabled: data.action === 'enable'
    });
  } catch (err) {
    console.error(`Error updating extension status:`, err);
    return json({ error: err.message || 'Failed to update extension status' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/extensions/:id
 * Uninstall an extension
 */
export async function DELETE({ request, params }) {
  try {
    const extensionId = params.id;
    
    if (!extensionId) {
      return json({ error: 'Extension ID is required' }, { status: 400 });
    }
    
    const extensionDir = path.join(EXTENSIONS_DIR, extensionId);
    
    // Console log for debugging
    console.log(`Trying to uninstall extension: ${extensionId}`);
    console.log(`Extension directory: ${extensionDir}`);
    console.log(`Directory exists: ${fs.existsSync(extensionDir)}`);
    
    // Check if extension exists
    if (!fs.existsSync(extensionDir)) {
      return json({ error: 'Extension not found' }, { status: 404 });
    }
    
    try {
      // Delete extension directory
      fs.rmSync(extensionDir, { recursive: true, force: true });
      console.log(`Extension directory deleted: ${extensionDir}`);
      
      return json({ 
        message: 'Extension uninstalled successfully',
        extensionId
      });
    } catch (err) {
      console.error(`Error deleting extension directory:`, err);
      return json({ error: `Failed to delete extension directory: ${err.message}` }, { status: 500 });
    }
  } catch (err) {
    console.error(`Error uninstalling extension:`, err);
    return json({ error: err.message || 'Failed to uninstall extension' }, { status: 500 });
  }
}

/**
 * POST /api/admin/extensions/:id/settings
 * Update extension settings
 */
export async function POST({ request, params }) {
  try {
    const extensionId = params.id;
    
    if (!extensionId) {
      return json({ error: 'Extension ID is required' }, { status: 400 });
    }
    
    // Parse the request body
    const data = await request.json();
    
    if (!data.settings) {
      return json({ error: 'Settings are required' }, { status: 400 });
    }
    
    // Check if extension exists
    const extensionDir = path.join(EXTENSIONS_DIR, extensionId);
    
    if (!fs.existsSync(extensionDir)) {
      return json({ error: 'Extension not found' }, { status: 404 });
    }
    
    // Create or update the config file
    const configPath = path.join(extensionDir, 'config.json');
    let config = { settings: data.settings };
    
    if (fs.existsSync(configPath)) {
      try {
        const configJson = fs.readFileSync(configPath, 'utf-8');
        const existingConfig = JSON.parse(configJson);
        config = { ...existingConfig, settings: data.settings };
      } catch (e) {
        console.error(`Error reading config for extension ${extensionId}:`, e);
      }
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    return json({
      message: 'Extension settings updated successfully',
      extensionId,
      settings: data.settings
    });
  } catch (err) {
    console.error(`Error updating extension settings:`, err);
    return json({ error: err.message || 'Failed to update extension settings' }, { status: 500 });
  }
}

/**
 * Handle OPTIONS requests for CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Allow': 'GET, PUT, DELETE, POST, OPTIONS'
    }
  });
}
