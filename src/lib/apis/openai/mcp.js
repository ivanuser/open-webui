/**
 * OpenAI API MCP integration functionality
 */

/**
 * Prepare MCP tool definitions for OpenAI-compatible models
 * @param {Array} tools - Tool definitions
 * @returns {Object} - Formatted tools for OpenAI API
 */
export function prepareMCPToolsForRequest(tools, provider) {
    if (!tools || tools.length === 0) {
        return null;
    }
    
    // For Ollama, we need to add tool information to the system message instead
    if (provider === 'ollama') {
        return null;
    }
    
    // Standard OpenAI format for other providers
    return tools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters
        }
    }));
}

/**
 * Enhance the chat completion request with MCP tools if available
 * @param {Object} request - Original chat completion request
 * @param {Array} tools - MCP tools to add
 * @returns {Object} - Enhanced request object
 */
export function enhanceChatCompletionWithMCPTools(request, tools, provider) {
    if (!tools || tools.length === 0) {
        return request;
    }
    
    // For Ollama, tools are added to the system message by MCPHandler
    if (provider === 'ollama') {
        return request;
    }
    
    // For OpenAI compatible APIs
    const enhancedRequest = { ...request };
    enhancedRequest.tools = prepareMCPToolsForRequest(tools, provider);
    
    return enhancedRequest;
}

export default {
    prepareMCPToolsForRequest,
    enhanceChatCompletionWithMCPTools
};