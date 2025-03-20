/**
 * MCP Server Process Manager
 * Handles starting, stopping, and monitoring MCP server processes
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execPromise = promisify(exec);

// Map of running MCP server processes
const runningProcesses = new Map();

/**
 * Start an MCP server process
 * @param {Object} serverConfig - Server configuration
 * @returns {Promise<Object>} - Process information
 */
export async function startMCPServer(serverConfig) {
    const { id, command, args, env } = serverConfig;
    
    // Check if server is already running
    if (runningProcesses.has(id)) {
        return {
            success: true,
            message: 'Server already running',
            process: runningProcesses.get(id)
        };
    }
    
    // Determine server URL
    const port = extractPortFromArgs(args);
    const serverUrl = `http://localhost:${port}`;
    
    try {
        // Start the process
        const process = spawn(command, args, {
            env: { ...process.env, ...env },
            shell: true
        });
        
        // Store process information
        const processInfo = {
            id,
            pid: process.pid,
            url: serverUrl,
            config: serverConfig,
            startTime: new Date(),
            status: 'starting'
        };
        
        runningProcesses.set(id, processInfo);
        
        // Set up event handlers
        process.stdout.on('data', (data) => {
            console.log(`[MCP ${id}] ${data.toString().trim()}`);
        });
        
        process.stderr.on('data', (data) => {
            console.error(`[MCP ${id}] Error: ${data.toString().trim()}`);
        });
        
        process.on('close', (code) => {
            console.log(`[MCP ${id}] Process exited with code ${code}`);
            runningProcesses.delete(id);
        });
        
        // Wait for server to become available
        let retries = 30; // 30 attempts (15 seconds total)
        while (retries > 0) {
            try {
                const response = await fetch(serverUrl + '/health');
                if (response.ok) {
                    processInfo.status = 'running';
                    break;
                }
            } catch (err) {
                // Server not ready yet
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
            retries--;
        }
        
        // Update process info based on final status
        if (processInfo.status === 'running') {
            return {
                success: true,
                message: 'Server started successfully',
                process: processInfo
            };
        } else {
            // Server failed to start
            process.kill();
            runningProcesses.delete(id);
            
            return {
                success: false,
                message: 'Server failed to start within the expected time'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: `Failed to start server: ${error.message}`
        };
    }
}

/**
 * Stop an MCP server process
 * @param {String} serverId - Server ID
 * @returns {Promise<Object>} - Result of stopping the server
 */
export async function stopMCPServer(serverId) {
    // Check if server is running
    if (!runningProcesses.has(serverId)) {
        return {
            success: false,
            message: 'Server not running'
        };
    }
    
    const processInfo = runningProcesses.get(serverId);
    const { pid } = processInfo;
    
    try {
        // Kill the process
        if (process.platform === 'win32') {
            await execPromise(`taskkill /PID ${pid} /F /T`);
        } else {
            process.kill(pid);
        }
        
        // Remove from running processes
        runningProcesses.delete(serverId);
        
        return {
            success: true,
            message: 'Server stopped successfully'
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to stop server: ${error.message}`
        };
    }
}

/**
 * Check if an MCP server is running
 * @param {String} serverId - Server ID
 * @returns {Promise<Object>} - Server status
 */
export async function checkMCPServerStatus(serverId) {
    // Check if server is in our running processes map
    if (!runningProcesses.has(serverId)) {
        return {
            running: false,
            message: 'Server not started by this process manager'
        };
    }
    
    const processInfo = runningProcesses.get(serverId);
    const { url } = processInfo;
    
    try {
        // Check if server is responsive
        const response = await fetch(url + '/health');
        if (response.ok) {
            return {
                running: true,
                message: 'Server is running and responsive',
                process: processInfo
            };
        } else {
            return {
                running: false,
                message: `Server returned unexpected status: ${response.status}`,
                process: processInfo
            };
        }
    } catch (error) {
        return {
            running: false,
            message: `Failed to connect to server: ${error.message}`,
            process: processInfo
        };
    }
}

/**
 * Get all running MCP servers
 * @returns {Array} - List of running server processes
 */
export function getRunningMCPServers() {
    return Array.from(runningProcesses.values());
}

/**
 * Clean up all running MCP servers
 * @returns {Promise<void>}
 */
export async function cleanupAllServers() {
    const serverIds = Array.from(runningProcesses.keys());
    
    for (const serverId of serverIds) {
        await stopMCPServer(serverId);
    }
    
    console.log('All MCP servers have been stopped');
}

/**
 * Extract port from args array
 * @param {Array} args - Command arguments
 * @returns {Number} - Port number
 */
function extractPortFromArgs(args) {
    const portIndex = args.indexOf('--port');
    if (portIndex !== -1 && portIndex < args.length - 1) {
        const port = parseInt(args[portIndex + 1], 10);
        if (!isNaN(port)) {
            return port;
        }
    }
    
    // Default port if not specified
    return 3500;
}

// Register cleanup handlers
process.on('SIGINT', cleanupAllServers);
process.on('SIGTERM', cleanupAllServers);
process.on('exit', cleanupAllServers);

export default {
    startMCPServer,
    stopMCPServer,
    checkMCPServerStatus,
    getRunningMCPServers,
    cleanupAllServers
};