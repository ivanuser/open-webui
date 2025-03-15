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
    // For now, do client-side filtering of extensions
    const extensions = await fetchMarketplaceExtensions();
    
    return extensions.filter(extension => {
      // Filter by search query
      if (query) {
        const queryLower = query.toLowerCase();
        
        const matchesName = extension.name.toLowerCase().includes(queryLower);
        const matchesDescription = extension.description.toLowerCase().includes(queryLower);
        const matchesTags = extension.tags.some(tag => tag.toLowerCase().includes(queryLower));
        
        if (!(matchesName || matchesDescription || matchesTags)) {
          return false;
        }
      }
      
      // Filter by category
      if (category && category !== 'all' && extension.category !== category) {
        return false;
      }
      
      // Filter by type
      if (type && type !== 'all' && extension.type !== type) {
        return false;
      }
      
      return true;
    });
  } catch (error) {
    console.error('Error searching marketplace extensions:', error);
    return [];
  }
}

/**
 * Install an extension from the marketplace
 * 
 * This uses the existing extension API endpoints in Open WebUI,
 * which might differ from what's available in your current setup.
 * Adjust the endpoint URLs and payloads as needed.
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
    
    console.log("Installing extension:", manifest);
    
    // 3. Call the Open WebUI extension installation API
    // Note: This endpoint might need to be adjusted based on your actual API
    const installResponse = await fetch('/api/admin/extensions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: manifest.name,
        description: manifest.description,
        version: manifest.version,
        author: manifest.author,
        type: manifest.type,
        source: {
          type: 'marketplace',
          id: extensionId,
          url: releaseInfo.downloadUrl
        }
      })
    });
    
    if (!installResponse.ok) {
      const errorData = await installResponse.json().catch(() => ({}));
      throw new Error(`Failed to install extension: ${errorData.message || installResponse.statusText}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error installing extension ${extensionId}:`, error);
    throw error;
  }
}

/**
 * Track extension download/installation 
 * This would normally update the download count on the marketplace server
 */
export async function trackExtensionInstall(extensionId: string): Promise<void> {
  // In a real implementation, this would call an API to track the download
  // For now, we'll just log it
  console.log(`Extension downloaded: ${extensionId}`);
}
