import { API_HOST } from '$lib/constants';
import { config, settings } from '$lib/stores';
import { get } from 'svelte/store';

export async function getMCPServers(token) {
	try {
		// For now, return mock data since we don't have a backend implementation yet
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

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${API_HOST}/api/mcp/servers`, {
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
		// For now, just log the data since we don't have a backend implementation yet
		console.log('Creating MCP server:', serverData);
		return { id: crypto.randomUUID(), ...serverData, status: 'disconnected' };

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${API_HOST}/api/mcp/servers`, {
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
		// For now, just log the data since we don't have a backend implementation yet
		console.log('Updating MCP server:', id, serverData);
		return { id, ...serverData };

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${API_HOST}/api/mcp/servers/${id}`, {
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
		// For now, just log the data since we don't have a backend implementation yet
		console.log('Deleting MCP server:', id);
		return { success: true };

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${API_HOST}/api/mcp/servers/${id}`, {
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
		// For now, just log the data since we don't have a backend implementation yet
		console.log('Connecting to MCP server:', id);
		return { success: true, status: 'connected' };

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${API_HOST}/api/mcp/servers/${id}/connect`, {
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
		// For now, just log the data since we don't have a backend implementation yet
		console.log('Disconnecting from MCP server:', id);
		return { success: true, status: 'disconnected' };

		// Once we have a backend implementation, we can use this:
		/*
		const response = await fetch(`${API_HOST}/api/mcp/servers/${id}/disconnect`, {
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
