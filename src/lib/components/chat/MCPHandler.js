/**
 * MCP Handler for Open WebUI
 * 
 * This module handles the integration between Open WebUI and Model Context Protocol (MCP) servers.
 * It provides functions for tool registration, tool execution, and MCP server management.
 */

import { get } from 'svelte/store';
import { mcpServers, settings } from '$lib/stores';
import { WEBUI_API_BASE_URL } from '$lib/constants';

/**
 * Gets the currently connected MCP servers
 * @returns {Array} Array of connected MCP server objects
 */
export function getConnectedMCPServers() {
    const servers = get(mcpServers) || [];
    return servers.filter(server => server.status === 'connected');
}

/**
 * Gets the default MCP server if set
 * @returns {Object|null} Default MCP server object or null
 */
export function getDefaultMCPServer() {
    const userSettings = get(settings);
    const defaultServerId = userSettings?.defaultMcpServer;
    const servers = get(mcpServers) || [];
    
    if (defaultServerId) {
        const defaultServer = servers.find(s => s.id === defaultServerId && s.status === 'connected');
        return defaultServer || null;
    }
    
    return null;
}

/**
 * Generates OpenAI-compatible tool definitions for a specific MCP server type
 * @param {string} serverType - Type of MCP server (e.g., 'filesystem', 'memory')
 * @returns {Array} Array of tool definitions
 */
export function getMCPTools(serverType) {
    if (serverType === 'filesystem' || serverType === 'filesystem-py') {
        return [
            {
                type: "function",
                function: {
                    name: "list_directory",
                    description: "Lists all files and directories in the specified directory path",
                    parameters: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string",
                                description: "The absolute path to the directory"
                            }
                        },
                        required: ["path"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "read_file",
                    description: "Reads the content of a file",
                    parameters: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string",
                                description: "The absolute path to the file"
                            }
                        },
                        required: ["path"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "write_file",
                    description: "Creates a new file or overwrites an existing file",
                    parameters: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string",
                                description: "The absolute path where the file should be created or overwritten"
                            },
                            content: {
                                type: "string",
                                description: "The content to write to the file"
                            }
                        },
                        required: ["path", "content"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "create_directory",
                    description: "Creates a new directory or ensures it exists",
                    parameters: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string",
                                description: "The absolute path where the directory should be created"
                            }
                        },
                        required: ["path"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_files",
                    description: "Searches for files matching a pattern in a directory",
                    parameters: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string",
                                description: "The absolute path to the directory to search in"
                            },
                            pattern: {
                                type: "string",
                                description: "The search pattern (glob format)"
                            }
                        },
                        required: ["path", "pattern"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "get_file_info",
                    description: "Gets detailed information about a file or directory",
                    parameters: {
                        type: "object",
                        properties: {
                            path: {
                                type: "string",
                                description: "The absolute path to the file or directory"
                            }
                        },
                        required: ["path"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "list_allowed_directories",
                    description: "Lists all directories that this server is allowed to access",
                    parameters: {
                        type: "object",
                        properties: {}
                    }
                }
            }
        ];
    } else if (serverType === 'memory') {
        return [
            {
                type: "function",
                function: {
                    name: "store_memory",
                    description: "Stores information in the memory server",
                    parameters: {
                        type: "object",
                        properties: {
                            key: {
                                type: "string",
                                description: "The key to store the information under"
                            },
                            value: {
                                type: "string",
                                description: "The information to store"
                            }
                        },
                        required: ["key", "value"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "retrieve_memory",
                    description: "Retrieves information from the memory server",
                    parameters: {
                        type: "object",
                        properties: {
                            key: {
                                type: "string",
                                description: "The key to retrieve information for"
                            }
                        },
                        required: ["key"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "search_memory",
                    description: "Searches for information in the memory server",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "The search query"
                            }
                        },
                        required: ["query"]
                    }
                }
            }
        ];
    }
    
    // Default empty tools for unknown server types
    return [];
}

/**
 * Gets the system prompt for MCP interaction
 * @param {Object} server - MCP server object
 * @returns {string} System prompt for MCP interaction
 */
export function getMCPSystemPrompt(server) {
    if (!server) return '';
    
    let instructions = '';
    
    if (server.type === 'filesystem' || server.type === 'filesystem-py') {
        // Get the allowed path from the server args
        const allowedPath = server.args?.[server.args.length - 1] || '';
        
        // Determine path separator based on path format
        const isWindows = allowedPath.includes('\\') || allowedPath.includes(':');
        const pathSep = isWindows ? '\\' : '/';
        
        instructions = `You have access to a filesystem through an MCP server. You can perform operations on files and directories by using function calls when needed.

When working with the filesystem:
1. Only access paths under: ${allowedPath}
2. Use ${isWindows ? 'backslashes' : 'forward slashes'} for paths
3. Always provide absolute paths starting with ${allowedPath}

Available functions:
- list_directory(path): Lists files in a directory
- read_file(path): Reads a file's contents
- write_file(path, content): Creates or overwrites a file
- create_directory(path): Creates a directory
- search_files(path, pattern): Searches for files
- get_file_info(path): Gets file metadata
- list_allowed_directories(): Shows accessible directories

Examples:
- To see files in ${allowedPath}: Use list_directory function
- To read a file: Use read_file function
- To create a file: Use write_file function

When the user mentions files or wants to see directory contents, use these functions to provide actual information from the filesystem.`;
    
    } else if (server.type === 'memory') {
        instructions = `You have access to a persistent memory system through an MCP server. You can store and retrieve information across conversations.

Use memory functions when:
- The user asks you to remember something
- You need to recall previously stored information
- The user asks about something you mentioned in a previous conversation

Available functions:
- store_memory(key, value): Stores information
- retrieve_memory(key): Retrieves information
- search_memory(query): Searches across stored memories

When storing information, use descriptive keys that will make the information easy to find later.`;
    } else {
        instructions = `You have access to an MCP server of type ${server.type}. When appropriate, you can use the available functions to perform operations with this server.`;
    }
    
    return instructions;
}

