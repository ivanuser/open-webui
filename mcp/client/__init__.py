"""
MCP Client Package

This package handles client-side interaction with MCP servers,
including bridging with Ollama models, formatting messages,
and executing tool calls.
"""

from .bridge import OllamaMCPBridge
from .formatter import MCPFormatter
from .executor import MCPToolExecutor

__all__ = ["OllamaMCPBridge", "MCPFormatter", "MCPToolExecutor"]
