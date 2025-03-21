<!-- MCP Dashboard Component -->
<script>
    import { onMount, onDestroy } from 'svelte';
    import { fade } from 'svelte/transition';
    import { getMCPServers, getMCPServerLogs } from '$lib/apis/mcp';
    import { mcpServers } from '$lib/stores';
    import MCPServerList from './MCPServerList.svelte';
    import MCPServerLogs from './MCPServerLogs.svelte';
    
    export let token = '';
    
    let selectedServerId = null;
    let serverLogs = [];
    let logsLoading = false;
    let refreshInterval;
    
    // Subscribe to the mcpServers store
    const unsubscribe = mcpServers.subscribe(value => {
        const servers = value || [];
        
        // Check if the selected server still exists
        if (selectedServerId && !servers.find(s => s.id === selectedServerId)) {
            selectedServerId = null;
            serverLogs = [];
        }
        
        // Select first server if none selected
        if (!selectedServerId && servers.length > 0) {
            selectedServerId = servers[0].id;
            loadServerLogs();
        }
    });
    
    onMount(() => {
        // Refresh logs every 5 seconds for the selected server
        refreshInterval = setInterval(() => {
            if (selectedServerId) {
                loadServerLogs();
            }
        }, 5000);
        
        return () => {
            clearInterval(refreshInterval);
            unsubscribe();
        };
    });
    
    onDestroy(() => {
        clearInterval(refreshInterval);
    });
    
    async function loadServerLogs() {
        if (!selectedServerId) return;
        
        logsLoading = true;
        
        try {
            const result = await getMCPServerLogs(token, selectedServerId, 100);
            
            if (result.success && result.logs) {
                serverLogs = result.logs;
            } else {
                serverLogs = [];
            }
        } catch (err) {
            console.error('Error loading server logs:', err);
            serverLogs = [];
        } finally {
            logsLoading = false;
        }
    }
    
    function handleSelectServer(serverId) {
        selectedServerId = serverId;
        loadServerLogs();
    }
</script>

<div class="grid grid-cols-1 md:grid-cols-12 gap-6">
    <div class="md:col-span-7">
        <MCPServerList {token} />
    </div>
    
    <div class="md:col-span-5">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
            <h2 class="text-lg font-semibold mb-4">Server Logs</h2>
            
            <div class="mb-3">
                <label for="server-select" class="block text-sm font-medium mb-1">
                    Select Server
                </label>
                <select 
                    id="server-select"
                    class="w-full rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 px-3 py-2"
                    bind:value={selectedServerId}
                    on:change={() => loadServerLogs()}
                >
                    <option value="">-- Select a server --</option>
                    {#each $mcpServers || [] as server}
                        <option value={server.id}>{server.name}</option>
                    {/each}
                </select>
            </div>
            
            <MCPServerLogs 
                logs={serverLogs} 
                loading={logsLoading} 
                onRefresh={loadServerLogs}
            />
        </div>
    </div>
</div>
