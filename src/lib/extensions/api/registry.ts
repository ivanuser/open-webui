/**
 * Extension Registry
 * Handles discovery, loading, and management of extensions
 */

import { browser } from '$app/environment';
import type { Extension, ExtensionManifest, ExtensionModule, ExtensionRegistration } from '../framework/types';
import { HookRegistry } from '../framework/hooks';
import { isCompatible, generateDefaultConfig } from '../framework/utils';
import { get, writable } from 'svelte/store';

/**
 * Store for extensions
 */
export const extensions = writable<Map<string, Extension>>(new Map());

/**
 * Store for loaded extension modules
 */
export const extensionModules = writable<Map<string, ExtensionModule>>(new Map());

/**
 * Store for extension registrations
 */
export const extensionRegistrations = writable<Map<string, ExtensionRegistration>>(new Map());

/**
 * Store for extension loading state
 */
export const extensionsLoading = writable<boolean>(false);

/**
 * Store for extension error messages
 */
export const extensionErrors = writable<Map<string, string>>(new Map());

/**
 * Get mock extensions for development and testing
 */
function getMockExtensions(): Extension[] {
  return [
    {
      manifest: {
        id: "prompt-library",
        name: "Prompt Library",
        description: "Save, organize, and reuse effective prompts with categories and templates",
        version: "0.1.0",
        author: "Open WebUI Team",
        type: "ui",
        main: "main.js",
        entry_point: "__init__.py",
        sidebar: {
          icon: "BookOpen",
          label: "Prompt Library"
        }
      },
      enabled: true,
      installed: true,
      settings: {},
      installDate: new Date("2025-03-15T10:00:00Z"),
      updateDate: new Date("2025-03-15T10:00:00Z"),
      status: "enabled"
    }
  ];
}

/**
 * Fetch the list of installed extensions from the server
 */
export async function fetchExtensions(): Promise<Extension[]> {
  extensionsLoading.set(true);
  
  try {
    // Try fetching from the API first
    const response = await fetch('/api/admin/extensions');
    
    if (response.ok) {
      const data = await response.json();
      console.log('Extensions from API:', data);
      
      // If the response is empty or invalid, fall back to mock data
      if (!data || !data.extensions || !Array.isArray(data.extensions) || data.extensions.length === 0) {
        console.log('API returned empty data, using mock extensions');
        const mockExtensions = getMockExtensions();
        updateExtensionsStore(mockExtensions);
        return mockExtensions;
      }
      
      // Update the extensions store with API data
      updateExtensionsStore(data.extensions);
      return data.extensions;
    } else {
      console.warn(`API returned ${response.status}: ${response.statusText}`);
      const mockExtensions = getMockExtensions();
      updateExtensionsStore(mockExtensions);
      return mockExtensions;
    }
  } catch (error) {
    console.error('Error fetching extensions:', error);
    // Return mock data if the API call fails
    const mockExtensions = getMockExtensions();
    updateExtensionsStore(mockExtensions);
    return mockExtensions;
  } finally {
    extensionsLoading.set(false);
  }
}

/**
 * Helper to update the extensions store
 */
function updateExtensionsStore(extensionsList: Extension[]) {
  const extensionsMap = new Map<string, Extension>();
  extensionsList.forEach((ext: Extension) => {
    extensionsMap.set(ext.manifest.id, ext);
  });
  extensions.set(extensionsMap);
}

/**
 * Create sidebar navigation items from extensions
 */
export function getSidebarNavItems() {
  const items = [];
  
  try {
    // First check for extensions that have a sidebar.json file
    if (browser) {
      // Look in each extension directory for sidebar.json
      const extensionDirs = ['prompt-library']; // This would ideally be fetched from the server
      
      for (const extId of extensionDirs) {
        try {
          // Try to dynamically import the sidebar.json file
          // Since we can't dynamically import JSON files, we'll make an API call instead
          fetch(`/extensions/${extId}/sidebar.json`)
            .then(response => {
              if (response.ok) {
                return response.json();
              }
              return null;
            })
            .then(data => {
              if (data) {
                items.push({
                  id: `extension-${data.id}`,
                  label: data.label,
                  icon: data.icon || 'PuzzlePiece',
                  href: data.href || `/extensions/${data.id}`,
                  type: 'extension'
                });
                
                // Force update of sidebar
                const event = new CustomEvent('extension-sidebar-updated', { detail: items });
                window.dispatchEvent(event);
              }
            })
            .catch(error => {
              console.error(`Error loading sidebar.json for extension ${extId}:`, error);
            });
        } catch (error) {
          console.error(`Error loading sidebar for extension ${extId}:`, error);
        }
      }
    }
    
    // Then add any extensions from the store that have sidebar metadata
    const extensionsMap = get(extensions);
    
    for (const [id, extension] of extensionsMap.entries()) {
      if (extension.enabled && extension.manifest.sidebar) {
        // Check if this extension is already in items
        const exists = items.some(item => item.id === `extension-${id}`);
        
        if (!exists) {
          items.push({
            id: `extension-${id}`,
            label: extension.manifest.sidebar.label || extension.manifest.name,
            icon: extension.manifest.sidebar.icon || 'PuzzlePiece',
            href: `/extensions/${id}`,
            type: 'extension'
          });
        }
      }
    }
  } catch (error) {
    console.error('Error getting sidebar nav items:', error);
  }
  
  return items;
}

