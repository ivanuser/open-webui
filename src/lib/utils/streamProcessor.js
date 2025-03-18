/**
 * Stream Processing Utilities
 * 
 * This module provides utilities for processing streamed responses from AI models,
 * including handling of tool calls in streaming mode.
 */

import { processToolCalls } from '$lib/components/chat/MCPToolCallProcessor';

/**
 * Process a streamed response with potential tool calls
 * @param {ReadableStream} stream - Stream from the API response
 * @param {Function} onChunk - Callback for each chunk of text
 * @param {Function} onToolCall - Callback when a tool call is detected
 * @param {Function} onToolResult - Callback when a tool result is ready
 * @param {Function} onComplete - Callback when streaming is complete
 * @param {string} token - Authentication token
 * @returns {Promise<object>} The complete response object
 */
export async function processStream(
    stream,
    onChunk,
    onToolCall,
    onToolResult,
    onComplete,
    token
) {
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
            const lines = buffer.split('\n\n');
            buffer = lines.pop() || ''; // Save the incomplete part
            
            for (const line of lines) {
                if (!line.trim() || !line.startsWith('data: ')) {
                    continue;
                }
                
                try {
                    // Parse the JSON data
                    const data = line.slice(6); // Remove "data: " prefix
                    
                    if (data === '[DONE]') {
                        // Stream completed
                        continue;
                    }
                    
                    const jsonData = JSON.parse(data);
                    
                    // Check if we have the complete response
                    if (jsonData.choices && 
                        jsonData.choices[0]?.finish_reason === 'tool_calls') {
                        completeResponse = jsonData;
                        
                        // Notify about tool calls
                        if (onToolCall && jsonData.choices[0]?.message?.tool_calls) {
                            onToolCall(jsonData.choices[0].message.tool_calls);
                        }
                        
                        // Process tool calls
                        if (jsonData.choices[0]?.message?.tool_calls?.length > 0) {
                            try {
                                const updatedResponse = await processToolCalls(token, jsonData);
                                
                                // Notify about tool results
                                if (onToolResult && updatedResponse.toolResults) {
                                    onToolResult(updatedResponse.toolResults);
                                }
                                
                                completeResponse = updatedResponse;
                            } catch (error) {
                                console.error('Error processing tool calls:', error);
                            }
                        }
                    }
                    
                    // Call the chunk callback with the delta content
                    if (onChunk && jsonData.choices && jsonData.choices[0]?.delta?.content) {
                        onChunk(jsonData.choices[0].delta.content);
                    }
                } catch (error) {
                    console.error('Error parsing JSON from stream:', error, 'Line:', line);
                }
            }
        }
        
        // Process any remaining buffer
        if (buffer.trim()) {
            try {
                if (buffer.startsWith('data: ')) {
                    const data = buffer.slice(6); // Remove "data: " prefix
                    
                    if (data !== '[DONE]') {
                        const jsonData = JSON.parse(data);
                        
                        if (jsonData.choices) {
                            completeResponse = jsonData;
                            
                            // Check for tool calls in the final chunk
                            if (jsonData.choices[0]?.finish_reason === 'tool_calls' && 
                                jsonData.choices[0]?.message?.tool_calls) {
                                
                                // Notify about tool calls
                                if (onToolCall) {
                                    onToolCall(jsonData.choices[0].message.tool_calls);
                                }
                                
                                // Process tool calls
                                if (jsonData.choices[0]?.message?.tool_calls?.length > 0) {
                                    try {
                                        const updatedResponse = await processToolCalls(token, jsonData);
                                        
                                        // Notify about tool results
                                        if (onToolResult && updatedResponse.toolResults) {
                                            onToolResult(updatedResponse.toolResults);
                                        }
                                        
                                        completeResponse = updatedResponse;
                                    } catch (error) {
                                        console.error('Error processing tool calls:', error);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error parsing JSON from final buffer:', error);
            }
        }
        
        // Notify that the stream is complete
        if (onComplete) {
            onComplete(completeResponse);
        }
        
        return completeResponse;
    } catch (error) {
        console.error('Error processing stream:', error);
        throw error;
    } finally {
        reader.releaseLock();
    }
}
