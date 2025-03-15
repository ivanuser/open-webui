/**
 * Extension API - Uninstall Extension
 * DELETE /api/extensions/:id/uninstall
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';
import { getUserToken, verifyAdmin } from '$lib/server/auth';
import { EXTENSIONS_DIR, PUBLIC_EXTENSIONS_DIR } from '$lib/server/constants';

export const DELETE: RequestHandler = async ({ request, locals, params }) => {
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
  
  const extensionId = params.id;
  const extensionDir = path.join(EXTENSIONS_DIR, extensionId);
  const publicExtensionDir = path.join(PUBLIC_EXTENSIONS_DIR, extensionId);
  
  try {
    // Check if extension exists
    if (!fs.existsSync(extensionDir)) {
      return json(
        { success: false, error: 'Extension not found' },
        { status: 404 }
      );
    }
    
    // Remove extension directory
    fs.rmSync(extensionDir, { recursive: true, force: true });
    
    // Remove public extension directory if it exists
    if (fs.existsSync(publicExtensionDir)) {
      fs.rmSync(publicExtensionDir, { recursive: true, force: true });
    }
    
    return json({ success: true });
  } catch (error) {
    console.error(`Error uninstalling extension ${extensionId}:`, error);
    return json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
};
