/**
 * MCP API Endpoint
 * 
 * This file serves as the main entry point for MCP-related API requests.
 */

import { json } from '@sveltejs/kit';

/**
 * GET handler for MCP API endpoints
 */
export async function GET({ url, fetch }) {
    try {
        // Return basic info about the MCP API
        return json({
            status: 'ok',
            version: '1.0.0',
            description: 'MCP API endpoints for Open WebUI'
        });
    } catch (error) {
        console.error('Error in MCP API:', error);
        return json({
            status: 'error',
            message: error.message || 'An unexpected error occurred'
        }, { status: 500 });
    }
}
