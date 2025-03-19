/**
 * Ollama MCP Client
 * 
 * This module adapts the MCP client functionality for Ollama models,
 * creating a bridge between Ollama and MCP servers. It handles the
 * connection to MCP servers, tool discovery, and tool execution.
 */

import { spawn } from 'child_process';
import { get } from 'svelte/store';
import { mcpServers, settings } from '$lib/stores';
import { WEBUI_API_BASE_URL } from '$lib/constants';

// Cache for MCP server tools
const toolsCache = new Map();

/**
 * Get the active MCP server configuration
 * @returns {Object|null} MCP server configuration or null if none active
 */
export function getActiveMCPServer() {
    const currentSettings = get(settings);
    const defaultServerId = currentSettings?.defaultMcpServer;
    const servers = get(mcpServers) || [];
    
    // Get default server if it exists and is connected
    if (defaultServerId) {
        const server = servers.find(s => s.id === defaultServerId && s.status === 'connected');
        if (server) return server;
    }
    
    // Otherwise, use the first connected server
    return servers.find(s => s.status === 'connected') || null;
}

/**
 * Connect to an MCP server and discover available tools
 * @param {Object} server - MCP server configuration
 * @returns {Promise<Array>} List of tools available on the server
 */
export async function connectToMCPServer(server) {
    // Check if we already have tools for this server in cache
    if (toolsCache.has(server.id)) {
        return toolsCache.get(server.id);
    }
    
    // For server types that use a script file (filesystem, filesystem-py)
    if (server.type === 'filesystem' || server.type === 'filesystem-py') {
        const scriptPath = server.type === 'filesystem-py' 
            ? 'filesystem_mcp_server.py' 
            : 'standalone_mcp_filesystem_server.js';
        
        const isPython = scriptPath.endsWith('.py');
        const command = isPython ? 'python' : 'node';
        
        // Get tools by calling the listTools method
        const tools = await discoverMCPTools(command, scriptPath, server.args.slice(1));
        
        // Cache the tools
        toolsCache.set(server.id, tools);
        
        return tools;
    }
    
    // For other server types, use predefined tools 
    // This would need to be expanded for other MCP server types
    const tools = getDefaultTools(server.type);
    toolsCache.set(server.id, tools);
    
    return tools;
}

/**
 * Discover tools available on an MCP server
 * @param {string} command - Command to run (node or python)
 * @param {string} scriptPath - Path to the MCP server script
 * @param {Array} args - Additional arguments for the server
 * @returns {Promise<Array>} List of tools
 */
async function discoverMCPTools(command, scriptPath, args) {
    return new Promise((resolve, reject) => {
        try {
            // Construct the command to list tools
            const listToolsRequest = JSON.stringify({
                jsonrpc: "2.0",
                method: "listTools",
                params: {},
                id: 1
            });
            
            // Spawn the server process
            const serverProcess = spawn(command, [scriptPath, ...args], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            serverProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            serverProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            serverProcess.on('error', (error) => {
                reject(`Failed to start MCP server: ${error.message}`);
            });
            
            serverProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`MCP server process exited with code ${code}`);
                    console.error('stderr:', stderr);
                    // Fallback to default tools if we can't get them from the server
                    resolve(getDefaultTools('filesystem'));
                    return;
                }
                
                try {
                    // Parse the response to get tools
                    const responseLines = stdout.split('\n').filter(line => line.trim());
                    let toolsJson = null;
                    
                    for (const line of responseLines) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.result && parsed.result.tools) {
                                toolsJson = parsed.result.tools;
                                break;
                            }
                        } catch (e) {
                            // Skip lines that aren't valid JSON
                        }
                    }
                    
                    if (toolsJson) {
                        // Convert tools to Ollama format
                        const ollamaTools = toolsJson.map(tool => ({
                            type: "function",
                            function: {
                                name: tool.name,
                                description: tool.description,
                                parameters: tool.inputSchema
                            }
                        }));
                        
                        resolve(ollamaTools);
                    } else {
                        // Fallback to default tools
                        resolve(getDefaultTools('filesystem'));
                    }
                } catch (error) {
                    console.error('Error parsing MCP server response:', error);
                    resolve(getDefaultTools('filesystem'));
                }
            });
            
            // Write the request to the server's stdin
            serverProcess.stdin.write(listToolsRequest + '\n');
            serverProcess.stdin.end();
        } catch (error) {
            console.error('Error discovering MCP tools:', error);
            resolve(getDefaultTools('filesystem'));
        }
    });
}

/**
 * Get default tools for a server type
 * @param {string} serverType - MCP server type
 * @returns {Array} Default tools for this server type
 */
function getDefaultTools(serverType) {
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
    
    return [];
}

/**
 * Execute an MCP tool call
 * @param {string} token - Authentication token
 * @param {Object} toolCall - Tool call object from Ollama response
 * @returns {Promise<Object>} The result of executing the tool
 */
