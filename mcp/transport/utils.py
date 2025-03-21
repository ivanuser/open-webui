"""
MCP Transport Utilities

This module provides utility functions for working with MCP transports.
"""

import os
import shlex
import subprocess
import logging
import json
from typing import Dict, List, Any, Optional, Tuple, Union

logger = logging.getLogger("mcp")

def create_mcp_transport(config: Dict[str, Any]):
    """
    Create an MCP transport based on server configuration
    
    Args:
        config: Server configuration
        
    Returns:
        Transport instance or None if not supported
    """
    transport_type = config.get("type", "stdio")
    
    if transport_type == "stdio":
        from .stdio import StdioTransport
        return StdioTransport()
    elif transport_type == "sse":
        from .sse import SSETransport
        url = config.get("url", "")
        return SSETransport(url) if url else None
    else:
        logger.error(f"Unsupported MCP transport type: {transport_type}")
        return None

def format_command(command: str, args: List[str], env: Dict[str, str] = None) -> str:
    """
    Format a command with arguments and environment variables
    
    Args:
        command: Command to run
        args: Command arguments
        env: Environment variables
        
    Returns:
        Formatted command string
    """
    cmd_parts = []
    
    # Add environment variables
    if env:
        for key, value in env.items():
            cmd_parts.append(f"{key}={shlex.quote(value)}")
    
    # Add command and arguments
    cmd_parts.append(shlex.quote(command))
    cmd_parts.extend(shlex.quote(arg) for arg in args)
    
    return " ".join(cmd_parts)

def is_process_running(process: subprocess.Popen) -> bool:
    """
    Check if a process is running
    
    Args:
        process: Process to check
        
    Returns:
        True if process is running, False otherwise
    """
    if process is None:
        return False
    
    return process.poll() is None

def get_timestamp() -> str:
    """
    Get current timestamp
    
    Returns:
        Timestamp string
    """
    import datetime
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def find_executable(command: str) -> str:
    """
    Find the full path to an executable
    
    Args:
        command: Command name
        
    Returns:
        Full path to the executable or the original command if not found
    """
    import shutil
    path = shutil.which(command)
    return path if path else command

def extract_port_from_args(args: List[str]) -> int:
    """
    Extract port from command arguments
    
    Args:
        args: Command arguments
        
    Returns:
        Port number or 3500 if not found
    """
    try:
        port_index = args.index("--port")
        if port_index < len(args) - 1:
            return int(args[port_index + 1])
    except (ValueError, IndexError):
        pass
    
    return 3500
