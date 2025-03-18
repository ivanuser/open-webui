import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Execute an MCP tool call by spawning the appropriate MCP server and sending a request
 */
export async function POST({ request }) {
    const data = await request.json();
    const { serverId, tool, args } = data;
    
    try {
        if (!serverId || !tool) {
            return json({ error: 'Missing required parameters' }, { status: 400 });
        }
        
        // For now, we'll retrieve MCP servers from this hardcoded array
        // In production, this should come from a database or configuration
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
            // For filesystem, we'll use the mcp_filesystem_server.js directly
            result = await executeFilesystemTool(server, tool, args);
        } else if (server.type === 'memory') {
            // For memory server, we would use the memory server
            result = await executeMemoryTool(server, tool, args);
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
 * Execute a filesystem tool by directly using the filesystem
 * This is a more direct approach than spawning a separate process
 */
async function executeFilesystemTool(server, tool, args) {
    // Get the allowed directory from server config
    const allowedDirs = server.args.slice(1); // Remove the script path
    const fs = await import('fs/promises');
    
    // Validate that the path is within allowed directories
    function isPathAllowed(filePath) {
        return allowedDirs.some(dir => {
            const normalizedDir = path.normalize(dir);
            const normalizedPath = path.normalize(filePath);
            return normalizedPath === normalizedDir || normalizedPath.startsWith(normalizedDir + path.sep);
        });
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
    
    // Handle different filesystem tools
    switch (tool) {
        case 'read_file': {
            const { path: filePath } = args;
            
            if (!isPathAllowed(filePath)) {
                return { 
                    status: 'error',
                    result: `Error: Access to ${filePath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`
                };
            }
            
            try {
                const content = await fs.readFile(filePath, 'utf8');
                return { 
                    status: 'success',
                    result: content
                };
            } catch (error) {
                return { 
                    status: 'error',
                    result: `Error reading file: ${error.message}`
                };
            }
        }
        
        case 'list_directory': {
            const { path: dirPath } = args;
            
            if (!isPathAllowed(dirPath)) {
                return { 
                    status: 'error',
                    result: `Error: Access to ${dirPath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`
                };
            }
            
            try {
                // Check if path exists
                try {
                    await fs.access(dirPath);
                } catch (error) {
                    return { 
                        status: 'error',
                        result: `Error: Path ${dirPath} does not exist`
                    };
                }
                
                // Check if it's a directory
                const stats = await fs.stat(dirPath);
                if (!stats.isDirectory()) {
                    return { 
                        status: 'error',
                        result: `Error: Path ${dirPath} is not a directory`
                    };
                }
                
                // Read directory contents
                const items = await fs.readdir(dirPath);
                
                let result = `Directory listing for ${dirPath}:\n`;
                
                const directories = [];
                const files = [];
                
                // Process each item
                for (const item of items) {
                    const itemPath = path.join(dirPath, item);
                    const itemStats = await fs.stat(itemPath);
                    
                    if (itemStats.isDirectory()) {
                        directories.push(`[DIR] ${item}`);
                    } else {
                        files.push(`[FILE] ${item} (${formatSize(itemStats.size)})`);
                    }
                }
                
                // Add directories to result
                if (directories.length > 0) {
                    result += "\nDirectories:\n" + directories.sort().join("\n");
                }
                
                // Add files to result
                if (files.length > 0) {
                    result += "\n\nFiles:\n" + files.sort().join("\n");
                }
                
                // Handle empty directory
                if (directories.length === 0 && files.length === 0) {
                    result += "\nDirectory is empty.";
                }
                
                return { 
                    status: 'success',
                    result: result
                };
            } catch (error) {
                return { 
                    status: 'error',
                    result: `Error listing directory: ${error.message}`
                };
            }
        }
        
        case 'write_file': {
            const { path: filePath, content } = args;
            
            if (!isPathAllowed(filePath)) {
                return { 
                    status: 'error',
                    result: `Error: Access to ${filePath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`
                };
            }
            
            try {
                // Create directory if it doesn't exist
                const dir = path.dirname(filePath);
                await fs.mkdir(dir, { recursive: true });
                
                // Write the file
                await fs.writeFile(filePath, content);
                
                return { 
                    status: 'success',
                    result: `Successfully wrote ${content.length} characters to ${filePath}`
                };
            } catch (error) {
                return { 
                    status: 'error',
                    result: `Error writing file: ${error.message}`
                };
            }
        }
        
        case 'create_directory': {
            const { path: dirPath } = args;
            
            if (!isPathAllowed(dirPath)) {
                return { 
                    status: 'error',
                    result: `Error: Access to ${dirPath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`
                };
            }
            
            try {
                await fs.mkdir(dirPath, { recursive: true });
                
                return { 
                    status: 'success',
                    result: `Successfully created directory at ${dirPath}`
                };
            } catch (error) {
                return { 
                    status: 'error',
                    result: `Error creating directory: ${error.message}`
                };
            }
        }
        
        case 'search_files': {
            const { path: dirPath, pattern } = args;
            
            if (!isPathAllowed(dirPath)) {
                return { 
                    status: 'error',
                    result: `Error: Access to ${dirPath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`
                };
            }
            
            try {
                // Check if path exists and is a directory
                try {
                    const stats = await fs.stat(dirPath);
                    if (!stats.isDirectory()) {
                        return { 
                            status: 'error',
                            result: `Error: Path ${dirPath} is not a directory`
                        };
                    }
                } catch (error) {
                    return { 
                        status: 'error',
                        result: `Error: Path ${dirPath} does not exist`
                    };
                }
                
                // Function to search recursively
                async function searchDir(dir, results = []) {
                    const items = await fs.readdir(dir);
                    
                    for (const item of items) {
                        const itemPath = path.join(dir, item);
                        const itemStats = await fs.stat(itemPath);
                        
                        // Check if item matches pattern (case insensitive)
                        if (item.toLowerCase().includes(pattern.toLowerCase())) {
                            results.push({
                                path: itemPath,
                                isDirectory: itemStats.isDirectory()
                            });
                        }
                        
                        // Recurse into subdirectories
                        if (itemStats.isDirectory()) {
                            await searchDir(itemPath, results);
                        }
                    }
                    
                    return results;
                }
                
                // Perform the search
                const matches = await searchDir(dirPath);
                
                if (matches.length === 0) {
                    return { 
                        status: 'success',
                        result: `No files matching '${pattern}' found in ${dirPath}`
                    };
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
                
                return { 
                    status: 'success',
                    result: result
                };
            } catch (error) {
                return { 
                    status: 'error',
                    result: `Error searching files: ${error.message}`
                };
            }
        }
        
        case 'get_file_info': {
            const { path: filePath } = args;
            
            if (!isPathAllowed(filePath)) {
                return { 
                    status: 'error',
                    result: `Error: Access to ${filePath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`
                };
            }
            
            try {
                // Check if path exists
                try {
                    await fs.access(filePath);
                } catch (error) {
                    return { 
                        status: 'error',
                        result: `Error: Path ${filePath} does not exist`
                    };
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
                
                return { 
                    status: 'success',
                    result: result
                };
            } catch (error) {
                return { 
                    status: 'error',
                    result: `Error getting file info: ${error.message}`
                };
            }
        }
        
        case 'list_allowed_directories': {
            let result = "This MCP server has access to the following directories:\n";
            
            for (let i = 0; i < allowedDirs.length; i++) {
                result += `${i + 1}. ${allowedDirs[i]}\n`;
            }
            
            return { 
                status: 'success',
                result: result
            };
        }
        
        default:
            return { 
                status: 'error',
                result: `Unknown tool: ${tool}`
            };
    }
}

/**
 * Execute a memory tool
 */
async function executeMemoryTool(server, tool, args) {
    // Implement memory tool execution
    // This is a placeholder implementation
    return { 
        status: 'success',
        result: `Memory tool execution (${tool}) with args: ${JSON.stringify(args)}`
    };
}
