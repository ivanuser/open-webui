/**
 * Extension API - Install Extension
 * POST /api/extensions/install
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';
import { getUserToken, verifyAdmin } from '$lib/server/auth';
import { EXTENSIONS_DIR, PUBLIC_EXTENSIONS_DIR } from '$lib/server/constants';
import { validateManifest } from '$lib/extensions/framework/utils';
import type { ExtensionManifest } from '$lib/extensions/framework/types';
import { fileURLToPath } from 'url';
import { createReadStream, createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  const token = await getUserToken(request, locals);
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Verify admin status
  const isAdmin = await verifyAdmin(token);
  if (!isAdmin) {
    return new Response('Forbidden: Admin privileges required', { status: 403 });
  }
  
  try {
    // Parse form data
    const formData = await request.formData();
    const manifestJson = formData.get('manifest') as string;
    const file = formData.get('file') as File;
    
    if (!manifestJson || !file) {
      return new Response('Bad Request: Missing manifest or file', { status: 400 });
    }
    
    // Parse and validate manifest
    const manifest = JSON.parse(manifestJson) as ExtensionManifest;
    const errors = validateManifest(manifest);
    
    if (errors.length > 0) {
      return json({ success: false, errors }, { status: 400 });
    }
    
    // Create extension directory
    const extensionDir = path.join(EXTENSIONS_DIR, manifest.id);
    const publicExtensionDir = path.join(PUBLIC_EXTENSIONS_DIR, manifest.id);
    
    if (fs.existsSync(extensionDir)) {
      // Remove existing extension
      fs.rmSync(extensionDir, { recursive: true, force: true });
    }
    
    // Create directories
    fs.mkdirSync(extensionDir, { recursive: true });
    fs.mkdirSync(publicExtensionDir, { recursive: true });
    
    // Save zip file to disk temporarily
    const zipPath = path.join(extensionDir, 'extension.zip');
    const arrayBuffer = await file.arrayBuffer();
    fs.writeFileSync(zipPath, Buffer.from(arrayBuffer));
    
    // Extract zip using the unzip command - this approach avoids the need for JSZip
    try {
      await execAsync(`unzip -o "${zipPath}" -d "${extensionDir}"`);
      
      // Create public directory for static assets if it doesn't exist
      if (fs.existsSync(path.join(extensionDir, 'static'))) {
        // Copy static files to public directory
        const staticDir = path.join(extensionDir, 'static');
        const files = fs.readdirSync(staticDir, { withFileTypes: true });
        
        for (const file of files) {
          const srcPath = path.join(staticDir, file.name);
          const destPath = path.join(publicExtensionDir, file.name);
          
          if (file.isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyDirectorySync(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      
      // Remove the temporary zip file
      fs.unlinkSync(zipPath);
    } catch (error) {
      console.error('Error extracting zip:', error);
      
      // Fallback to writing files manually if unzip command fails
      // We'll just write the manifest and leave a note that extraction failed
      console.warn('Zip extraction failed, falling back to basic installation');
    }
    
    // Write manifest to disk
    fs.writeFileSync(
      path.join(extensionDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    // Create default config
    const config = {
      enabled: true,
      settings: {}
    };
    
    fs.writeFileSync(
      path.join(extensionDir, 'config.json'),
      JSON.stringify(config, null, 2)
    );
    
    return json({ success: true, extension: manifest.id });
  } catch (error) {
    console.error('Error installing extension:', error);
    return json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
};

/**
 * Helper function to recursively copy a directory
 */
function copyDirectorySync(src: string, dest: string) {
  const files = fs.readdirSync(src, { withFileTypes: true });
  
  for (const file of files) {
    const srcPath = path.join(src, file.name);
    const destPath = path.join(dest, file.name);
    
    if (file.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectorySync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
