/**
 * MCP Tool Call Processor
 * 
 * This module handles processing tool calls in AI responses, executing them,
 * and constructing follow-up messages.
 */

import { get } from 'svelte/store';
import { mcpServers, settings } from '$lib/stores';
import { executeMCPTool } from '$lib/apis/mcp/execute';

/**
 * Process tool calls in an AI response
 * @param {string} token - Authentication token
 * @param {object} response - AI response containing tool calls
 * @returns {Promise<object>} Updated response with tool call results
 */
export async function processToolCalls(token, response) {
    if (!response?.choices?.[0]?.message?.tool_calls?.length) {
        return response;
    }
    
    const message = response.choices[0].message;
    const toolCalls = message.tool_calls;
    
    // Get the default MCP server
    const currentSettings = get(settings);
    const defaultServerId = currentSettings?.defaultMcpServer;
    const servers = get(mcpServers) || [];
    
    let serverId = defaultServerId;
    
    // If no default server, use the first connected server
    if (!serverId) {
        const connectedServer = servers.find(s => s.status === 'connected');
        if (connectedServer) {
            serverId = connectedServer.id;
        }
    }
    
    if (!serverId) {
        console.error('No connected MCP server available for tool execution');
        return response;
    }
    
    // Create an array to hold tool results
    const toolResults = [];
    
    // Process each tool call
    for (const toolCall of toolCalls) {
        try {
            const toolId = toolCall.id;
            const name = toolCall.function.name;
            const argsString = toolCall.function.arguments;
            
            // Parse arguments
            const args = JSON.parse(argsString);
            
            console.log(`Executing tool ${name} with args:`, args);
            
            // Execute the tool call
            const result = await executeMCPTool(token, {
                serverId,
                tool: name,
                args
            });
            
            // Add result to tool results
            toolResults.push({
                tool_call_id: toolId,
                role: 'tool',
                name: name,
                content: typeof result === 'string' ? result : 
                         (result.result ? result.result : JSON.stringify(result))
            });
            
            console.log(`Tool ${name} execution result:`, result);
        } catch (error) {
            console.error(`Error executing tool call:`, error);
            
            // Add error result
            toolResults.push({
                tool_call_id: toolCall.id,
                role: 'tool',
                name: toolCall.function.name,
                content: `Error: ${error.message || 'Unknown error'}`
            });
        }
    }
    
    // Return the original response with tool results
    return {
        ...response,
        toolResults
    };
}

/**
 * Construct follow-up messages after tool calls
 * @param {Array} messages - Original conversation messages
 * @param {object} aiMessage - AI message containing tool calls
 * @param {Array} toolResults - Results of tool execution
 * @returns {Array} Updated conversation messages array
 */
export function constructFollowUpMessages(messages, aiMessage, toolResults) {
    // Create a copy of the messages array
    const updatedMessages = [...messages];
    
    // Add the AI message with tool calls
    updatedMessages.push({
        role: 'assistant',
        content: aiMessage.content || null,
        tool_calls: aiMessage.tool_calls
    });
    
    // Add each tool result as a separate message
    for (const result of toolResults) {
        updatedMessages.push(result);
    }
    
    return updatedMessages;
}
