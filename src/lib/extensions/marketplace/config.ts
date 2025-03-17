/**
 * Extension Marketplace Configuration
 */

// Base URL for the extension marketplace
// Using GitHub Pages URL instead of raw.githubusercontent.com
export const MARKETPLACE_BASE_URL = 'https://ivanuser.github.io/open-webui-extension-marketplace';

// API endpoints
export const MARKETPLACE_API = {
  // Main index file
  index: `${MARKETPLACE_BASE_URL}/index.json`,
  
  // API endpoints
  extensions: `${MARKETPLACE_BASE_URL}/api/v1/extensions.json`,
  categories: `${MARKETPLACE_BASE_URL}/api/v1/categories.json`,
  featured: `${MARKETPLACE_BASE_URL}/api/v1/featured.json`,
  search: `${MARKETPLACE_BASE_URL}/api/v1/search.json`,
  
  // Helper function to get extension details
  getExtensionManifest: (id: string) => `${MARKETPLACE_BASE_URL}/extensions/${id}/manifest.json`,
  getExtensionReadme: (id: string) => `${MARKETPLACE_BASE_URL}/extensions/${id}/README.md`,
  getExtensionPreview: (id: string) => `${MARKETPLACE_BASE_URL}/extensions/${id}/preview.png`,
  getExtensionRelease: (id: string, version: string) => 
    `${MARKETPLACE_BASE_URL}/extensions/${id}/releases/${version}.zip`,
  getExtensionLatestRelease: (id: string) => 
    `${MARKETPLACE_BASE_URL}/extensions/${id}/releases/latest.json`,
};

// Categories 
export const EXTENSION_CATEGORIES = [
  { id: 'all', name: 'All Extensions', icon: 'collection' },
  { id: 'productivity', name: 'Productivity', icon: 'clipboard-list' },
  { id: 'appearance', name: 'Appearance', icon: 'paint-brush' },
  { id: 'developer-tools', name: 'Developer Tools', icon: 'code' },
  { id: 'ai-models', name: 'AI Models', icon: 'brain' },
  { id: 'utilities', name: 'Utilities', icon: 'cog' },
  { id: 'integrations', name: 'Integrations', icon: 'link' }
];

// Extension types
export const EXTENSION_TYPES = [
  { id: 'all', name: 'All Types' },
  { id: 'ui', name: 'UI Extensions' },
  { id: 'api', name: 'API Extensions' },
  { id: 'model-adapter', name: 'Model Adapters' },
  { id: 'tool', name: 'Tool Extensions' },
  { id: 'theme', name: 'Theme Extensions' }
];
