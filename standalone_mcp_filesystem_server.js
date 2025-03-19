#!/usr/bin/env node
/**
 * Standalone MCP Filesystem Server
 * 
 * This is a standalone implementation of an MCP filesystem server
 * that doesn't require the @modelcontextprotocol/server library.
 * It implements the same tools as the main MCP filesystem server.
 */

import fs from 'fs/promises';
import path from 'path';
import { existsSync, statSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments for allowed directories
const allowedDirs = process.argv.slice(2).map(dir => path.resolve(dir));

// If no directories specified, use current directory
if (allowedDirs.length === 0) {
    allowedDirs.push(process.cwd());
}

console.log('Starting standalone MCP filesystem server with allowed directories:', allowedDirs);

// Helper function to check if a path is allowed
function isPathAllowed(filePath) {
    const resolvedPath = path.resolve(filePath);
    return allowedDirs.some(dir => resolvedPath === dir || resolvedPath.startsWith(dir + path.sep));
}

// Format file size for display
function formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
}

// Tool implementations
const tools = {
    // Read a file
    async read_file({ path: filePath }) {
        // Handle path parameter that might be passed as an object
        if (typeof filePath === 'object') {
            filePath = filePath.path || '';
        }
        
        if (!filePath) {
            return 'Error: No path provided';
        }
        
        if (!isPathAllowed(filePath)) {
            return `Error: Access to ${filePath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`;
        }
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return content;
        } catch (error) {
            return `Error reading file: ${error.message}`;
        }
    },
    
    // Read multiple files
    async read_multiple_files({ paths }) {
        const results = {};
        
        for (const filePath of paths) {
            if (!isPathAllowed(filePath)) {
                results[filePath] = `Error: Access to ${filePath} is not allowed`;
                continue;
            }
            
            try {
                const content = await fs.readFile(filePath, 'utf8');
                results[filePath] = content;
            } catch (error) {
                results[filePath] = `Error reading file: ${error.message}`;
            }
        }
        
        return results;
    },
    
    // Write to a file
    async write_file({ path: filePath, content }) {
        // Handle path parameter that might be passed as an object
        if (typeof filePath === 'object') {
            filePath = filePath.path || '';
            content = filePath.content || '';
        }
        
        if (!filePath) {
            return 'Error: No path provided';
        }
        
        if (!isPathAllowed(filePath)) {
            return `Error: Access to ${filePath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`;
        }
        
        try {
            // Create directory if it doesn't exist
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            
            // Write the file
            await fs.writeFile(filePath, content);
            return `Successfully wrote ${content.length} characters to ${filePath}`;
        } catch (error) {
            return `Error writing file: ${error.message}`;
        }
    },
    
    // Create a directory
    async create_directory({ path: dirPath }) {
        // Handle path parameter that might be passed as an object
        if (typeof dirPath === 'object') {
            dirPath = dirPath.path || '';
        }
        
        if (!dirPath) {
            return 'Error: No path provided';
        }
        
        if (!isPathAllowed(dirPath)) {
            return `Error: Access to ${dirPath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`;
        }
        
        try {
            await fs.mkdir(dirPath, { recursive: true });
            return `Successfully created directory at ${dirPath}`;
        } catch (error) {
            return `Error creating directory: ${error.message}`;
        }
    },
    
    // List a directory
    async list_directory({ path: dirPath }) {
        // Handle path parameter that might be passed as an object
        if (typeof dirPath === 'object') {
            dirPath = dirPath.path || '';
        }
        
        if (!dirPath) {
            // If no path provided, default to the first allowed directory
            dirPath = allowedDirs[0];
        }
        
        if (!isPathAllowed(dirPath)) {
            return `Error: Access to ${dirPath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`;
        }
        
        try {
            // Check if path exists
            try {
                await fs.access(dirPath);
            } catch (error) {
                return `Error: Path ${dirPath} does not exist`;
            }
            
            // Check if it's a directory
            const stats = await fs.stat(dirPath);
            if (!stats.isDirectory()) {
                return `Error: Path ${dirPath} is not a directory`;
            }
            
            // Read directory contents
            const items = await fs.readdir(dirPath);
            
            let result = `Directory listing for ${dirPath}:\n`;
            
            const directories = [];
            const files = [];
            
            // Process each item
            for (const item of items) {
                const itemPath = path.join(dirPath, item);
                try {
                    const itemStats = await fs.stat(itemPath);
                    
                    if (itemStats.isDirectory()) {
                        directories.push(`[DIR] ${item}`);
                    } else {
                        files.push(`[FILE] ${item} (${formatSize(itemStats.size)})`);
                    }
                } catch (error) {
                    console.error(`Error getting stats for ${itemPath}:`, error);
                    // Continue with next item if there's an error
                }
            }
            
            // Add directories to result
            if (directories.length > 0) {
                result += "\n\nDirectories:\n" + directories.sort().join("\n");
            }
            
            // Add files to result
            if (files.length > 0) {
                result += "\n\nFiles:\n" + files.sort().join("\n");
            }
            
            // Handle empty directory
            if (directories.length === 0 && files.length === 0) {
                result += "\nDirectory is empty.";
            }
            
            return result;
        } catch (error) {
            return `Error listing directory: ${error.message}`;
        }
    },
    
    // Move a file
    async move_file({ source, destination }) {
        if (!isPathAllowed(source) || !isPathAllowed(destination)) {
            return `Error: Access to source or destination is not allowed. Allowed directories: ${allowedDirs.join(', ')}`;
        }
        
        try {
            // Check if destination exists
            try {
                await fs.access(destination);
                return `Error: Destination ${destination} already exists`;
            } catch {
                // This is good, destination should not exist
            }
            
            // Create parent directory if needed
            const destDir = path.dirname(destination);
            await fs.mkdir(destDir, { recursive: true });
            
            // Move the file
            await fs.rename(source, destination);
            return `Successfully moved ${source} to ${destination}`;
        } catch (error) {
            return `Error moving file: ${error.message}`;
        }
    },
    
    // Search for files
    async search_files({ path: dirPath, pattern }) {
        // Handle parameters that might be passed as objects
        if (typeof dirPath === 'object') {
            dirPath = dirPath.path || '';
            pattern = dirPath.pattern || '';
        }
        
        if (!dirPath) {
            // If no path provided, default to the first allowed directory
            dirPath = allowedDirs[0];
        }
        
        if (!isPathAllowed(dirPath)) {
            return `Error: Access to ${dirPath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`;
        }
        
        try {
            // Check if path exists and is a directory
            try {
                const stats = await fs.stat(dirPath);
                if (!stats.isDirectory()) {
                    return `Error: Path ${dirPath} is not a directory`;
                }
            } catch (error) {
                return `Error: Path ${dirPath} does not exist`;
            }
            
            // Function to search recursively
            async function searchDir(dir, results = []) {
                let items;
                try {
                    items = await fs.readdir(dir);
                } catch (error) {
                    console.error(`Error reading directory ${dir}:`, error);
                    return results;
                }
                
                for (const item of items) {
                    const itemPath = path.join(dir, item);
                    
                    try {
                        const itemStats = await fs.stat(itemPath);
                        
                        // Check if item matches pattern (case insensitive)
                        if (pattern && item.toLowerCase().includes(pattern.toLowerCase())) {
                            results.push({
                                path: itemPath,
                                isDirectory: itemStats.isDirectory()
                            });
                        }
                        
                        // Recurse into subdirectories
                        if (itemStats.isDirectory()) {
                            await searchDir(itemPath, results);
                        }
                    } catch (error) {
                        console.error(`Error processing ${itemPath}:`, error);
                        // Continue with next item
                    }
                }
                
                return results;
            }
            
            // If no pattern provided, list everything
            if (!pattern) {
                return await tools.list_directory({ path: dirPath });
            }
            
            // Perform the search
            const matches = await searchDir(dirPath);
            
            if (matches.length === 0) {
                return `No files matching '${pattern}' found in ${dirPath}`;
            }
            
            let result = `Found ${matches.length} matches for '${pattern}' in ${dirPath}:\n`;
            
            // Sort matches by path
            matches.sort((a, b) => a.path.localeCompare(b.path));
            
            // Format results
            for (const match of matches) {
                const itemType = match.isDirectory ? "[DIR]" : "[FILE]";
                const relativePath = path.relative(dirPath, match.path);
                result += `${itemType} ${relativePath}\n`;
            }
            
            return result;
        } catch (error) {
            return `Error searching files: ${error.message}`;
        }
    },
    
    // Get file information
    async get_file_info({ path: filePath }) {
        // Handle path parameter that might be passed as an object
        if (typeof filePath === 'object') {
            filePath = filePath.path || '';
        }
        
        if (!filePath) {
            return `Error: Path parameter is required`;
        }
        
        if (!isPathAllowed(filePath)) {
            return `Error: Access to ${filePath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`;
        }
        
        try {
            // Check if path exists
            try {
                await fs.access(filePath);
            } catch (error) {
                return `Error: Path ${filePath} does not exist`;
            }
            
            // Get file stats
            const stats = await fs.stat(filePath);
            const isDir = stats.isDirectory();
            
            // Create info object
            const info = {
                'Path': filePath,
                'Type': isDir ? 'Directory' : 'File',
                'Size': isDir ? 'N/A' : formatSize(stats.size),
                'Created': formatTimestamp(stats.birthtime),
                'Modified': formatTimestamp(stats.mtime),
                'Accessed': formatTimestamp(stats.atime),
                'Permissions': stats.mode.toString(8).slice(-3)
            };
            
            // Format output
            let result = "File Information:\n";
            const maxKeyLen = Math.max(...Object.keys(info).map(key => key.length));
            
            for (const [key, value] of Object.entries(info)) {
                result += `${key.padEnd(maxKeyLen)}: ${value}\n`;
            }
            
            return result;
        } catch (error) {
            return `Error getting file info: ${error.message}`;
        }
    },
    
    // List allowed directories
    async list_allowed_directories() {
        let result = "This MCP server has access to the following directories:\n";
        
        for (let i = 0; i < allowedDirs.length; i++) {
            result += `${i + 1}. ${allowedDirs[i]}\n`;
        }
        
        return result;
    }
};

