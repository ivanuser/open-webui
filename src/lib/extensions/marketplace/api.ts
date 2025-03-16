/**
 * Extension Marketplace API Client
 */

import { MARKETPLACE_API } from './config';
import type { ExtensionManifest } from '../framework/types';
import { toast } from 'svelte-sonner';

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
 * Safe JSON parsing that handles HTML responses
 */
async function safeJsonFetch(url: string) {
  console.log(`Fetching from URL: ${url}`);
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}: ${response.statusText}`);
    }
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.warn(`Expected JSON but got ${contentType} from ${url}`);
      
      // Get the first few characters to log for debugging
      const text = await response.text();
      const preview = text.substring(0, 100);
      console.error(`Response starts with: ${preview}...`);
      
      // For now, return empty data
      return {};
    }
    
    // Parse the JSON
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      console.error(`Failed to parse JSON from ${url}`, error);
      console.error(`Response content: ${text.substring(0, 200)}...`);
      throw new Error(`Invalid JSON response from ${url}`);
    }
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    // Return an empty object instead of throwing
    return {};
  }
}

/**
 * Fetch all extensions from the marketplace
 */
export async function fetchMarketplaceExtensions(): Promise<MarketplaceExtension[]> {
  try {
    // IMPORTANT: Using hardcoded data only - skip network requests for now
    // We'll re-enable network requests once the marketplace API is stable
    return getHardcodedExtensions();
    
    /* Original code - commenting out for now
    console.log(`Fetching extensions from: ${MARKETPLACE_API.extensions}`);
    const data = await safeJsonFetch(MARKETPLACE_API.extensions);
    
    if (data && data.extensions && Array.isArray(data.extensions)) {
      return data.extensions;
    } else {
      console.warn('Extensions data format is invalid, using hardcoded data');
      return getHardcodedExtensions();
    }
    */
  } catch (error) {
    console.error('Error fetching marketplace extensions:', error);
    toast.error(`Failed to load extensions: ${error.message}`);
    return getHardcodedExtensions();
  }
}

/**
 * Get hardcoded example extensions for testing
 */
function getHardcodedExtensions(): MarketplaceExtension[] {
  return [
    {
      id: "prompt-library",
      name: "Prompt Library",
      description: "Save, organize, and reuse effective prompts with categories and templates",
      version: "0.1.0",
      author: "Open WebUI Team",
      license: "MIT",
      type: "ui",
      tags: ["prompts", "templates", "productivity"],
      category: "productivity",
      compatibility: {
        openWebUIVersion: ">=0.1.0"
      },
      downloads: 1240,
      rating: 4.8,
      // Updated repository URL to point to the correct location in the extension marketplace
      repository: "https://github.com/ivanuser/open-webui-extension-marketplace/tree/main/extensions/prompt-library",
      createdAt: "2025-03-15T10:00:00Z",
      updatedAt: "2025-03-15T10:00:00Z",
      manifest: "/extensions/prompt-library/manifest.json",
      readme: "/extensions/prompt-library/README.md",
      preview: "/extensions/prompt-library/preview.png",
      latestRelease: "/extensions/prompt-library/releases/latest.json",
      featured: true
    }
  ];
}

/**
 * Fetch extension categories from the marketplace
 */
export async function fetchMarketplaceCategories(): Promise<MarketplaceCategory[]> {
  try {
    // Using hardcoded categories only for now
    return [
      {
        id: "productivity",
        name: "Productivity",
        description: "Extensions that enhance productivity and workflow",
        icon: "clipboard-list",
        count: 1,
        extensions: ["prompt-library"]
      }
    ];
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
    // Using hardcoded featured data only for now
    return {
      featured: getHardcodedExtensions(),
      collections: [
        {
          id: "productivity-essentials",
          name: "Productivity Essentials",
          description: "Must-have extensions to boost your productivity",
          extensions: ["prompt-library"]
        }
      ]
    };
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
    // For prompt-library, return hardcoded manifest
    if (id === "prompt-library") {
      return {
        id: "prompt-library",
        name: "Prompt Library",
        description: "Save, organize, and reuse effective prompts with categories and templates",
        version: "0.1.0",
        author: "Open WebUI Team",
        type: "ui",
        entry_point: "__init__.py"
      };
    }
    return null;
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
    // For prompt-library, return hardcoded readme
    if (id === "prompt-library") {
      return `# Prompt Library Extension for Open WebUI

Save, organize, and reuse your most effective prompts with the Prompt Library extension for Open WebUI.

## Features

- **Save Prompts**: Capture effective prompts directly from your conversations
- **Organize**: Categorize and tag prompts for easy retrieval
- **Templates**: Use and customize pre-built prompt templates for common tasks
- **Import/Export**: Share prompt collections with others
- **Quick Access**: Insert prompts directly into your conversations`;
    }
    return '';
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
    // For prompt-library, return hardcoded release info
    if (id === "prompt-library") {
      return {
        version: "0.1.0",
        releaseDate: "2025-03-15T10:00:00Z",
        // Make sure this URL is correct for your ZIP file
        downloadUrl: "https://raw.githubusercontent.com/ivanuser/open-webui-extension-marketplace/main/extensions/prompt-library/releases/0.1.0.zip",
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        size: 245678,
        changelog: [
          "Initial release",
          "Basic prompt management functionality",
          "Pre-built prompt templates",
          "Categorization and tagging"
        ],
        minimumOpenWebUIVersion: "0.1.0",
        releaseNotes: "This is the first release of the Prompt Library extension for Open WebUI."
      };
    }
    return null;
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
    // Just return the hardcoded extensions for now
    return getHardcodedExtensions();
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
    console.log("Release info:", releaseInfo);
    
    // Prepare request payload
    const payload = {
      id: extensionId,  // Added explicit ID
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
    };
    
    console.log("Installation payload:", JSON.stringify(payload, null, 2));
    
    // 3. Use the new dedicated installation endpoint
    const installResponse = await fetch('/api/admin/extensions/install', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    // Log the full response for debugging
    console.log("Installation API response status:", installResponse.status);
    
    if (!installResponse.ok) {
      const errorText = await installResponse.text();
      console.error("Installation error response:", errorText);
      
      let errorMessage = `Error ${installResponse.status}: ${installResponse.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorData.detail || errorMessage;
      } catch (e) {
        // If we can't parse JSON, just use the error text
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(`Failed to install extension: ${errorMessage}`);
    }
    
    // 4. Get the response data
    const responseData = await installResponse.json();
    console.log("Installation successful:", responseData);
    
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
