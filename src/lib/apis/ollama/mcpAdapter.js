/**
 * Ollama MCP Adapter
 *
 * This module provides adapter functions for integrating MCP with Ollama API.
 * Ollama has specific requirements for tool formats and handling.
 */

import { get } from 'svelte/store';
import { mcpServers, settings } from '$lib/stores';
import { getMCPTools } from '$lib/apis/mcp';
import { executeMCPTool } from '$lib/apis/mcp/execute';
import { getMCPSystemPrompt } from '$lib/components/chat/MCPMiddleware';

/**
 * Check if MCP is enabled and should be included in requests
 * @returns {boolean} True if MCP is enabled
 */
export function isMCPEnabled() {
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
 * Format tools for Ollama API
 * @param {Array} tools - Original tools 
 * @returns {Array} Formatted tools for Ollama
 */
export function formatToolsForOllama(tools) {
    return tools.map(tool => {
        // Make sure the tool is in the format Ollama expects
        return {
            name: tool.function?.name || tool.name,
            description: tool.function?.description || tool.description,
            parameters: tool.function?.parameters || tool.parameters
        };
    });
}

/**
 * Adapt Ollama request for MCP
 * @param {object} requestData - Original request data
 * @returns {object} Adapted request data
 */
export function adaptRequestForOllama(requestData) {
    // Check if MCP is enabled
    if (!isMCPEnabled()) {
        return requestData;
    }
    
    // Get MCP tools
    const mcpTools = getMCPTools();
    
    if (!mcpTools || mcpTools.length === 0) {
        return requestData;
    }
    
    // Format tools for Ollama
    const formattedTools = formatToolsForOllama(mcpTools);
    
    // Add MCP system prompt
    const systemPrompt = getMCPSystemPrompt();
    let messages = [...(requestData.messages || [])];
    
    if (systemPrompt) {
        const systemIndex = messages.findIndex(m => m.role === 'system');
        if (systemIndex >= 0) {
            // Append to existing system message
            messages[systemIndex] = {
                ...messages[systemIndex],
                content: `${messages[systemIndex].content}\n\n${systemPrompt}`
            };
        } else {
            // Add new system message
            messages = [
                { role: 'system', content: systemPrompt },
                ...messages
            ];
        }
    }
    
    // Create adapted request
    return {
        ...requestData,
        messages,
        tools: formattedTools,
        tool_choice: "auto"
    };
}

/**
 * Process tool calls from Ollama response
 * @param {string} token - Auth token
 * @param {object} response - Response from Ollama
 * @returns {Promise<object>} Processed response with tool results
 */
export async function processOllamaToolCalls(token, response) {
    if (!response?.message?.tool_calls || response.message.tool_calls.length === 0) {
        return response;
    }
    
    // Get the default MCP server
    const currentSettings = get(settings);
    const defaultServerId = currentSettings?.defaultMcpServer;
    const servers = get(mcpServers) || [];
    
    let serverId = defaultServerId;
    
    // If no default server, use the first connected server
    if (!serverId) {
        const connectedServer = servers.find(s => s.status === 'connected');
        if (connectedServer) {
            serverId = connectedServer.id;
        }
    }
    
    if (!serverId) {
        console.error('No connected MCP server available for tool execution');
        return response;
    }
    
    // Create an array to hold tool results
    const toolResults = [];
    
    // Process each tool call
    for (const toolCall of response.message.tool_calls) {
        try {
            const name = toolCall.function?.name || toolCall.name;
            let args = {};
            
            try {
                // Parse arguments (handle both string and object formats)
                if (typeof toolCall.function?.arguments === 'string') {
                    args = JSON.parse(toolCall.function.arguments);
                } else if (toolCall.function?.arguments) {
                    args = toolCall.function.arguments;
                } else if (typeof toolCall.arguments === 'string') {
                    args = JSON.parse(toolCall.arguments);
                } else if (toolCall.arguments) {
                    args = toolCall.arguments;
                }
            } catch (error) {
                console.error('Error parsing tool arguments:', error);
                args = {}; // Use empty object if parsing fails
            }
            
            console.log(`Executing tool ${name} with args:`, args);
            
            // Execute the tool call
            const result = await executeMCPTool(token, {
                serverId,
                tool: name,
                args
            });
            
            // Add result to tool results
            const resultString = typeof result === 'string' ? result : 
                               (result.result ? result.result : JSON.stringify(result));
            
            toolResults.push({
                tool_call_id: toolCall.id || `call-${Math.random().toString(36).substr(2, 9)}`,
                role: 'tool',
                name: name,
                content: resultString
            });
            
            console.log(`Tool ${name} execution result:`, resultString);
        } catch (error) {
            console.error(`Error executing tool call:`, error);
            
            // Add error result
            toolResults.push({
                tool_call_id: toolCall.id || `call-${Math.random().toString(36).substr(2, 9)}`,
                role: 'tool',
                name: toolCall.function?.name || toolCall.name || 'unknown',
                content: `Error: ${error.message || 'Unknown error'}`
            });
        }
    }
    
    // Return the original response with tool results
    return {
        ...response,
        toolResults
    };
}

/**
 * Create follow-up messages with tool results
 * @param {Array} messages - Original messages
 * @param {Array} toolResults - Tool execution results
 * @returns {Array} Updated messages
 */
export function createFollowUpMessages(messages, toolResults) {
    if (!toolResults || toolResults.length === 0) {
        return messages;
    }
    
    // Create a copy of the messages array
    const updatedMessages = [...messages];
    
    // Add each tool result as a separate message
    for (const result of toolResults) {
        updatedMessages.push(result);
    }
    
    return updatedMessages;
}
