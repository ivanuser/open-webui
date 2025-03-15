<script lang="ts">
  import { getContext } from 'svelte';
  import { mcpServers, settings } from '$lib/stores';
  
  const i18n = getContext('i18n');
  
  export let selectedMCPServer = '';
  
  // Get the selected server object
  $: server = $mcpServers?.find(s => s.id === selectedMCPServer);
  $: isConnected = server?.status === 'connected';
  $: serverType = server?.type || '';
  
  // Extract the directory path from server args for filesystem server
  $: directoryPath = (server?.type === 'filesystem' || server?.type === 'filesystem-py') && server?.args?.length > 0 
      ? server.args[server.args.length - 1]
      : '';
  
  // Determine platform by checking path format
  $: isWindows = directoryPath.includes('\\') || directoryPath.includes(':');
  
  // Format example paths based on platform
  $: examplePath = directoryPath;
  $: exampleFilePath = isWindows 
      ? `${directoryPath}\\example.txt` 
      : `${directoryPath}/example.txt`;
  $: exampleNewFilePath = isWindows
      ? `${directoryPath}\\test.txt`
      : `${directoryPath}/test.txt`;
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
      {#if serverType === 'filesystem' || serverType === 'filesystem-py'}
        {$i18n.t('This MCP server gives you filesystem access to the directory')} <strong>{examplePath}</strong>. {$i18n.t('To access files or directories, tell the AI to make MCP tool calls.')}
      {:else if serverType === 'memory'}
        {$i18n.t('This MCP server provides persistent memory capabilities. To use it in your conversation, tell the model explicitly to use the MCP server.')}
      {:else}
        {$i18n.t('This MCP server provides additional capabilities. To use it in your conversation, tell the model explicitly to use the MCP server.')}
      {/if}
    </p>
    
    <div class="bg-white dark:bg-gray-800 p-2 rounded border-l-4 border-blue-500 text-gray-700 dark:text-gray-300">
      <strong>{$i18n.t('Example prompts')}:</strong>
      <div class="mt-1 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
        {#if serverType === 'filesystem' || serverType === 'filesystem-py'}
          <div class="mb-1">• {$i18n.t('Using the MCP filesystem server, list the directory {directory}', { directory: examplePath })}</div>
          <div class="mb-1">• {$i18n.t('Make a list_directory tool call to show me the files in {directory}', { directory: examplePath })}</div>
          <div class="mb-1">• {$i18n.t('Use the read_file tool to show me the contents of {file}', { file: exampleFilePath })}</div>
          <div>• {$i18n.t('Create a new file at {file} with the content "Hello world"', { file: exampleNewFilePath })}</div>
        {:else if serverType === 'memory'}
          <div class="mb-1">• {$i18n.t('Using the MCP memory server, please remember this information: {info}', { info: $i18n.t('Important fact to remember') })}</div>
          <div>• {$i18n.t('Using the MCP memory server, recall what you know about {topic}', { topic: $i18n.t('specific topic') })}</div>
        {:else}
          <div>• {$i18n.t('Using the MCP server, please {action}', { action: $i18n.t('perform the desired action') })}</div>
        {/if}
      </div>
    </div>
    
    {#if serverType === 'filesystem' || serverType === 'filesystem-py'}
      <div class="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs text-yellow-800 dark:text-yellow-300">
        <strong>{$i18n.t('Important')}: </strong>
        {$i18n.t('Always specify the full path starting with')} <code class="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">{examplePath}</code> 
        {$i18n.t('when using filesystem operations. The server can only access this directory and its subdirectories.')}
        {#if isWindows}
          <div class="mt-1">
            {$i18n.t('Use backslashes (\\) for Windows paths.')}
          </div>
        {:else}
          <div class="mt-1">
            {$i18n.t('Use forward slashes (/) for Unix/Linux paths.')}
          </div>
        {/if}
      </div>
      
      <div class="mt-2 p-2 rounded text-xs bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300">
        <strong>{$i18n.t('Available MCP tool calls')}:</strong>
        <ul class="list-disc list-inside mt-1">
          <li><code>list_directory(path="...")</code> - {$i18n.t('Lists files and directories')}</li>
          <li><code>read_file(path="...")</code> - {$i18n.t('Reads file content')}</li>
          <li><code>write_file(path="...", content="...")</code> - {$i18n.t('Creates or overwrites a file')}</li>
          <li><code>create_directory(path="...")</code> - {$i18n.t('Creates a new directory')}</li>
          <li><code>search_files(path="...", pattern="...")</code> - {$i18n.t('Searches for files matching a pattern')}</li>
          <li><code>get_file_info(path="...")</code> - {$i18n.t('Gets detailed information about a file')}</li>
        </ul>
        <div class="mt-2 font-semibold">
          {$i18n.t('Remind the AI to MAKE ACTUAL TOOL CALLS rather than just writing code!')}
        </div>
      </div>
    {/if}
  </div>
{/if}
