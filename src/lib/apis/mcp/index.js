/**
 * MCP API Client
 * 
 * This module provides functions for interacting with the MCP API.
 */

import { WEBUI_API_BASE_URL } from '$lib/constants';
import { config, settings, mcpServers } from '$lib/stores';
import { get } from 'svelte/store';
import { updateUserSettings } from '$lib/apis/users';
import { executeMCPTool } from './execute';

// Export the executeMCPTool function
export { executeMCPTool };

/**
 * Get all MCP servers
 * @param {string} token - Authentication token
 * @returns {Promise<Array>} - List of MCP servers
 */
export async function getMCPServers(token) {
    try {
        // Use backend API
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/servers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Store in the store
        if (result.success && result.servers) {
            const serverList = Object.entries(result.servers).map(([id, server]) => ({
                id,
                ...server
            }));
            mcpServers.set(serverList);
        }
        
        // Return the list
        return result.servers ? Object.entries(result.servers).map(([id, server]) => ({
            id,
            ...server
        })) : [];
    } catch (error) {
        console.error('Error fetching MCP servers:', error);
        
        // Fallback to local storage if API fails
        const storedServers = localStorage.getItem('mcpServers');
        if (storedServers) {
            try {
                const servers = JSON.parse(storedServers);
                mcpServers.set(servers);
                return servers;
            } catch (e) {
                console.error('Error parsing stored MCP servers:', e);
            }
        }
        
        return [];
    }
}

/**
 * Create a new MCP server
 * @param {string} token - Authentication token
 * @param {Object} serverData - Server configuration
 * @returns {Promise<Object>} - Created server
 */
export async function createMCPServer(token, serverData) {
    try {
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/servers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(serverData)
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Refresh server list
        await getMCPServers(token);
        
        return result;
    } catch (error) {
        console.error('Error creating MCP server:', error);
        throw error;
    }
}

/**
 * Update an MCP server
 * @param {string} token - Authentication token
 * @param {string} id - Server ID
 * @param {Object} serverData - Updated server configuration
 * @returns {Promise<Object>} - Updated server
 */
export async function updateMCPServer(token, id, serverData) {
    try {
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/servers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(serverData)
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Refresh server list
        await getMCPServers(token);
        
        return result;
    } catch (error) {
        console.error('Error updating MCP server:', error);
        throw error;
    }
}

/**
 * Delete an MCP server
 * @param {string} token - Authentication token
 * @param {string} id - Server ID
 * @returns {Promise<Object>} - Result of the operation
 */
export async function deleteMCPServer(token, id) {
    try {
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/servers/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Refresh server list
        await getMCPServers(token);
        
        // Also remove from enabled servers in settings
        const currentSettings = get(settings);
        if (currentSettings && currentSettings.enabledMcpServers) {
            currentSettings.enabledMcpServers = currentSettings.enabledMcpServers.filter(
                serverId => serverId !== id
            );
            
            // If this was the default server, clear the default
            if (currentSettings.defaultMcpServer === id) {
                currentSettings.defaultMcpServer = currentSettings.enabledMcpServers.length > 0 
                    ? currentSettings.enabledMcpServers[0] 
                    : null;
            }
            
            // Save the updated settings
            await saveUserSettings(currentSettings);
        }
        
        return result;
    } catch (error) {
        console.error('Error deleting MCP server:', error);
        throw error;
    }
}

/**
 * Start an MCP server
 * @param {string} token - Authentication token
 * @param {string} id - Server ID
 * @returns {Promise<Object>} - Result of the operation
 */
export async function startMCPServer(token, id) {
    try {
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/servers/${id}/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Refresh server list
        await getMCPServers(token);
        
        // Update enabled servers in settings
        if (result.success) {
            await connectToMCPServer(token, id);
        }
        
        return result;
    } catch (error) {
        console.error('Error starting MCP server:', error);
        throw error;
    }
}

/**
 * Stop an MCP server
 * @param {string} token - Authentication token
 * @param {string} id - Server ID
 * @returns {Promise<Object>} - Result of the operation
 */
export async function stopMCPServer(token, id) {
    try {
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/servers/${id}/stop`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Refresh server list
        await getMCPServers(token);
        
        // Update enabled servers in settings
        if (result.success) {
            await disconnectFromMCPServer(token, id);
        }
        
        return result;
    } catch (error) {
        console.error('Error stopping MCP server:', error);
        throw error;
    }
}

/**
 * Get MCP server logs
 * @param {string} token - Authentication token
 * @param {string} id - Server ID
 * @param {number} limit - Maximum number of log entries to return
 * @returns {Promise<Object>} - Server logs
 */
export async function getMCPServerLogs(token, id, limit = 100) {
    try {
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/servers/${id}/logs?limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting MCP server logs:', error);
        throw error;
    }
}

/**
 * Get MCP server templates
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Server templates
 */
export async function getMCPServerTemplates(token) {
    try {
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/servers/templates`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error getting MCP server templates:', error);
        throw error;
    }
}

