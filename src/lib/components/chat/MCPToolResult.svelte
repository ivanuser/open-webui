<!-- MCP Tool Result Component -->
<script>
    import { onMount } from 'svelte';
    import { fade } from 'svelte/transition';
    
    export let toolName = '';
    export let result = '';
    
    let formattedResult = '';
    let resultType = 'text';
    
    onMount(() => {
        formatResult();
    });
    
    // Format the result based on the tool and content
    function formatResult() {
        if (!result) {
            formattedResult = 'No result returned';
            return;
        }
        
        // Try to parse result as JSON if it's a string
        if (typeof result === 'string') {
            try {
                const parsed = JSON.parse(result);
                
                // Check if the parsed result has an error
                if (parsed.error) {
                    formattedResult = `Error: ${parsed.error}`;
                    resultType = 'error';
                    return;
                }
                
                // For successful result objects
                if (parsed.result !== undefined) {
                    result = parsed.result;
                } else {
                    result = parsed;
                }
            } catch (e) {
                // Not JSON, continue with string handling
            }
        }
        
        // Handle different tool types
        if (toolName === 'read_file') {
            resultType = 'code';
            formattedResult = result;
        } else if (toolName === 'list_directory') {
            // Format directory listing
            resultType = 'text';
            if (typeof result === 'object' && Array.isArray(result)) {
                formattedResult = formatDirectoryListing(result);
            } else {
                formattedResult = result;
            }
        } else if (toolName === 'search_files') {
            resultType = 'text';
            formattedResult = result;
        } else if (toolName === 'get_file_info') {
            // Format file info
            resultType = 'json';
            if (typeof result === 'object') {
                formattedResult = JSON.stringify(result, null, 2);
            } else {
                formattedResult = result;
            }
        } else if (toolName === 'write_file' || toolName === 'create_directory') {
            // Operation status
            resultType = 'success';
            formattedResult = result;
        } else {
            // General result handling
            if (typeof result === 'object') {
                resultType = 'json';
                formattedResult = JSON.stringify(result, null, 2);
            } else {
                resultType = 'text';
                formattedResult = result;
            }
        }
    }
    
    // Format directory listing in a readable way
    function formatDirectoryListing(items) {
        if (!items || items.length === 0) {
            return 'Directory is empty';
        }
        
        // Group by directories and files
        const directories = items.filter(item => item.isDirectory || item.name?.endsWith('/'));
        const files = items.filter(item => !item.isDirectory && !item.name?.endsWith('/'));
        
        let output = '';
        
        // Add directories
        if (directories.length > 0) {
            output += 'Directories:\n';
            directories.forEach(dir => {
                const name = dir.name || dir;
                output += `📁 ${name}\n`;
            });
        }
        
        // Add files
        if (files.length > 0) {
            if (output) output += '\n';
            output += 'Files:\n';
            files.forEach(file => {
                const name = file.name || file;
                const size = file.size ? ` (${formatFileSize(file.size)})` : '';
                output += `📄 ${name}${size}\n`;
            });
        }
        
        return output;
    }
    
    // Format file size
    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
</script>

<div 
    class="mcp-tool-result mt-2 mb-2 p-3 rounded-md border bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
    in:fade={{ duration: 200 }}
>
    <div class="flex items-center mb-1">
        <div class="tool-badge bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 text-xs rounded">
            MCP Tool: {toolName}
        </div>
    </div>
    
    {#if resultType === 'error'}
        <div class="tool-result text-red-600 dark:text-red-400 text-sm font-mono whitespace-pre-wrap">
            {formattedResult}
        </div>
    {:else if resultType === 'code'}
        <div class="tool-result bg-gray-100 dark:bg-gray-900 p-2 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto max-h-72 overflow-y-auto">
            {formattedResult}
        </div>
    {:else if resultType === 'json'}
        <div class="tool-result bg-gray-100 dark:bg-gray-900 p-2 rounded text-sm font-mono whitespace-pre-wrap overflow-x-auto max-h-72 overflow-y-auto">
            {formattedResult}
        </div>
    {:else if resultType === 'success'}
        <div class="tool-result text-green-600 dark:text-green-400 text-sm">
            ✓ {formattedResult}
        </div>
    {:else}
        <div class="tool-result text-sm font-mono whitespace-pre-wrap overflow-x-auto max-h-72 overflow-y-auto">
            {formattedResult}
        </div>
    {/if}
</div>
