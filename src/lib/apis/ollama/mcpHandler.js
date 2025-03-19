/**
 * Ollama MCP Handler
 * 
 * This module provides functions for integrating MCP with Ollama API calls.
 * It handles enhancing requests with MCP tools and processing responses with tool calls.
 */

import { enhanceOllamaRequest, processOllamaMessage, enhanceMessagesWithToolResults } from '../mcp/ollamaMCPClient';
import { get } from 'svelte/store';
import { settings, mcpServers } from '$lib/stores';

/**
 * Check if MCP is enabled and should be included in requests
 * @returns {boolean} True if MCP is enabled
 */
export function isMCPEnabled() {
    const currentSettings = get(settings);
    const servers = get(mcpServers) || [];
    
    // Check if there's a default server or any connected server
    const defaultServerId = currentSettings?.defaultMcpServer;
    
    if (defaultServerId) {
        return servers.some(s => s.id === defaultServerId && s.status === 'connected');
    }
    
    // If no default, check if any server is connected
    return servers.some(s => s.status === 'connected');
}

/**
 * Send a chat request to Ollama with MCP capabilities
 * @param {Object} options - Request options
 * @param {string} options.token - Authentication token
 * @param {Object} options.body - Request body
 * @param {string} options.baseUrl - Base URL for the API
 * @param {function} options.onChunk - Callback for streaming chunks
 * @param {function} options.onToolCall - Callback for tool calls
 * @param {function} options.onToolResult - Callback for tool results
 * @param {function} options.onComplete - Callback when the request is complete
 * @returns {Promise<Object>} The response data
 */
export async function sendOllamaChatRequest(options) {
    const { token, body, baseUrl, onChunk, onToolCall, onToolResult, onComplete } = options;
    
    try {
        // Check if MCP is enabled
        if (!isMCPEnabled()) {
            // If MCP is not enabled, just forward the request as-is
            const response = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { Authorization: `Bearer ${token}` })
                },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
            }
            
            if (body.stream) {
                // Handle streaming response
                return processStreamingResponse(response, onChunk, onComplete);
            } else {
                // Handle regular response
                const data = await response.json();
                if (onComplete) onComplete(data);
                return data;
            }
        }
        
        // MCP is enabled, enhance the request
        const enhancedBody = await enhanceOllamaRequest(body);
        
        // Make the request
        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` })
            },
            body: JSON.stringify(enhancedBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
        }
        
        // Handle different response types
        if (body.stream) {
            // Process streaming response with tool calls
            return processStreamingResponseWithTools(
                response, 
                token, 
                onChunk, 
                onToolCall, 
                onToolResult, 
                onComplete
            );
        } else {
            // Process regular response with tool calls
            const data = await response.json();
            
            // Check for tool calls
            if (data.message && data.message.tool_calls && data.message.tool_calls.length > 0) {
                if (onToolCall) onToolCall(data.message.tool_calls);
                
                // Process tool calls
                const processedData = await processOllamaMessage(token, data.message);
                
                if (processedData.toolResults && onToolResult) {
                    onToolResult(processedData.toolResults);
                }
                
                // Modify the data with tool results
                const enhancedData = {
                    ...data,
                    message: processedData
                };
                
                if (onComplete) onComplete(enhancedData);
                return enhancedData;
            }
            
            // No tool calls, just return the data
            if (onComplete) onComplete(data);
            return data;
        }
    } catch (error) {
        console.error('Error in Ollama chat request:', error);
        throw error;
    }
}

/**
 * Process a regular streaming response (without tool calls)
 * @param {Response} response - Fetch response
 * @param {Function} onChunk - Callback for each chunk
 * @param {Function} onComplete - Callback when streaming is complete
 * @returns {Promise<Object>} The complete response data
 */
async function processStreamingResponse(response, onChunk, onComplete) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalData = null;
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }
            
            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process the buffer for complete JSON objects
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Save the incomplete part
            
            for (const line of lines) {
                if (!line.trim()) {
                    continue;
                }
                
                try {
                    const data = JSON.parse(line);
                    finalData = data;
                    
                    // Call the chunk callback with the content
                    if (onChunk && data.message && data.message.content) {
                        onChunk(data.message.content);
                    }
                } catch (error) {
                    console.error('Error parsing JSON from stream:', error);
                }
            }
        }
        
        // Process any remaining buffer
        if (buffer.trim()) {
            try {
                const data = JSON.parse(buffer);
                finalData = data;
                
                if (onChunk && data.message && data.message.content) {
                    onChunk(data.message.content);
                }
            } catch (error) {
                console.error('Error parsing JSON from final buffer:', error);
            }
        }
        
        // Call the complete callback
        if (onComplete) {
            onComplete(finalData);
        }
        
        return finalData;
    } catch (error) {
        console.error('Error processing Ollama stream:', error);
        throw error;
    } finally {
        reader.releaseLock();
    }
}

/**
 * Process a streaming response with potential tool calls
 * @param {Response} response - Fetch response
 * @param {string} token - Authentication token
 * @param {Function} onChunk - Callback for each content chunk
 * @param {Function} onToolCall - Callback for tool calls
 * @param {Function} onToolResult - Callback for tool results
 * @param {Function} onComplete - Callback when streaming is complete
 * @returns {Promise<Object>} The complete response data
 */
async function processStreamingResponseWithTools(
    response, 
    token, 
    onChunk, 
    onToolCall, 
    onToolResult, 
    onComplete
) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalData = null;
    
    try {
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }
            
            // Decode the chunk
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Process the buffer for complete JSON objects
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Save the incomplete part
            
            for (const line of lines) {
                if (!line.trim()) {
                    continue;
                }
                
                try {
                    const data = JSON.parse(line);
                    finalData = data;
                    
                    // Handle content chunks
                    if (onChunk && data.message && data.message.content) {
                        onChunk(data.message.content);
                    }
                    
                    // Check for tool calls in the streaming response
                    // Note: Some Ollama models might not include tool_calls in streaming mode
                    // and only include them in the final message
                    if (data.message && data.message.tool_calls && data.message.tool_calls.length > 0) {
                        if (onToolCall) {
                            onToolCall(data.message.tool_calls);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing JSON from stream:', error);
                }
            }
        }
        
        // Process any remaining buffer
        if (buffer.trim()) {
            try {
                const data = JSON.parse(buffer);
                finalData = data;
                
                if (onChunk && data.message && data.message.content) {
                    onChunk(data.message.content);
                }
                
                // Check for tool calls in the final message
                if (data.message && data.message.tool_calls && data.message.tool_calls.length > 0) {
                    if (onToolCall) {
                        onToolCall(data.message.tool_calls);
                    }
                    
                    // Process tool calls
                    const processedMessage = await processOllamaMessage(token, data.message);
                    
                    if (processedMessage.toolResults && onToolResult) {
                        onToolResult(processedMessage.toolResults);
                    }
                    
                    // Update the final data
                    finalData = {
                        ...data,
                        message: processedMessage
                    };
                }
            } catch (error) {
                console.error('Error parsing JSON from final buffer:', error);
            }
        }
        
        // Call the complete callback
        if (onComplete) {
            onComplete(finalData);
        }
        
        return finalData;
    } catch (error) {
        console.error('Error processing Ollama stream with tools:', error);
        throw error;
    } finally {
        reader.releaseLock();
    }
}

/**
 * Update conversation messages with tool results
 * @param {Array} messages - Original conversation messages
 * @param {Array} toolResults - Tool call results
 * @returns {Array} Updated conversation messages
 */
export function updateConversationWithToolResults(messages, toolResults) {
    return enhanceMessagesWithToolResults(messages, toolResults);
}
