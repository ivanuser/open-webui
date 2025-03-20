// Enhanced MCP Handler for Ollama integration

import { getOpenAIModelName } from '$lib/utils/models';
import { mcpTools, getActiveMCPServer } from '$lib/apis/mcp';

/**
 * Prepares MCP specific system prompt additions for Ollama models
 * @param {Object} activeModel - The currently active model
 * @param {Array} availableTools - Available MCP tools
 * @returns {String} - Formatted tool definitions for the model prompt
 */
export function prepareMCPSystemPrompt(activeModel, availableTools = []) {
    // Skip if no tools available
    if (!availableTools || availableTools.length === 0) {
        return '';
    }

    const modelName = getOpenAIModelName(activeModel);
    const isOllama = activeModel.provider === 'ollama';
    
    // Format specifically for Ollama models
    if (isOllama) {
        // Use Ollama-specific tool definition format
        let toolsDescription = `\n\nYou have access to the following tools:\n\n`;
        
        availableTools.forEach(tool => {
            toolsDescription += `Tool: ${tool.name}\n`;
            toolsDescription += `Description: ${tool.description}\n`;
            toolsDescription += `Parameters: ${JSON.stringify(tool.parameters, null, 2)}\n\n`;
        });
        
        toolsDescription += `\nTo use a tool, respond with JSON in the following format:
{
  "tool": "tool_name",
  "tool_input": {
    "param1": "value1",
    "param2": "value2"
  }
}

After using a tool, I'll show you the tool's response, and then you should continue the conversation.
Remember: when a user asks you to perform an action that could be accomplished using one of these tools, USE THE TOOL instead of making up a response.
`;
        
        return toolsDescription;
    }

    // Standard OpenAI format for other models
    return formatToolsForOpenAI(availableTools);
}

/**
 * Formats tools for OpenAI compatible models
 */
function formatToolsForOpenAI(tools) {
    // Existing implementation
}

/**
 * Processes model response to extract and execute tool calls
 * @param {String} modelResponse - Raw model response text
 * @param {Function} callback - Callback to handle tool execution results
 * @returns {Promise<Object>} - Processed response with tool execution results
 */
export async function processPotentialToolCalls(modelResponse, callback) {
    // Get active MCP server
    const mcpServer = await getActiveMCPServer();
    if (!mcpServer) {
        return { text: modelResponse, toolCalls: [] };
    }

    // For Ollama models, we need to parse potential JSON tool calls from the text
    try {
        // Extract JSON objects from text (Ollama format)
        const jsonMatches = modelResponse.match(/```json\n([\s\S]*?)\n```|{[\s\S]*?}/g);
        
        if (jsonMatches && jsonMatches.length > 0) {
            const toolCalls = [];
            
            for (const match of jsonMatches) {
                let cleanedMatch = match;
                // Remove markdown code block syntax if present
                if (match.startsWith('```json')) {
                    cleanedMatch = match.replace(/```json\n|```/g, '');
                }
                
                try {
                    const toolCall = JSON.parse(cleanedMatch);
                    
                    // Check if this is a valid tool call
                    if (toolCall.tool && toolCall.tool_input) {
                        // Execute the tool
                        const toolResult = await executeMCPTool(
                            mcpServer,
                            toolCall.tool,
                            toolCall.tool_input
                        );
                        
                        toolCalls.push({
                            toolName: toolCall.tool,
                            toolInput: toolCall.tool_input,
                            toolResult
                        });
                        
                        if (callback) {
                            callback(toolCalls);
                        }
                    }
                } catch (parseError) {
                    console.error('Error parsing potential tool call:', parseError);
                }
            }
            
            if (toolCalls.length > 0) {
                // Format the response with tool results
                let processedResponse = modelResponse;
                
                // Replace the tool calls with their results
                toolCalls.forEach(call => {
                    const toolCallJson = JSON.stringify({ 
                        tool: call.toolName, 
                        tool_input: call.toolInput 
                    }, null, 2);
                    
                    const resultBlock = `
Tool used: ${call.toolName}
Tool input: ${JSON.stringify(call.toolInput, null, 2)}
Tool result: ${JSON.stringify(call.toolResult, null, 2)}
`;
                    
                    // Replace the tool call with the result
                    processedResponse = processedResponse.replace(
                        new RegExp(escapeRegExp(toolCallJson), 'g'),
                        resultBlock
                    );
                });
                
                return { text: processedResponse, toolCalls };
            }
        }
    } catch (error) {
        console.error('Error processing tool calls:', error);
    }
    
    return { text: modelResponse, toolCalls: [] };
}

/**
 * Execute an MCP tool via the server
 */
async function executeMCPTool(server, toolName, toolInput) {
    try {
        // Import dynamically to avoid circular dependencies
        const { executeTool } = await import('$lib/apis/mcp/execute');
        return await executeTool(server, toolName, toolInput);
    } catch (error) {
        console.error(`Error executing MCP tool ${toolName}:`, error);
        return { error: `Failed to execute tool: ${error.message}` };
    }
}

// Utility to escape special regex characters in string
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Exports
export default {
    prepareMCPSystemPrompt,
    processPotentialToolCalls
};