/**
 * MCP Integration Handler for Chat
 * 
 * This module handles the integration of MCP tool calls with the chat interface.
 */

import { processToolCall } from '$lib/apis/mcp';
import { extractToolCallsFromOllama } from '$lib/apis/ollama/mcp-integration';
import { getMCPTools, processMCPModelResponse } from '$lib/apis/mcp/tools';

// Re-export the functions from tools.js
export { getMCPTools, processMCPModelResponse };

/**
 * Processes a model response for tool calls
 * @param {string} response - Model response text
 * @param {string} token - Authentication token
 * @returns {Promise<Object>} - Processed response with tool results
 */
export async function processModelResponse(response, token) {
    // Check if the response contains tool calls
    const toolCalls = extractToolCallsFromOllama(response);
    
    if (!toolCalls || toolCalls.length === 0) {
        return { 
            hasToolCalls: false, 
            response 
        };
    }
    
    // Process each tool call
    const toolResults = [];
    
    for (const toolCall of toolCalls) {
        try {
            // Execute the tool
            const result = await processToolCall(token, toolCall);
            
            // Format result
            const resultStr = typeof result === 'object' 
                ? JSON.stringify(result, null, 2) 
                : String(result);
            
            // Add to results
            toolResults.push({
                tool: toolCall.name,
                result: resultStr
            });
        } catch (error) {
            console.error('Error processing tool call:', error);
            
            // Add error result
            toolResults.push({
                tool: toolCall.name,
                error: error.message
            });
        }
    }
    
    return {
        hasToolCalls: true,
        response,
        toolCalls,
        toolResults
    };
}

/**
 * Format tool results for display in chat
 * @param {Array} toolResults - Tool execution results
 * @returns {string} - Formatted tool results
 */
export function formatToolResults(toolResults) {
    if (!toolResults || toolResults.length === 0) {
        return '';
    }
    
    let formattedResults = '';
    
    for (const result of toolResults) {
        formattedResults += `\n**Tool Call Result**: ${result.tool}\n\n`;
        
        if (result.error) {
            formattedResults += `**Error**: ${result.error}\n\n`;
        } else {
            formattedResults += "```\n" + result.result + "\n```\n\n";
        }
    }
    
    return formattedResults;
}

/**
 * Creates a follow-up message with tool results
 * @param {Array} toolResults - Tool execution results
 * @returns {Object} - Message object with tool results
 */
export function createToolResultMessage(toolResults) {
    return {
        role: 'system',
        content: formatToolResults(toolResults),
        isToolResult: true
    };
}

/**
 * Enhance a system prompt with MCP tool instructions
 * @param {string} systemPrompt - Original system prompt
 * @param {Array} tools - Available MCP tools
 * @returns {string} - Enhanced system prompt
 */
export function enhanceSystemPromptWithMCP(systemPrompt, tools) {
    if (!tools || tools.length === 0) {
        return systemPrompt;
    }
    
    let mcpPrompt = 'You have access to the following tools via the Model Context Protocol:\n\n';
    
    tools.forEach(tool => {
        const name = tool.function?.name || '';
        const description = tool.function?.description || '';
        
        mcpPrompt += `- ${name}: ${description}\n`;
    });
    
    mcpPrompt += `\nWhen you need to use a tool, respond with a JSON object in this format inside a code block:

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
    
    if (systemPrompt) {
        return `${systemPrompt}\n\n${mcpPrompt}`;
    }
    
    return mcpPrompt;
}

export default {
    processModelResponse,
    formatToolResults,
    createToolResultMessage,
    enhanceSystemPromptWithMCP,
    getMCPTools,
    processMCPModelResponse
};
