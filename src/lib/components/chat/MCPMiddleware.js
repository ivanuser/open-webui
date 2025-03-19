/**
 * MCP Middleware
 * 
 * This component provides middleware functions to integrate MCP with chat.
 */

import { get } from 'svelte/store';
import { mcpServers, settings } from '$lib/stores';
import { addMCPCapabilities, processMCPModelResponse, enhanceMessagesWithToolResults } from '$lib/components/chat/MCPHandler';

/**
 * Check if MCP is enabled for the current user
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
 * Get the active MCP server
 * @returns {Object|null} Active MCP server or null
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
 * Get the system prompt for the active MCP server
 * @returns {string} System prompt for MCP
 */
export function getMCPSystemPrompt() {
    const server = getActiveMCPServer();
    if (!server) return '';
    
    if (server.type === 'filesystem' || server.type === 'filesystem-py') {
        // Get the allowed path from the server args
        const allowedPath = server.args?.[server.args.length - 1] || '';
        
        // Determine path separator based on path format
        const isWindows = allowedPath.includes('\\') || allowedPath.includes(':');
        
        return `You have access to a filesystem through MCP. 
        
You can interact with files in: ${allowedPath}

Available tools:
- list_directory: Lists files and folders
- read_file: Gets file contents
- write_file: Creates or updates files
- create_directory: Makes new folders
- search_files: Finds files matching a pattern
- get_file_info: Shows file details
- list_allowed_directories: Shows accessible folders

When the user asks about files or directories, use these tools to access the actual filesystem and provide real information.`;
    } else if (server.type === 'memory') {
        return `You have access to a memory system through MCP.

Available memory tools:
- store_memory: Saves information
- retrieve_memory: Gets saved information
- search_memory: Finds information across all memories

Use these when appropriate to remember user information.`;
    }
    
    return '';
}

/**
 * Initialize MCP for a chat session
 * @param {Object} requestOptions - Original request options
 * @param {string} token - Authentication token
 * @returns {Object} Enhanced request options with MCP
 */
export function initializeMCP(requestOptions, token) {
    if (!isMCPEnabled()) {
        return requestOptions;
    }
    
    // Enhance the request with MCP capabilities
    return addMCPCapabilities(requestOptions, token);
}

/**
 * Process a response to handle tool calls
 * @param {string} token - Authentication token
 * @param {Object} response - Response from the model
 * @returns {Promise<Object>} Processed response with tool results
 */
export async function processMCPResponse(token, response) {
    if (!isMCPEnabled()) {
        return response;
    }
    
    // Check if response has tool calls
    if (!response?.choices?.[0]?.message?.tool_calls) {
        return response;
    }
    
    // Get the active server
    const server = getActiveMCPServer();
    if (!server) {
        return response;
    }
    
    try {
        // Process the tool calls in the response
        const processedMessage = await processMCPModelResponse(
            token,
            response.choices[0].message,
            server.id
        );
        
        // Update the response with the processed message
        if (processedMessage.toolResults) {
            response.choices[0].message = processedMessage;
        }
    } catch (error) {
        console.error('Error processing MCP response:', error);
    }
    
    return response;
}

/**
 * Prepare follow-up messages with tool results
 * @param {Array} messages - Original messages
 * @param {Object} response - Model response with tool results
 * @returns {Array} Updated messages
 */
export function prepareMCPFollowUp(messages, response) {
    if (!isMCPEnabled() || !response?.choices?.[0]?.message?.toolResults) {
        return messages;
    }
    
    // Enhance messages with tool results
    return enhanceMessagesWithToolResults(
        messages,
        response.choices[0].message.toolResults
    );
}