<!--
  ExtensionManager.svelte
  Main UI component for managing extensions
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    extensions, 
    extensionsLoading,
    extensionErrors,
    fetchExtensions 
  } from '../../api/registry';
  import ExtensionCard from './ExtensionCard.svelte';
  import ExtensionForm from './ExtensionForm.svelte';
  import { Button, Input, Alert, AlertTitle, AlertDescription, Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui';
  import { Search, Plus, Loader2, AlertCircle } from 'lucide-svelte';
  import type { Extension, ExtensionType } from '../../framework/types';
  
  // State
  let searchQuery = '';
  let selectedExtensionId: string | null = null;
  let showInstallForm = false;
  let activeTab: ExtensionType | 'all' = 'all';
  
  // Computed
  $: filteredExtensions = Array.from($extensions.values())
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
    await fetchExtensions();
  });
  
  // Methods
  function handleSettingsClick(event: CustomEvent<{ id: string }>) {
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
    fetchExtensions();
  }
  
  function handleSettingsUpdated() {
    selectedExtensionId = null;
  }
  
  function handleExtensionToggle() {
    // Refresh the extensions list
    fetchExtensions();
  }
  
  function handleExtensionUninstall() {
    // Refresh the extensions list
    fetchExtensions();
  }
  
  function getSelectedExtension(): Extension | null {
    if (!selectedExtensionId) {
      return null;
    }
    
    return $extensions.get(selectedExtensionId) || null;
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
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold">Extensions</h2>
        <Button on:click={handleInstallClick} class="flex items-center gap-2">
          <Plus class="w-4 h-4" />
          Install Extension
        </Button>
      </div>
      
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="relative w-full sm:w-64">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search extensions..."
            class="pl-8"
            bind:value={searchQuery}
          />
        </div>
        
        <Tabs bind:value={activeTab} class="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="ui">UI</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="model-adapter">Models</TabsTrigger>
            <TabsTrigger value="tool">Tools</TabsTrigger>
            <TabsTrigger value="theme">Themes</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {#if $extensionsLoading}
        <div class="flex flex-col items-center justify-center py-8">
          <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
          <p class="mt-2 text-sm text-muted-foreground">Loading extensions...</p>
        </div>
      {:else if $extensions.size === 0}
        <div class="border rounded-md flex flex-col items-center justify-center p-8">
          <div class="text-center space-y-2">
            <h3 class="text-lg font-medium">No Extensions Installed</h3>
            <p class="text-sm text-muted-foreground">
              Install extensions to enhance the functionality of Open WebUI.
            </p>
            <Button variant="outline" on:click={handleInstallClick} class="mt-4">
              Install Your First Extension
            </Button>
          </div>
        </div>
      {:else if filteredExtensions.length === 0}
        <div class="border rounded-md flex flex-col items-center justify-center p-8">
          <div class="text-center space-y-2">
            <h3 class="text-lg font-medium">No Matching Extensions</h3>
            <p class="text-sm text-muted-foreground">
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
      
      {#if $extensionErrors.size > 0}
        <div class="mt-4">
          <Alert variant="destructive">
            <AlertCircle class="w-4 h-4" />
            <AlertTitle>Extension Errors</AlertTitle>
            <AlertDescription>
              <ul class="list-disc pl-5 mt-2 space-y-1">
                {#each Array.from($extensionErrors.entries()) as [id, error]}
                  <li>
                    <span class="font-medium">{$extensions.get(id)?.manifest.name || id}:</span> {error}
                  </li>
                {/each}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      {/if}
    </div>
  {/if}
</div>