/**
 * Load an extension by its ID
 * @param extensionId The ID of the extension to load
 * @returns True if the extension was loaded successfully
 */
export async function loadExtension(extensionId: string): Promise<boolean> {
  const extensionsStore = get(extensions);
  const extension = extensionsStore.get(extensionId);
  
  if (!extension) {
    console.error(`Extension ${extensionId} not found`);
    return false;
  }
  
  if (!extension.enabled) {
    console.warn(`Extension ${extensionId} is disabled`);
    return false;
  }
  
  if (!isCompatible(extension.manifest)) {
    console.warn(`Extension ${extensionId} is not compatible with this version of the application`);
    extensionErrors.update(errors => {
      errors.set(extensionId, 'Incompatible with this version of the application');
      return errors;
    });
    return false;
  }
  
  try {
    console.log(`Loading extension: ${extensionId}`);
    
    // For development, simulate a mock extension module
    const mockModule: ExtensionModule = {
      manifest: extension.manifest,
      initialize: async () => {
        console.log(`[${extensionId}] Initialized`);
        return true;
      },
      activate: async () => {
        console.log(`[${extensionId}] Activated`);
        return true;
      },
      deactivate: async () => {
        console.log(`[${extensionId}] Deactivated`);
        return true;
      }
    };
    
    // Store the mock module
    extensionModules.update(modules => {
      modules.set(extensionId, mockModule);
      return modules;
    });
    
    // Create a registration
    const registration: ExtensionRegistration = {
      id: extensionId,
      hooks: [],
      module: mockModule
    };
    
    // Store the registration
    extensionRegistrations.update(regs => {
      regs.set(extensionId, registration);
      return regs;
    });
    
    // Initialize the extension
    await mockModule.initialize();
    
    // Activate the extension
    if (extension.enabled) {
      await mockModule.activate();
    }
    
    return true;
  } catch (error) {
    console.error(`Failed to load extension ${extensionId}:`, error);
    extensionErrors.update(errors => {
      errors.set(extensionId, error instanceof Error ? error.message : String(error));
      return errors;
    });
    return false;
  }
}

/**
 * Load all enabled extensions
 */
export async function loadAllExtensions(): Promise<void> {
  const exts = await fetchExtensions();
  
  // Load enabled extensions
  for (const extension of exts) {
    if (extension.enabled) {
      await loadExtension(extension.manifest.id);
    }
  }
}

/**
 * Enable an extension
 * @param extensionId The ID of the extension to enable
 */
export async function enableExtension(extensionId: string): Promise<boolean> {
  try {
    // Make API call to enable extension
    const response = await fetch(`/api/admin/extensions/${extensionId}/enable`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'enable' })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error enabling extension:', errorData || response.statusText);
      throw new Error(errorData?.error || `Failed to enable extension: ${response.statusText}`);
    }
    
    // Update local state
    extensions.update(exts => {
      const ext = exts.get(extensionId);
      if (ext) {
        ext.enabled = true;
        ext.status = "enabled";
        exts.set(extensionId, ext);
      }
      return exts;
    });
    
    // Load the extension
    await loadExtension(extensionId);
    
    return true;
  } catch (error) {
    console.error('Error enabling extension:', error);
    return false;
  }
}

/**
 * Disable an extension
 * @param extensionId The ID of the extension to disable
 */
