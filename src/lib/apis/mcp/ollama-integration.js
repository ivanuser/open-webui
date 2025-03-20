/**
 * Ollama MCP Integration
 * Handles integration between Ollama models and MCP servers
 * Based on reference implementations from dolphin-mcp, mcphost, and LibreChat
 */

/**
 * Enhance Ollama request with MCP tools
 * @param {Object} request - Ollama API request
 * @param {Array} mcpTools - MCP tools to add
 * @returns {Object} - Enhanced request
 */
export function enhanceOllamaRequestWithMCP(request, mcpTools) {
    if (!mcpTools || mcpTools.length === 0) {
        return request;
    }
    
    // Clone the request
    const enhancedRequest = { ...request };
    
    // Prepare the system prompt addition for MCP tools
    const mcpPrompt = formatToolsForOllama(mcpTools);
    
    // Add to existing system message or create new one
    if (enhancedRequest.options?.system) {
        enhancedRequest.options.system += '\n\n' + mcpPrompt;
    } else if (enhancedRequest.options) {
        enhancedRequest.options.system = mcpPrompt;
    } else {
        enhancedRequest.options = { system: mcpPrompt };
    }
    
    return enhancedRequest;
}

/**
 * Format MCP tools for Ollama system prompt
 * @param {Array} tools - MCP tools
 * @returns {String} - Formatted prompt
 */
function formatToolsForOllama(tools) {
    if (!tools || tools.length === 0) {
        return '';
    }
    
    // Starting with tool description
    let prompt = 'You have access to the following tools:\n\n';
    
    // Add each tool
    tools.forEach(tool => {
        const name = tool.function?.name || tool.name;
        const description = tool.function?.description || tool.description;
        const parameters = tool.function?.parameters || tool.parameters;
        
        prompt += `Tool: ${name}\n`;
        prompt += `Description: ${description}\n`;
        prompt += `Parameters: ${JSON.stringify(parameters, null, 2)}\n\n`;
    });
    
    // Add instructions for tool usage
    prompt += `\nTo use a tool, respond with JSON in the following format:
\`\`\`json
{
  "tool": "tool_name",
  "tool_input": {
    "param1": "value1",
    "param2": "value2"
  }
}
\`\`\`

After using a tool, I'll show you the tool's response, and then you should continue the conversation.
IMPORTANT: When a user asks you to perform an action that could be accomplished using one of these tools, USE THE TOOL instead of making up a response.
`;
    
    return prompt;
}

/**
 * Process Ollama response to extract and execute tool calls
 * @param {String} response - Raw model response
 * @param {Function} executeToolFn - Function to execute tool calls
 * @returns {Promise<Object>} - Processed response
 */
export async function processOllamaToolCalls(response, executeToolFn) {
    if (!response || !executeToolFn) {
        return { text: response, toolCalls: [] };
    }
    
    try {
        // Extract JSON objects from text
        const jsonRegex = /```json\n([\s\S]*?)\n```|({[\s\S]*?})/g;
        const matches = [];
        let match;
        
        while ((match = jsonRegex.exec(response)) !== null) {
            if (match[1]) {
                // Matched JSON inside code block
                matches.push(match[1]);
            } else if (match[2]) {
                // Matched standalone JSON
                matches.push(match[2]);
            }
        }
        
        if (matches.length === 0) {
            return { text: response, toolCalls: [] };
        }
        
        const toolCalls = [];
        let processedResponse = response;
        
        for (const jsonStr of matches) {
            try {
                const parsedJson = JSON.parse(jsonStr);
                
                // Check if this is a valid tool call
                if (parsedJson.tool && parsedJson.tool_input) {
                    // Execute the tool
                    const result = await executeToolFn(parsedJson.tool, parsedJson.tool_input);
                    
                    // Add to list of tool calls
                    toolCalls.push({
                        tool: parsedJson.tool,
                        input: parsedJson.tool_input,
                        result
                    });
                    
                    // Replace in the response
                    const formattedToolCall = JSON.stringify(parsedJson, null, 2);
                    const resultBlock = `
Tool: ${parsedJson.tool}
Input: ${JSON.stringify(parsedJson.tool_input, null, 2)}
Result: ${JSON.stringify(result, null, 2)}
`;
                    
                    // Replace both code block and standalone formats
                    processedResponse = processedResponse
                        .replace(`\`\`\`json\n${jsonStr}\n\`\`\``, resultBlock)
                        .replace(jsonStr, resultBlock);
                }
            } catch (error) {
                console.error('Error processing potential tool call:', error);
                // Continue with next match
            }
        }
        
        return {
            text: processedResponse,
            toolCalls
        };
    } catch (error) {
        console.error('Error extracting tool calls from Ollama response:', error);
        return { text: response, toolCalls: [] };
    }
}

export default {
    enhanceOllamaRequestWithMCP,
    processOllamaToolCalls
};