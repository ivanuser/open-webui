/**
 * Extension API - Update Extension Settings
 * POST /api/extensions/:id/settings
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';
import { getUserToken, verifyAdmin } from '$lib/server/auth';
import { EXTENSIONS_DIR } from '$lib/server/constants';

export const POST: RequestHandler = async ({ request, locals, params }) => {
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
  const configPath = path.join(EXTENSIONS_DIR, extensionId, 'config.json');
  
  try {
    // Check if extension exists
    if (!fs.existsSync(path.join(EXTENSIONS_DIR, extensionId))) {
      return json(
        { success: false, error: 'Extension not found' },
        { status: 404 }
      );
    }
    
    // Read request body
    const body = await request.json();
    const newSettings = body.settings;
    
    if (!newSettings || typeof newSettings !== 'object') {
      return json(
        { success: false, error: 'Invalid settings format' },
        { status: 400 }
      );
    }
    
    // Read config
    let config = { enabled: true, settings: {} };
    if (fs.existsSync(configPath)) {
      const configJson = fs.readFileSync(configPath, 'utf-8');
      config = JSON.parse(configJson);
    }
    
    // Update settings
    config.settings = newSettings;
    
    // Write config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    return json({ success: true, settings: config.settings });
  } catch (error) {
    console.error(`Error updating extension settings for ${extensionId}:`, error);
    return json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
};

export const GET: RequestHandler = async ({ request, locals, params }) => {
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
  const configPath = path.join(EXTENSIONS_DIR, extensionId, 'config.json');
  
  try {
    // Check if extension exists
    if (!fs.existsSync(path.join(EXTENSIONS_DIR, extensionId))) {
      return json(
        { success: false, error: 'Extension not found' },
        { status: 404 }
      );
    }
    
    // Read config
    let settings = {};
    if (fs.existsSync(configPath)) {
      const configJson = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configJson);
      settings = config.settings || {};
    }
    
    return json({ success: true, settings });
  } catch (error) {
    console.error(`Error getting extension settings for ${extensionId}:`, error);
    return json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
};
