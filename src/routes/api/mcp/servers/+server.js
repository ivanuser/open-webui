/**
 * MCP Servers API Endpoint
 * 
 * This file handles MCP server management API requests.
 */

import { json } from '@sveltejs/kit';

/**
 * GET handler for listing MCP servers
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
        
        // Forward request to Python backend
        const response = await fetch('/api/mcp/servers', {
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
        console.error('Error in MCP servers API:', error);
        return json({
            status: 'error',
            message: error.message || 'An unexpected error occurred'
        }, { status: 500 });
    }
}

/**
 * POST handler for creating MCP servers
 */
export async function POST({ request }) {
    try {
        const token = request.headers.get('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return json({
                status: 'error',
                message: 'Authentication required'
            }, { status: 401 });
        }
        
        const serverData = await request.json();
        
        // Forward request to Python backend
        const response = await fetch('/api/mcp/servers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(serverData)
        });
        
        if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
        }
        
        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Error creating MCP server:', error);
        return json({
            status: 'error',
            message: error.message || 'An unexpected error occurred'
        }, { status: 500 });
    }
}
