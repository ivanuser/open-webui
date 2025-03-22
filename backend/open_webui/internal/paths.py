"""
Path management module for Open WebUI.
Handles global paths for data storage, static files, and server information.
"""

import os
from pathlib import Path

# Base directories
def get_base_dir():
    """Get the base directory for Open WebUI."""
    return os.environ.get("OPENWEBUI_BASE_DIR", os.path.expanduser("~/.openwebui"))

def get_data_dir():
    """Get the data directory for Open WebUI."""
    data_dir = os.environ.get("OPENWEBUI_DATA_DIR")
    if data_dir:
        return data_dir
    return os.path.join(get_base_dir(), "data")

def get_static_dir():
    """Get the static files directory for Open WebUI."""
    static_dir = os.environ.get("OPENWEBUI_STATIC_DIR")
    if static_dir:
        return static_dir
    return os.path.join(get_base_dir(), "static")

def get_storage_dir():
    """Get the storage directory for Open WebUI."""
    storage_dir = os.environ.get("OPENWEBUI_STORAGE_DIR")
    if storage_dir:
        return storage_dir
    return os.path.join(get_base_dir(), "storage")

def get_server_dir():
    """Get the server configuration directory for Open WebUI."""
    server_dir = os.environ.get("OPENWEBUI_SERVER_DIR")
    if server_dir:
        return server_dir
    return os.path.join(get_base_dir(), "server")

def get_mcp_dir():
    """Get the MCP directory for Open WebUI."""
    mcp_dir = os.environ.get("OPENWEBUI_MCP_DIR")
    if mcp_dir:
        return mcp_dir
    return os.path.join(get_base_dir(), "mcp")

def ensure_dir(directory):
    """Ensure that a directory exists, creating it if necessary."""
    Path(directory).mkdir(parents=True, exist_ok=True)
    return directory

# Ensure all required directories exist
def initialize_directories():
    """Initialize all required directories."""
    ensure_dir(get_data_dir())
    ensure_dir(get_static_dir())
    ensure_dir(get_storage_dir())
    ensure_dir(get_server_dir())
    ensure_dir(get_mcp_dir())
