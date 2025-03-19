import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Execute an MCP tool call
 */
export async function POST({ request }) {
    const data = await request.json();
    const { serverId, tool, args } = data;
    
    try {
        if (!serverId || !tool) {
            return json({ error: 'Missing required parameters' }, { status: 400 });
        }
        
        // Get MCP server configuration
        // In a production environment, this would come from a database
        // For now, we'll use a simple lookup based on localStorage data
        const mcpServers = [
            {
                id: 'memory-server',
                name: 'Memory Server',
                type: 'memory',
                command: 'npx',
                args: ['-y', '@modelcontextprotocol/server-memory'],
                status: 'connected'
            },
            {
                id: 'filesystem-server',
                name: 'Filesystem Server',
                type: 'filesystem',
                command: 'node',
                args: ['mcp_filesystem_server.js', '/home/ihoner'],
                status: 'connected'
            }
        ];
        
        const server = mcpServers.find(s => s.id === serverId);
        if (!server) {
            return json({ error: `MCP server ${serverId} not found` }, { status: 404 });
        }
        
        // Execute the tool call
        let result;
        
        if (server.type === 'filesystem') {
            // For filesystem, use direct execution with our existing implementation
            result = await executeToolCall(server, tool, args);
        } else if (server.type === 'filesystem-py') {
            // For Python filesystem, use the Python server
            result = await executePythonToolCall(server, tool, args);
        } else if (server.type === 'memory') {
            // For memory server, we'd implement a similar execution function
            result = await executeMemoryToolCall(server, tool, args);
        } else {
            return json({ error: `Unsupported MCP server type: ${server.type}` }, { status: 400 });
        }
        
        return json({ result });
    } catch (error) {
        console.error('Error executing MCP tool:', error);
        return json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * Execute a tool call with our JavaScript MCP server
 */
async function executeToolCall(server, tool, args) {
    return new Promise((resolve, reject) => {
        try {
            // Find the script path relative to the project root
            const scriptPath = path.resolve(process.cwd(), 'mcp_filesystem_server.js');
            
            // Ensure the script exists
            if (!fs.existsSync(scriptPath)) {
                reject(new Error(`MCP server script not found at ${scriptPath}`));
                return;
            }
            
            // Prepare the tool call request
            const toolCallData = JSON.stringify({
                jsonrpc: "2.0",
                method: "callTool",
                params: {
                    name: tool,
                    arguments: args
                },
                id: Date.now()
            });
            
            // Get the allowed directories from server config
            const allowedDirs = server.args.slice(1); // Remove the script path
            
            // Spawn the MCP server process
            const serverProcess = spawn('node', [scriptPath, ...allowedDirs], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            serverProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            serverProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            serverProcess.on('error', (error) => {
                reject(new Error(`Failed to start MCP server: ${error.message}`));
            });
            
            serverProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`MCP server process exited with code ${code}`);
                    console.error('stderr:', stderr);
                    reject(new Error(`MCP server error: ${stderr}`));
                    return;
                }
                
                try {
                    // Parse the response
                    const responseLines = stdout.split('\n').filter(line => line.trim());
                    let resultText = '';
                    
                    for (const line of responseLines) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.result && parsed.id) {
                                // This is a response to our tool call
                                if (parsed.result.content && parsed.result.content.length > 0) {
                                    resultText = parsed.result.content[0].text;
                                } else {
                                    resultText = JSON.stringify(parsed.result);
                                }
                                break;
                            }
                        } catch (e) {
                            // Not a valid JSON response, might be debugging output
                            console.log('Non-JSON output from MCP server:', line);
                        }
                    }
                    
                    // If we didn't find a valid response, use the entire output
                    if (!resultText && stdout.trim()) {
                        resultText = stdout.trim();
                    }
                    
                    resolve(resultText || `Executed ${tool} successfully but no output was returned`);
                } catch (error) {
                    console.error('Error parsing MCP server response:', error);
                    reject(new Error('Invalid response from MCP server'));
                }
            });
            
            // Write the tool call request to the server's stdin
            serverProcess.stdin.write(toolCallData + '\n');
            serverProcess.stdin.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Execute a tool call with Python MCP server
 */
async function executePythonToolCall(server, tool, args) {
    return new Promise((resolve, reject) => {
        try {
            // Find the script path relative to the project root
            const scriptPath = path.resolve(process.cwd(), 'filesystem_mcp_server.py');
            
            // Ensure the script exists
            if (!fs.existsSync(scriptPath)) {
                reject(new Error(`Python MCP server script not found at ${scriptPath}`));
                return;
            }
            
            // Prepare the tool call request
            const toolCallData = JSON.stringify({
                jsonrpc: "2.0",
                method: "callTool",
                params: {
                    name: tool,
                    arguments: args
                },
                id: Date.now()
            });
            
            // Get the allowed directories from server config
            const allowedDirs = server.args.slice(1); // Remove the script path
            
            // Spawn the Python MCP server process
            const serverProcess = spawn('python', [scriptPath, ...allowedDirs], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            
            serverProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            serverProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            serverProcess.on('error', (error) => {
                reject(new Error(`Failed to start Python MCP server: ${error.message}`));
            });
            
            serverProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Python MCP server process exited with code ${code}`);
                    console.error('stderr:', stderr);
                    reject(new Error(`Python MCP server error: ${stderr}`));
                    return;
                }
                
                try {
                    // Parse the response
                    const responseLines = stdout.split('\n').filter(line => line.trim());
                    let resultText = '';
                    
                    for (const line of responseLines) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.result && parsed.id) {
                                // This is a response to our tool call
                                if (parsed.result.content && parsed.result.content.length > 0) {
                                    resultText = parsed.result.content[0].text;
                                } else {
                                    resultText = JSON.stringify(parsed.result);
                                }
                                break;
                            }
                        } catch (e) {
                            // Not a valid JSON response, might be debugging output
                            console.log('Non-JSON output from Python MCP server:', line);
                        }
                    }
                    
                    // If we didn't find a valid response, use the entire output
                    if (!resultText && stdout.trim()) {
                        resultText = stdout.trim();
                    }
                    
                    resolve(resultText || `Executed ${tool} successfully but no output was returned`);
                } catch (error) {
                    console.error('Error parsing Python MCP server response:', error);
                    reject(new Error('Invalid response from Python MCP server'));
                }
            });
            
            // Write the tool call request to the server's stdin
            serverProcess.stdin.write(toolCallData + '\n');
            serverProcess.stdin.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Execute a tool call with memory MCP server
 */
async function executeMemoryToolCall(server, tool, args) {
    // Implement memory server tool execution
    // This would be similar to the filesystem tool execution
    return `Memory tool ${tool} executed with args: ${JSON.stringify(args)}`;
}
