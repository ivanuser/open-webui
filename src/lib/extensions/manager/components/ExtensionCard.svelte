<!--
  ExtensionCard.svelte
  UI component for displaying and managing an individual extension
-->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { toast } from 'svelte-sonner';
  import type { Extension } from '../../framework/types';
  import { enableExtension, disableExtension, uninstallExtension } from '../../api/registry';
  import Switch from '$lib/components/common/Switch.svelte';
  import Info from '$lib/components/icons/Info.svelte';
  import Gear from '$lib/components/icons/Gear.svelte';
  import GarbageBin from '$lib/components/icons/GarbageBin.svelte';
  import Link from '$lib/components/icons/Link.svelte';
  
  // Props
  export let extension: Extension;
  export let showSettings: boolean = true;
  
  // Local state
  let loading = false;
  let isEnabled = extension.enabled;
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    enable: { id: string };
    disable: { id: string };
    uninstall: { id: string };
    settings: { id: string };
  }>();
  
  // Methods
  async function handleToggle() {
    loading = true;
    
    try {
      if (isEnabled) {
        // Actually call the API
        const success = await disableExtension(extension.manifest.id);
        
        if (success) {
          isEnabled = false;
          extension.enabled = false;
          extension.status = "disabled";
          toast.success(`Extension "${extension.manifest.name}" disabled`);
          dispatch('disable', { id: extension.manifest.id });
        } else {
          toast.error(`Failed to disable extension "${extension.manifest.name}"`);
        }
      } else {
        // Actually call the API
        const success = await enableExtension(extension.manifest.id);
        
        if (success) {
          isEnabled = true;
          extension.enabled = true;
          extension.status = "enabled";
          toast.success(`Extension "${extension.manifest.name}" enabled`);
          dispatch('enable', { id: extension.manifest.id });
        } else {
          toast.error(`Failed to enable extension "${extension.manifest.name}"`);
        }
      }
    } catch (error) {
      console.error('Error toggling extension:', error);
      toast.error(`Failed to ${isEnabled ? 'disable' : 'enable'} extension: ${error.message || 'Unknown error'}`);
    } finally {
      loading = false;
    }
  }
  
  async function handleUninstall() {
    if (!confirm(`Are you sure you want to uninstall "${extension.manifest.name}"?`)) {
      return;
    }
    
    loading = true;
    
    try {
      // Actually call the API
      const success = await uninstallExtension(extension.manifest.id);
      
      if (success) {
        toast.success(`Extension "${extension.manifest.name}" uninstalled`);
        dispatch('uninstall', { id: extension.manifest.id });
      } else {
        toast.error(`Failed to uninstall extension "${extension.manifest.name}"`);
      }
    } catch (error) {
      console.error('Error uninstalling extension:', error);
      toast.error(`Failed to uninstall extension: ${error.message || 'Unknown error'}`);
    } finally {
      loading = false;
    }
  }
  
  function openSettings() {
    dispatch('settings', { id: extension.manifest.id });
  }
  
  // Computed
  $: typeLabel = Array.isArray(extension.manifest.type)
    ? extension.manifest.type.join(', ')
    : extension.manifest.type;
</script>

<div class="flex flex-col overflow-hidden border rounded-md bg-card">
  <!-- Header -->
  <div class="flex items-center justify-between p-4 border-b">
    <div class="flex items-center gap-2">
      {#if extension.manifest.icon}
        <img 
          src={`/extensions/${extension.manifest.id}/${extension.manifest.icon}`} 
          alt={extension.manifest.name} 
          class="w-8 h-8"
          onerror="this.onerror=null; this.src='/api/placeholder/32/32';"
        />
      {:else}
        <div class="flex items-center justify-center w-8 h-8 text-xs font-bold text-white bg-blue-500 rounded-sm">
          {extension.manifest.name.slice(0, 2).toUpperCase()}
        </div>
      {/if}
      <div>
        <h3 class="text-sm font-medium">{extension.manifest.name}</h3>
        <div class="flex items-center gap-1 text-xs text-muted-foreground">
          <span>v{extension.manifest.version}</span>
          {#if typeLabel}
            <span>•</span>
            <span>{typeLabel}</span>
          {/if}
        </div>
      </div>
    </div>
    
    <div class="flex items-center gap-2">
      <Switch
        checked={isEnabled}
        disabled={loading}
        on:change={handleToggle}
      />
    </div>
  </div>
  
  <!-- Description -->
  <div class="flex-1 p-4">
    <p class="text-sm text-card-foreground">{extension.manifest.description}</p>
  </div>
  
  <!-- Footer -->
  <div class="flex items-center justify-between p-4 border-t">
    <div class="text-xs text-muted-foreground">
      By {extension.manifest.author}
    </div>
    
    <div class="flex items-center gap-2">
      {#if showSettings}
        <button 
          class="p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800" 
          on:click={openSettings}
          disabled={loading}
        >
          <Gear class="w-4 h-4" />
        </button>
      {/if}
      
      {#if extension.manifest.homepage}
        <a href={extension.manifest.homepage} 
           class="p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800"
           target="_blank" 
           rel="noopener noreferrer">
          <Link class="w-4 h-4" />
        </a>
      {/if}
      
      <button 
        class="p-1 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800" 
        on:click={handleUninstall}
        disabled={loading}
      >
        <GarbageBin class="w-4 h-4 text-red-500" />
      </button>
    </div>
  </div>
</div>
