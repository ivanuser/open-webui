<!--
  Extension component page
  Loads and displays extension content
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { extensions } from '$lib/extensions/api/registry';
  
  // Get the extension ID from the route params
  const extensionId = $page.params.extension;
  
  let component = null;
  let loading = true;
  let error = null;
  
  onMount(async () => {
    try {
      loading = true;
      
      // Try to dynamically import the main component
      const componentModule = await import(`/extensions/${extensionId}/${extensionId}.svelte`).catch(async () => {
        // If not found, try other common filenames
        try {
          return await import(`/extensions/${extensionId}/index.svelte`);
        } catch (e) {
          try {
            return await import(`/extensions/${extensionId}/PromptLibrary.svelte`);
          } catch (e) {
            try {
              return await import(`/extensions/${extensionId}/App.svelte`);
            } catch (e) {
              try {
                return await import(`/extensions/${extensionId}/Main.svelte`);
              } catch (e) {
                return null;
              }
            }
          }
        }
      });
      
      if (componentModule && componentModule.default) {
        component = componentModule.default;
      } else {
        error = `Could not load component for extension ${extensionId}`;
      }
    } catch (e) {
      console.error(`Error loading extension ${extensionId}:`, e);
      error = `Error loading extension: ${e.message || 'Unknown error'}`;
    } finally {
      loading = false;
    }
  });
</script>

<div class="w-full h-full">
  {#if loading}
    <div class="flex items-center justify-center h-full">
      <div class="flex flex-col items-center justify-center space-y-4">
        <div class="w-10 h-10 border-4 border-t-blue-500 rounded-full animate-spin"></div>
        <div class="text-gray-500">Loading extension...</div>
      </div>
    </div>
  {:else if error}
    <div class="flex items-center justify-center h-full">
      <div class="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg max-w-xl">
        <h2 class="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Extension Error</h2>
        <p class="text-gray-700 dark:text-gray-300">{error}</p>
        <div class="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
          <code class="text-sm whitespace-pre-wrap break-all">
            Extension ID: {extensionId}
          </code>
        </div>
        <div class="mt-4">
          <a 
            href="/admin/extensions" 
            class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Go to Extension Manager
          </a>
        </div>
      </div>
    </div>
  {:else if component}
    <svelte:component this={component} />
  {:else}
    <div class="flex items-center justify-center h-full">
      <div class="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg max-w-xl">
        <h2 class="text-xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">Extension Not Found</h2>
        <p class="text-gray-700 dark:text-gray-300">
          Could not find the main component for extension "{extensionId}".
        </p>
        <div class="mt-4">
          <a 
            href="/admin/extensions" 
            class="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Go to Extension Manager
          </a>
        </div>
      </div>
    </div>
  {/if}
</div>
