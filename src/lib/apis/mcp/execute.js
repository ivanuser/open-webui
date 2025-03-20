// Enhanced tool execution for MCP

/**
 * Execute a tool call through the MCP server
 * @param {Object} server - MCP server configuration
 * @param {String} toolName - Name of the tool to execute
 * @param {Object} toolInput - Input parameters for the tool
 * @returns {Promise<Object>} - Result of the tool execution
 */
export async function executeMCPTool(server, toolName, toolInput) {
    if (!server || !server.url) {
        throw new Error('MCP server not configured');
    }
    
    try {
        // Different handling for filesystem tools to ensure proper execution
        if (toolName === 'read_file' || toolName === 'write_file' || 
            toolName === 'list_directory' || toolName === 'search_files') {
            return await executeFilesystemTool(server, toolName, toolInput);
        }
        
        // Generic tool execution
        const response = await fetch(`${server.url}/tools/${toolName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(server.apiKey ? { 'Authorization': `Bearer ${server.apiKey}` } : {})
            },
            body: JSON.stringify(toolInput)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`MCP server returned error: ${response.status} ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`MCP tool execution error (${toolName}):`, error);
        return {
            error: true,
            message: `Failed to execute tool: ${error.message}`
        };
    }
}

// Alias executeTool to maintain backward compatibility
export const executeTool = executeMCPTool;

/**
 * Execute filesystem specific tools with proper path handling
 */
async function executeFilesystemTool(server, toolName, toolInput) {
    // Special handling for filesystem operations to ensure proper path resolution
    let endpoint = `${server.url}/tools/${toolName}`;
    
    // Normalize path parameter
    let normalizedInput = { ...toolInput };
    
    if (toolInput.path) {
        // Ensure path is properly formatted for the server
        normalizedInput.path = toolInput.path.replace(/\\/g, '/');
        
        // Handle relative paths
        if (!normalizedInput.path.startsWith('/')) {
            normalizedInput.path = `/${normalizedInput.path}`;
        }
    }
    
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(server.apiKey ? { 'Authorization': `Bearer ${server.apiKey}` } : {})
        },
        body: JSON.stringify(normalizedInput)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Filesystem tool error: ${errorText}`);
        return {
            error: true,
            message: `Failed to execute filesystem operation: ${response.status} ${response.statusText}`
        };
    }
    
    return await response.json();
}

// Export default object
export default {
    executeMCPTool,
    executeTool
};