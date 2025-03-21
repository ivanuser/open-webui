# Model Context Protocol (MCP) Integration

Open WebUI now includes comprehensive support for the Model Context Protocol (MCP), allowing Ollama models to interact with external tools and data sources using a standardized protocol.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. Created by Anthropic, it provides a standardized way for AI models to access external context like filesystem access, web search, and more.

MCP follows a client-server architecture:
- **MCP Clients**: Applications like Open WebUI that connect to MCP servers
- **MCP Servers**: Tools that provide specific capabilities to AI models

## Features

Open WebUI's MCP integration includes:

- **Server Management**: Install, start, stop, and configure MCP servers directly from the UI
- **Server Monitoring**: View server status and logs
- **Tool Integration**: Seamlessly integrate MCP tools with Ollama models
- **Command-line Interface**: Manage MCP servers from the command line

## Supported Server Types

Open WebUI includes pre-configured templates for popular MCP servers:

- **Filesystem**: Access files and directories on your local system
- **Memory**: Persistent knowledge graph-based memory
- **Brave Search**: Search the web using Brave Search API
- **GitHub**: Access and interact with GitHub repositories

You can also add custom MCP servers with your own configurations.

## Getting Started

### Managing MCP Servers

1. Go to the **Admin Panel** and select **MCP**
2. Click **Add Server** to configure a new MCP server
3. Choose a server type and configure its settings
4. Click **Add Server** to save the configuration
5. Click **Start** to start the server
6. Click **Connect** to connect the server to your models

### Using MCP in Chat

1. Start a new chat with any Ollama model
2. You'll see instructions for using the connected MCP server
3. Ask the model to use the MCP tools by giving specific instructions

For example, with a filesystem server connected:
- "List all files in my documents directory using the MCP filesystem server"
- "Read the content of my README.md file"
- "Create a new file called notes.txt with some sample content"

### Example Prompts

#### Filesystem

```
Using the MCP filesystem server, list the files in /path/to/directory
```

```
Read the content of /path/to/file.txt using the MCP server
```

```
Create a new file at /path/to/new-file.txt with the following content: 
Hello world, this is a test file.
```

#### Memory

```
Using the MCP memory server, please remember this information: 
The capital of France is Paris.
```

```
Using the MCP memory server, recall what you know about France.
```

## Command Line Interface

Open WebUI provides a command-line interface for managing MCP servers:

```bash
# List all configured servers
python -m mcp list

# Start a server
python -m mcp start <server_id>

# Stop a server
python -m mcp stop <server_id>

# Get server logs
python -m mcp logs <server_id>

# Install a new server
python -m mcp install --name "My Server" --type filesystem --command npx --args "-y" "@modelcontextprotocol/server-filesystem" "/path/to/dir"

# Uninstall a server
python -m mcp uninstall <server_id>
```

## Advanced Configuration

### Custom MCP Servers

You can configure custom MCP servers by selecting "Advanced" settings in the server configuration modal. This allows you to specify:

- Custom commands and arguments
- Environment variables
- Custom port configurations

### Server Communication Types

MCP supports multiple transport mechanisms:

- **STDIO**: Standard input/output for local processes (default)
- **SSE**: Server-Sent Events for HTTP-based communication

### Integration with Ollama Models

When a model is used with MCP, Open WebUI:

1. Enhances the system prompt with tool descriptions
2. Instructs the model how to make tool calls
3. Detects tool calls in the model's output
4. Executes the requested tools
5. Returns the results to the model

## Troubleshooting

### Server Won't Start

- Check if the required dependencies are installed
- Verify the command and arguments are correct
- Check the server logs for specific errors

### Model Doesn't Use Tools

- Ensure you're explicitly asking the model to use MCP tools
- Check that the server is running and connected
- Try providing more specific instructions to the model

### Permission Errors

- For filesystem servers, ensure the specified path is accessible
- For other servers, check if authentication credentials are correct

## Learning More

For more information about the Model Context Protocol, visit:
- [Model Context Protocol Website](https://modelcontextprotocol.io/)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol)
