/**
 * Static file server for extension files
 * This route handles serving static files from the extensions directory
 */

import fs from 'fs';
import path from 'path';
import { error } from '@sveltejs/kit';

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.txt': 'text/plain',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown',
  '.svelte': 'text/plain'
};

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
  const filePath = params.path;
  
  if (!filePath) {
    throw error(404, 'File not found');
  }
  
  try {
    // Construct the full path to the requested file
    const extensionsDir = path.join(process.cwd(), 'extensions');
    
    // Prevent path traversal attacks
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    
    // Combine with extensions directory
    const fullPath = path.join(extensionsDir, normalizedPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      throw error(404, 'File not found');
    }
    
    // Read file
    const fileBuffer = fs.readFileSync(fullPath);
    
    // Determine content type
    let contentType = 'application/octet-stream';
    const extname = path.extname(fullPath).toLowerCase();
    
    if (extname in mimeTypes) {
      contentType = mimeTypes[extname];
    }
    
    // Return file with appropriate headers
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (err) {
    console.error('Error serving extension file:', err);
    throw error(404, 'File not found');
  }
}
