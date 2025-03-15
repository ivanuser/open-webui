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

// Initialize extensions when this module is imported
import { browser } from '$app/environment';
import { initializeRegistry } from './api/registry';

// Initialize extensions in the browser
if (browser) {
  initializeRegistry().catch(err => {
    console.error('Failed to initialize extension system:', err);
  });
}
