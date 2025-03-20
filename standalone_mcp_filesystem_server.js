// Improved MCP filesystem server implementation

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = promisify(require('glob'));

// Configuration
const config = {
    port: process.env.MCP_SERVER_PORT || 3500,
    basePath: process.argv[2] || '/tmp', // Use command line arg or default to /tmp
    apiKey: process.env.MCP_API_KEY || '',
    debug: process.env.MCP_DEBUG === 'true' || false
};

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text());

// Authentication middleware
function authenticate(req, res, next) {
    if (!config.apiKey) {
        return next(); // No API key configured, skip authentication
    }
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    if (token !== config.apiKey) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
    
    next();
}

// Logging middleware
function logRequest(req, res, next) {
    if (config.debug) {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        if (req.body && Object.keys(req.body).length > 0) {
            console.log('Request body:', JSON.stringify(req.body, null, 2));
        }
    }
    
    // Add response logging for debug mode
    if (config.debug) {
        const originalSend = res.send;
        res.send = function(body) {
            console.log(`[${new Date().toISOString()}] Response:`, body);
            return originalSend.call(this, body);
        };
    }
    
    next();
}

// Apply middleware
app.use(logRequest);
app.use(authenticate);

// CORS preflight for all routes
app.options('*', cors());

// Add health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Server info endpoint
app.get('/info', (req, res) => {
    try {
        // Check if base path exists and is readable
        const basePath = config.basePath;
        const baseStat = fs.statSync(basePath);
        
        if (!baseStat.isDirectory()) {
            return res.status(500).json({
                error: `Base path "${basePath}" is not a directory`,
                name: 'MCP Filesystem Server',
                version: '1.0.0',
                status: 'error'
            });
        }
        
        // Return successful info response
        res.json({
            name: 'MCP Filesystem Server',
            version: '1.0.0',
            tools: ['read_file', 'write_file', 'list_directory', 'create_directory', 'search_files', 'get_file_info', 'list_allowed_directories'],
            basePath: config.basePath,
            status: 'running'
        });
    } catch (error) {
        console.error('Error in info endpoint:', error);
        res.status(500).json({
            error: `Error accessing base path: ${error.message}`,
            name: 'MCP Filesystem Server',
            version: '1.0.0',
            status: 'error'
        });
    }
});

// List available tools
app.get('/tools', (req, res) => {
    res.json([
        {
            name: 'read_file',
            description: 'Read the contents of a file from the file system',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path to the file to read'
                    }
                },
                required: ['path']
            }
        },
        {
            name: 'write_file',
            description: 'Write content to a file in the file system',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path where to write the file'
                    },
                    content: {
                        type: 'string',
                        description: 'Content to write to the file'
                    }
                },
                required: ['path', 'content']
            }
        },
        {
            name: 'list_directory',
            description: 'List contents of a directory in the file system',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path to the directory to list'
                    }
                },
                required: ['path']
            }
        },
        {
            name: 'create_directory',
            description: 'Create a new directory in the file system',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path where to create the directory'
                    }
                },
                required: ['path']
            }
        },
        {
            name: 'search_files',
            description: 'Search for files matching a pattern in a directory',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path to the directory to search in'
                    },
                    pattern: {
                        type: 'string',
                        description: 'Pattern to search for (glob pattern)'
                    }
                },
                required: ['path', 'pattern']
            }
        },
        {
            name: 'get_file_info',
            description: 'Get detailed information about a file or directory',
            parameters: {
                type: 'object',
                properties: {
                    path: {
                        type: 'string',
                        description: 'Path to the file or directory'
                    }
                },
                required: ['path']
            }
        },
        {
            name: 'list_allowed_directories',
            description: 'List all directories that this server is allowed to access',
            parameters: {
                type: 'object',
                properties: {}
            }
        }
    ]);
});

// Resolve and validate path
function resolvePath(requestedPath) {
    // Handle empty paths and root path
    if (!requestedPath || requestedPath === '/' || requestedPath === '.') {
        return config.basePath;
    }
    
    // Remove leading slash if present
    const normalizedPath = requestedPath.startsWith('/') 
        ? requestedPath.substring(1)
        : requestedPath;
    
    // Resolve full path
    const fullPath = path.resolve(config.basePath, normalizedPath);
    
    // Check path is within basePath (security check)
    if (!fullPath.startsWith(config.basePath)) {
        throw new Error('Access denied: Path outside allowed directory');
    }
    
    return fullPath;
}

