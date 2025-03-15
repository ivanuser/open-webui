/**
 * Extension API - List Extensions
 * GET /api/extensions
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import fs from 'fs';
import path from 'path';
import { EXTENSIONS_DIR } from '$lib/server/constants';
import { getUserToken } from '$lib/server/auth';
import type { Extension, ExtensionManifest } from '$lib/extensions/framework/types';

export const GET: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  const token = await getUserToken(request, locals);
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  try {
    // Ensure extensions directory exists
    if (!fs.existsSync(EXTENSIONS_DIR)) {
      fs.mkdirSync(EXTENSIONS_DIR, { recursive: true });
    }
    
    // Get installed extensions
    const extensionDirs = fs.readdirSync(EXTENSIONS_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    const extensions: Extension[] = [];
    
    for (const dirName of extensionDirs) {
      const extensionDir = path.join(EXTENSIONS_DIR, dirName);
      const manifestPath = path.join(extensionDir, 'manifest.json');
      
      // Skip if no manifest exists
      if (!fs.existsSync(manifestPath)) {
        continue;
      }
      
      try {
        // Read and parse manifest
        const manifestJson = fs.readFileSync(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestJson) as ExtensionManifest;
        
        // Read extension configuration
        const configPath = path.join(extensionDir, 'config.json');
        let config: { enabled: boolean; settings?: Record<string, any> } = { enabled: true };
        
        if (fs.existsSync(configPath)) {
          const configJson = fs.readFileSync(configPath, 'utf-8');
          config = JSON.parse(configJson);
        } else {
          // Create default config
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }
        
        // Get file stats for install date
        const stats = fs.statSync(extensionDir);
        
        // Add to extensions list
        extensions.push({
          manifest,
          enabled: config.enabled,
          installed: true,
          settings: config.settings,
          installDate: stats.birthtime,
          updateDate: stats.mtime
        });
      } catch (error) {
        console.error(`Error loading extension ${dirName}:`, error);
      }
    }
    
    return json({ extensions });
  } catch (error) {
    console.error('Error listing extensions:', error);
    return json({ extensions: [] });
  }
};
