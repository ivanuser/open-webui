<!-- MCP Handler Component -->
<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { extractToolCallsFromOllama, processOllamaResponseForMCP } from '$lib/apis/ollama/mcp-integration';
    import { processToolCall } from '$lib/apis/mcp';
    
    export let token = '';
    export let message = '';
    export let isActive = false;
    export let autoExecute = true;
    export let showResults = true;
    
    const dispatch = createEventDispatcher();
    
    let toolCalls = [];
    let toolResults = [];
    let processing = false;
    let error = null;
    
    // Handle new message
    $: if (isActive && message && message.trim()) {
        detectToolCalls(message);
    }
    
    // Detect tool calls in the message
    async function detectToolCalls(messageText) {
        try {
            // Extract tool calls from message
            const extractedCalls = extractToolCallsFromOllama(messageText);
            
            // If no tool calls found, do nothing
            if (!extractedCalls || extractedCalls.length === 0) {
                toolCalls = [];
                return;
            }
            
            // Update tool calls
            toolCalls = extractedCalls;
            
            // Execute tools if auto-execute is enabled
            if (autoExecute) {
                executeToolCalls();
            }
        } catch (err) {
            console.error('Error detecting tool calls:', err);
            error = err.message || 'Failed to detect tool calls';
        }
    }
    
    // Execute tool calls
    async function executeToolCalls() {
        if (!toolCalls || toolCalls.length === 0 || processing) {
            return;
        }
        
        processing = true;
        error = null;
        toolResults = [];
        
        try {
            // Notify that we are processing tool calls
            dispatch('toolCallsDetected', { toolCalls });
            
            // Execute each tool call sequentially
            for (const toolCall of toolCalls) {
                try {
                    // Process the tool call
                    const result = await processToolCall(token, toolCall);
                    
                    // Format the result
                    const formattedResult = {
                        role: 'tool',
                        tool_call_id: toolCall.id || `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: toolCall.name,
                        content: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                    };
                    
                    // Add to results
                    toolResults = [...toolResults, formattedResult];
                    
                    // Notify about the result
                    dispatch('toolResult', { 
                        toolCall, 
                        result: formattedResult,
                        allResults: toolResults
                    });
                } catch (err) {
                    console.error(`Error executing tool call ${toolCall.name}:`, err);
                    
                    // Format error result
                    const errorResult = {
                        role: 'tool',
                        tool_call_id: toolCall.id || `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        name: toolCall.name,
                        content: `Error: ${err.message || 'Unknown error'}`
                    };
                    
                    // Add to results
                    toolResults = [...toolResults, errorResult];
                    
                    // Notify about the error
                    dispatch('toolError', { 
                        toolCall, 
                        error: err,
                        result: errorResult,
                        allResults: toolResults
                    });
                }
            }
            
            // Notify that all tool calls are processed
            dispatch('toolCallsProcessed', { 
                toolCalls,
                toolResults
            });
        } catch (err) {
            console.error('Error executing tool calls:', err);
            error = err.message || 'Failed to execute tool calls';
            dispatch('error', { error });
        } finally {
            processing = false;
        }
    }
    
    // Force execute tool calls
    export function forceExecuteToolCalls() {
        if (toolCalls && toolCalls.length > 0) {
            executeToolCalls();
        }
    }
    
    // Reset the handler
    export function reset() {
        toolCalls = [];
        toolResults = [];
        error = null;
        processing = false;
    }
</script>

{#if showResults && toolResults.length > 0}
    <div class="mcp-tool-results mt-2">
        {#each toolResults as result}
            <div class="tool-result bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-2 text-sm">
                <div class="flex items-center mb-1">
                    <span class="font-bold text-blue-600 dark:text-blue-400">
                        Tool: {result.name}
                    </span>
                </div>
                <div class="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                    {result.content}
                </div>
            </div>
        {/each}
    </div>
{/if}

{#if error}
    <div class="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-2 rounded-md mt-2 text-sm">
        {error}
    </div>
{/if}

{#if processing}
    <div class="flex justify-center items-center py-2">
        <div class="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Processing tool calls...</span>
    </div>
{/if}
