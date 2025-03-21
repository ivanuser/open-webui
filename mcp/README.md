# Open WebUI MCP Implementation

This module provides a comprehensive implementation of the Model Context Protocol (MCP) for Open WebUI.

## Overview

The Model Context Protocol (MCP) is an open protocol that enables seamless integration between LLM applications and external data sources and tools. This implementation allows Open WebUI to:

1. **Manage MCP Servers**: Install, start, stop, and monitor MCP servers
2. **Connect with Ollama Models**: Enable Ollama models to use MCP tools
3. **Provide Tool Execution**: Execute tool calls made by models
4. **Support Multiple Transports**: Work with both STDIO and SSE transports

## Directory Structure

```
mcp/
├── client/             # Client-side MCP implementation
│   ├── bridge.py       # Bridge between Ollama and MCP
│   ├── formatter.py    # Message format conversion
│   └── executor.py     # Tool execution
├── server_manager/     # Server management
│   ├── config.py       # Configuration handling
│   └── controller.py   # Server lifecycle control
├── templates/          # Pre-configured server templates
├── transport/          # Transport implementations
│   ├── stdio.py        # STDIO transport
│   └── sse.py          # SSE transport
├── install.py          # Installation script
├── setup.py            # Package setup
└── README.md           # This file
```

## Installation

To install the MCP package:

```bash
# Basic installation
python mcp/install.py

# Development mode installation
python mcp/install.py --dev

# Install with server packages
python mcp/install.py --servers
```

## Usage

The MCP implementation is integrated with Open WebUI and can be accessed through:

1. **Admin Panel**: Configure and manage MCP servers
2. **Chat Interface**: Use MCP tools in conversations
3. **API**: Access MCP functionality programmatically

## Supported Servers

This implementation supports the following MCP servers:

- **Filesystem**: Access and manipulate files
- **Memory**: Knowledge graph-based persistent memory
- **Brave Search**: Web search capabilities
- **GitHub**: GitHub repository access
- **Custom Servers**: Add your own MCP servers

## Contributing

Contributions are welcome! Please follow the Open WebUI contribution guidelines.

## License

This project is licensed under the same license as Open WebUI.