/**
 * Get tools for an MCP server
 * @param {string} token - Authentication token
 * @param {string} id - Server ID
 * @returns {Promise<Object>} - Tools available on the server
 */
export async function getMCPServerTools(token, id) {
    try {
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/tools/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();
        return result.success ? result.tools : [];
    } catch (error) {
        console.error('Error getting MCP server tools:', error);
        return [];
    }
}

/**
 * Connect to an MCP server (for UI purposes)
 * @param {string} token - Authentication token
 * @param {string} id - Server ID
 * @returns {Promise<Object>} - Result of the operation
 */
export async function connectToMCPServer(token, id) {
    try {
        // Get current settings
        const currentSettings = get(settings);
        
        if (!currentSettings) {
            return { success: false, message: "No settings found" };
        }
        
        // Initialize enabledMcpServers if necessary
        if (!currentSettings.enabledMcpServers) {
            currentSettings.enabledMcpServers = [];
        }
        
        // Add to enabled servers if not already there
        if (!currentSettings.enabledMcpServers.includes(id)) {
            currentSettings.enabledMcpServers.push(id);
        }
        
        // Set as default if no default is set
        if (!currentSettings.defaultMcpServer) {
            currentSettings.defaultMcpServer = id;
        }
        
        // Save the updated settings
        await saveUserSettings(currentSettings);
        
        // Update server in store
        const servers = get(mcpServers) || [];
        const updatedServers = servers.map(server => 
            server.id === id ? { ...server, status: 'connected' } : server
        );
        mcpServers.set(updatedServers);
        
        return { success: true, status: 'connected' };
    } catch (error) {
        console.error('Error connecting to MCP server:', error);
        throw error;
    }
}

/**
 * Disconnect from an MCP server (for UI purposes)
 * @param {string} token - Authentication token
 * @param {string} id - Server ID
 * @returns {Promise<Object>} - Result of the operation
 */
export async function disconnectFromMCPServer(token, id) {
    try {
        // Get current settings
        const currentSettings = get(settings);
        
        if (!currentSettings) {
            return { success: false, message: "No settings found" };
        }
        
        // Remove from enabled servers
        if (currentSettings.enabledMcpServers) {
            currentSettings.enabledMcpServers = currentSettings.enabledMcpServers.filter(
                serverId => serverId !== id
            );
            
            // Update default server if needed
            if (currentSettings.defaultMcpServer === id) {
                currentSettings.defaultMcpServer = currentSettings.enabledMcpServers.length > 0 
                    ? currentSettings.enabledMcpServers[0] 
                    : null;
            }
            
            // Save the updated settings
            await saveUserSettings(currentSettings);
        }
        
        // Update server in store
        const servers = get(mcpServers) || [];
        const updatedServers = servers.map(server => 
            server.id === id ? { ...server, status: 'disconnected' } : server
        );
        mcpServers.set(updatedServers);
        
        return { success: true, status: 'disconnected' };
    } catch (error) {
        console.error('Error disconnecting from MCP server:', error);
        throw error;
    }
}

/**
 * Get the active MCP server
 * @returns {Promise<Object|null>} - Active MCP server or null if none
 */
export async function getActiveMCPServer() {
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

/**
 * Process an MCP tool call from a model
 * @param {string} token - Authentication token
 * @param {Object} toolCall - Tool call object
 * @returns {Promise<Object>} - Tool execution result
 */
export async function processToolCall(token, toolCall) {
    const { name, arguments: argsString } = toolCall;
    const args = typeof argsString === 'string' ? JSON.parse(argsString) : argsString;
    
    // Get the default MCP server
    const server = await getActiveMCPServer();
    
    if (!server) {
        throw new Error('No active MCP server available');
    }
    
    // Execute the tool call
    return await executeMCPTool(token, {
        serverId: server.id,
        tool: name,
        args
    });
}

/**
 * Get MCP tools for Ollama models
 * @returns {Array} - Tool definitions in Ollama format
 */
export function getMCPTools() {
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
        return [];
    }
    
    // Return cached tools based on server type
    if (server.type === 'filesystem' || server.type === 'filesystem-py') {
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
    } else if (server.type === 'memory') {
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
    
    // For other server types, we need to fetch dynamically (but not in this function)
    return [];
}

// Helper function to save user settings to localStorage and backend
async function saveUserSettings(updatedSettings) {
    // Update the store first
    settings.set({...updatedSettings});
    
    // Save to localStorage for immediate persistence
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('userSettings', JSON.stringify(updatedSettings));
    }
    
    // Save to backend if we have a token
    if (typeof localStorage !== 'undefined' && localStorage.token) {
        try {
            await updateUserSettings(localStorage.token, { ui: updatedSettings });
            return true;
        } catch (error) {
            console.error('Error saving user settings:', error);
            return false;
        }
    }
    
    return true;
}
