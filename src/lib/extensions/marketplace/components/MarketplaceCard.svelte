<script lang="ts">
  import type { MarketplaceExtension } from '../api';
  
  // Props
  export let extension: MarketplaceExtension;
  export let onViewDetails: () => void;
  export let onInstall: () => void;
  
  // Format date helper
  function formatDate(dateStr) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  }
  
  // Get type badge color
  function getTypeBadgeColor(type) {
    const colors = {
      ui: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      api: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'model-adapter': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      tool: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      theme: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300'
    };
    
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
</script>

<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
  <!-- Preview image or placeholder -->
  <div class="w-full h-40 bg-gray-50 dark:bg-gray-750 overflow-hidden">
    {#if extension.preview}
      <img 
        src={extension.preview} 
        alt={`${extension.name} preview`} 
        class="w-full h-full object-cover"
        onerror="this.onerror=null; this.src=''; this.classList.add('bg-gray-100');"
      />
    {:else}
      <div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <span class="text-gray-400 dark:text-gray-500 text-sm">No preview available</span>
      </div>
    {/if}
  </div>
  
  <div class="p-4">
    <div class="flex justify-between items-start mb-2">
      <h3 class="text-lg font-medium dark:text-white">{extension.name}</h3>
      
      <span
        class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full {getTypeBadgeColor(extension.type)}"
      >
        {extension.type}
      </span>
    </div>
    
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
      {extension.description}
    </p>
    
    {#if extension.tags && extension.tags.length > 0}
      <div class="flex flex-wrap gap-1 mb-3">
        {#each extension.tags.slice(0, 3) as tag}
          <span
            class="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          >
            {tag}
          </span>
        {/each}
        {#if extension.tags.length > 3}
          <span
            class="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          >
            +{extension.tags.length - 3}
          </span>
        {/if}
      </div>
    {/if}
    
    <div class="flex items-center mb-3">
      {#if extension.downloads > 0}
        <span class="text-xs text-gray-600 dark:text-gray-400">{extension.downloads.toLocaleString()} downloads</span>
      {:else}
        <span class="text-xs text-gray-600 dark:text-gray-400">New</span>
      {/if}
    </div>
    
    <div class="mt-3 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
      <div>
        <span>{extension.author}</span>
      </div>
      <div>
        <span>v{extension.version}</span>
      </div>
    </div>
  </div>
  
  <div class="bg-gray-50 dark:bg-gray-750 px-4 py-3 flex justify-between">
    <button
      on:click={onViewDetails}
      class="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
    >
      Details
    </button>
    
    <button
      on:click={onInstall}
      class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border border-transparent rounded-md shadow-sm"
    >
      Install
    </button>
  </div>
</div>