// Add tool descriptions
tools.read_file.description = 'Read the complete contents of a file from the file system';
tools.read_multiple_files.description = 'Read the contents of multiple files simultaneously';
tools.write_file.description = 'Create a new file or completely overwrite an existing file with new content';
tools.create_directory.description = 'Create a new directory or ensure a directory exists';
tools.list_directory.description = 'Get a detailed listing of all files and directories in a specified path';
tools.move_file.description = 'Move or rename files and directories';
tools.search_files.description = 'Recursively search for files and directories matching a pattern';
tools.get_file_info.description = 'Retrieve detailed metadata about a file or directory';
tools.list_allowed_directories.description = 'Returns the list of directories that this server is allowed to access';

// Process JSON-RPC requests
async function processRequest(request) {
    if (!request.method) {
        return {
            jsonrpc: "2.0",
            error: {
                code: -32600,
                message: "Invalid Request: method is required"
            },
            id: request.id || null
        };
    }
    
    if (request.method === 'listTools') {
        // List all available tools
        const toolList = Object.entries(tools).map(([name, fn]) => {
            return {
                name,
                description: fn.description || 'No description available',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            };
        });
        
        return {
            jsonrpc: "2.0",
            result: {
                tools: toolList
            },
            id: request.id
        };
    } else if (request.method === 'callTool') {
        // Call a specific tool
        const { name, arguments: args } = request.params;
        
        if (!name || !tools[name]) {
            return {
                jsonrpc: "2.0",
                error: {
                    code: -32601,
                    message: `Tool '${name}' not found`
                },
                id: request.id
            };
        }
        
        try {
            const result = await tools[name](args || {});
            
            return {
                jsonrpc: "2.0",
                result: {
                    content: [
                        {
                            type: "text",
                            text: result
                        }
                    ]
                },
                id: request.id
            };
        } catch (error) {
            return {
                jsonrpc: "2.0",
                error: {
                    code: -32603,
                    message: error.message || "Internal error"
                },
                id: request.id
            };
        }
    } else if (request.method === 'initialize') {
        // Initialize the server
        return {
            jsonrpc: "2.0",
            result: {
                server: {
                    name: "Standalone Filesystem Server",
                    version: "1.0.0"
                },
                capabilities: {
                    tools: {}
                }
            },
            id: request.id
        };
    } else {
        return {
            jsonrpc: "2.0",
            error: {
                code: -32601,
                message: `Method '${request.method}' not found`
            },
            id: request.id
        };
    }
}