export async function disableExtension(extensionId: string): Promise<boolean> {
  try {
    // Make API call to disable extension
    const response = await fetch(`/api/admin/extensions/${extensionId}/enable`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'disable' })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error disabling extension:', errorData || response.statusText);
      throw new Error(errorData?.error || `Failed to disable extension: ${response.statusText}`);
    }
    
    // Update local state
    extensions.update(exts => {
      const ext = exts.get(extensionId);
      if (ext) {
        ext.enabled = false;
        ext.status = "disabled";
        exts.set(extensionId, ext);
      }
      return exts;
    });
    
    // Deactivate the extension
    const moduleStore = get(extensionModules);
    const module = moduleStore.get(extensionId);
    
    if (module) {
      await module.deactivate();
    }
    
    return true;
  } catch (error) {
    console.error('Error disabling extension:', error);
    return false;
  }
}

/**
 * Install an extension
 * @param manifest The extension manifest
 * @param fileData The extension file data
 */
export async function installExtension(manifest: ExtensionManifest, fileData: ArrayBuffer): Promise<boolean> {
  try {
    // Create FormData with the extension zip file and manifest
    const formData = new FormData();
    formData.append('manifest', JSON.stringify(manifest));
    formData.append('file', new Blob([fileData], { type: 'application/zip' }), 'extension.zip');
    
    // Make API call to install extension
    const response = await fetch('/api/admin/extensions/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error installing extension:', errorData || response.statusText);
      throw new Error(errorData?.error || `Failed to install extension: ${response.statusText}`);
    }
    
    // Add the extension to the store
    const newExtension: Extension = {
      manifest,
      enabled: true,
      installed: true,
      settings: {},
      installDate: new Date(),
      updateDate: new Date(),
      status: "enabled"
    };
    
    extensions.update(exts => {
      exts.set(manifest.id, newExtension);
      return exts;
    });
    
    return true;
  } catch (error) {
    console.error('Error installing extension:', error);
    throw error;
  }
}

/**
 * Uninstall an extension
 * @param extensionId The ID of the extension to uninstall
 */
export async function uninstallExtension(extensionId: string): Promise<boolean> {
  try {
    // Deactivate the extension first
    const moduleStore = get(extensionModules);
    const module = moduleStore.get(extensionId);
    
    if (module) {
      // Deactivate
      await module.deactivate();
      
      // Run uninstall if available
      if (module.uninstall) {
        await module.uninstall();
      }
    }
    
    // Unregister all hooks
    HookRegistry.unregisterAll(extensionId);
    
    // Remove from stores
    extensionModules.update(modules => {
      modules.delete(extensionId);
      return modules;
    });
    
    extensionRegistrations.update(regs => {
      regs.delete(extensionId);
      return regs;
    });
    
    // Call API to uninstall
    const response = await fetch(`/api/admin/extensions/${extensionId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error uninstalling extension:', errorData || response.statusText);
      throw new Error(errorData?.error || `Failed to uninstall extension: ${response.statusText}`);
    }
    
    // Update local state
    extensions.update(exts => {
      exts.delete(extensionId);
      return exts;
    });
    
    return true;
  } catch (error) {
    console.error('Error uninstalling extension:', error);
    return false;
  }
}

/**
 * Update extension settings
 * @param extensionId The ID of the extension
 * @param settings The new settings
 */
export async function updateExtensionSettings(extensionId: string, settings: Record<string, any>): Promise<boolean> {
  try {
    // Make API call to update settings
    const response = await fetch(`/api/admin/extensions/${extensionId}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ settings })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Error updating extension settings:', errorData || response.statusText);
      throw new Error(errorData?.error || `Failed to update settings: ${response.statusText}`);
    }
    
    // Update local state
    extensions.update(exts => {
      const ext = exts.get(extensionId);
      if (ext) {
        ext.settings = settings;
        exts.set(extensionId, ext);
      }
      return exts;
    });
    
    // Notify the extension
    const moduleStore = get(extensionModules);
    const module = moduleStore.get(extensionId);
    
    if (module && module.updateSettings) {
      await module.updateSettings(settings);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating extension settings:', error);
    return false;
  }
}

/**
 * Get extension settings
 * @param extensionId The ID of the extension
 */
export function getExtensionSettings(extensionId: string): Record<string, any> {
  const extensionsStore = get(extensions);
  const extension = extensionsStore.get(extensionId);
  
  if (!extension) {
    return {};
  }
  
  // If settings are defined, return them
  if (extension.settings) {
    return extension.settings;
  }
  
  // Otherwise, generate default settings
  return generateDefaultConfig(extension.manifest);
}

/**
 * Initialize the extension registry
 * This should be called when the application starts
 */
export async function initializeRegistry(): Promise<void> {
  if (browser) {
    await loadAllExtensions();
  }
}
