/**
 * This is a simplified version focusing only on adding MCP integration.
 * In a real implementation, this would be integrated with your existing OpenAI API code.
 */

import { WEBUI_API_BASE_URL } from '$lib/constants';
import { getMCPTools, processToolCall } from '$lib/apis/mcp';
import { mcpServers, settings } from '$lib/stores';
import { get } from 'svelte/store';

/**
 * Check if MCP is enabled for the current request
 * @returns {boolean} True if MCP is enabled
 */
function isMCPEnabled() {
    const currentSettings = get(settings);
    const servers = get(mcpServers) || [];
    
    // Check if there's a default server or any connected server
    const defaultServerId = currentSettings?.defaultMcpServer;
    
    if (defaultServerId) {
        return servers.some(s => s.id === defaultServerId && s.status === 'connected');
    }
    
    // If no default, check if any server is connected
    return servers.some(s => s.status === 'connected');
}

/**
 * Add MCP tools to the OpenAI request if needed
 * @param {Object} requestData - Original request data
 * @returns {Object} Updated request data with MCP tools if needed
 */
export function addMCPToolsToRequest(requestData) {
    // Check if MCP is enabled
    if (!isMCPEnabled()) {
        return requestData;
    }
    
    // Get MCP tools
    const mcpTools = getMCPTools();
    
    if (!mcpTools || mcpTools.length === 0) {
        return requestData;
    }
    
    // Add or merge tools
    const updatedRequest = { ...requestData };
    
    if (!updatedRequest.tools) {
        updatedRequest.tools = mcpTools;
    } else {
        updatedRequest.tools = [...updatedRequest.tools, ...mcpTools];
    }
    
    // Set tool_choice if not already set
    if (!updatedRequest.tool_choice) {
        updatedRequest.tool_choice = "auto";
    }
    
    return updatedRequest;
}

/**
 * Process OpenAI response for tool calls
 * @param {Object} response - OpenAI response
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} Processed response
 */
export async function processToolCalls(response, token) {
    // Check if the response contains tool calls
    if (!response.tool_calls || response.tool_calls.length === 0) {
        return response;
    }
    
    // Process each tool call
    for (const toolCall of response.tool_calls) {
        try {
            // Execute the tool call
            const result = await processToolCall(token, toolCall.function);
            
            // Add result to response
            if (!response.tool_results) {
                response.tool_results = [];
            }
            
            response.tool_results.push({
                tool_call_id: toolCall.id,
                result: result.result || JSON.stringify(result)
            });
        } catch (error) {
            console.error('Error processing tool call:', error);
            
            // Add error to response
            if (!response.tool_results) {
                response.tool_results = [];
            }
            
            response.tool_results.push({
                tool_call_id: toolCall.id,
                error: error.message || 'Unknown error'
            });
        }
    }
    
    return response;
}

/**
 * Example function showing how to generate a chat completion with MCP integration
 * This should be merged with your existing generateOpenAIChatCompletion function
 */
export async function generateOpenAIChatCompletionWithMCP(token, data, apiBaseUrl = '') {
    // Add MCP tools to the request if needed
    const requestData = addMCPToolsToRequest(data);
    
    // Make the API request
    // (This would use your existing code for making the request)
    
    // Process tool calls in the response
    // const response = await processToolCalls(apiResponse, token);
    
    // Return the processed response
    // return response;
    
    // This is just a placeholder
    return { message: "This is a placeholder for integrating with your existing OpenAI API code" };
}