export async function executeToolCall(token, toolCall) {
    try {
        // Get the server to use
        const server = getActiveMCPServer();
        if (!server) {
            throw new Error('No active MCP server available');
        }
        
        // Get tool name and arguments
        const tool = toolCall.function?.name || toolCall.name;
        let args;
        
        try {
            args = typeof toolCall.function?.arguments === 'string' 
                ? JSON.parse(toolCall.function?.arguments) 
                : toolCall.function?.arguments || {};
        } catch (error) {
            console.error('Error parsing tool arguments:', error);
            args = {};
        }
        
        // Execute the tool
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify({
                serverId: server.id,
                tool,
                args
            })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Tool execution failed: ${errorData}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error executing MCP tool:', error);
        throw error;
    }
}

/**
 * Process an Ollama message with tool calls
 * @param {string} token - Authentication token
 * @param {Object} message - Ollama message object
 * @returns {Promise<Object>} Processed message with tool results
 */
export async function processOllamaMessage(token, message) {
    // Check if the message has tool calls
    if (!message?.tool_calls || message.tool_calls.length === 0) {
        return message;
    }
    
    // Process each tool call and collect results
    const toolResults = [];
    
    for (const toolCall of message.tool_calls) {
        try {
            // Execute the tool
            const result = await executeToolCall(token, toolCall);
            
            // Add to results
            toolResults.push({
                role: 'tool',
                tool_call_id: toolCall.id || `call-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                name: toolCall.function?.name || toolCall.name,
                content: result.result || JSON.stringify(result)
            });
        } catch (error) {
            console.error('Error processing tool call:', error);
            
            // Add error result
            toolResults.push({
                role: 'tool',
                tool_call_id: toolCall.id || `call-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                name: toolCall.function?.name || toolCall.name,
                content: `Error: ${error.message}`
            });
        }
    }
    
    return {
        ...message,
        toolResults
    };
}

/**
 * Get system message instructions for using MCP tools
 * @returns {string} System message instructions
 */
export function getMCPSystemInstructions() {
    const server = getActiveMCPServer();
    if (!server) return '';
    
    if (server.type === 'filesystem' || server.type === 'filesystem-py') {
        // Get the allowed directory from server args
        const allowedPath = server.args[server.args.length - 1] || '';
        const isWindows = allowedPath.includes('\\') || allowedPath.includes(':');
        const pathSep = isWindows ? '\\' : '/';
        
        return `You have access to a filesystem through the MCP (Model Context Protocol).
You can interact with files and directories using the available tools when needed.

When working with the filesystem:
1. You can only access paths under: ${allowedPath}
2. Use ${isWindows ? 'backslashes' : 'forward slashes'} for paths
3. Always provide absolute paths starting with ${allowedPath}

Available filesystem tools:
- list_directory(path): Lists files/directories
- read_file(path): Reads file contents
- write_file(path, content): Creates/overwrites files
- create_directory(path): Creates directories
- search_files(path, pattern): Searches for files
- get_file_info(path): Gets metadata about files
- list_allowed_directories(): Shows accessible directories

Use these tools when a user asks about files or directories.`;
    } else if (server.type === 'memory') {
        return `You have access to a persistent memory system through MCP.
You can store and retrieve information that persists across conversations.

Available memory tools:
- store_memory(key, value): Stores information
- retrieve_memory(key): Retrieves information
- search_memory(query): Searches across stored memories

Use descriptive keys when storing information.`;
    }
    
    return '';
}

/**
 * Enhance chat messages with MCP tool results
 * @param {Array} messages - Original chat messages
 * @param {Array} toolResults - Tool execution results
 * @returns {Array} Enhanced messages including tool results
 */
export function enhanceMessagesWithToolResults(messages, toolResults) {
    if (!toolResults || toolResults.length === 0) {
        return messages;
    }
    
    return [...messages, ...toolResults];
}

/**
 * Enhance Ollama API request with MCP capabilities
 * @param {Object} requestData - Original request data
 * @returns {Promise<Object>} Enhanced request with MCP tools
 */
export async function enhanceOllamaRequest(requestData) {
    const server = getActiveMCPServer();
    if (!server) {
        return requestData;
    }
    
    // Get tools for this server
    const tools = await connectToMCPServer(server);
    
    // Add system message with MCP instructions if not already present
    let messages = [...(requestData.messages || [])];
    const sysInstructions = getMCPSystemInstructions();
    
    if (sysInstructions) {
        const systemIndex = messages.findIndex(m => m.role === 'system');
        
        if (systemIndex >= 0) {
            // Append to existing system message
            messages[systemIndex] = {
                ...messages[systemIndex],
                content: `${messages[systemIndex].content}\n\n${sysInstructions}`
            };
        } else {
            // Add new system message at the beginning
            messages = [
                { role: 'system', content: sysInstructions },
                ...messages
            ];
        }
    }
    
    // Return enhanced request
    return {
        ...requestData,
        messages,
        tools,
        tool_choice: "auto"
    };
}
