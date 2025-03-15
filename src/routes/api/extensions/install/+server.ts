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
import JSZip from 'jszip';

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
    
    fs.mkdirSync(extensionDir, { recursive: true });
    
    // Create public directory for static assets
    if (!fs.existsSync(publicExtensionDir)) {
      fs.mkdirSync(publicExtensionDir, { recursive: true });
    }
    
    // Get file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Extract the zip file
    const zip = await JSZip.loadAsync(buffer);
    
    // Extract files
    const extractPromises: Promise<void>[] = [];
    
    zip.forEach((filePath, zipEntry) => {
      if (zipEntry.dir) return;
      
      const extractPromise = async () => {
        const content = await zipEntry.async('nodebuffer');
        const targetPath = path.join(extensionDir, filePath);
        const targetDir = path.dirname(targetPath);
        
        // Create directories
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Write file
        fs.writeFileSync(targetPath, content);
        
        // Copy static assets to public directory
        if (filePath.startsWith('static/')) {
          const publicPath = path.join(publicExtensionDir, filePath.slice(7));
          const publicDir = path.dirname(publicPath);
          
          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }
          
          fs.writeFileSync(publicPath, content);
        }
      };
      
      extractPromises.push(extractPromise());
    });
    
    await Promise.all(extractPromises);
    
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
