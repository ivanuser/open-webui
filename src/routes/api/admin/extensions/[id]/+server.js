/**
 * Extension API endpoints for managing specific extensions
 */

import { json, error } from '@sveltejs/kit';
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
export async function GET({ request, params, locals }) {
  // Ensure user is authenticated as admin
  const session = locals.session;
  if (!session || !session.user || !session.user.role === 'admin') {
    throw error(403, 'Unauthorized');
  }
  
  const extensionId = params.id;
  
  if (!extensionId) {
    throw error(400, 'Extension ID is required');
  }
  
  // Check if extension exists in registry
  const extension = extensions.get(extensionId);
  
  if (!extension) {
    throw error(404, 'Extension not found');
  }
  
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

/**
 * PUT /api/admin/extensions/:id/enable
 * Enable or disable an extension
 */
export async function PUT({ request, params, locals }) {
  // Ensure user is authenticated as admin
  const session = locals.session;
  if (!session || !session.user || !session.user.role === 'admin') {
    throw error(403, 'Unauthorized');
  }
  
  try {
    const extensionId = params.id;
    
    if (!extensionId) {
      throw error(400, 'Extension ID is required');
    }
    
    const data = await request.json();
    
    // Check if extension exists in registry
    const extension = extensions.get(extensionId);
    
    if (!extension) {
      throw error(404, 'Extension not found');
    }
    
    // Toggle extension status based on action
    if (data.action === 'enable') {
      extension.status = 'enabled';
    } else if (data.action === 'disable') {
      extension.status = 'disabled';
    } else {
      throw error(400, 'Invalid action');
    }
    
    return json({
      message: `Extension ${data.action === 'enable' ? 'enabled' : 'disabled'} successfully`,
      status: extension.status
    });
  } catch (err) {
    console.error(`Error updating extension status:`, err);
    throw error(500, err.message || 'Failed to update extension status');
  }
}

/**
 * DELETE /api/admin/extensions/:id
 * Uninstall an extension
 */
export async function DELETE({ request, params, locals }) {
  // For testing only - skip authentication
  // const session = { user: { role: 'admin' } };
  
  // Ensure user is authenticated as admin
  // const session = locals.session;
  // if (!session || !session.user || !session.user.role === 'admin') {
  //   throw error(403, 'Unauthorized');
  // }
  
  const extensionId = params.id;
  
  if (!extensionId) {
    throw error(400, 'Extension ID is required');
  }
  
  const extensionDir = path.join(EXTENSIONS_DIR, extensionId);
  
  console.log(`Attempting to uninstall extension: ${extensionId}`);
  console.log(`Extension directory: ${extensionDir}`);
  
  // Check if extension exists
  if (!fs.existsSync(extensionDir)) {
    console.warn(`Extension directory not found: ${extensionDir}`);
    throw error(404, 'Extension not found');
  }
  
  try {
    // Delete extension directory
    fs.rmSync(extensionDir, { recursive: true, force: true });
    console.log(`Extension uninstalled successfully: ${extensionId}`);
    
    return json({ message: 'Extension uninstalled successfully' });
  } catch (err) {
    console.error('Error uninstalling extension:', err);
    throw error(500, 'Failed to uninstall extension');
  }
}
