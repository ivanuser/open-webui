import { WEBUI_API_BASE_URL } from '$lib/constants';
import { config, settings, mcpServers } from '$lib/stores';
import { get } from 'svelte/store';
import { updateUserSettings } from '$lib/apis/users';

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
			command: 'npx',
			args: ['-y', '@modelcontextprotocol/server-filesystem', '/home/ihoner'],
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