/**
 * Executes an MCP tool call
 * @param {string} token - Authentication token
 * @param {string} serverId - ID of the MCP server to use
 * @param {string} toolName - Name of the tool to call
 * @param {Object} args - Arguments for the tool call
 * @returns {Promise} Promise resolving to the result of the tool call
 */
export async function executeMCPToolCall(token, serverId, toolName, args) {
    try {
        console.log(`Executing MCP tool call: ${toolName}`, args);
        
        // Make the actual API call to execute the tool
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ 
                serverId, 
                tool: toolName, 
                args 
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error executing MCP tool: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`MCP tool execution result:`, result);
        
        return result;
    } catch (error) {
        console.error('Error executing MCP tool call:', error);
        return { 
            error: true, 
            message: error.message || 'Unknown error executing MCP tool call' 
        };
    }
}

/**
 * Prepares message data for the model, including tool definitions
 * @param {Array} messages - Conversation messages
 * @param {Object} server - MCP server object
 * @returns {Object} Prepared message data
 */
export function prepareMCPMessageData(messages, server) {
    if (!server) {
        return { messages };
    }
    
    // Get tools for this server type
    const tools = getMCPTools(server.type);
    
    // Add system prompt with MCP instructions
    const systemPrompt = getMCPSystemPrompt(server);
    let updatedMessages = [...messages];
    
    if (systemPrompt) {
        const systemIndex = updatedMessages.findIndex(m => m.role === 'system');
        if (systemIndex >= 0) {
            // Append to existing system message
            updatedMessages[systemIndex] = {
                ...updatedMessages[systemIndex],
                content: `${updatedMessages[systemIndex].content}\n\n${systemPrompt}`
            };
        } else {
            // Add new system message at the beginning
            updatedMessages = [
                { role: 'system', content: systemPrompt },
                ...updatedMessages
            ];
        }
    }
    
    // Prepare message data with tools
    return {
        messages: updatedMessages,
        tools,
        tool_choice: "auto"
    };
}

/**
 * Processes model response to extract and execute tool calls
 * @param {string} token - Authentication token
 * @param {Object} response - Model response
 * @param {string} serverId - ID of the MCP server to use
 * @returns {Promise} Promise resolving to the processed response with tool results
 */
export async function processMCPModelResponse(token, response, serverId) {
    // Check if the response contains tool calls
    if (!response?.tool_calls || response.tool_calls.length === 0) {
        return response;
    }
    
    console.log('Processing MCP tool calls in model response:', response.tool_calls);
    
    // Process each tool call
    const toolResults = [];
    
    for (const toolCall of response.tool_calls) {
        try {
            // Get tool name and arguments
            const name = toolCall.function?.name || toolCall.name;
            let args;
            
            try {
                args = typeof toolCall.function?.arguments === 'string' 
                    ? JSON.parse(toolCall.function.arguments) 
                    : (toolCall.function?.arguments || {});
            } catch (error) {
                console.error('Error parsing tool arguments:', error);
                args = {};
            }
            
            // Execute the tool call
            const result = await executeMCPToolCall(token, serverId, name, args);
            
            // Create a tool result message
            toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name,
                content: result.result || JSON.stringify(result)
            });
        } catch (error) {
            console.error(`Error processing tool call:`, error);
            
            // Add error result
            toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: toolCall.function?.name || toolCall.name || 'unknown',
                content: `Error: ${error.message || 'Unknown error'}`
            });
        }
    }
    
    // Return the updated response with tool results
    return {
        ...response,
        toolResults
    };
}

/**
 * Adds MCP capabilities to a model request
 * @param {Object} requestOptions - Original request options
 * @param {string} token - Authentication token
 * @returns {Object} Updated request options with MCP capabilities
 */
export function addMCPCapabilities(requestOptions, token) {
    // Get the default or first connected MCP server
    const defaultServer = getDefaultMCPServer();
    const connectedServers = getConnectedMCPServers();
    const server = defaultServer || (connectedServers.length > 0 ? connectedServers[0] : null);
    
    if (!server) {
        return requestOptions;
    }
    
    console.log(`Adding MCP capabilities using server: ${server.name} (${server.type})`);
    
    // Prepare message data with tools and system prompt
    const mcpMessageData = prepareMCPMessageData(requestOptions.messages, server);
    
    // Update request options
    return {
        ...requestOptions,
        ...mcpMessageData
    };
}

/**
 * Creates follow-up messages with tool results to continue the conversation
 * @param {Array} messages - Original conversation messages
 * @param {Array} toolResults - Tool results to add
 * @returns {Array} Updated conversation messages with tool results
 */
export function enhanceMessagesWithToolResults(messages, toolResults) {
    if (!toolResults || toolResults.length === 0) {
        return messages;
    }
    
    // Add each tool result as a separate message
    return [...messages, ...toolResults];
}