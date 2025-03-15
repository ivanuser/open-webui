/**
 * Extension Framework Decorators
 * Provides decorators for extension development
 */

import type { Hook, HookContext } from './types';
import { StandardHooks } from './hooks';

/**
 * Hook decorator
 * @param hookName The name of the hook
 * @param priority Optional priority (higher priority hooks run first)
 * @returns Method decorator
 */
export function Hook(hookName: string, priority: number = 10) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    // Store the hook metadata on the class
    if (!target.constructor._hooks) {
      target.constructor._hooks = [];
    }
    
    // Add the hook definition
    const hook: Hook = {
      name: hookName,
      handler: originalMethod,
      priority
    };
    
    target.constructor._hooks.push(hook);
    
    return descriptor;
  };
}

/**
 * Decorator for UI extension admin menu hooks
 * @param priority Optional priority
 */
export function AdminMenuHook(priority: number = 10) {
  return Hook(StandardHooks.UI_ADMIN_MENU, priority);
}

/**
 * Decorator for UI extension admin settings hooks
 * @param priority Optional priority
 */
export function AdminSettingsHook(priority: number = 10) {
  return Hook(StandardHooks.UI_ADMIN_SETTINGS, priority);
}

/**
 * Decorator for UI extension chat sidebar hooks
 * @param priority Optional priority
 */
export function ChatSidebarHook(priority: number = 10) {
  return Hook(StandardHooks.UI_CHAT_SIDEBAR, priority);
}

/**
 * Decorator for UI extension chat message hooks
 * @param priority Optional priority
 */
export function ChatMessageHook(priority: number = 10) {
  return Hook(StandardHooks.UI_CHAT_MESSAGE, priority);
}

/**
 * Decorator for UI extension chat input hooks
 * @param priority Optional priority
 */
export function ChatInputHook(priority: number = 10) {
  return Hook(StandardHooks.UI_CHAT_INPUT, priority);
}

/**
 * Decorator for UI extension header hooks
 * @param priority Optional priority
 */
export function HeaderHook(priority: number = 10) {
  return Hook(StandardHooks.UI_HEADER, priority);
}

/**
 * Decorator for UI extension settings hooks
 * @param priority Optional priority
 */
export function SettingsHook(priority: number = 10) {
  return Hook(StandardHooks.UI_SETTINGS, priority);
}

/**
 * Decorator for model initialization hooks
 * @param priority Optional priority
 */
export function ModelInitHook(priority: number = 10) {
  return Hook(StandardHooks.MODEL_INIT, priority);
}

/**
 * Decorator for model load hooks
 * @param priority Optional priority
 */
export function ModelLoadHook(priority: number = 10) {
  return Hook(StandardHooks.MODEL_LOAD, priority);
}

/**
 * Decorator for model request hooks
 * @param priority Optional priority
 */
export function ModelRequestHook(priority: number = 10) {
  return Hook(StandardHooks.MODEL_REQUEST, priority);
}

/**
 * Decorator for model response hooks
 * @param priority Optional priority
 */
export function ModelResponseHook(priority: number = 10) {
  return Hook(StandardHooks.MODEL_RESPONSE, priority);
}

/**
 * Decorator for tool registration hooks
 * @param priority Optional priority
 */
export function ToolRegisterHook(priority: number = 10) {
  return Hook(StandardHooks.TOOL_REGISTER, priority);
}

/**
 * Decorator for tool execution hooks
 * @param priority Optional priority
 */
export function ToolExecuteHook(priority: number = 10) {
  return Hook(StandardHooks.TOOL_EXECUTE, priority);
}

/**
 * Decorator for theme load hooks
 * @param priority Optional priority
 */
export function ThemeLoadHook(priority: number = 10) {
  return Hook(StandardHooks.THEME_LOAD, priority);
}

/**
 * Decorator for initialization hooks
 * @param priority Optional priority
 */
export function InitHook(priority: number = 10) {
  return Hook(StandardHooks.INIT, priority);
}

/**
 * Decorator for activation hooks
 * @param priority Optional priority
 */
export function ActivateHook(priority: number = 10) {
  return Hook(StandardHooks.ACTIVATE, priority);
}

/**
 * Decorator for deactivation hooks
 * @param priority Optional priority
 */
export function DeactivateHook(priority: number = 10) {
  return Hook(StandardHooks.DEACTIVATE, priority);
}

/**
 * Decorator for uninstall hooks
 * @param priority Optional priority
 */
export function UninstallHook(priority: number = 10) {
  return Hook(StandardHooks.UNINSTALL, priority);
}
