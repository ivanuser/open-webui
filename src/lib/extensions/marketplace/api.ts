/**
 * Extension Marketplace API Client
 */

import { MARKETPLACE_API } from './config';
import type { ExtensionManifest } from '../framework/types';

// Types for marketplace data
export interface MarketplaceExtension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  license?: string;
  type: string;
  tags: string[];
  category: string;
  compatibility: {
    openWebUIVersion: string;
  };
  downloads: number;
  rating: number;
  repository?: string;
  createdAt: string;
  updatedAt: string;
  manifest: string;
  readme: string;
  preview: string;
  latestRelease: string;
  featured: boolean;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
  extensions: string[];
}

export interface MarketplaceFeatured {
  featured: MarketplaceExtension[];
  collections: {
    id: string;
    name: string;
    description: string;
    extensions: string[];
  }[];
  spotlight?: {
    id: string;
    title: string;
    description: string;
    banner: string;
    learnMoreUrl: string;
  };
}

export interface ReleaseInfo {
  version: string;
  releaseDate: string;
  downloadUrl: string;
  sha256: string;
  size: number;
  changelog: string[];
  minimumOpenWebUIVersion: string;
  releaseNotes?: string;
}

/**
 * Fetch all extensions from the marketplace
 */
export async function fetchMarketplaceExtensions(): Promise<MarketplaceExtension[]> {
  try {
    const response = await fetch(MARKETPLACE_API.extensions);
    if (!response.ok) {
      throw new Error(`Failed to fetch extensions: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.extensions || [];
  } catch (error) {
    console.error('Error fetching marketplace extensions:', error);
    return [];
  }
}

/**
 * Fetch extension categories from the marketplace
 */
export async function fetchMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  try {
    const response = await fetch(MARKETPLACE_API.categories);
    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.categories || [];
  } catch (error) {
    console.error('Error fetching marketplace categories:', error);
    return [];
  }
}

/**
 * Fetch featured extensions from the marketplace
 */
export async function fetchMarketplaceFeatured(): Promise<MarketplaceFeatured> {
  try {
    const response = await fetch(MARKETPLACE_API.featured);
    if (!response.ok) {
      throw new Error(`Failed to fetch featured extensions: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching featured extensions:', error);
    return { featured: [], collections: [] };
  }
}

/**
 * Fetch extension manifest from the marketplace
 */
export async function fetchExtensionManifest(id: string): Promise<ExtensionManifest | null> {
  try {
    const response = await fetch(MARKETPLACE_API.getExtensionManifest(id));
    if (!response.ok) {
      throw new Error(`Failed to fetch extension manifest: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching manifest for extension ${id}:`, error);
    return null;
  }
}

/**
 * Fetch extension readme from the marketplace
 */
export async function fetchExtensionReadme(id: string): Promise<string> {
  try {
    const response = await fetch(MARKETPLACE_API.getExtensionReadme(id));
    if (!response.ok) {
      throw new Error(`Failed to fetch extension readme: ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error fetching readme for extension ${id}:`, error);
    return '';
  }
}

/**
 * Fetch extension release info from the marketplace
 */
export async function fetchExtensionReleaseInfo(id: string): Promise<ReleaseInfo | null> {
  try {
    const response = await fetch(MARKETPLACE_API.getExtensionLatestRelease(id));
    if (!response.ok) {
      throw new Error(`Failed to fetch release info: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching release info for extension ${id}:`, error);
    return null;
  }
}

/**
 * Search extensions in the marketplace
 */
export async function searchMarketplaceExtensions(query: string, category?: string, type?: string): Promise<MarketplaceExtension[]> {
  try {
    let url = `${MARKETPLACE_API.search}?q=${encodeURIComponent(query)}`;
    
    if (category && category !== 'all') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    
    if (type && type !== 'all') {
      url += `&type=${encodeURIComponent(type)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to search extensions: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching marketplace extensions:', error);
    return [];
  }
}

/**
 * Install an extension from the marketplace
 */
export async function installMarketplaceExtension(
  token: string, 
  extensionId: string
): Promise<boolean> {
  try {
    // 1. Fetch the extension manifest
    const manifest = await fetchExtensionManifest(extensionId);
    if (!manifest) {
      throw new Error(`Failed to fetch manifest for extension ${extensionId}`);
    }
    
    // 2. Fetch release information
    const releaseInfo = await fetchExtensionReleaseInfo(extensionId);
    if (!releaseInfo) {
      throw new Error(`Failed to fetch release info for extension ${extensionId}`);
    }
    
    // 3. Download the extension package
    const packageResponse = await fetch(releaseInfo.downloadUrl);
    if (!packageResponse.ok) {
      throw new Error(`Failed to download extension package: ${packageResponse.statusText}`);
    }
    
    // 4. Extract and install the extension
    // Note: In a real implementation, this would require server-side code to handle
    //       downloading, verifying, and installing the extension package
    //       For now, we'll simulate this by calling the extension installation API
    
    const installResponse = await fetch('/api/extensions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(manifest)
    });
    
    if (!installResponse.ok) {
      throw new Error(`Failed to install extension: ${installResponse.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error installing extension ${extensionId}:`, error);
    return false;
  }
}
