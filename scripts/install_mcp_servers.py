#!/usr/bin/env python3
"""
MCP Server Installer

This script installs MCP servers for Open WebUI.
"""

import os
import sys
import argparse
import subprocess
import platform

# MCP server definitions
MCP_SERVERS = {
    "filesystem": {
        "name": "Filesystem",
        "description": "Access and manipulate files in a directory",
        "js_package": "@modelcontextprotocol/server-filesystem",
        "py_package": "modelcontextprotocol"
    },
    "memory": {
        "name": "Memory",
        "description": "Knowledge graph-based persistent memory",
        "js_package": "@modelcontextprotocol/server-memory",
        "py_package": None
    },
    "brave-search": {
        "name": "Brave Search",
        "description": "Search the web using Brave Search API",
        "js_package": "@modelcontextprotocol/server-brave-search",
        "py_package": None
    },
    "github": {
        "name": "GitHub",
        "description": "Access and manage GitHub repositories",
        "js_package": "@modelcontextprotocol/server-github",
        "py_package": None
    },
    "sqlite": {
        "name": "SQLite",
        "description": "Interact with SQLite databases",
        "js_package": "mcp-server-sqlite",
        "py_package": None
    }
}

def is_tool_installed(name):
    """Check if a command-line tool is installed."""
    try:
        subprocess.run([name, "--version"], 
                       stdout=subprocess.PIPE, 
                       stderr=subprocess.PIPE, 
                       check=False)
        return True
    except FileNotFoundError:
        return False

def install_js_package(package):
    """Install a JavaScript package globally using npm."""
    print(f"Installing {package}...")
    try:
        subprocess.run(["npm", "install", "-g", package], 
                       check=True, 
                       stdout=subprocess.PIPE, 
                       stderr=subprocess.PIPE)
        print(f"Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing {package}: {e}")
        print(f"stderr: {e.stderr.decode()}")
        return False

def install_py_package(package):
    """Install a Python package using pip."""
    print(f"Installing {package}...")
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", package], 
                       check=True, 
                       stdout=subprocess.PIPE, 
                       stderr=subprocess.PIPE)
        print(f"Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error installing {package}: {e}")
        print(f"stderr: {e.stderr.decode()}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Install MCP servers for Open WebUI")
    parser.add_argument("servers", nargs="*", help="MCP servers to install (default: install all)")
    parser.add_argument("--list", action="store_true", help="List available MCP servers")
    parser.add_argument("--js-only", action="store_true", help="Install only JavaScript implementations")
    parser.add_argument("--py-only", action="store_true", help="Install only Python implementations")
    
    args = parser.parse_args()
    
    # Check for Node.js and npm
    if not args.py_only and not is_tool_installed("npm"):
        print("Error: npm is not installed. Please install Node.js and npm first.")
        sys.exit(1)
    
    # List available servers
    if args.list:
        print("Available MCP servers:")
        for server_id, server in MCP_SERVERS.items():
            print(f"  {server_id}: {server['name']} - {server['description']}")
            print(f"    JS Package: {server['js_package'] or 'N/A'}")
            print(f"    Python Package: {server['py_package'] or 'N/A'}")
        sys.exit(0)
    
    # Determine which servers to install
    servers_to_install = args.servers if args.servers else list(MCP_SERVERS.keys())
    
    # Validate server names
    for server in servers_to_install:
        if server not in MCP_SERVERS:
            print(f"Error: Unknown server '{server}'")
            print("Run with --list to see available servers")
            sys.exit(1)
    
    # Install servers
    for server in servers_to_install:
        server_info = MCP_SERVERS[server]
        print(f"\nInstalling {server_info['name']} MCP server...")
        
        # Install JavaScript implementation
        if not args.py_only and server_info["js_package"]:
            install_js_package(server_info["js_package"])
        
        # Install Python implementation
        if not args.js_only and server_info["py_package"]:
            install_py_package(server_info["py_package"])
    
    print("\nInstallation complete!")
    print("You can now configure these servers in Open WebUI's MCP settings.")

if __name__ == "__main__":
    main()
