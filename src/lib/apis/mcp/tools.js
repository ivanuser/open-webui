/**
 * MCP Tools Helper
 * 
 * This module provides functions for working with MCP tools.
 */

import { settings, mcpServers } from '$lib/stores';
import { get } from 'svelte/store';
import { executeMCPTool } from './execute';

/**
 * Get MCP tools for a specific server type
 * @param {string} serverType - Type of MCP server
 * @returns {Array} - Tool definitions in OpenAI format
 */
export function getMCPTools(serverType = 'filesystem') {
    // Return tools based on server type
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
    
    // For other server types or if none specified
    return [];
}

/**
 * Process MCP tool calls from a model response
 * @param {string} token - Authentication token
 * @param {object} message - OpenAI message with tool calls
 * @param {string} serverId - Server ID to use for tools
 * @returns {Promise<object>} - Message with tool results
 */
export async function processMCPModelResponse(token, message, serverId) {
    if (!message || !message.tool_calls || message.tool_calls.length === 0) {
        return message;
    }
    
    // Process each tool call
    const toolResults = [];
    const toolOutputs = [];
    
    for (const toolCall of message.tool_calls) {
        try {
            // Parse arguments
            const args = JSON.parse(toolCall.function.arguments);
            
            // Execute the tool
            const result = await executeMCPTool(token, {
                serverId: serverId,
                tool: toolCall.function.name,
                args
            });
            
            // Format the result
            const resultText = typeof result === 'object' 
                ? (result.result || JSON.stringify(result))
                : String(result);
            
            // Add to results
            toolResults.push({
                tool: toolCall.function.name,
                result: resultText
            });
            
            // Add to tool outputs for OpenAI format
            toolOutputs.push({
                tool_call_id: toolCall.id,
                output: resultText
            });
        } catch (error) {
            console.error('Error processing tool call:', error);
            
            // Add error result
            toolResults.push({
                tool: toolCall.function.name,
                error: error.message
            });
            
            toolOutputs.push({
                tool_call_id: toolCall.id,
                output: `Error: ${error.message}`
            });
        }
    }
    
    // Return the message with tool results attached
    return {
        ...message,
        toolResults,
        tool_outputs: toolOutputs
    };
}

/**
 * Get the active MCP server
 * @returns {Promise<Object|null>} - Active MCP server or null if none
 */
export function getActiveMCPServer() {
    // Get from user settings
    const currentSettings = get(settings);
    const defaultServerId = currentSettings?.defaultMcpServer;
    const servers = get(mcpServers) || [];
    
    // Get default server if it exists and is connected
    if (defaultServerId) {
        const server = servers.find(s => s.id === defaultServerId && s.status === 'connected');
        if (server) return server;
    }
    
    // If no default server, use the first connected server
    const connectedServer = servers.find(s => s.status === 'connected');
    if (connectedServer) return connectedServer;
    
    return null;
}

export default {
    getMCPTools,
    processMCPModelResponse,
    getActiveMCPServer
};
