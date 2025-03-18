/**
 * Ollama Chat API Integration
 * 
 * This file provides Ollama-specific handling for chat and MCP integration.
 * It ensures that the correct format is used when sending tool-enabled messages to Ollama.
 */

import { WEBUI_API_BASE_URL } from '$lib/constants';
import { adaptRequestForOllama, processOllamaToolCalls } from '$lib/apis/ollama/mcpAdapter';

/**
 * Send a chat request to Ollama API with MCP support
 * @param {string} token - Auth token
 * @param {Object} data - Request data
 * @param {string} ollamaHost - Ollama host URL (e.g. http://192.168.1.167:11434)
 * @returns {Promise<Response>} Fetch response
 */
export async function sendChatRequest(token, data, ollamaHost) {
    // Adapt the request for Ollama with MCP support
    const adaptedData = adaptRequestForOllama(data);
    
    // Make the API request
    const response = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(adaptedData)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama: ${response.status}, message='${errorText}', url='${ollamaHost}/api/chat'`);
    }
    
    return response;
}

/**
 * Process a streamed response from Ollama
 * @param {ReadableStream} stream - Response stream
 * @param {Function} onChunk - Callback for each text chunk
 * @param {Function} onToolCall - Callback for tool calls
 * @param {Function} onToolResult - Callback for tool results
 * @param {Function} onComplete - Callback on completion
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Complete response
 */
export async function processOllamaStream(stream, onChunk, onToolCall, onToolResult, onComplete, token) {
    if (!stream) {
        throw new Error('Stream is null or undefined');
    }
    
    const reader = stream.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let completeResponse = null;
    
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
                    // Parse the JSON data
                    const jsonData = JSON.parse(line);
                    
                    // Update the complete response
                    completeResponse = jsonData;
                    
                    // Call the chunk callback with the delta content
                    if (onChunk && jsonData.message?.content) {
                        onChunk(jsonData.message.content);
                    }
                    
                    // Check for tool calls
                    if (jsonData.message?.tool_calls && jsonData.message.tool_calls.length > 0) {
                        // Notify about tool calls
                        if (onToolCall) {
                            onToolCall(jsonData.message.tool_calls);
                        }
                        
                        // Process tool calls
                        try {
                            const updatedResponse = await processOllamaToolCalls(token, jsonData);
                            
                            // Notify about tool results
                            if (onToolResult && updatedResponse.toolResults) {
                                onToolResult(updatedResponse.toolResults);
                            }
                            
                            completeResponse = updatedResponse;
                        } catch (error) {
                            console.error('Error processing tool calls:', error);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing JSON from stream:', error, 'Line:', line);
                }
            }
        }
        
        // Notify that the stream is complete
        if (onComplete) {
            onComplete(completeResponse);
        }
        
        return completeResponse;
    } catch (error) {
        console.error('Error processing Ollama stream:', error);
        throw error;
    } finally {
        reader.releaseLock();
    }
}
