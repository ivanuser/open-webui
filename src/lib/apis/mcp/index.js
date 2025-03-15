import { WEBUI_API_BASE_URL } from '$lib/constants';
import { config, settings, mcpServers } from '$lib/stores';
import { get } from 'svelte/store';
import { updateUserSettings } from '$lib/apis/users';
import { executeMCPTool } from './execute';

// Export the executeMCPTool function
export { executeMCPTool };

// Helper function to get MCP servers from localStorage
const getMCPServersFromStorage = () => {
	if (typeof localStorage !== 'undefined') {
		const storedServers = localStorage.getItem('mcpServers');
		if (storedServers) {
			try {
				return JSON.parse(storedServers);
			} catch (e) {
				console.error('Error parsing stored MCP servers:', e);
			}
		}
	}
	// Default mock data if nothing in storage
	return [
		{
			id: 'memory-server',
			name: 'Memory Server',
			type: 'memory',
			command: 'npx',
			args: ['-y', '@modelcontextprotocol/server-memory'],
			status: 'disconnected',
			description: 'Knowledge graph-based persistent memory system'
		},
		{
			id: 'filesystem-server',
			name: 'Filesystem Server',
			type: 'filesystem',
			command: 'node',
			args: ['mcp_filesystem_server.js', '/home/ihoner'],
			status: 'disconnected',
			description: 'Secure file operations with configurable access controls'
		}
	];
};

// Helper function to save MCP servers to localStorage
const saveMCPServersToStorage = (servers) => {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem('mcpServers', JSON.stringify(servers));
	}
};

// Helper function to save user settings to localStorage and backend
const saveUserSettings = async (updatedSettings) => {
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
};

// Helper function to sync enabled MCP servers with settings and save to backend
const syncEnabledMCPServers = async (servers) => {
	try {
		const currentSettings = get(settings);
		if (!currentSettings) return;
		
		// Get all connected servers
		const connectedServerIds = servers
			.filter(server => server.status === 'connected')
			.map(server => server.id);
		
		// Initialize enabledMcpServers if necessary
		if (!currentSettings.enabledMcpServers) {
			currentSettings.enabledMcpServers = [];
		}
		
		// Replace with connected servers
		currentSettings.enabledMcpServers = connectedServerIds;
		
		// Handle default server
		if (currentSettings.defaultMcpServer) {
			const defaultServerStillExists = servers.some(s => s.id === currentSettings.defaultMcpServer);
			const defaultServerStillConnected = connectedServerIds.includes(currentSettings.defaultMcpServer);
			
			if (!defaultServerStillExists || !defaultServerStillConnected) {
				// If default server no longer exists or is not connected, update it
				currentSettings.defaultMcpServer = connectedServerIds.length > 0 ? connectedServerIds[0] : null;
			}
		} else if (connectedServerIds.length > 0) {
			// If no default is set but there are connected servers, set the first one as default
			currentSettings.defaultMcpServer = connectedServerIds[0];
		}
		
		// Save the updated settings
		await saveUserSettings(currentSettings);
	} catch (error) {
		console.error('Error syncing enabled MCP servers with settings:', error);
	}
};

/**
 * Get the tools for the default/enabled MCP server
 * @returns {Array} Array of tool definitions
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
	
	// Return tools based on server type
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
	
	return [];
}

/**
 * Process an MCP tool call
 * @param {string} token - Authentication token
 * @param {Object} toolCall - Tool call object
 * @returns {Promise} Promise resolving to the tool call result
 */
export async function processToolCall(token, toolCall) {
	const { name, arguments: argsString } = toolCall;
	const args = typeof argsString === 'string' ? JSON.parse(argsString) : argsString;
	
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
		throw new Error('No connected MCP server available');
	}
	
	// Execute the tool call
	return await executeMCPTool(token, {
		serverId,
		tool: name,
		args
	});
}

