/**
 * MCP Tools API Endpoint
 * 
 * This file handles MCP tool-related API requests.
 */

import { json } from '@sveltejs/kit';

/**
 * GET handler for listing MCP tools
 */
export async function GET({ url, fetch, request }) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return json({
                status: 'error',
                message: 'Authentication required'
            }, { status: 401 });
        }
        
        // Extract server ID from URL
        const serverId = url.searchParams.get('serverId');
        
        if (!serverId) {
            return json({
                status: 'error',
                message: 'Server ID is required'
            }, { status: 400 });
        }
        
        // Forward request to Python backend
        const response = await fetch(`/api/mcp/tools/${serverId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }
        
        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Error in MCP tools API:', error);
        return json({
            status: 'error',
            message: error.message || 'An unexpected error occurred'
        }, { status: 500 });
    }
}
