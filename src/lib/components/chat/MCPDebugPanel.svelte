<script lang="ts">
  import { onMount, onDestroy, getContext } from 'svelte';
  import { mcpServers, settings } from '$lib/stores';
  
  const i18n = getContext('i18n');
  
  // If this component is used, we'll add it to the chat window
  let debugEnabled = false;
  let debugLogs = [];
  
  // Mock tool call that will be replaced with actual functionality
  const logMCPInteraction = (type, action, data) => {
    debugLogs.unshift({
      timestamp: new Date().toISOString(),
      type,
      action,
      data
    });
    
    // Keep only the most recent 20 logs
    if (debugLogs.length > 20) {
      debugLogs.pop();
    }
    
    // Force a UI update
    debugLogs = [...debugLogs];
  };
  
  onMount(() => {
    // Set up event listeners for MCP interactions
    window.addEventListener('mcp:tool-call', (e) => {
      logMCPInteraction('tool-call', e.detail.tool, e.detail.args);
    });
    
    window.addEventListener('mcp:tool-result', (e) => {
      logMCPInteraction('tool-result', e.detail.tool, e.detail.result);
    });
    
    window.addEventListener('mcp:error', (e) => {
      logMCPInteraction('error', e.detail.tool, e.detail.error);
    });
  });
  
  onDestroy(() => {
    // Clean up event listeners
    window.removeEventListener('mcp:tool-call', () => {});
    window.removeEventListener('mcp:tool-result', () => {});
    window.removeEventListener('mcp:error', () => {});
  });
</script>

{#if debugEnabled}
  <div class="fixed bottom-0 right-0 w-96 h-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg rounded-tl-md overflow-hidden z-50">
    <div class="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">{$i18n.t('MCP Debug Console')}</h3>
      <div class="flex items-center gap-2">
        <button 
          class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
          on:click={() => { debugLogs = []; }}
        >
          {$i18n.t('Clear')}
        </button>
        <button 
          class="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
          on:click={() => { debugEnabled = false; }}
        >
          {$i18n.t('Close')}
        </button>
      </div>
    </div>
    
    <div class="overflow-y-auto h-[calc(100%-2.5rem)] p-2 text-xs font-mono bg-gray-50 dark:bg-gray-850">
      {#if debugLogs.length === 0}
        <div class="text-gray-400 dark:text-gray-500 text-center py-4">
          {$i18n.t('No MCP interactions logged yet')}
        </div>
      {:else}
        {#each debugLogs as log}
          <div class="mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2">
              <span class="text-gray-400 dark:text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
              <span class="{log.type === 'error' ? 'text-red-500' : log.type === 'tool-call' ? 'text-blue-500' : 'text-green-500'} font-bold">
                {log.type}
              </span>
              <span class="font-semibold">{log.action}</span>
            </div>
            <div class="mt-1 bg-white dark:bg-gray-800 p-1 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap overflow-x-auto max-h-20">
              {JSON.stringify(log.data, null, 2)}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}

<!-- Button to toggle debug panel -->
<button 
  class="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg z-50 hover:bg-blue-700"
  on:click={() => { debugEnabled = !debugEnabled; }}
  title={$i18n.t('Toggle MCP Debug Console')}
>
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
</button>
