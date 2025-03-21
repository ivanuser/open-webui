<!-- MCP Server Logs Component -->
<script>
    import { fade } from 'svelte/transition';
    
    export let logs = [];
    export let loading = false;
    export let onRefresh = () => {};
    
    function getTimestamp(timestamp) {
        try {
            return new Date(timestamp).toLocaleTimeString();
        } catch (e) {
            return timestamp;
        }
    }
    
    function getTypeClass(type) {
        switch (type) {
            case 'stderr':
                return 'text-red-600 dark:text-red-400';
            case 'stdout':
                return 'text-green-600 dark:text-green-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    }
</script>

<div class="mcp-server-logs">
    <div class="flex justify-between items-center mb-2">
        <h3 class="text-sm font-medium">Recent Logs</h3>
        <button 
            class="text-blue-600 hover:text-blue-800 text-sm"
            on:click={onRefresh}
            disabled={loading}
        >
            {loading ? 'Refreshing...' : 'Refresh'}
        </button>
    </div>
    
    <div class="h-80 overflow-y-auto bg-gray-50 dark:bg-gray-900 rounded p-2 text-xs font-mono">
        {#if loading && logs.length === 0}
            <div class="flex justify-center items-center h-full">
                <div class="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        {:else if logs.length === 0}
            <div class="flex justify-center items-center h-full text-gray-500">
                No logs available
            </div>
        {:else}
            {#each logs as log}
                <div 
                    class="py-1 border-b border-gray-200 dark:border-gray-800"
                    in:fade={{ duration: 200 }}
                >
                    <span class="text-gray-500">[{getTimestamp(log.timestamp)}]</span>
                    <span class={getTypeClass(log.type)}>[{log.type}]</span>
                    <span>{log.message}</span>
                </div>
            {/each}
        {/if}
    </div>
</div>
