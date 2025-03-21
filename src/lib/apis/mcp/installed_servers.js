/**
 * Installed MCP Servers
 * 
 * This module keeps track of installed MCP servers.
 */

// List of official MCP servers and their commands
export const officialMCPServers = {
    filesystem: {
        name: "Filesystem",
        description: "Access and manipulate files in a directory",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem"],
        defaultPort: 3500
    },
    memory: {
        name: "Memory",
        description: "Knowledge graph-based persistent memory",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
        defaultPort: 3501
    },
    "brave-search": {
        name: "Brave Search",
        description: "Search the web using Brave Search API",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-brave-search"],
        defaultPort: 3502,
        envVars: ["BRAVE_API_KEY"]
    },
    github: {
        name: "GitHub",
        description: "Access and manage GitHub repositories",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-github"],
        defaultPort: 3503,
        envVars: ["GITHUB_PERSONAL_ACCESS_TOKEN"]
    },
    sqlite: {
        name: "SQLite",
        description: "Interact with SQLite databases",
        command: "npx",
        args: ["-y", "mcp-server-sqlite"],
        defaultPort: 3504
    }
};

// Check if a server is installed
export function isServerInstalled(serverType) {
    // This is a placeholder. In a real implementation, this would check
    // if the server is actually installed on the system
    return serverType in officialMCPServers;
}

// Get installation command for a server
export function getInstallCommand(serverType) {
    if (serverType in officialMCPServers) {
        const server = officialMCPServers[serverType];
        return `npm install -g ${server.args[1]}`;
    }
    return null;
}

// Get server configuration template
export function getServerTemplate(serverType) {
    if (serverType in officialMCPServers) {
        const server = officialMCPServers[serverType];
        return {
            name: server.name,
            description: server.description,
            type: serverType,
            command: server.command,
            args: [...server.args],
            port: server.defaultPort
        };
    }
    return null;
}

export default {
    officialMCPServers,
    isServerInstalled,
    getInstallCommand,
    getServerTemplate
};
