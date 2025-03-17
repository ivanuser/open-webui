<!--
  ExtensionManager.svelte
  Main UI component for managing extensions
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { 
    extensions, 
    extensionsLoading,
    extensionErrors,
    fetchExtensions 
  } from '../../api/registry';
  import ExtensionCard from './ExtensionCard.svelte';
  import ExtensionForm from './ExtensionForm.svelte';
  import { MarketplaceTab } from '../../marketplace/components';
  
  import Tabs from '$lib/components/common/Tabs.svelte';
  import Search from '$lib/components/icons/Search.svelte';
  import Plus from '$lib/components/icons/Plus.svelte';
  import ArrowPath from '$lib/components/icons/ArrowPath.svelte';
  import Info from '$lib/components/icons/Info.svelte';
  import type { Extension, ExtensionType } from '../../framework/types';
  
  // State
  let searchQuery = '';
  let selectedExtensionId: string | null = null;
  let showInstallForm = false;
  let activeTab: ExtensionType | 'all' = 'all';
  let activeSection = 'installed'; // 'installed' or 'marketplace'
  
  let localExtensions = [];
  let loading = false;
  
  // Hardcoded extension for testing
  let mockExtensions = [
    {
      manifest: {
        id: "prompt-library",
        name: "Prompt Library",
        description: "Save, organize, and reuse effective prompts with categories and templates",
        version: "0.1.0",
        author: "Open WebUI Team",
        type: "ui",
        main: "main.js",
        entry_point: "__init__.py",
        sidebar: {
          icon: "BookOpen",
          label: "Prompt Library"
        }
      },
      enabled: true,
      installed: true,
      settings: {},
      installDate: new Date("2025-03-15T10:00:00Z"),
      updateDate: new Date("2025-03-15T10:00:00Z"),
      status: "enabled"
    }
  ];
  
  // Computed
  $: filteredExtensions = localExtensions
    .filter(extension => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          extension.manifest.name.toLowerCase().includes(query) ||
          extension.manifest.description.toLowerCase().includes(query) ||
          extension.manifest.author.toLowerCase().includes(query) ||
          (extension.manifest.tags && extension.manifest.tags.some(tag => tag.toLowerCase().includes(query)))
        );
      }
      return true;
    })
    .filter(extension => {
      // Filter by type
      if (activeTab === 'all') {
        return true;
      }
      
      // Check if the extension type matches the active tab
      if (Array.isArray(extension.manifest.type)) {
        return extension.manifest.type.includes(activeTab);
      }
      return extension.manifest.type === activeTab;
    })
    .sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
  
  // Lifecycle
  onMount(async () => {
    // Load mock extensions
    loading = true;
    try {
      // Use local mock data for development
      localExtensions = [...mockExtensions];
    } catch (error) {
      console.error('Error loading extensions:', error);
      toast.error('Failed to load extensions');
    } finally {
      loading = false;
    }
  });
  
  // Methods
  function handleSettingsClick(event) {
    selectedExtensionId = event.detail.id;
  }
  
  function handleInstallClick() {
    showInstallForm = true;
  }
  
  function handleFormCancel() {
    selectedExtensionId = null;
    showInstallForm = false;
  }
  
  function handleExtensionInstalled() {
    showInstallForm = false;
    // Refresh the extensions list
    fetchMockExtensions();
  }
  
  function handleSettingsUpdated() {
    selectedExtensionId = null;
  }
  
  function handleExtensionToggle(event) {
    const extensionId = event.detail.id;
    const extensionIndex = localExtensions.findIndex(ext => ext.manifest.id === extensionId);
    
    if (extensionIndex >= 0) {
      // Update the enabled status
      localExtensions[extensionIndex].enabled = !localExtensions[extensionIndex].enabled;
      localExtensions[extensionIndex].status = localExtensions[extensionIndex].enabled ? "enabled" : "disabled";
      localExtensions = [...localExtensions]; // Trigger reactivity
    }
  }
  
  function handleExtensionUninstall(event) {
    const extensionId = event.detail.id;
    localExtensions = localExtensions.filter(ext => ext.manifest.id !== extensionId);
  }
  
  function getSelectedExtension() {
    if (!selectedExtensionId) {
      return null;
    }
    
    return localExtensions.find(ext => ext.manifest.id === selectedExtensionId) || null;
  }
  
  function setActiveTab(tab) {
    activeTab = tab;
  }
  
  function setActiveSection(section) {
    activeSection = section;
  }
  
  function fetchMockExtensions() {
    // For development purposes, we'll just use the mock data
    localExtensions = [...mockExtensions];
  }
