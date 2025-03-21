<!-- MCP Server Selector Component -->
<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { getMCPServers, connectToMCPServer, disconnectFromMCPServer } from '$lib/apis/mcp';
    import { mcpServers, settings } from '$lib/stores';
    import { get } from 'svelte/store';
    
    export let token = '';
    export let disabled = false;
    
    let servers = [];
    let selectedServerId = '';
    let loading = true;
    let error = null;
    
    // Subscribe to MCP servers store
    $: {
        servers = $mcpServers || [];
        // Update the selected server if it's not in the list anymore
        if (selectedServerId && !servers.some(s => s.id === selectedServerId)) {
            selectedServerId = '';
        }
    }
    
    onMount(async () => {
        await loadServers();
        
        // Set the currently active server
        const currentSettings = get(settings);
        const defaultServerId = currentSettings?.defaultMcpServer;
        
        if (defaultServerId && servers.some(s => s.id === defaultServerId && s.status === 'connected')) {
            selectedServerId = defaultServerId;
        }
    });
    
    async function loadServers() {
        loading = true;
        error = null;
        
        try {
            await getMCPServers(token);
            loading = false;
        } catch (err) {
            console.error('Error loading MCP servers:', err);
            error = 'Failed to load MCP servers';
            loading = false;
        }
    }
    
    async function handleServerChange(event) {
        const serverId = event.target.value;
        
        try {
            // If deselecting (empty value)
            if (!serverId && selectedServerId) {
                await disconnectFromMCPServer(token, selectedServerId);
                selectedServerId = '';
                return;
            }
            
            // If selecting a different server
            if (serverId !== selectedServerId) {
                // Disconnect from current server if any
                if (selectedServerId) {
                    await disconnectFromMCPServer(token, selectedServerId);
                }
                
                // Connect to new server
                if (serverId) {
                    await connectToMCPServer(token, serverId);
                }
                
                selectedServerId = serverId;
            }
        } catch (err) {
            console.error('Error changing MCP server:', err);
            error = `Failed to change MCP server: ${err.message}`;
            
            // Reset to previous selection
            selectedServerId = event.target.dataset.previous || '';
        }
    }
</script>

<div class="mcp-server-selector">
    {#if loading}
        <div class="flex justify-center py-1">
            <div class="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    {:else if error}
        <div class="text-xs text-red-500 mt-1" transition:fade>
            {error}
            <button 
                class="text-blue-500 hover:underline ml-1"
                on:click={loadServers}
            >
                Retry
            </button>
        </div>
    {:else}
        <div class="relative">
            <select
                class="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 pl-2 pr-7 text-sm"
                bind:value={selectedServerId}
                data-previous={selectedServerId}
                on:change={handleServerChange}
                disabled={disabled}
            >
                <option value="">-- No MCP Server --</option>
                {#each servers.filter(s => s.status === 'running') as server}
                    <option 
                        value={server.id}
                        selected={selectedServerId === server.id}
                    >
                        {server.name}
                    </option>
                {/each}
            </select>
            
            <div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg class="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
            </div>
        </div>
        
        {#if selectedServerId}
            <div class="text-xs text-gray-500 mt-1">
                Using MCP Server: {servers.find(s => s.id === selectedServerId)?.name}
            </div>
        {/if}
    {/if}
</div>
