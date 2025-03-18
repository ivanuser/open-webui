/**
 * MCP Middleware
 * 
 * This module provides middleware functions for integrating MCP with the chat component.
 * It handles adding MCP tools to requests, processing responses with tool calls,
 * and managing the conversation flow with MCP.
 */

import { get } from 'svelte/store';
import { mcpServers, settings } from '$lib/stores';
import { getMCPTools } from '$lib/apis/mcp';
import { processToolCalls, constructFollowUpMessages } from './MCPToolCallProcessor';
import { processStream } from '$lib/utils/streamProcessor';

/**
 * Get the system prompt for MCP
 * @returns {string} System prompt for MCP
 */
export function getMCPSystemPrompt() {
    // Get the default MCP server
    const currentSettings = get(settings);
    const defaultServerId = currentSettings?.defaultMcpServer;
    const servers = get(mcpServers) || [];
    
    // Get default server if it exists and is connected
    let server = null;
    if (defaultServerId) {
        server = servers.find(s => s.id === defaultServerId && s.status === 'connected');
    }
    
    // If no default server, use the first connected server
    if (!server) {
        server = servers.find(s => s.status === 'connected');
    }
    
    if (!server) {
        return '';
    }
    
    // Generate system prompt based on server type
    if (server.type === 'filesystem' || server.type === 'filesystem-py') {
        // Get the allowed path from the server args
        const allowedPath = server.args?.[server.args.length - 1] || '';
        
        // Determine path separator based on path format
        const isWindows = allowedPath.includes('\\') || allowedPath.includes(':');
        const pathSep = isWindows ? '\\' : '/';
        
        return `You have access to a filesystem through the MCP (Model Context Protocol) server. 
You can interact with files and directories by using function calls when needed.

When working with the filesystem:
1. Only access paths under: ${allowedPath}
2. Use ${isWindows ? 'backslashes' : 'forward slashes'} for paths (${pathSep})
3. Always provide absolute paths starting with ${allowedPath}

Available functions:
- list_directory(path): Lists files and directories in a directory
- read_file(path): Reads a file's contents
- write_file(path, content): Creates or overwrites a file
- create_directory(path): Creates a directory
- search_files(path, pattern): Searches for files or directories matching a pattern
- get_file_info(path): Gets file metadata
- list_allowed_directories(): Lists directories you have access to

Examples:
- To see what files are in ${allowedPath}: Use list_directory("${allowedPath}")
- To read a file: Use read_file("${allowedPath}${pathSep}example.txt")
- To create a file: Use write_file("${allowedPath}${pathSep}new_file.txt", "content")

When a user asks to see directory contents or read/write files, use these functions.`;
    } else if (server.type === 'memory') {
        return `You have access to a persistent memory system through the MCP server.
You can store and retrieve information across conversations.

Use memory functions when:
- The user asks you to remember something
- You need to recall previously stored information
- The user asks about something you mentioned in a previous conversation

Available functions:
- store_memory(key, value): Stores information
- retrieve_memory(key): Retrieves information
- search_memory(query): Searches across stored memories

When storing information, use descriptive keys that will make the information easy to find later.`;
    }
    
    return `You have access to an MCP server of type ${server.type}.
When appropriate, you can use the available functions to perform operations with this server.`;
}

/**
 * Check if MCP is enabled
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
 * Enhance request options with MCP capabilities
 * @param {object} options - Original request options
 * @returns {object} Enhanced request options
 */
export function enhanceRequestWithMCP(options) {
    if (!isMCPEnabled()) {
        return options;
    }
    
    // Get MCP tools
    const mcpTools = getMCPTools();
    
    if (!mcpTools || mcpTools.length === 0) {
        return options;
    }
    
    // Add system prompt for MCP if not already present
    let messages = [...options.messages];
    const systemPrompt = getMCPSystemPrompt();
    
    if (systemPrompt) {
        // Check if there's already a system message
        const systemMessageIndex = messages.findIndex(msg => msg.role === 'system');
        
        if (systemMessageIndex >= 0) {
            // Append to existing system message
            messages[systemMessageIndex] = {
                ...messages[systemMessageIndex],
                content: `${messages[systemMessageIndex].content}\n\n${systemPrompt}`
            };
        } else {
            // Add new system message at the beginning
            messages = [
                { role: 'system', content: systemPrompt },
                ...messages
            ];
        }
    }
    
    // Add or merge tools
    const updatedOptions = { 
        ...options,
        messages,
        tools: [...(options.tools || []), ...mcpTools],
        tool_choice: options.tool_choice || "auto"
    };
    
    return updatedOptions;
}

/**
 * Process a streamed response with MCP tool calls
 * @param {object} params - Stream processing parameters
 * @param {ReadableStream} params.stream - Stream from the API response
 * @param {Function} params.onChunk - Callback for each chunk of text
 * @param {Function} params.onToolCall - Callback when a tool call is detected
 * @param {Function} params.onToolResult - Callback when a tool result is ready
 * @param {Function} params.onComplete - Callback when streaming is complete
 * @param {string} params.token - Authentication token
 * @returns {Promise<object>} The complete response object
 */
export function processMCPStream(params) {
    const { stream, onChunk, onToolCall, onToolResult, onComplete, token } = params;
    
    return processStream(
        stream,
        onChunk,
        onToolCall,
        onToolResult,
        onComplete,
        token
    );
}

/**
 * Handle tool calls in a response
 * @param {string} token - Authentication token
 * @param {object} response - Model response
 * @returns {Promise<object>} Updated response with tool results
 */
export async function handleToolCalls(token, response) {
    return await processToolCalls(token, response);
}

/**
 * Update conversation history with tool calls and results
 * @param {Array} messages - Original conversation messages
 * @param {object} aiMessage - AI message with tool calls
 * @param {Array} toolResults - Results of tool execution
 * @returns {Array} Updated conversation messages
 */
export function updateConversationWithToolResults(messages, aiMessage, toolResults) {
    return constructFollowUpMessages(messages, aiMessage, toolResults);
}
