/**
 * Ollama MCP Adapter
 *
 * This module provides adapter functions for integrating MCP with Ollama API.
 * Ollama has specific requirements for tool formats and handling.
 */

import { get } from 'svelte/store';
import { mcpServers, settings } from '$lib/stores';
import { getMCPTools } from '$lib/components/chat/MCPHandler';
import { executeMCPToolCall } from '$lib/components/chat/MCPHandler';

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
 * Get active MCP server
 * @returns {Object|null} The active MCP server or null
 */
export function getActiveMCPServer() {
    const currentSettings = get(settings);
    const servers = get(mcpServers) || [];
    
    // Get default server if it exists and is connected
    if (currentSettings?.defaultMcpServer) {
        const server = servers.find(s => 
            s.id === currentSettings.defaultMcpServer && 
            s.status === 'connected'
        );
        if (server) return server;
    }
    
    // Otherwise, use the first connected server
    return servers.find(s => s.status === 'connected') || null;
}

/**
 * Format tools for Ollama API
 * @param {Array} tools - Original tools 
 * @returns {Array} Formatted tools for Ollama
 */
export function formatToolsForOllama(tools) {
    return tools.map(tool => {
        if (tool.type === 'function') {
            // Convert OpenAI-style tools to Ollama-style tools
            return {
                name: tool.function.name,
                description: tool.function.description,
                parameters: tool.function.parameters
            };
        }
        // Already in Ollama format
        return tool;
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
    
    // Get active MCP server
    const server = getActiveMCPServer();
    if (!server) {
        return requestData;
    }
    
    // Get MCP tools
    const mcpTools = getMCPTools(server.type);
    if (!mcpTools || mcpTools.length === 0) {
        return requestData;
    }
    
    // Format tools for Ollama
    const formattedTools = formatToolsForOllama(mcpTools);
    
    // Add MCP system prompt
    const systemPrompt = `You have access to external tools through MCP. 
    
For the filesystem, you can use:
- list_directory: Lists files and directories
- read_file: Gets contents of a file
- write_file: Creates or updates a file
- create_directory: Makes new directories
- search_files: Finds files matching a pattern
- get_file_info: Shows file metadata
- list_allowed_directories: Shows available directories

When asked about files or directories, use these tools to access the real filesystem.`;

    let messages = [...(requestData.messages || [])];
    
    // Find or add system message
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
    
    console.log('Processing Ollama tool calls:', response.message.tool_calls);
    
    // Get the active MCP server
    const server = getActiveMCPServer();
    if (!server) {
        console.error('No active MCP server available for tool execution');
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
            const result = await executeMCPToolCall(token, server.id, name, args);
            
            // Add result to tool results
            const resultString = result.result || 
                              (typeof result === 'string' ? result : JSON.stringify(result));
            
            toolResults.push({
                tool_call_id: toolCall.id || `call-${Math.random().toString(36).substr(2, 9)}`,
                role: 'tool',
                name: name,
                content: resultString
            });
            
            console.log(`Tool ${name} execution result:`, resultString.substring(0, 100) + '...');
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