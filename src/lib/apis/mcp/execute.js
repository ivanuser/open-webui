/**
 * MCP Tool Execution
 * 
 * This module handles execution of MCP tools.
 */

import { WEBUI_API_BASE_URL } from '$lib/constants';

/**
 * Execute an MCP tool
 * @param {string} token - Authentication token
 * @param {Object} params - Tool execution parameters
 * @returns {Promise<Object>} - Tool execution result
 */
export async function executeMCPTool(token, params) {
    try {
        const response = await fetch(`${WEBUI_API_BASE_URL}/api/mcp/tools/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(params)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Tool execution failed: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error executing MCP tool:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

export default {
    executeMCPTool
};
