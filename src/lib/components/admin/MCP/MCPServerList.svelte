<!-- MCP Server List Component -->
<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    import { getMCPServers, startMCPServer, stopMCPServer, connectToMCPServer, disconnectFromMCPServer } from '$lib/apis/mcp';
    import { mcpServers } from '$lib/stores';
    import MCPServerModal from './MCPServerModal.svelte';
    import MCPConnectionStatus from './MCPConnectionStatus.svelte';
    
    export let token = '';
    
    let loading = true;
    let error = null;
    let showAddModal = false;
    let serverToEdit = null;
    let servers = [];
    
    // Subscribe to the mcpServers store
    const unsubscribe = mcpServers.subscribe(value => {
        servers = value || [];
    });
    
    onMount(() => {
        loadServers();
        return unsubscribe;
    });
    
    async function loadServers() {
        loading = true;
        error = null;
        
        try {
            await getMCPServers(token);
            loading = false;
        } catch (err) {
            console.error('Error loading MCP servers:', err);
            error = err.message || 'Failed to load MCP servers';
            loading = false;
        }
    }
    
    async function handleStartServer(serverId) {
        try {
            await startMCPServer(token, serverId);
        } catch (err) {
            console.error('Error starting MCP server:', err);
            alert(`Failed to start server: ${err.message}`);
        }
    }
    
    async function handleStopServer(serverId) {
        try {
            await stopMCPServer(token, serverId);
        } catch (err) {
            console.error('Error stopping MCP server:', err);
            alert(`Failed to stop server: ${err.message}`);
        }
    }
    
    async function handleConnectServer(serverId) {
        try {
            await connectToMCPServer(token, serverId);
        } catch (err) {
            console.error('Error connecting to MCP server:', err);
            alert(`Failed to connect to server: ${err.message}`);
        }
    }
    
    async function handleDisconnectServer(serverId) {
        try {
            await disconnectFromMCPServer(token, serverId);
        } catch (err) {
            console.error('Error disconnecting from MCP server:', err);
            alert(`Failed to disconnect from server: ${err.message}`);
        }
    }
    
    function openAddModal() {
        serverToEdit = null;
        showAddModal = true;
    }
    
    function openEditModal(server) {
        serverToEdit = server;
        showAddModal = true;
    }
    
    async function handleSaveServer(event) {
        const server = event.detail;
        
        try {
            if (serverToEdit) {
                // Update existing server
                await updateMCPServer(token, server.id, server);
            } else {
                // Create new server
                await createMCPServer(token, server);
            }
            
            // Refresh the server list
            await loadServers();
        } catch (err) {
            console.error('Error saving MCP server:', err);
            alert(`Failed to save server: ${err.message}`);
        }
    }
    
    async function handleDeleteServer(serverId) {
        if (confirm('Are you sure you want to delete this server?')) {
            try {
                await deleteMCPServer(token, serverId);
                
                // Refresh the server list
                await loadServers();
            } catch (err) {
                console.error('Error deleting MCP server:', err);
                alert(`Failed to delete server: ${err.message}`);
            }
        }
    }
</script>

<div class="mcp-server-list">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">MCP Servers</h2>
        <button 
            class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            on:click={openAddModal}
        >
            Add Server
        </button>
    </div>
    
    {#if loading}
        <div class="flex justify-center py-8">
            <div class="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    {:else if error}
        <div class="bg-red-100 text-red-700 p-3 rounded-md mb-4" transition:fade>
            {error}
            <button 
                class="ml-2 text-red-700 hover:text-red-900"
                on:click={loadServers}
            >
                Retry
            </button>
        </div>
    {:else if servers.length === 0}
        <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-md text-center">
            <p class="text-gray-600 dark:text-gray-400 mb-2">No MCP servers configured</p>
            <button 
                class="text-blue-600 hover:text-blue-800"
                on:click={openAddModal}
            >
                Add your first server
            </button>
        </div>
    {:else}
        <div class="space-y-3">
            {#each servers as server (server.id)}
                <div 
                    class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4 transition-all"
                    in:fade={{ duration: 200 }}
                >
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="flex items-center">
                                <h3 class="font-medium">{server.name}</h3>
                                <MCPConnectionStatus status={server.status} />
                            </div>
                            <p class="text-sm text-gray-600 dark:text-gray-400">{server.description || 'No description'}</p>
                            <div class="mt-1 text-xs text-gray-500">
                                <div>Type: {server.type}</div>
                                <div>URL: {server.url || 'Not set'}</div>
                            </div>
                        </div>
                        <div class="flex space-x-2">
                            {#if server.status === 'running'}
                                <button 
                                    class="px-2 py-1 text-xs border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded"
                                    on:click={() => handleStopServer(server.id)}
                                >
                                    Stop
                                </button>
                                {#if server.status !== 'connected'}
                                    <button 
                                        class="px-2 py-1 text-xs border border-green-500 text-green-500 hover:bg-green-500 hover:text-white rounded"
                                        on:click={() => handleConnectServer(server.id)}
                                    >
                                        Connect
                                    </button>
                                {:else}
                                    <button 
                                        class="px-2 py-1 text-xs border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded"
                                        on:click={() => handleDisconnectServer(server.id)}
                                    >
                                        Disconnect
                                    </button>
                                {/if}
                            {:else if server.status === 'stopped' || server.status === 'disconnected'}
                                <button 
                                    class="px-2 py-1 text-xs border border-green-500 text-green-500 hover:bg-green-500 hover:text-white rounded"
                                    on:click={() => handleStartServer(server.id)}
                                >
                                    Start
                                </button>
                            {/if}
                            
                            <button 
                                class="px-2 py-1 text-xs border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white rounded"
                                on:click={() => openEditModal(server)}
                            >
                                Edit
                            </button>
                            
                            <button 
                                class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                on:click={() => handleDeleteServer(server.id)}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                    
                    {#if server.command}
                        <div class="mt-2 bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs font-mono overflow-x-auto">
                            {server.command} {server.args?.join(' ') || ''}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
    
    <MCPServerModal 
        bind:open={showAddModal} 
        serverToEdit={serverToEdit}
        on:save={handleSaveServer}
    />
</div>
