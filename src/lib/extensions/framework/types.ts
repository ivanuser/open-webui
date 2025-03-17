/**
 * Extension Framework Types
 * Defines the core types for the extension system
 */

export enum ExtensionType {
  UI = 'ui',
  API = 'api',
  MODEL_ADAPTER = 'model-adapter',
  TOOL = 'tool',
  THEME = 'theme'
}

export interface SidebarConfig {
  icon: string;
  label: string;
  priority?: number;
}

export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  authorUrl?: string;
  homepage?: string;
  repository?: string;
  license?: string;
  type: string | string[];
  icon?: string;
  tags?: string[];
  minAppVersion?: string;
  maxAppVersion?: string;
  main?: string;
  entry_point?: string;
  settings?: ExtensionSetting[];
  sidebar?: SidebarConfig;
  routes?: {
    path: string;
    component: string;
  }[];
  status?: string;
}

export interface ExtensionSetting {
  id: string;
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  default?: any;
  options?: {value: string, label: string}[]; // For select/multiselect
  required?: boolean;
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface Extension {
  manifest: ExtensionManifest;
  enabled: boolean;
  installed: boolean;
  settings?: Record<string, any>;
  installDate?: Date;
  updateDate?: Date;
  status?: string;
}

export interface ExtensionModule {
  manifest: ExtensionManifest;
  initialize: () => Promise<boolean> | boolean;
  activate: () => Promise<boolean> | boolean;
  deactivate: () => Promise<boolean> | boolean;
  uninstall?: () => Promise<void> | void;
  getSettings?: () => Record<string, any>;
  updateSettings?: (settings: Record<string, any>) => Promise<void> | void;
}

export interface HookContext {
  extensionId: string;
  [key: string]: any;
}

export type HookHandler = (context: HookContext) => Promise<any> | any;

export interface Hook {
  name: string;
  handler: HookHandler;
  priority?: number; // Higher priority hooks run first (default: 10)
}

export interface ExtensionRegistration {
  id: string;
  hooks: Hook[];
  module: ExtensionModule;
}
