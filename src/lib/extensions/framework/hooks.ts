/**
 * Extension Framework Hook System
 * Provides a centralized hook registry for extension integration
 */

import type { Hook, HookContext, HookHandler } from './types';

/**
 * Hook Registry
 * Manages extension hooks and their execution
 */
export class HookRegistry {
  // Map of hook names to hook handlers, grouped by extension ID
  private static hooks: Map<string, Map<string, Hook[]>> = new Map();
  
  /**
   * Register a hook
   * @param extensionId The ID of the extension registering the hook
   * @param hook The hook to register
   */
  public static register(extensionId: string, hook: Hook): void {
    // Get or create the map for this hook name
    if (!this.hooks.has(hook.name)) {
      this.hooks.set(hook.name, new Map());
    }
    
    const hookMap = this.hooks.get(hook.name)!;
    
    // Get or create the array of hooks for this extension
    if (!hookMap.has(extensionId)) {
      hookMap.set(extensionId, []);
    }
    
    // Add the hook
    hookMap.get(extensionId)!.push(hook);
  }
  
  /**
   * Unregister a hook
   * @param extensionId The ID of the extension that registered the hook
   * @param hookName The name of the hook to unregister
   */
  public static unregister(extensionId: string, hookName: string): void {
    if (!this.hooks.has(hookName)) {
      return;
    }
    
    const hookMap = this.hooks.get(hookName)!;
    hookMap.delete(extensionId);
    
    // Clean up empty maps
    if (hookMap.size === 0) {
      this.hooks.delete(hookName);
    }
  }
  
  /**
   * Unregister all hooks for an extension
   * @param extensionId The ID of the extension
   */
  public static unregisterAll(extensionId: string): void {
    for (const [hookName, hookMap] of this.hooks.entries()) {
      hookMap.delete(extensionId);
      
      // Clean up empty maps
      if (hookMap.size === 0) {
        this.hooks.delete(hookName);
      }
    }
  }
  
  /**
   * Execute a hook
   * @param hookName The name of the hook to execute
   * @param context The context for the hook execution
   * @returns The results of the hook execution
   */
  public static async execute(hookName: string, context: HookContext): Promise<any[]> {
    if (!this.hooks.has(hookName)) {
      return [];
    }
    
    const hookMap = this.hooks.get(hookName)!;
    const allHooks: Hook[] = [];
    
    // Collect all hooks for this hook name
    for (const hooks of hookMap.values()) {
      allHooks.push(...hooks);
    }
    
    // Sort hooks by priority (higher priority first)
    allHooks.sort((a, b) => (b.priority || 10) - (a.priority || 10));
    
    // Execute hooks in order
    const results: any[] = [];
    for (const hook of allHooks) {
      try {
        const result = await hook.handler(context);
        results.push(result);
      } catch (error) {
        console.error(`Error executing hook ${hookName} from extension ${context.extensionId}:`, error);
      }
    }
    
    return results;
  }
  
  /**
   * Check if a hook exists
   * @param hookName The name of the hook to check
   * @returns True if the hook exists
   */
  public static hasHook(hookName: string): boolean {
    return this.hooks.has(hookName) && this.hooks.get(hookName)!.size > 0;
  }
  
  /**
   * Get all registered hook names
   * @returns Array of hook names
   */
  public static getHookNames(): string[] {
    return Array.from(this.hooks.keys());
  }
}

/**
 * Standard hooks for the extension system
 */
export class StandardHooks {
  // UI hooks
  public static readonly UI_ADMIN_MENU = 'ui:admin:menu';
  public static readonly UI_ADMIN_SETTINGS = 'ui:admin:settings';
  public static readonly UI_CHAT_SIDEBAR = 'ui:chat:sidebar';
  public static readonly UI_CHAT_MESSAGE = 'ui:chat:message';
  public static readonly UI_CHAT_INPUT = 'ui:chat:input';
  public static readonly UI_HEADER = 'ui:header';
  public static readonly UI_SETTINGS = 'ui:settings';
  
  // Model hooks
  public static readonly MODEL_INIT = 'model:init';
  public static readonly MODEL_LOAD = 'model:load';
  public static readonly MODEL_REQUEST = 'model:request';
  public static readonly MODEL_RESPONSE = 'model:response';
  
  // Tool hooks
  public static readonly TOOL_REGISTER = 'tool:register';
  public static readonly TOOL_EXECUTE = 'tool:execute';
  
  // Theme hooks
  public static readonly THEME_LOAD = 'theme:load';
  
  // Lifecycle hooks
  public static readonly INIT = 'init';
  public static readonly ACTIVATE = 'activate';
  public static readonly DEACTIVATE = 'deactivate';
  public static readonly UNINSTALL = 'uninstall';
}
