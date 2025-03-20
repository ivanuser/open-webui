// Enhanced MCP Handler for Ollama integration

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
    // Convert tool definitions to OpenAI format
    let toolDescription = '';
    
    tools.forEach(tool => {
        if (tool.function) {
            toolDescription += `Function: ${tool.function.name}\n`;
            toolDescription += `Description: ${tool.function.description}\n\n`;
        }
    });
    
    return toolDescription;
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
                        const { executeMCPTool } = await import('$lib/apis/mcp/execute');
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

// Utility to escape special regex characters in string
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Process MCP tool calls from OpenAI models
export async function processMCPModelResponse(token, message, serverId) {
    if (!message.tool_calls || message.tool_calls.length === 0) {
        return message;
    }
    
    try {
        // Import the tool execution function
        const { processToolCall } = await import('$lib/apis/mcp');
        
        // Process each tool call
        const toolResults = [];
        
        for (const toolCall of message.tool_calls) {
            const result = await processToolCall(token, {
                serverId,
                tool: toolCall.function.name,
                args: JSON.parse(toolCall.function.arguments)
            });
            
            toolResults.push({
                id: toolCall.id,
                type: toolCall.type,
                function: {
                    name: toolCall.function.name,
                    arguments: toolCall.function.arguments
                },
                result
            });
        }
        
        // Add the tool results to the message
        message.toolResults = toolResults;
        
        return message;
    } catch (error) {
        console.error('Error processing MCP tool calls:', error);
        return message;
    }
}

/**
 * Get MCP tools based on server type
 */
export function getMCPTools(serverType) {
    if (serverType === 'filesystem' || serverType === 'filesystem-py') {
        return [
            {
                name: "list_directory",
                description: "Lists all files and directories in the specified directory path",
                parameters: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "The absolute path to the directory"
                        }
                    },
                    required: ["path"]
                }
            },
            {
                name: "read_file",
                description: "Reads the content of a file",
                parameters: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "The absolute path to the file"
                        }
                    },
                    required: ["path"]
                }
            },
            {
                name: "write_file",
                description: "Creates a new file or overwrites an existing file",
                parameters: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string", 
                            description: "The absolute path where the file should be created or overwritten"
                        },
                        content: {
                            type: "string",
                            description: "The content to write to the file"
                        }
                    },
                    required: ["path", "content"]
                }
            },
            {
                name: "create_directory",
                description: "Creates a new directory or ensures it exists",
                parameters: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "The absolute path where the directory should be created"
                        }
                    },
                    required: ["path"]
                }
            },
            {
                name: "search_files",
                description: "Searches for files matching a pattern in a directory",
                parameters: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "The absolute path to the directory to search in"
                        },
                        pattern: {
                            type: "string",
                            description: "The search pattern (glob format)"
                        }
                    },
                    required: ["path", "pattern"]
                }
            },
            {
                name: "get_file_info",
                description: "Gets detailed information about a file or directory",
                parameters: {
                    type: "object",
                    properties: {
                        path: {
                            type: "string",
                            description: "The absolute path to the file or directory"
                        }
                    },
                    required: ["path"]
                }
            },
            {
                name: "list_allowed_directories",
                description: "Lists all directories that this server is allowed to access",
                parameters: {
                    type: "object",
                    properties: {}
                }
            }
        ];
    } else if (serverType === 'memory') {
        return [
            {
                name: "store_memory",
                description: "Stores information in the memory server",
                parameters: {
                    type: "object",
                    properties: {
                        key: {
                            type: "string",
                            description: "The key to store the information under"
                        },
                        value: {
                            type: "string",
                            description: "The information to store"
                        }
                    },
                    required: ["key", "value"]
                }
            },
            {
                name: "retrieve_memory",
                description: "Retrieves information from the memory server",
                parameters: {
                    type: "object",
                    properties: {
                        key: {
                            type: "string",
                            description: "The key to retrieve information for"
                        }
                    },
                    required: ["key"]
                }
            },
            {
                name: "search_memory",
                description: "Searches for information in the memory server",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search query"
                        }
                    },
                    required: ["query"]
                }
            }
        ];
    }
    
    return [];
}

// Exports
export default {
    prepareMCPSystemPrompt,
    processPotentialToolCalls,
    processMCPModelResponse,
    getMCPTools
};