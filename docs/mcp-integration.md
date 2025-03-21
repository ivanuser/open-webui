# Model Context Protocol (MCP) Integration

Open WebUI integrates the Model Context Protocol (MCP) to extend AI capabilities by providing access to tools and data sources.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that standardizes how applications provide context to large language models (LLMs). It enables LLMs to interact with external tools and data sources in a standardized way.

Learn more at [modelcontextprotocol.io](https://modelcontextprotocol.io/)

## Features

- **MCP Server Management**: Install, start, stop, and configure MCP servers through the Open WebUI interface
- **Ollama Integration**: Use MCP tools with Ollama models
- **Tool Support**: Access filesystem, memory, web search, and more through MCP tools
- **Security**: Control which directories and resources are accessible to MCP servers

## Prerequisites

- Node.js 16+ (for JavaScript MCP servers)
- Python 3.9+ (for Python MCP servers)
- Ollama with compatible models (models that support tool calls/function calling)

## Setup

### Install MCP Dependencies

You can install MCP server packages using our installation script:

```bash
python scripts/install_mcp_servers.py
```

For a list of available servers:

```bash
python scripts/install_mcp_servers.py --list
```

To install specific servers:

```bash
python scripts/install_mcp_servers.py filesystem memory
```

### Configure MCP in Open WebUI

1. Open the admin panel in Open WebUI
2. Navigate to the "MCP" section
3. Add a new MCP server with appropriate configuration
4. Start the server from the UI

### Recommended Models

For the best experience with MCP, use models that support function calling. Some recommended models:

- Qwen 2.5 models (`qwen2.5-coder-7b`, `qwen2.5-coder-14b`)
- Llama 3.2 models (`llama3.2-70b`, `llama3.2-11b`)
- Mistral models with function calling support
- DeepSeek models with function calling support

## Using MCP in Chat

When an MCP server is connected, you can use its tools in chat by explicitly asking the model to use them:

### Filesystem Example

```
Using the MCP filesystem server, please list the files in /path/to/directory
```

### Memory Example

```
Using the MCP memory server, please remember this information: The capital of France is Paris
```

## Advanced Usage

### Starting Servers Manually

You can start MCP servers manually using the provided script:

```bash
python scripts/start_mcp_server.py filesystem --directory /path/to/directory
```

### Custom Servers

You can create custom MCP servers and add them to Open WebUI. The server needs to implement the Model Context Protocol specification.

## Troubleshooting

### Common Issues

- **Server won't start**: Make sure the required packages are installed and the command is correct
- **Model doesn't use tools**: Ensure you're using a model that supports function calling
- **Access denied**: Check that the paths configured are accessible to the server process

### Logs

Check the server logs in the MCP admin panel for more detailed error information.

## Additional Resources

- [MCP GitHub Repository](https://github.com/modelcontextprotocol/mcp)
- [MCP Documentation](https://modelcontextprotocol.io/docs)
- [MCP Servers Repository](https://github.com/modelcontextprotocol/servers)
