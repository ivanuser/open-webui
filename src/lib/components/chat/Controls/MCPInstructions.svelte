<script lang="ts">
  import { getContext } from 'svelte';
  import { mcpServers, settings } from '$lib/stores';
  
  const i18n = getContext('i18n');
  
  export let selectedMCPServer = '';
  
  // Get the selected server object
  $: server = $mcpServers?.find(s => s.id === selectedMCPServer);
  $: isConnected = server?.status === 'connected';
  $: serverType = server?.type || '';
</script>

{#if server && isConnected}
  <div class="mt-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm">
    <h3 class="font-bold text-blue-700 dark:text-blue-400 flex items-center mb-1">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1">
        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
      </svg>
      {$i18n.t('How to use this MCP server')}
    </h3>
    
    <p class="text-blue-800 dark:text-blue-300 mb-2">
      {#if serverType === 'filesystem'}
        {$i18n.t('This MCP server provides access to files and directories. To use it in your conversation, tell the model explicitly to use the MCP server.')}
      {:else if serverType === 'memory'}
        {$i18n.t('This MCP server provides persistent memory capabilities. To use it in your conversation, tell the model explicitly to use the MCP server.')}
      {:else}
        {$i18n.t('This MCP server provides additional capabilities. To use it in your conversation, tell the model explicitly to use the MCP server.')}
      {/if}
    </p>
    
    <div class="bg-white dark:bg-gray-800 p-2 rounded border-l-4 border-blue-500 text-gray-700 dark:text-gray-300">
      <strong>{$i18n.t('Example prompt')}:</strong>
      <div class="mt-1 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
        {#if serverType === 'filesystem'}
          {$i18n.t('Using the MCP filesystem server, please list the files in {directory}', { directory: server.args?.[server.args.length - 1] || '/home' })}
        {:else if serverType === 'memory'}
          {$i18n.t('Using the MCP memory server, please remember this information: {info}', { info: $i18n.t('Important fact to remember') })}
        {:else}
          {$i18n.t('Using the MCP server, please {action}', { action: $i18n.t('perform the desired action') })}
        {/if}
      </div>
    </div>
  </div>
{/if}
