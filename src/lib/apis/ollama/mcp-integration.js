// Ollama MCP integration helper

/**
 * Prepare a special prompt for Ollama models to use MCP tools
 * @param {Object} model - The Ollama model configuration
 * @param {Array} tools - Available MCP tools
 * @returns {Object} - Enhanced model parameters
 */
export function enhanceOllamaRequestForMCP(modelParams, tools) {
    if (!tools || tools.length === 0) {
        return modelParams;
    }
    
    // Create a special prompt that works with Ollama models
    let toolsDescription = `You have access to the following external tools:\n\n`;
    
    tools.forEach(tool => {
        toolsDescription += `Tool: ${tool.name}\n`;
        toolsDescription += `Description: ${tool.description}\n`;
        
        // Format parameters
        toolsDescription += `Parameters:\n`;
        if (tool.parameters && tool.parameters.properties) {
            Object.entries(tool.parameters.properties).forEach(([name, prop]) => {
                toolsDescription += `  - ${name}: ${prop.description || 'No description'} (${prop.type})\n`;
            });
        }
        
        toolsDescription += `\n`;
    });
    
    // Add instructions for using tools
    toolsDescription += `\nWhen you need to use a tool, respond with a JSON object in the following format:
\`\`\`json
{
  "tool": "tool_name",
  "tool_input": {
    "param1": "value1",
    "param2": "value2"
  }
}
\`\`\`

Always use the available tools when a user asks you to perform a task they can help with. Be direct and use the tools immediately when appropriate. For example, when asked about files or directories, use the appropriate filesystem tools.
`;

    // Add to system prompt if it exists
    if (modelParams.system) {
        modelParams.system = `${modelParams.system}\n\n${toolsDescription}`;
    } else {
        modelParams.system = toolsDescription;
    }
    
    return modelParams;
}

/**
 * Process Ollama response and extract tool calls
 * @param {String} response - Raw model response
 * @returns {Object} - Extracted tool calls
 */
export function extractOllamaToolCalls(response) {
    const toolCalls = [];
    
    // Look for JSON blocks
    const jsonMatches = response.match(/```json\n([\s\S]*?)\n```|{[\s\S]*?}/g);
    
    if (jsonMatches) {
        jsonMatches.forEach(match => {
            try {
                let jsonStr = match;
                
                // Remove markdown code block syntax if present
                if (jsonStr.startsWith('```json')) {
                    jsonStr = jsonStr.replace(/```json\n|```/g, '');
                }
                
                const parsedJson = JSON.parse(jsonStr);
                
                // Check if this is a valid tool call
                if (parsedJson.tool && parsedJson.tool_input) {
                    toolCalls.push({
                        tool: parsedJson.tool,
                        toolInput: parsedJson.tool_input
                    });
                }
            } catch (error) {
                // Not a valid JSON tool call
            }
        });
    }
    
    return toolCalls;
}

export default {
    enhanceOllamaRequestForMCP,
    extractOllamaToolCalls
};