// Tool implementations
app.post('/tools/read_file', async (req, res) => {
    try {
        if (!req.body || !req.body.path) {
            return res.status(400).json({ error: 'Path parameter is required' });
        }
        
        const fullPath = resolvePath(req.body.path);
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ 
                error: 'File not found',
                path: req.body.path,
                fullPath: config.debug ? fullPath : undefined
            });
        }
        
        // Check if it's a file
        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) {
            return res.status(400).json({ 
                error: 'Path is not a file',
                path: req.body.path,
                fullPath: config.debug ? fullPath : undefined
            });
        }
        
        // Read file content
        const content = await fs.promises.readFile(fullPath, 'utf8');
        
        res.json({
            path: req.body.path,
            content,
            size: stats.size,
            lastModified: stats.mtime
        });
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ 
            error: error.message,
            path: req.body.path
        });
    }
});

app.post('/tools/write_file', async (req, res) => {
    try {
        if (!req.body || !req.body.path) {
            return res.status(400).json({ error: 'Path parameter is required' });
        }
        
        if (req.body.content === undefined) {
            return res.status(400).json({ error: 'Content parameter is required' });
        }
        
        const fullPath = resolvePath(req.body.path);
        
        // Create parent directories if they don't exist
        const parentDir = path.dirname(fullPath);
        if (!fs.existsSync(parentDir)) {
            await fs.promises.mkdir(parentDir, { recursive: true });
        }
        
        // Write content to file
        await fs.promises.writeFile(fullPath, req.body.content);
        
        // Get stats of the new file
        const stats = fs.statSync(fullPath);
        
        res.json({
            path: req.body.path,
            size: stats.size,
            lastModified: stats.mtime,
            success: true
        });
    } catch (error) {
        console.error('Error writing file:', error);
        res.status(500).json({ 
            error: error.message,
            path: req.body.path
        });
    }
});

app.post('/tools/list_directory', async (req, res) => {
    try {
        if (!req.body || !req.body.path) {
            return res.status(400).json({ error: 'Path parameter is required' });
        }
        
        const fullPath = resolvePath(req.body.path);
        
        // Check if directory exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ 
                error: 'Directory not found',
                path: req.body.path,
                fullPath: config.debug ? fullPath : undefined
            });
        }
        
        // Check if it's a directory
        const stats = fs.statSync(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ 
                error: 'Path is not a directory',
                path: req.body.path,
                fullPath: config.debug ? fullPath : undefined
            });
        }
        
        // Read directory contents
        const files = await fs.promises.readdir(fullPath);
        
        // Get details for each file/directory
        const contents = await Promise.all(files.map(async (file) => {
            try {
                const filePath = path.join(fullPath, file);
                const fileStats = fs.statSync(filePath);
                
                // Format the relative path 
                let relativePath = path.join(req.body.path, file).replace(/\\/g, '/');
                if (!relativePath.startsWith('/')) {
                    relativePath = '/' + relativePath;
                }
                
                return {
                    name: file,
                    path: relativePath,
                    type: fileStats.isDirectory() ? 'directory' : 'file',
                    size: fileStats.size,
                    lastModified: fileStats.mtime
                };
            } catch (error) {
                console.error(`Error getting details for ${file}:`, error);
                return {
                    name: file,
                    path: path.join(req.body.path, file).replace(/\\/g, '/'),
                    error: error.message
                };
            }
        }));
        
        res.json({
            path: req.body.path,
            contents
        });
    } catch (error) {
        console.error('Error listing directory:', error);
        res.status(500).json({ 
            error: error.message,
            path: req.body.path
        });
    }
});

app.post('/tools/create_directory', async (req, res) => {
    try {
        if (!req.body || !req.body.path) {
            return res.status(400).json({ error: 'Path parameter is required' });
        }
        
        const fullPath = resolvePath(req.body.path);
        
        // Create directory (and parent directories if they don't exist)
        await fs.promises.mkdir(fullPath, { recursive: true });
        
        res.json({
            path: req.body.path,
            success: true
        });
    } catch (error) {
        console.error('Error creating directory:', error);
        res.status(500).json({ 
            error: error.message,
            path: req.body.path
        });
    }
});

