/**
 * Extension Framework Utilities
 * Provides utility functions for extension development and management
 */

import { version as appVersion } from '$app/environment';
import type { ExtensionManifest } from './types';

/**
 * Check if a version string satisfies a version constraint
 * Supports semver ranges: ^1.0.0, ~1.0.0, >=1.0.0, etc.
 * 
 * @param version The version to check
 * @param constraint The version constraint
 * @returns True if the version satisfies the constraint
 */
export function satisfiesVersion(version: string, constraint: string): boolean {
  if (!constraint) return true;
  
  // Parse version parts
  const vParts = version.split('.').map(p => parseInt(p, 10));
  
  // Handle different constraint types
  if (constraint.startsWith('^')) {
    // Compatible with major version (^1.2.3 -> >=1.2.3 <2.0.0)
    const cParts = constraint.slice(1).split('.').map(p => parseInt(p, 10));
    if (vParts[0] !== cParts[0]) return false;
    if (vParts[0] === 0) {
      // For 0.x.y versions, ^0.x.y is treated as ~0.x.y
      if (vParts[1] < cParts[1]) return false;
      if (vParts[1] === cParts[1] && vParts[2] < cParts[2]) return false;
    } else {
      if (vParts[0] > cParts[0]) return true;
      if (vParts[1] < cParts[1]) return false;
      if (vParts[1] === cParts[1] && vParts[2] < cParts[2]) return false;
    }
    return true;
  } else if (constraint.startsWith('~')) {
    // Compatible with minor version (~1.2.3 -> >=1.2.3 <1.3.0)
    const cParts = constraint.slice(1).split('.').map(p => parseInt(p, 10));
    if (vParts[0] !== cParts[0]) return false;
    if (vParts[1] !== cParts[1]) return false;
    if (vParts[2] < cParts[2]) return false;
    return true;
  } else if (constraint.startsWith('>=')) {
    // Greater than or equal to
    const cParts = constraint.slice(2).split('.').map(p => parseInt(p, 10));
    if (vParts[0] < cParts[0]) return false;
    if (vParts[0] > cParts[0]) return true;
    if (vParts[1] < cParts[1]) return false;
    if (vParts[1] > cParts[1]) return true;
    if (vParts[2] < cParts[2]) return false;
    return true;
  } else if (constraint.startsWith('<=')) {
    // Less than or equal to
    const cParts = constraint.slice(2).split('.').map(p => parseInt(p, 10));
    if (vParts[0] > cParts[0]) return false;
    if (vParts[0] < cParts[0]) return true;
    if (vParts[1] > cParts[1]) return false;
    if (vParts[1] < cParts[1]) return true;
    if (vParts[2] > cParts[2]) return false;
    return true;
  } else if (constraint.startsWith('>')) {
    // Greater than
    const cParts = constraint.slice(1).split('.').map(p => parseInt(p, 10));
    if (vParts[0] < cParts[0]) return false;
    if (vParts[0] > cParts[0]) return true;
    if (vParts[1] < cParts[1]) return false;
    if (vParts[1] > cParts[1]) return true;
    if (vParts[2] <= cParts[2]) return false;
    return true;
  } else if (constraint.startsWith('<')) {
    // Less than
    const cParts = constraint.slice(1).split('.').map(p => parseInt(p, 10));
    if (vParts[0] > cParts[0]) return false;
    if (vParts[0] < cParts[0]) return true;
    if (vParts[1] > cParts[1]) return false;
    if (vParts[1] < cParts[1]) return true;
    if (vParts[2] >= cParts[2]) return false;
    return true;
  } else {
    // Exact version match
    return version === constraint;
  }
}

/**
 * Check if a manifest is compatible with the current app version
 * @param manifest The extension manifest
 * @returns True if the extension is compatible
 */
export function isCompatible(manifest: ExtensionManifest): boolean {
  // Check minimum app version
  if (manifest.minAppVersion && !satisfiesVersion(appVersion, `>=${manifest.minAppVersion}`)) {
    return false;
  }
  
  // Check maximum app version
  if (manifest.maxAppVersion && !satisfiesVersion(appVersion, `<=${manifest.maxAppVersion}`)) {
    return false;
  }
  
  return true;
}

/**
 * Validate an extension manifest
 * @param manifest The extension manifest to validate
 * @returns An array of validation errors, or an empty array if valid
 */
export function validateManifest(manifest: any): string[] {
  const errors: string[] = [];
  
  // Check required fields
  if (!manifest.id) errors.push('Missing required field: id');
  if (!manifest.name) errors.push('Missing required field: name');
  if (!manifest.version) errors.push('Missing required field: version');
  if (!manifest.description) errors.push('Missing required field: description');
  if (!manifest.author) errors.push('Missing required field: author');
  if (!manifest.type) errors.push('Missing required field: type');
  if (!manifest.main) errors.push('Missing required field: main');
  
  // Validate version format (semver)
  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push('Invalid version format. Must be in semver format (e.g., 1.0.0)');
  }
  
  // Validate settings if present
  if (manifest.settings) {
    if (!Array.isArray(manifest.settings)) {
      errors.push('Settings must be an array');
    } else {
      manifest.settings.forEach((setting: any, index: number) => {
        if (!setting.id) errors.push(`Setting at index ${index} is missing required field: id`);
        if (!setting.name) errors.push(`Setting at index ${index} is missing required field: name`);
        if (!setting.type) errors.push(`Setting at index ${index} is missing required field: type`);
        
        // Validate setting type
        if (setting.type && !['string', 'number', 'boolean', 'select', 'multiselect'].includes(setting.type)) {
          errors.push(`Setting "${setting.id}" has invalid type. Must be one of: string, number, boolean, select, multiselect`);
        }
        
        // Validate options for select/multiselect
        if ((setting.type === 'select' || setting.type === 'multiselect') && (!setting.options || !Array.isArray(setting.options) || setting.options.length === 0)) {
          errors.push(`Setting "${setting.id}" of type "${setting.type}" must have options array`);
        }
      });
    }
  }
  
  return errors;
}

/**
 * Load and validate an extension manifest from JSON
 * @param json The manifest JSON
 * @returns The validated manifest or null if invalid
 */
export function loadManifest(json: string): ExtensionManifest | null {
  try {
    const manifest = JSON.parse(json);
    const errors = validateManifest(manifest);
    
    if (errors.length > 0) {
      console.error('Invalid extension manifest:', errors);
      return null;
    }
    
    return manifest as ExtensionManifest;
  } catch (error) {
    console.error('Failed to parse extension manifest:', error);
    return null;
  }
}

/**
 * Generate a default configuration for an extension based on its manifest
 * @param manifest The extension manifest
 * @returns A default configuration object
 */
export function generateDefaultConfig(manifest: ExtensionManifest): Record<string, any> {
  const config: Record<string, any> = {};
  
  if (manifest.settings) {
    for (const setting of manifest.settings) {
      config[setting.id] = setting.default;
    }
  }
  
  return config;
}
