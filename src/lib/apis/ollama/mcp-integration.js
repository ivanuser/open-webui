/**
 * Ollama MCP Integration
 * 
 * This module provides integration between Ollama models and MCP servers.
 */

import { getActiveMCPServer, getMCPServerTools, processToolCall } from '../mcp';

/**
 * Enhance an Ollama API request with MCP capabilities
 * @param {Object} requestData - Original request data for Ollama API
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Enhanced request data
 */
export async function enhanceOllamaRequestWithMCP(requestData, token) {
    // Check if we have an active MCP server
    const activeServer = await getActiveMCPServer();
    if (!activeServer) {
        return requestData;
    }
    
    try {
        // Get tools for the active server
        const tools = await getMCPServerTools(token, activeServer.id);
        
        if (!tools || tools.length === 0) {
            return requestData;
        }
        
        // Generate a system prompt with MCP instructions
        const mcpInstructions = generateMCPInstructions(activeServer, tools);
        
        // Start with a copy of the original request
        const enhancedRequest = { ...requestData };
        
        // Add tools to the request
        enhancedRequest.tools = tools;
        enhancedRequest.tool_choice = "auto";
        
        // Add MCP instructions to system prompt
        if (enhancedRequest.system) {
            enhancedRequest.system = `${enhancedRequest.system}\n\n${mcpInstructions}`;
        } else {
            enhancedRequest.system = mcpInstructions;
        }
        
        return enhancedRequest;
    } catch (error) {
        console.error('Error enhancing Ollama request with MCP:', error);
        return requestData;
    }
}

/**
 * Generate MCP instructions for system prompt
 * @param {Object} server - MCP server configuration
 * @param {Array} tools - Available tools
 * @returns {string} - MCP instructions
 */
function generateMCPInstructions(server, tools) {
    // Create a special prompt that works with Ollama models
    let prompt = `You have access to the following tools via the Model Context Protocol:\n\n`;
    
    tools.forEach(tool => {
        const name = tool.function?.name || '';
        const description = tool.function?.description || '';
        
        prompt += `- ${name}: ${description}\n`;
    });
    
    // Add server-specific instructions
    if (server.type === 'filesystem' || server.type === 'filesystem-py') {
        // Get the allowed directory from server args
        const allowedPath = server.args[server.args.length - 1] || '';
        const isWindows = allowedPath.includes('\\') || allowedPath.includes(':');
        
        prompt += `\nThe filesystem tools only have access to paths under: ${allowedPath}\n`;
        prompt += `Use ${isWindows ? 'backslashes' : 'forward slashes'} for paths.\n`;
    }
    
    prompt += `\nWhen you need to use a tool, respond with a JSON object in this format inside a code block:

\`\`\`json
{
  "action": "tool_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
\`\`\`

Always wrap the JSON in a code block with \`\`\`json and \`\`\` markers.
Use tools directly when they're appropriate for the task.
Wait for tool results before continuing.
`;

    return prompt;
}

/**
 * Extract tool calls from Ollama response
 * @param {string} response - Ollama response text
 * @returns {Array} - Array of tool calls, or empty array if none
 */
export function extractToolCallsFromOllama(response) {
    const toolCalls = [];
    
    // Look for JSON code blocks
    const jsonBlockPattern = /```json\s*({[\s\S]*?})\s*```/g;
    const matches = Array.from(response.matchAll(jsonBlockPattern));
    
    for (const match of matches) {
        try {
            const jsonStr = match[1];
            const data = JSON.parse(jsonStr);
            
            // Check if it's a valid tool call
            if (data.action && (data.params || data.parameters)) {
                const params = data.params || data.parameters || {};
                
                toolCalls.push({
                    name: data.action,
                    arguments: params
                });
            }
        } catch (error) {
            console.warn('Error parsing JSON from Ollama response:', error);
        }
    }
    
    return toolCalls;
}

/**
 * Process an Ollama response for tool calls
 * @param {Object} response - Ollama API response
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Processed response with tool results
 */
export async function processOllamaResponseForMCP(response, token) {
    if (!response || !response.message) {
        return response;
    }
    
    // Check if there are tool_calls in the response (newer Ollama versions)
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
        const toolResults = [];
        
        for (const toolCall of response.message.tool_calls) {
            try {
                // Execute the tool
                const result = await processToolCall(token, toolCall);
                
                // Add to results
                toolResults.push({
                    role: 'tool',
                    tool_call_id: toolCall.id || `call-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                    name: toolCall.function?.name || '',
                    content: JSON.stringify(result)
                });
            } catch (error) {
                console.error('Error processing tool call:', error);
                
                // Add error result
                toolResults.push({
                    role: 'tool',
                    tool_call_id: toolCall.id || `call-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
                    name: toolCall.function?.name || '',
                    content: `Error: ${error.message}`
                });
            }
        }
        
        // Return response with tool results
        return {
            ...response,
            toolResults
        };
    }
    
    // Check for tool calls in the message content (for older models)
    const content = response.message.content || '';
    const toolCalls = extractToolCallsFromOllama(content);
    
    if (toolCalls.length > 0) {
        const toolResults = [];
        
        for (const toolCall of toolCalls) {
            try {
                // Execute the tool
                const result = await processToolCall(token, toolCall);
                
                // Add to results
                toolResults.push({
                    role: 'tool',
                    name: toolCall.name,
                    content: JSON.stringify(result)
                });
            } catch (error) {
                console.error('Error processing tool call:', error);
                
                // Add error result
                toolResults.push({
                    role: 'tool',
                    name: toolCall.name,
                    content: `Error: ${error.message}`
                });
            }
        }
        
        // Return response with tool results
        return {
            ...response,
            toolResults
        };
    }
    
    // No tool calls, return original response
    return response;
}

/**
 * Enhance messages with tool results
 * @param {Array} messages - Original messages
 * @param {Array} toolResults - Tool results
 * @returns {Array} - Enhanced messages
 */
export function enhanceMessagesWithToolResults(messages, toolResults) {
    if (!toolResults || toolResults.length === 0) {
        return messages;
    }
    
    return [...messages, ...toolResults];
}

export default {
    enhanceOllamaRequestWithMCP,
    extractToolCallsFromOllama,
    processOllamaResponseForMCP,
    enhanceMessagesWithToolResults
};
