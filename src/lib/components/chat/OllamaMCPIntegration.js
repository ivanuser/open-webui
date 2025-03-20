// Specialized integration code for Ollama models

/**
 * Enhances an Ollama request with MCP tool information
 * @param {Object} ollamaRequest - Original request parameters
 * @param {Array} mcpTools - Available MCP tools
 * @returns {Object} - Enhanced request parameters
 */
export function enhanceOllamaRequest(ollamaRequest, mcpTools) {
    if (!mcpTools || mcpTools.length === 0) {
        return ollamaRequest;
    }
    
    // Clone the request to avoid modifying the original
    const enhancedRequest = { ...ollamaRequest };
    
    // Create a tools description
    let toolsPrompt = `\n\nYou have access to the following external tools:\n\n`;
    
    mcpTools.forEach(tool => {
        toolsPrompt += `Tool: ${tool.name}\n`;
        toolsPrompt += `Description: ${tool.description}\n`;
        toolsPrompt += `Parameters: ${JSON.stringify(tool.parameters, null, 2)}\n\n`;
    });
    
    toolsPrompt += `\nWhen you need to use a tool, format your response as follows:
\`\`\`json
{
  "tool": "tool_name",
  "tool_input": {
    "param1": "value1",
    "param2": "value2"
  }
}
\`\`\`

After you receive the tool results, you should continue the conversation.
IMPORTANT: When a user asks for file operations, ALWAYS use the appropriate tool rather than making up a response.
`;

    // Add to system prompt or create one if it doesn't exist
    if (enhancedRequest.options && enhancedRequest.options.system) {
        enhancedRequest.options.system += toolsPrompt;
    } else if (enhancedRequest.options) {
        enhancedRequest.options.system = toolsPrompt;
    } else {
        enhancedRequest.options = { system: toolsPrompt };
    }
    
    return enhancedRequest;
}

/**
 * Process Ollama response to handle tool calls
 * @param {String} response - Raw model response
 * @param {Array} mcpTools - Available MCP tools
 * @param {Function} executeToolFn - Function to execute tool calls
 * @returns {Promise<Object>} - Processed response with tool results
 */
export async function processOllamaResponse(response, mcpTools, executeToolFn) {
    if (!mcpTools || mcpTools.length === 0 || !executeToolFn) {
        return { text: response, toolCalls: [] };
    }
    
    try {
        // Look for JSON blocks in the response
        const jsonBlocks = response.match(/```json\n([\s\S]*?)\n```|{[\s\S]*?}/g);
        
        if (!jsonBlocks || jsonBlocks.length === 0) {
            return { text: response, toolCalls: [] };
        }
        
        const toolCalls = [];
        let processedResponse = response;
        
        for (const block of jsonBlocks) {
            try {
                // Clean up JSON block
                let jsonStr = block;
                if (block.startsWith('```json')) {
                    jsonStr = block.replace(/```json\n|```/g, '');
                }
                
                const parsedJson = JSON.parse(jsonStr);
                
                // Check if this is a valid tool call
                if (parsedJson.tool && parsedJson.tool_input) {
                    // Execute the tool
                    const toolResult = await executeToolFn(
                        parsedJson.tool,
                        parsedJson.tool_input
                    );
                    
                    // Add to list of tool calls
                    toolCalls.push({
                        tool: parsedJson.tool,
                        toolInput: parsedJson.tool_input,
                        toolResult
                    });
                    
                    // Replace the tool call with the result in the response
                    const resultBlock = `
Tool used: ${parsedJson.tool}
Tool input: ${JSON.stringify(parsedJson.tool_input, null, 2)}
Tool result: ${JSON.stringify(toolResult, null, 2)}
`;
                    
                    processedResponse = processedResponse.replace(block, resultBlock);
                }
            } catch (error) {
                console.error('Error processing JSON block:', error);
            }
        }
        
        return {
            text: processedResponse,
            toolCalls
        };
    } catch (error) {
        console.error('Error processing Ollama response:', error);
        return { text: response, toolCalls: [] };
    }
}

export default {
    enhanceOllamaRequest,
    processOllamaResponse
};