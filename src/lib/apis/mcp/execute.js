/**
 * MCP Tool Execution API
 * 
 * This module handles the execution of MCP tool calls by forwarding them to the appropriate
 * MCP server and returning the results.
 */

import { WEBUI_API_BASE_URL } from '$lib/constants';
import { mcpServers } from '$lib/stores';
import { get } from 'svelte/store';

/**
 * Execute an MCP tool call
 * @param {string} token - Authentication token
 * @param {Object} params - Tool call parameters
 * @param {string} params.serverId - ID of the MCP server
 * @param {string} params.tool - Name of the tool to call
 * @param {Object} params.args - Arguments for the tool call
 * @returns {Promise} Promise resolving to the tool call result
 */
export async function executeMCPTool(token, params) {
    const { serverId, tool, args } = params;
    
    // Get the MCP server
    const allServers = get(mcpServers) || [];
    const server = allServers.find(s => s.id === serverId);
    
    if (!server) {
        throw new Error(`MCP server with ID ${serverId} not found`);
    }
    
    if (server.status !== 'connected') {
        throw new Error(`MCP server ${server.name} is not connected`);
    }

    try {
        // Call the API endpoint for MCP tool execution
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify({ serverId, tool, args })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Error executing MCP tool: ${response.statusText}`);
        }

        const result = await response.json();
        return result.result;
    } catch (error) {
        console.error('Error executing MCP tool:', error);
        throw error;
    }
}
