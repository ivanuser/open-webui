/**
 * MCP Tool Execution API Endpoint
 * 
 * This file handles MCP tool execution API requests.
 */

import { json } from '@sveltejs/kit';

/**
 * POST handler for executing MCP tools
 */
export async function POST({ url, fetch, request }) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return json({
                status: 'error',
                message: 'Authentication required'
            }, { status: 401 });
        }
        
        const requestData = await request.json();
        
        // Validate required fields
        if (!requestData.serverId || !requestData.tool) {
            return json({
                status: 'error',
                message: 'Server ID and tool name are required'
            }, { status: 400 });
        }
        
        // Forward request to Python backend
        const response = await fetch('/api/mcp/tools/execute', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }
        
        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Error executing MCP tool:', error);
        return json({
            status: 'error',
            message: error.message || 'An unexpected error occurred'
        }, { status: 500 });
    }
}
