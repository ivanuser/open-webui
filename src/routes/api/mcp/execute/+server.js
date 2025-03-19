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
export async function POST({ request, locals }) {
    const data = await request.json();
    const { serverId, tool, args } = data;
    
    // Get the user's token from locals or request headers
    const token = locals.token || request.headers.get('authorization')?.replace('Bearer ', '');
    
    console.log(`Received request to execute tool: ${tool} on server: ${serverId}`);
    console.log(`Request data:`, data);
    console.log(`Extracted token: ${token}`);
    
    try {
        if (!serverId || !tool) {
            console.error('Missing required parameters');
            return json({ error: 'Missing required parameters' }, { status: 400 });
        }
        
        // In a real implementation, fetch MCP servers from database
        // For now, use localStorage data that's stored in the API handler
        const mcpServerRegistry = global.mcpServerRegistry || {};
        const mcpServers = mcpServerRegistry[token] || [];
        
        console.log(`MCP Server Registry:`, mcpServerRegistry);
        console.log(`MCP Servers for token (${token}):`, mcpServers);
        
        if (mcpServers.length === 0) {
            // If no servers found in registry, use default hardcoded servers
            console.log("Using default MCP servers as none found in registry");
            mcpServers.push({
                id: 'filesystem-server',
                name: 'Filesystem Server',
                type: 'filesystem',
                command: 'node',
                args: ['standalone_mcp_filesystem_server.js', '/home/ihoner'],
                status: 'connected'
            });
            console.log("Default MCP Servers:", mcpServers);

        } else {
            console.log(`Found ${mcpServers.length} MCP servers in registry for token`);
        }
        
        // Find the server by ID
        const server = mcpServers.find(s => s.id === serverId);
        if (!server) {
            console.error(`MCP server ${serverId} not found`);
            return json({ error: `MCP server ${serverId} not found` }, { status: 404 });
        }
        
        console.log(`Found server:`, server);
        console.log(`Executing tool ${tool} on MCP server ${server.name} (${server.type})`);
        console.log(`Tool arguments:`, args);
        
        // Execute the tool call
        let result;
        
        if (server.type === 'filesystem') {
            // Use standalone filesystem server
            result = await executeStandaloneToolCall(server, tool, args);
        } else if (server.type === 'filesystem-py') {
            // For Python filesystem, use the Python server
            result = await executePythonToolCall(server, tool, args);
        } else if (server.type === 'memory') {
            // For memory server, implement a similar execution function
            result = await executeMemoryToolCall(server, tool, args);
        } else {
            console.error(`Unsupported MCP server type: ${server.type}`);
            return json({ error: `Unsupported MCP server type: ${server.type}` }, { status: 400 });
        }
        
        console.log(`Tool result (detailed):`, JSON.stringify(result, null, 2));
        console.log(`Tool type:`, typeof result);
        console.log(`Tool result keys:`, Object.keys(result || {}));
        return json({ result });
    } catch (error) {
        console.error('Error executing MCP tool:', error);
        return json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

/**
 * Execute a tool call with our standalone MCP server
 */
async function executeStandaloneToolCall(server, tool, args) {
    return new Promise((resolve, reject) => {
        try {
            // Find the script path relative to the project root
            const scriptPath = path.resolve(process.cwd(), 'standalone_mcp_filesystem_server.js');
            
            console.log(`Checking for MCP server script at: ${scriptPath}`);
            // Ensure the script exists
            if (!fs.existsSync(scriptPath)) {
                console.error(`MCP server script not found at ${scriptPath}`);
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
            
            console.log(`Spawning MCP server process with allowed dirs: ${allowedDirs.join(', ')}`);
            
            // Spawn the MCP server process
            const serverProcess = spawn('node', [scriptPath, ...allowedDirs], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            console.log(`MCP server process spawned with PID: ${serverProcess.pid}`);
            
            let stdout = '';
            let stderr = '';
            
            serverProcess.stdout.on('data', (data) => {
                const dataString = data.toString().trim();
                console.log(`MCP stdout: ${dataString}`);
                stdout += dataString;
            });
            
            serverProcess.stderr.on('data', (data) => {
                const dataString = data.toString().trim();
                console.error(`MCP stderr: ${dataString}`);
                stderr += dataString;
            });
            
            serverProcess.on('error', (error) => {
                console.error(`Failed to start MCP server: ${error.message}`);
                reject(new Error(`Failed to start MCP server: ${error.message}`));
            });
            
            serverProcess.on('close', (code) => {
                console.log(`MCP server process exited with code ${code}`);
                if (code !== 0) {
                    console.error(`MCP server process exited with code ${code}`);
                    console.error('stderr:', stderr);
                    reject(new Error(`MCP server error: ${stderr}`));
                    return;
                }
                
                try {
                    // Parse the response
                    console.log(`Processing MCP server output: ${stdout.trim()}`);
                    const responseLines = stdout.split('\n').filter(line => line.trim());
                    let resultText = '';
                    
                    // Add these debugging lines:
                    console.log(`Raw response lines (${responseLines.length}):`);
                    responseLines.forEach((line, index) => {
                        console.log(`[Line ${index}]: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
                        try {
                            const parsed = JSON.parse(line);
                            console.log(`[Line ${index} parsed]:`, JSON.stringify(parsed, null, 2).substring(0, 200));
                        } catch (e) {
                            console.log(`[Line ${index} parse failed]: ${e.message}`);
                        }
                    });
                    
                    for (const line of responseLines) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.result && parsed.id) {
                                // This is a response to our tool call
                                if (parsed.result.content && parsed.result.content.length > 0) {
                                    resultText = parsed.result.content[0].text;
                                    console.log(`Found result in response content: ${resultText.substring(0, 100)}...`);
                                } else {
                                    resultText = JSON.stringify(parsed.result);
                                    console.log(`Found result without content: ${resultText.substring(0, 100)}...`);
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
                        console.log(`Using raw stdout as result: ${resultText.substring(0, 100)}...`);
                    }
                    
                    console.log(`Resolved resultText: ${resultText}`);
                    resolve(resultText || `Executed ${tool} successfully but no output was returned`);
                } catch (error) {
                    console.error('Error parsing MCP server response:', error);
                    reject(new Error('Invalid response from MCP server'));
                }
            });
            
            // Write the tool call request to the server's stdin
            console.log(`Sending tool call request: ${toolCallData}`);
            serverProcess.stdin.write(toolCallData + '\n');
            serverProcess.stdin.end();
            console.log(`Tool call request sent and stdin ended.`);

        } catch (error) {
            console.error('Error in executeStandaloneToolCall:', error);
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

/**
 * Helper endpoint to register MCP servers for a token
 * This is a development feature to allow registering MCP servers without a database
 */
export async function PUT({ request }) {
    const data = await request.json();
    const { token, servers } = data;
    
    if (!token || !servers) {
        return json({ error: 'Missing token or servers' }, { status: 400 });
    }
    
    // Initialize global registry if needed
    if (!global.mcpServerRegistry) {
        global.mcpServerRegistry = {};
    }
    
    // Store servers for this token
    global.mcpServerRegistry[token] = servers;
    
    return json({ 
        success: true, 
        message: `Registered ${servers.length} MCP servers for token` 
    });
}
