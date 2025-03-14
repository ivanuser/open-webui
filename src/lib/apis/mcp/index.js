import { WEBUI_API_BASE_URL } from '$lib/constants';
import { config, settings } from '$lib/stores';
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
			args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/files'],
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

// Helper function to sync enabled MCP servers with settings and save to backend
const syncEnabledMCPServers = async (servers) => {
	try {
		const currentSettings = get(settings);
		if (!currentSettings) return;
		
		// Get all connected servers
		const connectedServerIds = servers
			.filter(server => server.status === 'connected')
			.map(server => server.id);
		
		// Update enabledMcpServers in settings
		if (!currentSettings.enabledMcpServers) {
			currentSettings.enabledMcpServers = [];
		}
		
		// Replace with connected servers
		currentSettings.enabledMcpServers = connectedServerIds;
		
		// Update the settings store
		settings.set({...currentSettings});
		
		// Save to backend
		if (typeof localStorage !== 'undefined' && localStorage.token) {
			await updateUserSettings(localStorage.token, { ui: currentSettings });
		}
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
		
		// Also remove from enabled servers in settings
		const currentSettings = get(settings);
		if (currentSettings && currentSettings.enabledMcpServers) {
			currentSettings.enabledMcpServers = currentSettings.enabledMcpServers.filter(
				serverId => serverId !== id
			);
			settings.set({...currentSettings});
			
			// Save to backend
			if (localStorage.token) {
				await updateUserSettings(localStorage.token, { ui: currentSettings });
			}
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
			
			// Update settings to include this as an enabled server
			const currentSettings = get(settings);
			if (currentSettings) {
				if (!currentSettings.enabledMcpServers) {
					currentSettings.enabledMcpServers = [];
				}
				
				if (!currentSettings.enabledMcpServers.includes(id)) {
					currentSettings.enabledMcpServers.push(id);
					settings.set({...currentSettings});
					
					// Save to backend
					if (localStorage.token) {
						await updateUserSettings(localStorage.token, { ui: currentSettings });
					}
				}
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
			
			// Remove from enabled servers in settings
			const currentSettings = get(settings);
			if (currentSettings && currentSettings.enabledMcpServers) {
				currentSettings.enabledMcpServers = currentSettings.enabledMcpServers.filter(
					serverId => serverId !== id
				);
				settings.set({...currentSettings});
				
				// Save to backend
				if (localStorage.token) {
					await updateUserSettings(localStorage.token, { ui: currentSettings });
				}
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
