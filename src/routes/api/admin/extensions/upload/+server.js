/**
 * Extension Upload API
 * POST /api/admin/extensions/upload
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
 * POST /api/admin/extensions/upload
 * Upload an extension file
 */
export async function POST({ request }) {
  try {
    console.log('Received extension upload request');
    
    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file');
    const manifestJson = formData.get('manifest');
    
    if (!file || !manifestJson) {
      return json({ error: 'Missing file or manifest' }, { status: 400 });
    }
    
    // Parse the manifest
    let manifest;
    try {
      manifest = JSON.parse(manifestJson);
    } catch (err) {
      return json({ error: 'Invalid manifest JSON' }, { status: 400 });
    }
    
    // Validate manifest
    if (!manifest.id || !manifest.name) {
      return json({ error: 'Invalid manifest: id and name are required' }, { status: 400 });
    }
    
    // Create extension directory
    const extensionDir = path.join(EXTENSIONS_DIR, manifest.id);
    if (!fs.existsSync(extensionDir)) {
      await mkdir(extensionDir, { recursive: true });
    }
    
    // Save the manifest
    fs.writeFileSync(
      path.join(extensionDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    // Save the file
    if (file instanceof File) {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(path.join(extensionDir, 'extension.zip'), fileBuffer);
    }
    
    // Return success
    return json({
      success: true,
      message: 'Extension uploaded successfully',
      extensionId: manifest.id
    });
  } catch (err) {
    console.error('Error uploading extension:', err);
    return json({
      error: err.message || 'Failed to upload extension',
      success: false
    }, { status: 500 });
  }
}