export async function getMCPServers(token) {
	try {
		// Get from localStorage for now, until we have a backend implementation
		const servers = getMCPServersFromStorage();
		
		// If we have settings, update server status based on enabled servers
		const currentSettings = get(settings);
		if (currentSettings && currentSettings.enabledMcpServers) {
			for (let i = 0; i < servers.length; i++) {
				if (currentSettings.enabledMcpServers.includes(servers[i].id)) {
					servers[i].status = 'connected';
				}
			}
			// Save the updated status back to localStorage
			saveMCPServersToStorage(servers);
		}
		
		return servers;

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${WEBUI_API_BASE_URL}/mcp/servers`, {
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
		*/
	} catch (error) {
		console.error('Error fetching MCP servers:', error);
		throw error;
	}
}

export async function createMCPServer(token, serverData) {
	try {
		// For now, store in localStorage
		const servers = getMCPServersFromStorage();
		const newServer = { 
			id: serverData.id || crypto.randomUUID(), 
			...serverData, 
			status: 'disconnected' 
		};
		
		servers.push(newServer);
		saveMCPServersToStorage(servers);
		
		// Update the mcpServers store
		mcpServers.set(servers);
		
		return newServer;

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${WEBUI_API_BASE_URL}/mcp/servers`, {
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

		return await response.json();
		*/
	} catch (error) {
		console.error('Error creating MCP server:', error);
		throw error;
	}
}

export async function updateMCPServer(token, id, serverData) {
	try {
		// For now, store in localStorage
		const servers = getMCPServersFromStorage();
		const index = servers.findIndex(server => server.id === id);
		
		if (index !== -1) {
			// Preserve the current connection status
			const status = servers[index].status;
			servers[index] = { ...serverData, status };
			saveMCPServersToStorage(servers);
			
			// Update the mcpServers store
			mcpServers.set(servers);
		}
		
		return serverData;

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${WEBUI_API_BASE_URL}/mcp/servers/${id}`, {
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

		return await response.json();
		*/
	} catch (error) {
		console.error('Error updating MCP server:', error);
		throw error;
	}
}

export async function deleteMCPServer(token, id) {
	try {
		// For now, store in localStorage
		const servers = getMCPServersFromStorage();
		const filteredServers = servers.filter(server => server.id !== id);
		saveMCPServersToStorage(filteredServers);
		
		// Update the mcpServers store
		mcpServers.set(filteredServers);
		
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
		
		return { success: true };

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${WEBUI_API_BASE_URL}/mcp/servers/${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error(`Error: ${response.statusText}`);
		}

		return await response.json();
		*/
	} catch (error) {
		console.error('Error deleting MCP server:', error);
		throw error;
	}
}

export async function connectToMCPServer(token, id) {
	try {
		// For now, store in localStorage
		const servers = getMCPServersFromStorage();
		const index = servers.findIndex(server => server.id === id);
		
		if (index !== -1) {
			servers[index].status = 'connected';
			servers[index].lastConnected = new Date().toISOString();
			saveMCPServersToStorage(servers);
			
			// Update the mcpServers store
			mcpServers.set([...servers]);
			
			// Update settings to include this as an enabled server
			const currentSettings = get(settings);
			if (currentSettings) {
				if (!currentSettings.enabledMcpServers) {
					currentSettings.enabledMcpServers = [];
				}
				
				if (!currentSettings.enabledMcpServers.includes(id)) {
					currentSettings.enabledMcpServers.push(id);
				}
				
				// If no default server is set, set this as the default
				if (!currentSettings.defaultMcpServer) {
					currentSettings.defaultMcpServer = id;
				}
				
				// Save the updated settings
				await saveUserSettings(currentSettings);
			}
		}
		
		return { success: true, status: 'connected' };

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${WEBUI_API_BASE_URL}/mcp/servers/${id}/connect`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error(`Error: ${response.statusText}`);
		}

		return await response.json();
		*/
	} catch (error) {
		console.error('Error connecting to MCP server:', error);
		throw error;
	}
}

export async function disconnectFromMCPServer(token, id) {
	try {
		// For now, store in localStorage
		const servers = getMCPServersFromStorage();
		const index = servers.findIndex(server => server.id === id);
		
		if (index !== -1) {
			servers[index].status = 'disconnected';
			saveMCPServersToStorage(servers);
			
			// Update the mcpServers store
			mcpServers.set([...servers]);
			
			// Remove from enabled servers in settings
			const currentSettings = get(settings);
			if (currentSettings && currentSettings.enabledMcpServers) {
				currentSettings.enabledMcpServers = currentSettings.enabledMcpServers.filter(
					serverId => serverId !== id
				);
				
				// If this was the default server, update the default
				if (currentSettings.defaultMcpServer === id) {
					currentSettings.defaultMcpServer = currentSettings.enabledMcpServers.length > 0 
						? currentSettings.enabledMcpServers[0] 
						: null;
				}
				
				// Save the updated settings
				await saveUserSettings(currentSettings);
			}
		}
		
		return { success: true, status: 'disconnected' };

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${WEBUI_API_BASE_URL}/mcp/servers/${id}/disconnect`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!response.ok) {
			throw new Error(`Error: ${response.statusText}`);
		}

		return await response.json();
		*/
	} catch (error) {
		console.error('Error disconnecting from MCP server:', error);
		throw error;
	}
}
