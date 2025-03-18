#!/usr/bin/env node
/**
 * MCP Filesystem Server
 * 
 * This script implements a Model Context Protocol (MCP) server that provides
 * tools for working with the filesystem.
 */

const fs = require('fs').promises;
const path = require('path');
const { existsSync, statSync, readdirSync } = require('fs');
const { FastMCP } = require('@modelcontextprotocol/server');

// Parse command line arguments for allowed directories
const allowedDirs = process.argv.slice(2).map(dir => path.resolve(dir));

// If no directories specified, use current directory
if (allowedDirs.length === 0) {
    allowedDirs.push(process.cwd());
}

console.log('Starting filesystem MCP server with allowed directories:', allowedDirs);

// Create MCP server
const mcp = new FastMCP('Filesystem Server');

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

// Tool: Read a file
mcp.tool('read_file', async ({ path: filePath }) => {
    if (!isPathAllowed(filePath)) {
        return `Error: Access to ${filePath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`;
    }
    
    try {
        const content = await fs.readFile(filePath, 'utf8');
        return content;
    } catch (error) {
        return `Error reading file: ${error.message}`;
    }
});

// Tool: Read multiple files
mcp.tool('read_multiple_files', async ({ paths }) => {
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
});

// Tool: Write to a file
mcp.tool('write_file', async ({ path: filePath, content }) => {
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
});

// Tool: Create a directory
mcp.tool('create_directory', async ({ path: dirPath }) => {
    if (!isPathAllowed(dirPath)) {
        return `Error: Access to ${dirPath} is not allowed. Allowed directories: ${allowedDirs.join(', ')}`;
    }
    
    try {
        await fs.mkdir(dirPath, { recursive: true });
        return `Successfully created directory at ${dirPath}`;
    } catch (error) {
        return `Error creating directory: ${error.message}`;
    }
});

// Tool: List a directory
mcp.tool('list_directory', async ({ path: dirPath }) => {
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
});

// Tool: Move a file
mcp.tool('move_file', async ({ source, destination }) => {
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
});

// Tool: Search for files
mcp.tool('search_files', async ({ path: dirPath, pattern }) => {
    // Handle parameters that might be passed as objects
    if (typeof dirPath === 'object') {
        dirPath = dirPath.path || '';
    }
    
    if (typeof pattern === 'object') {
        pattern = pattern.pattern || '';
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
            return await mcp.tools.list_directory({ path: dirPath });
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
});

// Tool: Get file information
mcp.tool('get_file_info', async ({ path: filePath }) => {
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
});

// Tool: List allowed directories
mcp.tool('list_allowed_directories', async () => {
    let result = "This MCP server has access to the following directories:\n";
    
    for (let i = 0; i < allowedDirs.length; i++) {
        result += `${i + 1}. ${allowedDirs[i]}\n`;
    }
    
    return result;
});

// Special handler for direct command-line testing
if (process.stdin.isTTY) {
    // Interactive mode for testing
    process.stdin.setEncoding('utf8');
    console.log('\nInteractive testing mode. Enter tool calls in JSON format.');
    console.log('Example: {"method":"callTool","params":{"name":"list_directory","arguments":{"path":"'+allowedDirs[0]+'"}}}');
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
            const input = JSON.parse(buffer);
            buffer = '';
            
            if (input.method === 'callTool') {
                const { name, arguments: args } = input.params;
                console.log(`\nCalling tool: ${name} with args:`, args);
                
                try {
                    // Call the tool
                    const result = await mcp.tools[name](args);
                    console.log('\nResult:');
                    console.log(result);
                } catch (error) {
                    console.error('\nError executing tool:', error);
                }
            } else {
                console.log('Unknown method. Use "callTool".');
            }
            
            console.log('\nEnter next command (or "exit" to quit):');
        } catch (error) {
            // Not a complete JSON object yet, or invalid JSON
            if (buffer.endsWith('\n')) {
                console.error('Invalid JSON. Please try again.');
                buffer = '';
                console.log('\nEnter next command (or "exit" to quit):');
            }
        }
    });
} else {
    // Start the server
    mcp.run().catch(err => {
        console.error('MCP server error:', err);
        process.exit(1);
    });
}
