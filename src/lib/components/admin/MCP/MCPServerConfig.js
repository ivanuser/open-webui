/**
 * MCP Server Configuration Manager
 * This module handles MCP server configuration and process management
 */

// Define standard MCP server types and configs
export const standardMCPServers = {
    filesystem: {
        name: "Filesystem",
        description: "Access files on the local filesystem",
        package: "@modelcontextprotocol/server-filesystem",
        defaultCommand: "npx",
        defaultArgs: ["-y", "@modelcontextprotocol/server-filesystem"],
        configFields: [
            {
                name: "basePath",
                label: "Base Directory Path",
                description: "The directory path to provide access to",
                type: "text",
                required: true,
                default: "/tmp"
            },
            {
                name: "port",
                label: "Port",
                description: "Port to run the server on",
                type: "number",
                required: false,
                default: 3500
            }
        ]
    },
    memory: {
        name: "Memory",
        description: "Knowledge graph-based persistent memory system",
        package: "@modelcontextprotocol/server-memory",
        defaultCommand: "npx",
        defaultArgs: ["-y", "@modelcontextprotocol/server-memory"],
        configFields: [
            {
                name: "port",
                label: "Port",
                description: "Port to run the server on",
                type: "number",
                required: false,
                default: 3501
            }
        ]
    },
    github: {
        name: "GitHub",
        description: "Access GitHub repositories and perform actions",
        package: "@modelcontextprotocol/server-github",
        defaultCommand: "npx",
        defaultArgs: ["-y", "@modelcontextprotocol/server-github"],
        configFields: [
            {
                name: "GITHUB_PERSONAL_ACCESS_TOKEN",
                label: "GitHub Personal Access Token",
                description: "Personal access token for GitHub API access",
                type: "password",
                required: true,
                isEnv: true
            },
            {
                name: "port",
                label: "Port",
                description: "Port to run the server on",
                type: "number",
                required: false,
                default: 3502
            }
        ]
    }
};

/**
 * Generates full configuration for an MCP server
 * @param {Object} serverConfig - Basic server configuration
 * @returns {Object} - Complete server configuration with defaults filled in
 */
export function generateMCPServerConfig(serverConfig) {
    const { type } = serverConfig;
    const standardConfig = standardMCPServers[type];
    
    if (!standardConfig) {
        throw new Error(`Unknown MCP server type: ${type}`);
    }
    
    // Start with standard defaults
    const defaultConfig = {
        command: standardConfig.defaultCommand,
        args: [...standardConfig.defaultArgs],
        env: {}
    };
    
    // Add server-specific configuration based on type
    if (type === 'filesystem' && serverConfig.basePath) {
        defaultConfig.args.push(serverConfig.basePath);
    }
    
    // Add port if specified
    if (serverConfig.port) {
        defaultConfig.args.push('--port', serverConfig.port.toString());
    }
    
    // Add environment variables for servers that need them
    standardConfig.configFields
        .filter(field => field.isEnv)
        .forEach(field => {
            if (serverConfig[field.name]) {
                defaultConfig.env[field.name] = serverConfig[field.name];
            }
        });
    
    return {
        ...serverConfig,
        ...defaultConfig
    };
}

/**
 * Generates the startup command line for a server configuration
 * @param {Object} serverConfig - Server configuration
 * @returns {String} - Command line to start the server
 */
export function generateStartupCommand(serverConfig) {
    const { command, args, env } = serverConfig;
    
    let commandLine = command;
    
    if (args && args.length) {
        commandLine += ' ' + args.map(arg => {
            // Quote args with spaces
            return arg.includes(' ') ? `"${arg}"` : arg;
        }).join(' ');
    }
    
    // Add environment variables
    if (env && Object.keys(env).length) {
        const envString = Object.entries(env)
            .map(([key, value]) => `${key}="${value}"`)
            .join(' ');
        
        commandLine = `${envString} ${commandLine}`;
    }
    
    return commandLine;
}

/**
 * Generates a URL for connecting to the MCP server
 * @param {Object} serverConfig - Server configuration
 * @returns {String} - URL for the server
 */
export function getMCPServerUrl(serverConfig) {
    const port = serverConfig.port || getDefaultPortForType(serverConfig.type);
    return `http://localhost:${port}`;
}

/**
 * Gets the default port for a server type
 * @param {String} type - Server type
 * @returns {Number} - Default port
 */
function getDefaultPortForType(type) {
    switch (type) {
        case 'filesystem':
            return 3500;
        case 'memory':
            return 3501;
        case 'github':
            return 3502;
        default:
            return 3500;
    }
}

/**
 * Checks if the MCP server is compatible with Ollama models
 * @param {Object} serverConfig - Server configuration
 * @returns {Boolean} - True if compatible
 */
export function isOllamaCompatible(serverConfig) {
    // All standard MCP servers are compatible with Ollama
    return true;
}

export default {
    standardMCPServers,
    generateMCPServerConfig,
    generateStartupCommand,
    getMCPServerUrl,
    isOllamaCompatible
};