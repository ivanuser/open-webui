/**
 * Extension Framework Base Classes
 * Provides base implementations for different extension types
 */

import type { Extension, ExtensionManifest, ExtensionModule, Hook } from './types';
import { HookRegistry } from './hooks';

/**
 * Abstract base class for all extensions
 */
export abstract class BaseExtension implements ExtensionModule {
  /** The extension manifest */
  protected manifest: ExtensionManifest;
  
  /** Hooks registered by this extension */
  protected hooks: Hook[] = [];
  
  /** Whether the extension is currently active */
  protected active: boolean = false;
  
  /** Extension settings */
  protected settings: Record<string, any> = {};
  
  /**
   * Create a new extension instance
   * @param manifest The extension manifest
   */
  constructor(manifest: ExtensionManifest) {
    this.manifest = manifest;
  }
  
  /**
   * Register a hook
   * @param hook The hook to register
   */
  protected registerHook(hook: Hook): void {
    this.hooks.push(hook);
    HookRegistry.register(this.manifest.id, hook);
  }
  
  /**
   * Initialize the extension
   * Called when the extension is first loaded
   */
  async initialize(): Promise<void> {
    // Implementations should override this method
  }
  
  /**
   * Activate the extension
   * Called when the extension is enabled
   */
  async activate(): Promise<void> {
    this.active = true;
    // Implementations should override this method
  }
  
  /**
   * Deactivate the extension
   * Called when the extension is disabled
   */
  async deactivate(): Promise<void> {
    this.active = false;
    // Implementations should override this method
  }
  
  /**
   * Uninstall the extension
   * Called when the extension is being removed
   */
  async uninstall(): Promise<void> {
    // Remove all hooks
    for (const hook of this.hooks) {
      HookRegistry.unregister(this.manifest.id, hook.name);
    }
    // Implementations can override to add additional cleanup
  }
  
  /**
   * Get the extension settings
   * @returns The current settings
   */
  getSettings(): Record<string, any> {
    return { ...this.settings };
  }
  
  /**
   * Update the extension settings
   * @param settings The new settings
   */
  async updateSettings(settings: Record<string, any>): Promise<void> {
    this.settings = { ...settings };
    // Implementations can override to handle settings changes
  }
}

/**
 * Base class for UI extensions
 */
export abstract class UIExtension extends BaseExtension {
  /**
   * Get UI components provided by this extension
   * @returns Map of component locations to component factories
   */
  abstract getUIComponents(): Map<string, () => Promise<any>>;
}

/**
 * Base class for API extensions
 */
export abstract class APIExtension extends BaseExtension {
  /**
   * Get API endpoints provided by this extension
   * @returns Map of endpoint paths to handler functions
   */
  abstract getAPIEndpoints(): Map<string, Function>;
}

/**
 * Base class for model adapter extensions
 */
export abstract class ModelAdapterExtension extends BaseExtension {
  /**
   * Get the model adapter configuration
   * @returns Model adapter configuration
   */
  abstract getModelAdapter(): any;
}

/**
 * Base class for tool extensions
 */
export abstract class ToolExtension extends BaseExtension {
  /**
   * Get the tools provided by this extension
   * @returns Array of tool definitions
   */
  abstract getTools(): any[];
}

/**
 * Base class for theme extensions
 */
export abstract class ThemeExtension extends BaseExtension {
  /**
   * Get the theme CSS
   * @returns The theme CSS as a string
   */
  abstract getThemeCSS(): string;
  
  /**
   * Get the theme variables
   * @returns Map of CSS variables
   */
  abstract getThemeVariables(): Map<string, string>;
}