</script>

<div class="h-full flex flex-col">
  {#if showInstallForm || selectedExtensionId}
    <ExtensionForm
      extension={getSelectedExtension()}
      on:cancel={handleFormCancel}
      on:installed={handleExtensionInstalled}
      on:settingsUpdated={handleSettingsUpdated}
    />
  {:else}
    <div class="space-y-4">
      <!-- Main tabs: Installed vs Marketplace -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <ul class="flex -mb-px">
          <li class="mr-2">
            <button
              class="inline-block p-4 {activeSection === 'installed' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'} rounded-t-lg"
              on:click={() => setActiveSection('installed')}
            >
              Installed
            </button>
          </li>
          <li>
            <button
              class="inline-block p-4 {activeSection === 'marketplace' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-500 dark:border-blue-500' : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'} rounded-t-lg"
              on:click={() => setActiveSection('marketplace')}
            >
              Marketplace
            </button>
          </li>
        </ul>
      </div>
      
      <!-- Installed Extensions Tab -->
      {#if activeSection === 'installed'}
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold">Installed Extensions</h2>
            <button 
              class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500"
              on:click={handleInstallClick}>
              <Plus class="w-4 h-4" />
              Install Extension
            </button>
          </div>
          
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div class="relative w-full sm:w-64">
              <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="search"
                placeholder="Search extensions..."
                class="w-full pl-8 pr-3 py-2 border rounded-md"
                bind:value={searchQuery}
              />
            </div>
            
            <div class="flex border-b">
              <button 
                class="px-4 py-2 border-b-2 {activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:border-gray-300'}"
                on:click={() => setActiveTab('all')}>All</button>
              <button 
                class="px-4 py-2 border-b-2 {activeTab === 'ui' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:border-gray-300'}"
                on:click={() => setActiveTab('ui')}>UI</button>
              <button 
                class="px-4 py-2 border-b-2 {activeTab === 'api' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:border-gray-300'}"
                on:click={() => setActiveTab('api')}>API</button>
              <button 
                class="px-4 py-2 border-b-2 {activeTab === 'model-adapter' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:border-gray-300'}"
                on:click={() => setActiveTab('model-adapter')}>Models</button>
              <button 
                class="px-4 py-2 border-b-2 {activeTab === 'tool' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:border-gray-300'}"
                on:click={() => setActiveTab('tool')}>Tools</button>
              <button 
                class="px-4 py-2 border-b-2 {activeTab === 'theme' ? 'border-blue-600 text-blue-600' : 'border-transparent hover:border-gray-300'}"
                on:click={() => setActiveTab('theme')}>Themes</button>
            </div>
          </div>
          
          {#if loading}
            <div class="flex flex-col items-center justify-center py-8">
              <ArrowPath class="w-8 h-8 animate-spin text-gray-400" />
              <p class="mt-2 text-sm text-gray-500">Loading extensions...</p>
            </div>
          {:else if localExtensions.length === 0}
            <div class="border rounded-md flex flex-col items-center justify-center p-8">
              <div class="text-center space-y-2">
                <h3 class="text-lg font-medium">No Extensions Installed</h3>
                <p class="text-sm text-gray-500">
                  Install extensions to enhance the functionality of Open WebUI.
                </p>
                <div class="mt-4 flex space-x-4">
                  <button 
                    class="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                    on:click={handleInstallClick}>
                    Install Manually
                  </button>
                  <button 
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    on:click={() => setActiveSection('marketplace')}>
                    Browse Marketplace
                  </button>
                </div>
              </div>
            </div>
          {:else if filteredExtensions.length === 0}
            <div class="border rounded-md flex flex-col items-center justify-center p-8">
              <div class="text-center space-y-2">
                <h3 class="text-lg font-medium">No Matching Extensions</h3>
                <p class="text-sm text-gray-500">
                  No extensions match your search criteria.
                </p>
              </div>
            </div>
          {:else}
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {#each filteredExtensions as extension (extension.manifest.id)}
                <ExtensionCard
                  {extension}
                  on:enable={handleExtensionToggle}
                  on:disable={handleExtensionToggle}
                  on:uninstall={handleExtensionUninstall}
                  on:settings={handleSettingsClick}
                />
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <!-- Marketplace Tab -->
        <MarketplaceTab />
      {/if}
    </div>
  {/if}
</div>
