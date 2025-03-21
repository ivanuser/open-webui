#!/usr/bin/env python3
"""
MCP Server Starter

This script starts an MCP server manually.
"""

import os
import sys
import argparse
import subprocess
import platform

def start_filesystem_server(directory, port=3500):
    """Start the filesystem MCP server."""
    print(f"Starting filesystem MCP server on port {port} with access to {directory}...")
    
    # Determine the command based on how it was installed
    try:
        # Try with npx first
        cmd = ["npx", "-y", "@modelcontextprotocol/server-filesystem", directory, "--port", str(port)]
        print(f"Running command: {' '.join(cmd)}")
        process = subprocess.Popen(cmd)
        print(f"Server started with PID {process.pid}")
        print("Press Ctrl+C to stop the server")
        process.wait()
    except KeyboardInterrupt:
        print("\nStopping server...")
        process.terminate()
        process.wait()
        print("Server stopped")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

def start_py_filesystem_server(directory):
    """Start the Python filesystem MCP server."""
    print(f"Starting Python filesystem MCP server with access to {directory}...")
    
    try:
        cmd = [sys.executable, "-m", "mcp.server.stdio", "filesystem", directory]
        print(f"Running command: {' '.join(cmd)}")
        process = subprocess.Popen(cmd)
        print(f"Server started with PID {process.pid}")
        print("Press Ctrl+C to stop the server")
        process.wait()
    except KeyboardInterrupt:
        print("\nStopping server...")
        process.terminate()
        process.wait()
        print("Server stopped")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

def start_brave_search_server(api_key, port=3502):
    """Start the Brave Search MCP server."""
    print(f"Starting Brave Search MCP server on port {port}...")
    
    env = os.environ.copy()
    env["BRAVE_API_KEY"] = api_key
    
    try:
        cmd = ["npx", "-y", "@modelcontextprotocol/server-brave-search", "--port", str(port)]
        print(f"Running command: {' '.join(cmd)}")
        process = subprocess.Popen(cmd, env=env)
        print(f"Server started with PID {process.pid}")
        print("Press Ctrl+C to stop the server")
        process.wait()
    except KeyboardInterrupt:
        print("\nStopping server...")
        process.terminate()
        process.wait()
        print("Server stopped")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

def start_memory_server(port=3501):
    """Start the Memory MCP server."""
    print(f"Starting Memory MCP server on port {port}...")
    
    try:
        cmd = ["npx", "-y", "@modelcontextprotocol/server-memory", "--port", str(port)]
        print(f"Running command: {' '.join(cmd)}")
        process = subprocess.Popen(cmd)
        print(f"Server started with PID {process.pid}")
        print("Press Ctrl+C to stop the server")
        process.wait()
    except KeyboardInterrupt:
        print("\nStopping server...")
        process.terminate()
        process.wait()
        print("Server stopped")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Start an MCP server manually")
    parser.add_argument("server_type", choices=["filesystem", "py-filesystem", "brave-search", "memory"],
                       help="Type of MCP server to start")
    parser.add_argument("--directory", "-d", help="Directory to expose for filesystem server")
    parser.add_argument("--port", "-p", type=int, help="Port to run the server on")
    parser.add_argument("--api-key", "-k", help="API key for services that require it")
    
    args = parser.parse_args()
    
    if args.server_type == "filesystem":
        if not args.directory:
            print("Error: --directory is required for filesystem server")
            sys.exit(1)
        start_filesystem_server(args.directory, args.port or 3500)
    
    elif args.server_type == "py-filesystem":
        if not args.directory:
            print("Error: --directory is required for filesystem server")
            sys.exit(1)
        start_py_filesystem_server(args.directory)
    
    elif args.server_type == "brave-search":
        if not args.api_key:
            print("Error: --api-key is required for brave-search server")
            sys.exit(1)
        start_brave_search_server(args.api_key, args.port or 3502)
    
    elif args.server_type == "memory":
        start_memory_server(args.port or 3501)

if __name__ == "__main__":
    main()
