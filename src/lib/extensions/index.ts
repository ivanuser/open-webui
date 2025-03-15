/**
 * Open WebUI Extension System
 * Main entry point for the extension system
 */

// Export framework
export * from './framework';

// Export API
export * from './api';

// Export manager
export * from './manager';

// Export marketplace
export * from './marketplace';

// Export integration
export * from './integration';

// Initialize extensions when this module is imported
import { browser } from '$app/environment';
import { initializeRegistry } from './api/registry';
import { initializeExtensionSystem } from './integration';

// Initialize extensions in the browser
if (browser) {
  Promise.all([
    initializeRegistry(),
    initializeExtensionSystem()
  ]).catch(err => {
    console.error('Failed to initialize extension system:', err);
  });
}
