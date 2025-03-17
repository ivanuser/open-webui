/**
 * Extension Marketplace API Client
 * 
 * IMPORTANT: This is a fully mocked implementation that doesn't require any actual API calls.
 * All data is hardcoded and all operations are simulated client-side only.
 */

import { toast } from 'svelte-sonner';
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
    // Return hardcoded data only
    return getHardcodedExtensions();
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
      ],
      spotlight: {
        id: "prompt-library",
        title: "Prompt Library - Save and organize your prompts!",
        description: "Enhance your productivity with this powerful prompt management tool. Save, categorize, and reuse your best prompts for consistent AI interactions.",
        banner: "https://raw.githubusercontent.com/ivanuser/open-webui-extension-marketplace/main/extensions/prompt-library/preview.png",
        learnMoreUrl: "https://github.com/ivanuser/open-webui-extension-marketplace/tree/main/extensions/prompt-library"
      }
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
        entry_point: "__init__.py",
        sidebar: {
          icon: "BookOpen",
          label: "Prompt Library"
        }
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
 * Install an extension from the marketplace (MOCK)
 * This is a mock implementation that simulates installation success
 */
export async function installMarketplaceExtension(token: string, extensionId: string): Promise<boolean> {
  try {
    console.log(`Installing extension: ${extensionId} (MOCK)`);
    
    // Simulate a short delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Always return success
    return true;
  } catch (error) {
    console.error(`Error installing extension ${extensionId}:`, error);
    throw error;
  }
}

/**
 * Track extension download/installation (MOCK)
 */
export async function trackExtensionInstall(extensionId: string): Promise<void> {
  console.log(`Extension downloaded: ${extensionId} (MOCK)`);
}
