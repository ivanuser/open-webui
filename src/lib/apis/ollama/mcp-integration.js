/**
 * MCP integration for Ollama models
 * 
 * This module handles integration between Ollama models and MCP tools.
 */

// Regex pattern to match tool call JSON blocks
const TOOL_CALL_PATTERN = /```(?:json)?(?:\n)?\s*({[\s\S]*?})\s*```/g;

/**
 * Extract tool calls from Ollama model response
 * @param {string} text - Model response text
 * @returns {Array} - Array of extracted tool calls
 */
export function extractToolCallsFromOllama(text) {
    if (!text) return [];
    
    // Collect all json code blocks
    const jsonBlocks = [];
    let match;
    
    while ((match = TOOL_CALL_PATTERN.exec(text)) !== null) {
        try {
            const jsonStr = match[1];
            // Parse the JSON block
            const jsonObj = JSON.parse(jsonStr);
            
            // Check if this looks like a tool call
            if (jsonObj && jsonObj.action && typeof jsonObj.action === 'string') {
                // Convert to format expected by MCP handler
                jsonBlocks.push({
                    name: jsonObj.action,
                    arguments: jsonObj.params || {}
                });
            }
        } catch (error) {
            console.warn('Error parsing JSON block as tool call:', error);
        }
    }
    
    return jsonBlocks;
}

/**
 * Format MCP tool calls for Ollama system prompt
 * @param {Array} tools - MCP tools
 * @returns {string} - Formatted system prompt
 */
export function formatMCPToolsForOllama(tools) {
    if (!tools || tools.length === 0) {
        return '';
    }
    
    let systemPrompt = 'You have access to the following tools via the Model Context Protocol:\n\n';
    
    tools.forEach(tool => {
        const name = tool.function?.name || '';
        const description = tool.function?.description || '';
        const parameters = tool.function?.parameters || {};
        
        systemPrompt += `Tool: ${name}\n`;
        systemPrompt += `Description: ${description}\n`;
        
        // Add parameters if available
        if (parameters && Object.keys(parameters).length > 0) {
            systemPrompt += 'Parameters:\n';
            
            // For object parameters, list properties
            if (parameters.type === 'object' && parameters.properties) {
                Object.entries(parameters.properties).forEach(([key, prop]) => {
                    const required = parameters.required && parameters.required.includes(key) ? ' (required)' : '';
                    systemPrompt += `- ${key}: ${prop.type}${required} - ${prop.description || ''}\n`;
                });
            }
        }
        
        systemPrompt += '\n';
    });
    
    // Add instructions for using tools
    systemPrompt += `\nWhen you need to use a tool, respond with a JSON object in this format inside a code block:

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
    
    return systemPrompt;
}

/**
 * Create a tool result message
 * @param {Array} toolResults - Tool execution results
 * @returns {Object} - Tool result message object
 */
export function createOllamaToolResultMessage(toolResults) {
    if (!toolResults || toolResults.length === 0) {
        return null;
    }
    
    let content = '';
    
    for (const result of toolResults) {
        content += `\n**Tool Call Result**: ${result.tool}\n\n`;
        
        if (result.error) {
            content += `**Error**: ${result.error}\n\n`;
        } else {
            content += "```\n" + result.result + "\n```\n\n";
        }
    }
    
    return {
        role: 'assistant',
        content,
        isToolResult: true
    };
}

export default {
    extractToolCallsFromOllama,
    formatMCPToolsForOllama,
    createOllamaToolResultMessage
};
