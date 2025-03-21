<!-- MCP Tool Call Display Component -->
<script>
    import { fade } from 'svelte/transition';
    
    export let toolCall = null;
    export let toolResult = null;
    export let loading = false;
    
    function formatJSON(obj) {
        try {
            if (typeof obj === 'string') {
                // Try to parse JSON string
                const parsed = JSON.parse(obj);
                return JSON.stringify(parsed, null, 2);
            } else {
                // Already an object
                return JSON.stringify(obj, null, 2);
            }
        } catch (e) {
            // Not valid JSON, return as is
            return obj;
        }
    }
    
    function getToolIcon(toolName) {
        if (!toolName) return '🔧';
        
        const toolIcons = {
            'list_directory': '📁',
            'read_file': '📄',
            'write_file': '✏️',
            'create_directory': '📂',
            'search_files': '🔍',
            'get_file_info': 'ℹ️',
            'list_allowed_directories': '📋',
            'store_memory': '💾',
            'retrieve_memory': '🧠',
            'search_memory': '🔎',
            'brave_search': '🔍',
            'brave_web_search': '🌐',
            'brave_local_search': '📍'
        };
        
        return toolIcons[toolName] || '🔧';
    }
</script>

{#if toolCall}
    <div class="tool-call-container my-2 rounded-lg border border-blue-200 dark:border-blue-800" in:fade={{ duration: 150 }}>
        <!-- Tool Call Header -->
        <div class="bg-blue-50 dark:bg-blue-900/30 px-3 py-2 rounded-t-lg flex items-center">
            <span class="tool-icon mr-2">{getToolIcon(toolCall.name)}</span>
            <span class="font-medium">Tool Call: {toolCall.name}</span>
        </div>
        
        <!-- Tool Call Arguments -->
        <div class="px-3 py-2 bg-white dark:bg-gray-800 border-t border-blue-200 dark:border-blue-800">
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Arguments:</div>
            <pre class="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto">{formatJSON(toolCall.arguments)}</pre>
        </div>
        
        <!-- Tool Result (if available) -->
        {#if toolResult}
            <div class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-b-lg border-t border-blue-200 dark:border-blue-800">
                <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">Result:</div>
                <pre class="bg-white dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto {toolResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">{formatJSON(toolResult.result)}</pre>
            </div>
        {:else if loading}
            <div class="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-b-lg border-t border-blue-200 dark:border-blue-800 flex items-center justify-center">
                <div class="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                <span class="text-sm text-gray-600 dark:text-gray-400">Executing tool...</span>
            </div>
        {/if}
    </div>
{/if}
