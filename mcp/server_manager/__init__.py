"""
MCP Server Manager

This package handles the lifecycle management of MCP servers,
including configuration, starting, stopping, and monitoring.
"""

from .config import get_config, MCPConfig
from .controller import MCPServerController

__all__ = ["get_config", "MCPConfig", "MCPServerController"]
