/**
 * MCP Handler - Simplified version
 * Provides core MCP integration for Open WebUI
 */

/**
 * Prepares MCP system prompt for models
 * @param {Object} activeModel - The active model
 * @param {Array} tools - Available MCP tools
 * @returns {String} - Formatted system prompt
 */
export function prepareMCPSystemPrompt(activeModel, tools = []) {
    if (!tools || tools.length === 0) {
        return '';
    }

    // Format tools for the system prompt
    let toolsPrompt = 'You have access to the following external tools:\n\n';
    
    tools.forEach(tool => {
        toolsPrompt += `Tool: ${tool.name}\n`;
        toolsPrompt += `Description: ${tool.description}\n`;
        toolsPrompt += `Parameters: ${JSON.stringify(tool.parameters, null, 2)}\n\n`;
    });
    
    // Add instructions for using tools
    toolsPrompt += `\nTo use a tool, respond with a JSON object in this format:
\`\`\`json
{
  "tool": "tool_name",
  "tool_input": {
    "param1": "value1",
    "param2": "value2"
  }
}
\`\`\`

After I show you the tool result, please continue the conversation.
IMPORTANT: When asked to perform a task that can be done with these tools, USE THE TOOLS directly instead of making up a response.
For example, when asked about files or directories, use the appropriate filesystem tools.
`;

    return toolsPrompt;
}

/**
 * Process model response to extract tool calls
 * @param {String} response - Raw model response
 * @param {Function} callback - Tool result callback
 * @returns {Object} - Processed response
 */
export function processToolCalls(response, callback) {
    if (!response) {
        return { text: response, toolCalls: [] };
    }
    
    try {
        // Extract JSON blocks
        const jsonRegex = /```json\n([\s\S]*?)\n```|({[\s\S]*?})/g;
        const matches = [];
        let match;
        
        while ((match = jsonRegex.exec(response)) !== null) {
            if (match[1]) {
                // JSON in code block
                matches.push(match[1]);
            } else if (match[2]) {
                // Standalone JSON
                matches.push(match[2]);
            }
        }
        
        if (matches.length === 0) {
            return { text: response, toolCalls: [] };
        }
        
        const toolCalls = [];
        let processedResponse = response;
        
        // Process each potential tool call
        for (const jsonStr of matches) {
            try {
                const toolCall = JSON.parse(jsonStr);
                
                // Check if this is a valid tool call
                if (toolCall.tool && toolCall.tool_input) {
                    // Add to tool calls
                    toolCalls.push({
                        tool: toolCall.tool,
                        input: toolCall.tool_input
                    });
                    
                    // Callback for handling tool execution
                    if (callback) {
                        callback(toolCalls);
                    }
                }
            } catch (error) {
                console.error('Failed to parse potential tool call:', error);
            }
        }
        
        return { text: processedResponse, toolCalls };
    } catch (error) {
        console.error('Error processing tool calls:', error);
        return { text: response, toolCalls: [] };
    }
}

// Default export
export default {
    prepareMCPSystemPrompt,
    processToolCalls
};
