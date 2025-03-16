<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { toast } from 'svelte-sonner';
  
  import { 
    fetchMarketplaceExtensions, 
    fetchMarketplaceCategories, 
    fetchMarketplaceFeatured,
    installMarketplaceExtension,
    trackExtensionInstall
  } from '../api';
  import { EXTENSION_CATEGORIES, EXTENSION_TYPES } from '../config';
  import type { MarketplaceExtension, MarketplaceCategory } from '../api';
  
  import MarketplaceCard from './MarketplaceCard.svelte';
  import MarketplaceFeatured from './MarketplaceFeatured.svelte';
  import ExtensionDetails from './ExtensionDetails.svelte';
  
  import Search from '$lib/components/icons/Search.svelte';
  import ArrowPath from '$lib/components/icons/ArrowPath.svelte';
  
  // State
  let loading = true;
  let extensions: MarketplaceExtension[] = [];
  let categories: MarketplaceCategory[] = [];
  let featuredExtensions: MarketplaceExtension[] = [];
  let spotlight = null;
  let installing = false;
  
  // Filters
  let searchQuery = '';
  let selectedCategory = 'all';
  let selectedType = 'all';
  
  // Selected extension for details view
  let selectedExtension: MarketplaceExtension | null = null;
  
  // Fetch data on mount
  onMount(async () => {
    await Promise.all([
      loadExtensions(),
      loadCategories(),
      loadFeatured()
    ]);
    loading = false;
  });
  
  // Load extensions from marketplace
  async function loadExtensions() {
    extensions = await fetchMarketplaceExtensions();
    
    // Reset mock data - set downloads and ratings to realistic initial values
    extensions = extensions.map(ext => ({
      ...ext,
      downloads: 0,
      rating: 0
    }));
    
    // Remove duplicate extensions by ID
    const uniqueExtensions = new Map();
    extensions.forEach(ext => {
      if (!uniqueExtensions.has(ext.id)) {
        uniqueExtensions.set(ext.id, ext);
      }
    });
    
    extensions = Array.from(uniqueExtensions.values());
  }
  
  // Load categories from marketplace
  async function loadCategories() {
    categories = await fetchMarketplaceCategories();
  }
  
  // Load featured extensions from marketplace
  async function loadFeatured() {
    const featuredData = await fetchMarketplaceFeatured();
    if (featuredData.featured) {
      featuredExtensions = featuredData.featured;
      
      // Reset mock data for featured extensions
      featuredExtensions = featuredExtensions.map(ext => ({
        ...ext,
        downloads: 0,
        rating: 0
      }));
      
      // Remove duplicates
      const uniqueFeatured = new Map();
      featuredExtensions.forEach(ext => {
        if (!uniqueFeatured.has(ext.id)) {
          uniqueFeatured.set(ext.id, ext);
        }
      });
      
      featuredExtensions = Array.from(uniqueFeatured.values());
    }
    
    spotlight = featuredData.spotlight || null;
  }
  
  // Refresh marketplace data
  async function refreshMarketplace() {
    loading = true;
    await Promise.all([
      loadExtensions(),
      loadCategories(),
      loadFeatured()
    ]);
    loading = false;
    toast.success('Marketplace data refreshed');
  }
  
  // Filter extensions based on search and category
  $: filteredExtensions = extensions.filter(extension => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = extension.name.toLowerCase().includes(query);
      const matchesDescription = extension.description.toLowerCase().includes(query);
      const matchesTags = extension.tags.some(tag => tag.toLowerCase().includes(query));
      
      if (!(matchesName || matchesDescription || matchesTags)) {
        return false;
      }
    }
    
    // Filter by category
    if (selectedCategory !== 'all' && extension.category !== selectedCategory) {
      return false;
    }
    
    // Filter by type
    if (selectedType !== 'all' && extension.type !== selectedType) {
      return false;
    }
    
    return true;
  });
  
  // Handle category selection
  function handleCategorySelect(category: string) {
    selectedCategory = category;
  }
  
  // Handle type selection
  function handleTypeSelect(type: string) {
    selectedType = type;
  }
  
  // View extension details
  function viewExtensionDetails(extension: MarketplaceExtension) {
    selectedExtension = extension;
  }
  
  // Close extension details
  function closeExtensionDetails() {
    selectedExtension = null;
  }
  
  // Install extension
  async function installExtension(extension: MarketplaceExtension) {
    if (installing) {
      toast.info('Another extension is currently being installed. Please wait.');
      return;
    }
    
    installing = true;
    
    try {
      toast.loading(`Installing ${extension.name}...`);
      
      const success = await installMarketplaceExtension(localStorage.token, extension.id);
      
      if (success) {
        // Track the installation (not implemented on server yet)
        await trackExtensionInstall(extension.id);
        
        toast.dismiss();
        toast.success(`Extension "${extension.name}" installed successfully`);
        
        // Update extension in the list - increment download count
        const updatedExtensions = [...extensions];
        const extensionIndex = updatedExtensions.findIndex(ext => ext.id === extension.id);
        
        if (extensionIndex >= 0) {
          updatedExtensions[extensionIndex] = {
            ...updatedExtensions[extensionIndex],
            downloads: updatedExtensions[extensionIndex].downloads + 1
          };
          extensions = updatedExtensions;
        }
      } else {
        toast.dismiss();
        toast.error(`Failed to install extension "${extension.name}"`);
      }
    } catch (error) {
      console.error('Error installing extension:', error);
      toast.dismiss();
      toast.error(`Error installing extension: ${error.message || 'Unknown error'}`);
    } finally {
      installing = false;
    }
  }