// Start the server in the appropriate mode
if (process.stdin.isTTY) {
    // Interactive mode for testing
    process.stdin.setEncoding('utf8');
    console.log('\nInteractive testing mode. Enter requests in JSON-RPC format.');
    console.log('Examples:');
    console.log('  {"jsonrpc":"2.0","method":"listTools","params":{},"id":1}');
    console.log('  {"jsonrpc":"2.0","method":"callTool","params":{"name":"list_directory","arguments":{"path":"'+allowedDirs[0]+'"}},"id":2}');
    console.log('Enter "exit" to quit.\n');
    
    let buffer = '';
    
    process.stdin.on('data', async (data) => {
        buffer += data;
        
        if (buffer.trim().toLowerCase() === 'exit') {
            console.log('Exiting...');
            process.exit(0);
        }
        
        // Check if we have a complete JSON object
        try {
            const request = JSON.parse(buffer);
            buffer = '';
            
            console.log(`\nProcessing request: ${JSON.stringify(request)}`);
            
            const response = await processRequest(request);
            console.log('\nResponse:');
            console.log(JSON.stringify(response, null, 2));
            
            console.log('\nEnter next request (or "exit" to quit):');
        } catch (error) {
            // Not a complete JSON object yet, or invalid JSON
            if (buffer.endsWith('\n')) {
                console.error('Invalid JSON. Please try again.');
                buffer = '';
                console.log('\nEnter next request (or "exit" to quit):');
            }
        }
    });
} else {
    // Stdin/Stdout mode for MCP
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    
    process.stdin.on('data', async (data) => {
        buffer += data;
        
        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the incomplete line
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
                const request = JSON.parse(line);
                const response = await processRequest(request);
                console.log(JSON.stringify(response));
            } catch (error) {
                console.error(`Error processing request: ${error.message}`);
                if (line) {
                    try {
                        // Try to extract an ID for the error response
                        const parsed = JSON.parse(line);
                        console.log(JSON.stringify({
                            jsonrpc: "2.0",
                            error: {
                                code: -32700,
                                message: "Parse error: " + error.message
                            },
                            id: parsed.id || null
                        }));
                    } catch {
                        // Can't parse the request at all
                        console.log(JSON.stringify({
                            jsonrpc: "2.0",
                            error: {
                                code: -32700,
                                message: "Parse error: " + error.message
                            },
                            id: null
                        }));
                    }
                }
            }
        }
    });
    
    process.stdin.on('end', () => {
        process.exit(0);
    });
    
    // Log server info to stderr (doesn't interfere with JSON-RPC communication)
    console.error('Standalone MCP filesystem server running in stdin/stdout mode');
    console.error('Allowed directories:', allowedDirs);
}

// Optionally, start an HTTP server for browser-based access
if (process.env.HTTP_PORT) {
    const port = parseInt(process.env.HTTP_PORT, 10) || 3001;
    
    const server = createServer(async (req, res) => {
        if (req.method === 'POST') {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const request = JSON.parse(body);
                    const response = await processRequest(request);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(response));
                } catch (error) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        jsonrpc: "2.0",
                        error: {
                            code: -32700,
                            message: "Parse error: " + error.message
                        },
                        id: null
                    }));
                }
            });
        } else {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
        }
    });
    
    server.listen(port, () => {
        console.error(`HTTP server running at http://localhost:${port}/`);
    });
}
