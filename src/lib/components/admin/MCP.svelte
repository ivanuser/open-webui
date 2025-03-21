<!-- MCP Administration Panel -->
<script>
    import { onMount } from 'svelte';
    import MCPDashboard from './MCP/MCPDashboard.svelte';
    import { mcpServers } from '$lib/stores';
    import { getMCPServers } from '$lib/apis/mcp';
    
    export let token = '';
    
    let isMCPAvailable = true;
    let error = null;
    
    onMount(async () => {
        try {
            // Try to load MCP servers to see if the API is available
            await getMCPServers(token);
            isMCPAvailable = true;
        } catch (err) {
            console.error('MCP API check failed:', err);
            isMCPAvailable = false;
            error = 'Failed to connect to MCP API. Make sure the backend supports MCP.';
        }
    });
</script>

<div class="p-4">
    <div class="mb-4">
        <h1 class="text-2xl font-bold mb-2">Model Context Protocol (MCP)</h1>
        <p class="text-gray-600 dark:text-gray-400">
            MCP extends AI capabilities by providing access to tools and data sources.
            Configure and manage MCP servers to enable your models to interact with the outside world.
        </p>
    </div>
    
    {#if !isMCPAvailable}
        <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
            <p class="font-bold">Warning</p>
            <p>{error || 'MCP API is not available in this version.'}</p>
        </div>
    {:else}
        <MCPDashboard {token} />
    {/if}
    
    <div class="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
        <h2 class="text-lg font-semibold mb-2">About MCP</h2>
        <p class="text-gray-600 dark:text-gray-400 mb-2">
            The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to large language models.
        </p>
        <p class="text-gray-600 dark:text-gray-400">
            Learn more at <a href="https://modelcontextprotocol.io/" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">modelcontextprotocol.io</a>
        </p>
    </div>
</div>
