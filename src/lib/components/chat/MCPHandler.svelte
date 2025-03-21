<!-- MCP Handler Component for Chat -->
<script>
    import { onMount, createEventDispatcher } from 'svelte';
    import { processToolCall } from '$lib/apis/mcp';
    import { extractToolCallsFromOllama } from '$lib/apis/ollama/mcp-integration';
    
    export let token = '';
    export let message = '';
    export let processing = false;
    
    const dispatch = createEventDispatcher();
    let toolCalls = [];
    let toolResults = [];
    let currentToolIndex = 0;
    let showToolOutput = false;
    
    // Watch message for tool calls when processing stops
    $: if (!processing && message) {
        detectToolCalls(message);
    }
    
    // Detect tool calls in the message
    async function detectToolCalls(text) {
        if (!text) return;
        
        // Clear previous tool state
        toolCalls = [];
        toolResults = [];
        currentToolIndex = 0;
        showToolOutput = false;
        
        // Extract tool calls using regex
        const extracted = extractToolCallsFromOllama(text);
        
        if (extracted && extracted.length > 0) {
            toolCalls = extracted;
            showToolOutput = true;
            
            // Execute the first tool call
            if (toolCalls.length > 0) {
                executeNextToolCall();
            }
        }
    }
    
    // Execute the current tool call
    async function executeNextToolCall() {
        if (currentToolIndex >= toolCalls.length) {
            // All tool calls completed
            finishToolExecution();
            return;
        }
        
        const toolCall = toolCalls[currentToolIndex];
        
        try {
            // Dispatch tool call event
            dispatch('toolcall', { 
                index: currentToolIndex, 
                total: toolCalls.length,
                name: toolCall.name,
                arguments: toolCall.arguments
            });
            
            // Execute the tool call
            const result = await processToolCall(token, toolCall);
            
            // Store the result
            toolResults.push({
                index: currentToolIndex,
                name: toolCall.name,
                result: result.success ? result.result : { error: result.error || 'Tool execution failed' },
                success: result.success
            });
            
            // Move to next tool
            currentToolIndex++;
            
            // Dispatch tool result event
            dispatch('toolresult', { 
                index: currentToolIndex - 1, 
                total: toolCalls.length,
                name: toolCall.name,
                result: result
            });
            
            // Execute next tool
            executeNextToolCall();
        } catch (error) {
            console.error('Error executing tool call:', error);
            
            // Store the error result
            toolResults.push({
                index: currentToolIndex,
                name: toolCall.name,
                result: { error: error.message || 'Tool execution failed' },
                success: false
            });
            
            // Move to next tool
            currentToolIndex++;
            
            // Dispatch tool error event
            dispatch('toolerror', { 
                index: currentToolIndex - 1, 
                total: toolCalls.length,
                name: toolCall.name,
                error: error.message
            });
            
            // Execute next tool
            executeNextToolCall();
        }
    }
    
    // Finish tool execution and continue the conversation
    function finishToolExecution() {
        if (toolResults.length === 0) return;
        
        // Format results for the model
        const formattedResults = toolResults.map(result => {
            return {
                role: 'tool',
                name: result.name,
                content: typeof result.result === 'string' 
                    ? result.result 
                    : JSON.stringify(result.result, null, 2)
            };
        });
        
        // Dispatch event with all results
        dispatch('toolscomplete', { results: formattedResults });
    }
</script>

<!-- No visible UI elements, this is a logic component -->
