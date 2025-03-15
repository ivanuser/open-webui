/**
 * Extension System Integration
 * Integrates the Open WebUI Extension System with the existing extension framework
 */

import { extensions, registerExtension, unregisterExtension } from './api/registry';
import type { Extension, ExtensionManifest, ExtensionStatus } from './framework/types';

// Import the Open WebUI Extension System
let extensionSystem;

try {
  // This would normally import from the extension system
  // import * as system from 'open-webui-extensions';
  // extensionSystem = system;
  
  // For now, let's use a placeholder
  extensionSystem = {
    initialize: () => console.log('Extension System initialized'),
    getRegistry: () => ({ 
      get_extensions: () => [] 
    })
  };
} catch (error) {
  console.error('Failed to import Open WebUI Extension System:', error);
}

/**
 * Initialize the extension system
 */
export async function initializeExtensionSystem() {
  if (!extensionSystem) {
    console.warn('Open WebUI Extension System not found.');
    return;
  }
  
  try {
    // Initialize the extension system
    extensionSystem.initialize();
    
    // Register existing extensions with the extension system
    registerExistingExtensions();
    
    console.log('Extension System initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Extension System:', error);
  }
}

/**
 * Register existing extensions with the extension system
 */
function registerExistingExtensions() {
  if (!extensionSystem) {
    return;
  }
  
  // Get extensions from both systems
  const existingExtensions = extensions;
  const systemExtensions = extensionSystem.getRegistry()?.get_extensions() || [];
  
  // Register extensions from our system to the extension system
  existingExtensions.forEach((extension) => {
    // Check if the extension is already registered in the extension system
    const systemExtension = systemExtensions.find(ext => ext.name === extension.manifest.name);
    
    if (!systemExtension) {
      // Register the extension with the extension system
      console.log(`Registering extension ${extension.manifest.name} with the Extension System`);
      // This would call the extension system API to register the extension
    }
  });
  
  // Register extensions from the extension system to our system
  systemExtensions.forEach((systemExtension) => {
    const existingExtension = Array.from(existingExtensions.values()).find(
      ext => ext.manifest.name === systemExtension.name
    );
    
    if (!existingExtension) {
      // Register the extension with our system
      console.log(`Registering extension ${systemExtension.name} from the Extension System`);
      
      // Create a manifest from the system extension
      const manifest: ExtensionManifest = {
        id: systemExtension.id,
        name: systemExtension.name,
        description: systemExtension.description,
        version: systemExtension.version,
        author: systemExtension.author,
        type: systemExtension.type as any,
        entry_point: '',
        config: systemExtension.config || {}
      };
      
      // Register the extension
      registerExtension(manifest);
    }
  });
}

/**
 * Synchronize extensions between the two systems
 */
export async function synchronizeExtensions() {
  if (!extensionSystem) {
    return;
  }
  
  // This would synchronize extensions between our system and the extension system
  // For now, just log that we're synchronizing
  console.log('Synchronizing extensions between the two systems');
  
  // Re-register existing extensions
  registerExistingExtensions();
}
