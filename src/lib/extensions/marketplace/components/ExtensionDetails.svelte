<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  
  import ArrowLeft from '$lib/components/icons/ArrowLeft.svelte';
  import ArrowPath from '$lib/components/icons/ArrowPath.svelte';
  
  import { fetchExtensionReadme, fetchExtensionReleaseInfo } from '../api';
  import type { MarketplaceExtension, ReleaseInfo } from '../api';
  
  // Props
  export let extension: MarketplaceExtension;
  export let onClose: () => void;
  export let onInstall: () => void;
  
  // State
  let readme = '';
  let releaseInfo: ReleaseInfo | null = null;
  let loading = true;
  let activeTab = 'details'; // 'details', 'changelog', 'screenshots'
  
  // Load data on mount
  onMount(async () => {
    await Promise.all([
      loadReadme(),
      loadReleaseInfo()
    ]);
    loading = false;
  });
  
  // Load extension readme
  async function loadReadme() {
    readme = await fetchExtensionReadme(extension.id);
  }
  
  // Load extension release info
  async function loadReleaseInfo() {
    releaseInfo = await fetchExtensionReleaseInfo(extension.id);
  }
  
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
  
  // Format file size
  function formatFileSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  }
  
  // Render markdown to HTML
  function renderMarkdown(markdown: string) {
    try {
      const html = marked(markdown);
      return DOMPurify.sanitize(html);
    } catch (e) {
      console.error('Error rendering markdown:', e);
      return '';
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

<div in:fade={{ duration: 150 }}>
  <!-- Header with back button -->
  <div class="flex items-center mb-4">
    <button
      on:click={onClose}
      class="mr-3 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
    >
      <ArrowLeft class="h-5 w-5" />
    </button>
    
    <h2 class="text-xl font-bold">Extension Details</h2>
  </div>
  
  <!-- Extension overview -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-6">
    <div class="p-6">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Preview image -->
        <div class="md:w-1/3 h-48 bg-gray-50 dark:bg-gray-750 rounded-lg overflow-hidden">
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
        
        <!-- Extension info -->
        <div class="md:w-2/3">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-2xl font-medium dark:text-white">{extension.name}</h3>
            
            <span
              class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full {getTypeBadgeColor(extension.type)}"
            >
              {extension.type}
            </span>
          </div>
          
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            {extension.description}
          </p>
          
          <div class="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
            <div>
              <span class="text-gray-500 dark:text-gray-400">Author:</span>
              <span class="font-medium dark:text-white">{extension.author}</span>
            </div>
            
            <div>
              <span class="text-gray-500 dark:text-gray-400">Version:</span>
              <span class="font-medium dark:text-white">{extension.version}</span>
            </div>
            
            <div>
              <span class="text-gray-500 dark:text-gray-400">Downloads:</span>
              <span class="font-medium dark:text-white">
                {extension.downloads > 0 ? extension.downloads.toLocaleString() : 'New'}
              </span>
            </div>
            
            <div>
              <span class="text-gray-500 dark:text-gray-400">Updated:</span>
              <span class="font-medium dark:text-white">{formatDate(extension.updatedAt)}</span>
            </div>
            
            {#if releaseInfo}
              <div>
                <span class="text-gray-500 dark:text-gray-400">Size:</span>
                <span class="font-medium dark:text-white">{formatFileSize(releaseInfo.size)}</span>
              </div>
              
              <div>
                <span class="text-gray-500 dark:text-gray-400">Min Version:</span>
                <span class="font-medium dark:text-white">{releaseInfo.minimumOpenWebUIVersion}</span>
              </div>
            {/if}
          </div>
          
          {#if extension.tags && extension.tags.length > 0}
            <div class="flex flex-wrap gap-1 mb-4">
              {#each extension.tags as tag}
                <span
                  class="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              {/each}
            </div>
          {/if}
          
          <div class="flex gap-3">
            <button
              on:click={onInstall}
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 border border-transparent rounded-md shadow-sm"
            >
              Install
            </button>
            
            {#if extension.repository}
              <a
                href={extension.repository}
                target="_blank"
                rel="noopener noreferrer"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:text-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
              >
                View Repository
              </a>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Tabs -->
  <div class="border-b border-gray-200 dark:border-gray-700 mb-6">
    <div class="flex -mb-px">
      <button
        class="py-2 px-4 font-medium {activeTab === 'details'
          ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
        on:click={() => activeTab = 'details'}
      >
        Details
      </button>
      
      {#if releaseInfo && releaseInfo.changelog && releaseInfo.changelog.length > 0}
        <button
          class="py-2 px-4 font-medium {activeTab === 'changelog'
            ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
          on:click={() => activeTab = 'changelog'}
        >
          Changelog
        </button>
      {/if}
    </div>
  </div>
  
  <!-- Tab content -->
  <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6">
    {#if loading}
      <div class="flex flex-col items-center justify-center py-8">
        <ArrowPath class="w-8 h-8 animate-spin text-gray-400" />
        <p class="mt-2 text-sm text-gray-500">Loading extension details...</p>
      </div>
    {:else if activeTab === 'details'}
      <!-- Details tab: README content -->
      {#if readme}
        <div class="prose dark:prose-invert max-w-none">
          {@html renderMarkdown(readme)}
        </div>
      {:else}
        <div class="text-center py-8 text-gray-500">
          No detailed description available for this extension.
        </div>
      {/if}
    {:else if activeTab === 'changelog'}
      <!-- Changelog tab -->
      {#if releaseInfo && releaseInfo.changelog && releaseInfo.changelog.length > 0}
        <div class="mb-4">
          <h3 class="text-lg font-medium mb-2">Version {releaseInfo.version}</h3>
          <p class="text-sm text-gray-500 mb-4">Released on {formatDate(releaseInfo.releaseDate)}</p>
          
          {#if releaseInfo.releaseNotes}
            <div class="mb-4 text-gray-600 dark:text-gray-300">
              {releaseInfo.releaseNotes}
            </div>
          {/if}
          
          <ul class="list-disc pl-5 space-y-1">
            {#each releaseInfo.changelog as item}
              <li class="text-gray-600 dark:text-gray-300">{item}</li>
            {/each}
          </ul>
        </div>
      {:else}
        <div class="text-center py-8 text-gray-500">
          No changelog available for this extension.
        </div>
      {/if}
    {/if}
  </div>
</div>