</script>

<div class="h-full flex flex-col">
  {#if selectedExtension}
    <ExtensionDetails 
      extension={selectedExtension} 
      onClose={closeExtensionDetails}
      onInstall={() => installExtension(selectedExtension)}
    />
  {:else}
    <div class="space-y-6">
      <!-- Logo header -->
      <div class="flex justify-center mb-4">
        <div class="text-center">
          <img 
            src="/images/marketplace/extensplace-logo.png" 
            alt="Open-WebUI Extensplace" 
            class="w-48 h-auto mx-auto" 
          />
          <h1 class="text-2xl font-bold mt-2 bg-gradient-to-r from-red-500 to-orange-500 text-transparent bg-clip-text">
            Open-WebUI Extensplace
          </h1>
        </div>
      </div>
      
      <!-- Header with search and filters -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 class="text-xl font-bold">Extension Marketplace</h2>
        
        <div class="flex items-center gap-2">
          <div class="relative w-full sm:w-64">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search extensions..."
              class="w-full pl-8 pr-3 py-2 border rounded-md"
              bind:value={searchQuery}
            />
          </div>
          
          <button 
            class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            on:click={refreshMarketplace}
            title="Refresh marketplace data"
          >
            <ArrowPath class="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <!-- Category and type filters -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 class="text-sm font-medium mb-2">Categories</h3>
          <div class="flex flex-wrap gap-2">
            {#each EXTENSION_CATEGORIES as category}
              <button
                class="px-3 py-1 text-sm rounded-full {selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}"
                on:click={() => handleCategorySelect(category.id)}
              >
                {category.name}
              </button>
            {/each}
          </div>
        </div>
        
        <div>
          <h3 class="text-sm font-medium mb-2">Types</h3>
          <div class="flex flex-wrap gap-2">
            {#each EXTENSION_TYPES as type}
              <button
                class="px-3 py-1 text-sm rounded-full {selectedType === type.id
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'}"
                on:click={() => handleTypeSelect(type.id)}
              >
                {type.name}
              </button>
            {/each}
          </div>
        </div>
      </div>
      
      <!-- Featured extensions when no search/filter -->
      {#if !searchQuery && selectedCategory === 'all' && selectedType === 'all' && featuredExtensions.length > 0}
        <MarketplaceFeatured 
          featured={featuredExtensions} 
          spotlight={spotlight}
          onViewDetails={viewExtensionDetails}
          onInstall={installExtension}
        />
      {/if}
      
      <!-- Extensions list -->
      {#if loading}
        <div class="flex flex-col items-center justify-center py-8">
          <ArrowPath class="w-8 h-8 animate-spin text-gray-400" />
          <p class="mt-2 text-sm text-gray-500">Loading extensions...</p>
        </div>
      {:else if filteredExtensions.length === 0}
        <div class="border rounded-md flex flex-col items-center justify-center p-8">
          <div class="text-center space-y-2">
            <h3 class="text-lg font-medium">No Extensions Found</h3>
            <p class="text-sm text-gray-500">
              {searchQuery 
                ? 'No extensions match your search criteria'
                : 'No extensions available in this category/type'}
            </p>
          </div>
        </div>
      {:else}
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" in:fade={{ duration: 150 }}>
          {#each filteredExtensions as extension (extension.id)}
            <MarketplaceCard 
              {extension}
              onViewDetails={() => viewExtensionDetails(extension)}
              onInstall={() => installExtension(extension)}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
