/**
 * MCP Handler - For integration with OpenAI/Ollama models
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
IMPORTANT: When asked about files or directories, USE THE TOOLS instead of making up a response.
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

/**
 * Process MCP tool calls from OpenAI models
 * @param {String} token - Auth token
 * @param {Object} message - Model response message
 * @param {String} serverId - MCP server ID
 * @returns {Promise<Object>} - Processed message
 */
export async function processMCPModelResponse(token, message, serverId) {
    if (!message.tool_calls || message.tool_calls.length === 0) {
        return message;
    }
    
    try {
        // Import the processToolCall function dynamically
        let processToolCall;
        try {
            const mcpApi = await import('$lib/apis/mcp');
            processToolCall = mcpApi.processToolCall;
        } catch (error) {
            console.error('Failed to import processToolCall:', error);
            return message;
        }
        
        // Process each tool call
        const toolResults = [];
        
        for (const toolCall of message.tool_calls) {
            try {
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
            } catch (error) {
                console.error(`Error processing tool call ${toolCall.function.name}:`, error);
            }
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
 * @param {String} serverType - MCP server type
 * @returns {Array} - Tool definitions
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
                            description: "Content to write to the file"
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

// Default export with all functions
export default {
    prepareMCPSystemPrompt,
    processToolCalls,
    processMCPModelResponse,
    getMCPTools
};