app.post('/tools/search_files', async (req, res) => {
    try {
        if (!req.body || !req.body.path) {
            return res.status(400).json({ error: 'Path parameter is required' });
        }
        
        if (!req.body.pattern) {
            return res.status(400).json({ error: 'Pattern parameter is required' });
        }
        
        const fullPath = resolvePath(req.body.path);
        
        // Check if directory exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ 
                error: 'Directory not found',
                path: req.body.path,
                fullPath: config.debug ? fullPath : undefined
            });
        }
        
        // Check if it's a directory
        const stats = fs.statSync(fullPath);
        if (!stats.isDirectory()) {
            return res.status(400).json({ 
                error: 'Path is not a directory',
                path: req.body.path,
                fullPath: config.debug ? fullPath : undefined
            });
        }
        
        // Search for files matching pattern
        const fullPattern = path.join(fullPath, req.body.pattern);
        const matches = await glob(fullPattern);
        
        // Format results
        const results = matches.map(match => {
            try {
                const relativePath = path.relative(config.basePath, match);
                const fileStats = fs.statSync(match);
                
                // Format the relative path with leading slash
                let formattedPath = `/${relativePath}`.replace(/\\/g, '/');
                
                return {
                    name: path.basename(match),
                    path: formattedPath,
                    type: fileStats.isDirectory() ? 'directory' : 'file',
                    size: fileStats.size,
                    lastModified: fileStats.mtime
                };
            } catch (error) {
                console.error(`Error getting details for ${match}:`, error);
                return {
                    name: path.basename(match),
                    path: `/${path.relative(config.basePath, match)}`.replace(/\\/g, '/'),
                    error: error.message
                };
            }
        });
        
        res.json({
            path: req.body.path,
            pattern: req.body.pattern,
            matches: results
        });
    } catch (error) {
        console.error('Error searching files:', error);
        res.status(500).json({ 
            error: error.message,
            path: req.body.path,
            pattern: req.body.pattern
        });
    }
});

app.post('/tools/get_file_info', async (req, res) => {
    try {
        if (!req.body || !req.body.path) {
            return res.status(400).json({ error: 'Path parameter is required' });
        }
        
        const fullPath = resolvePath(req.body.path);
        
        // Check if file/directory exists
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ 
                error: 'File or directory not found',
                path: req.body.path,
                fullPath: config.debug ? fullPath : undefined
            });
        }
        
        // Get file/directory stats
        const stats = fs.statSync(fullPath);
        
        // Check permissions
        let readable = false;
        let writable = false;
        let executable = false;
        
        try {
            fs.accessSync(fullPath, fs.constants.R_OK);
            readable = true;
        } catch (e) {}
        
        try {
            fs.accessSync(fullPath, fs.constants.W_OK);
            writable = true;
        } catch (e) {}
        
        try {
            fs.accessSync(fullPath, fs.constants.X_OK);
            executable = true;
        } catch (e) {}
        
        res.json({
            path: req.body.path,
            exists: true,
            isFile: stats.isFile(),
            isDirectory: stats.isDirectory(),
            size: stats.size,
            created: stats.birthtime,
            lastModified: stats.mtime,
            lastAccessed: stats.atime,
            permissions: {
                readable,
                writable,
                executable
            }
        });
    } catch (error) {
        console.error('Error getting file info:', error);
        res.status(500).json({ 
            error: error.message,
            path: req.body.path
        });
    }
});

app.post('/tools/list_allowed_directories', (req, res) => {
    res.json({
        allowedDirectories: [config.basePath]
    });
});

// Default error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: config.debug ? err.message : 'An unexpected error occurred'
    });
});

// Handle 404 errors
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path
    });
});

// Start the server
const server = app.listen(config.port, () => {
    console.log(`MCP Filesystem Server running on port ${config.port}`);
    console.log(`Base path: ${config.basePath}`);
    console.log(`Authentication: ${config.apiKey ? 'Enabled' : 'Disabled'}`);
    console.log(`Debug mode: ${config.debug ? 'Enabled' : 'Disabled'}`);
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Shutting down MCP filesystem server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Shutting down MCP filesystem server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // Keep server running despite the error
});
