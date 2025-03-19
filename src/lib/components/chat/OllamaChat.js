/**
 * Ollama Chat Component
 * 
 * This module integrates Ollama-specific chat handling with MCP support.
 * It provides functions to send messages to Ollama models and process responses
 * with tool call support.
 */

import { get } from 'svelte/store';
import { chatStore, settings, mcpServers } from '$lib/stores';
import { sendOllamaChatRequest, updateConversationWithToolResults } from '$lib/apis/ollama/mcpHandler';

/**
 * Send a message to Ollama
 * @param {Object} options - Chat options
 * @param {string} options.token - Authentication token
 * @param {string} options.model - Model name
 * @param {Array} options.messages - Conversation messages
 * @param {string} options.baseUrl - Base URL for Ollama API
 * @param {boolean} options.stream - Whether to use streaming
 * @param {function} options.onStart - Callback when the request starts
 * @param {function} options.onChunk - Callback for streaming chunks
 * @param {function} options.onToolCall - Callback for tool calls
 * @param {function} options.onToolResult - Callback for tool results
 * @param {function} options.onComplete - Callback when the request is complete
 * @param {function} options.onError - Callback for errors
 * @returns {Promise<Object>} The response data
 */
export async function sendOllamaMessage(options) {
    const { 
        token, 
        model, 
        messages, 
        baseUrl, 
        stream = true,
        onStart, 
        onChunk, 
        onToolCall, 
        onToolResult, 
        onComplete, 
        onError 
    } = options;
    
    // Construct the request body
    const body = {
        model,
        messages,
        stream,
        options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40
        }
    };
    
    try {
        // Call onStart callback if provided
        if (onStart) onStart();
        
        // Send the request
        return await sendOllamaChatRequest({
            token,
            body,
            baseUrl,
            onChunk,
            onToolCall,
            onToolResult,
            onComplete
        });
    } catch (error) {
        console.error('Error sending Ollama message:', error);
        if (onError) onError(error);
        throw error;
    }
}

/**
 * Format a tool call for display
 * @param {Object} toolCall - Tool call object
 * @returns {string} Formatted tool call text
 */
export function formatToolCall(toolCall) {
    const name = toolCall.function?.name || toolCall.name || 'unknown';
    let args = '';
    
    try {
        const parsedArgs = typeof toolCall.function?.arguments === 'string' 
            ? JSON.parse(toolCall.function.arguments) 
            : toolCall.function?.arguments || {};
            
        args = JSON.stringify(parsedArgs, null, 2);
    } catch (error) {
        args = toolCall.function?.arguments || '{}';
    }
    
    return `Tool Call: ${name}(${args})`;
}

/**
 * Handle an Ollama chat submission
 * @param {Object} options - Chat submission options
 * @param {string} options.chatId - Chat ID
 * @param {string} options.token - Authentication token
 * @param {string} options.message - User message
 * @param {string} options.baseUrl - Base URL for Ollama API
 * @param {function} options.updateChat - Function to update the chat store
 * @returns {Promise<void>}
 */
export async function handleOllamaChatSubmission(options) {
    const { chatId, token, message, baseUrl, updateChat } = options;
    
    try {
        // Get the current chat state
        const chat = get(chatStore)[chatId];
        if (!chat) throw new Error(`Chat ${chatId} not found`);
        
        // Get the model
        const model = chat.model || 'llama2';
        
        // Create messages array
        const messages = [
            ...chat.messages,
            { role: 'user', content: message }
        ];
        
        // Create a temporary message ID for the assistant response
        const tempMessageId = `temp-${Date.now()}`;
        
        // Add a placeholder for the assistant response
        updateChat(chatId, {
            messages: [
                ...messages,
                { role: 'assistant', content: '', id: tempMessageId }
            ],
            isGenerating: true
        });
        
        // Collected content for the final message
        let collectedContent = '';
        let toolCalls = [];
        let toolResults = [];
        
        // Send the message
        await sendOllamaMessage({
            token,
            model,
            messages,
            baseUrl,
            onChunk: (chunk) => {
                // Update the content
                collectedContent += chunk;
                
                // Update the chat store with the current content
                updateChat(chatId, {
                    messages: [
                        ...messages,
                        { role: 'assistant', content: collectedContent, id: tempMessageId }
                    ]
                });
            },
            onToolCall: (calls) => {
                // Store tool calls
                toolCalls = calls;
                
                // Add tool calls to the message
                updateChat(chatId, {
                    messages: [
                        ...messages,
                        { 
                            role: 'assistant', 
                            content: collectedContent, 
                            tool_calls: toolCalls,
                            id: tempMessageId 
                        }
                    ]
                });
            },
            onToolResult: (results) => {
                // Store tool results
                toolResults = results;
                
                // Update the message with tool results
                const updatedMessages = updateConversationWithToolResults(
                    [
                        ...messages,
                        { 
                            role: 'assistant', 
                            content: collectedContent, 
                            tool_calls: toolCalls,
                            id: tempMessageId 
                        }
                    ],
                    toolResults
                );
                
                // Update the chat store
                updateChat(chatId, {
                    messages: updatedMessages
                });
            },
            onComplete: () => {
                // Final message with the complete content and any tool calls/results
                let finalMessages;
                
                if (toolCalls.length > 0) {
                    // Include tool calls and results
                    const assistantMessage = { 
                        role: 'assistant', 
                        content: collectedContent, 
                        tool_calls: toolCalls,
                        id: tempMessageId 
                    };
                    
                    finalMessages = updateConversationWithToolResults(
                        [...messages, assistantMessage],
                        toolResults
                    );
                } else {
                    // Just the assistant message
                    finalMessages = [
                        ...messages,
                        { role: 'assistant', content: collectedContent, id: tempMessageId }
                    ];
                }
                
                // Update the chat store with the final state
                updateChat(chatId, {
                    messages: finalMessages,
                    isGenerating: false
                });
            },
            onError: (error) => {
                console.error('Error in Ollama chat:', error);
                
                // Update the chat store with the error
                updateChat(chatId, {
                    messages: [
                        ...messages,
                        { 
                            role: 'assistant', 
                            content: `Error: ${error.message || 'An error occurred'}`, 
                            id: tempMessageId,
                            isError: true
                        }
                    ],
                    isGenerating: false
                });
            }
        });
    } catch (error) {
        console.error('Error handling Ollama chat submission:', error);
        
        // Update the chat store with the error
        updateChat(chatId, {
            messages: [
                ...get(chatStore)[chatId].messages,
                { 
                    role: 'assistant', 
                    content: `Error: ${error.message || 'An error occurred while generating a response'}`,
                    isError: true
                }
            ],
            isGenerating: false
        });
    }
}
