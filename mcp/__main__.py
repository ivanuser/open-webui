"""
MCP Command Line Interface

This module provides a command line interface for managing MCP servers.
"""

import argparse
import sys
import logging
import time
from .server_manager import MCPServerController

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger("mcp")

def main():
    """Main entry point for the MCP CLI"""
    parser = argparse.ArgumentParser(description="MCP Server Manager")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")
    
    # List servers command
    list_parser = subparsers.add_parser("list", help="List all configured MCP servers")
    
    # Start server command
    start_parser = subparsers.add_parser("start", help="Start an MCP server")
    start_parser.add_argument("server_id", help="ID of the server to start")
    
    # Stop server command
    stop_parser = subparsers.add_parser("stop", help="Stop an MCP server")
    stop_parser.add_argument("server_id", help="ID of the server to stop")
    
    # Install server command
    install_parser = subparsers.add_parser("install", help="Install a new MCP server configuration")
    install_parser.add_argument("--name", required=True, help="Name of the server")
    install_parser.add_argument("--type", required=True, help="Type of the server")
    install_parser.add_argument("--command", required=True, help="Command to run the server")
    install_parser.add_argument("--args", nargs="+", default=[], help="Arguments for the command")
    install_parser.add_argument("--env", nargs="+", default=[], help="Environment variables (KEY=VALUE)")
    install_parser.add_argument("--description", help="Description of the server")
    
    # Uninstall server command
    uninstall_parser = subparsers.add_parser("uninstall", help="Uninstall an MCP server configuration")
    uninstall_parser.add_argument("server_id", help="ID of the server to uninstall")
    
    # Get logs command
    logs_parser = subparsers.add_parser("logs", help="Get logs for an MCP server")
    logs_parser.add_argument("server_id", help="ID of the server to get logs for")
    logs_parser.add_argument("--follow", "-f", action="store_true", help="Follow the logs")
    logs_parser.add_argument("--limit", "-n", type=int, default=100, help="Maximum number of log entries to return")
    
    # Parse arguments
    args = parser.parse_args()
    
    # Create controller
    controller = MCPServerController()
    
    # Execute command
    if args.command == "list":
        # List servers
        result = controller.list_servers()
        if result["success"]:
            servers = result["servers"]
            if not servers:
                print("No MCP servers configured")
            else:
                print(f"{'ID':<36} {'Name':<20} {'Type':<15} {'Status':<12}")
                print("-" * 80)
                for server_id, server in servers.items():
                    print(f"{server_id:<36} {server['name']:<20} {server['type']:<15} {server['status']:<12}")
        else:
            print(f"Error: {result.get('message', 'Unknown error')}")
            return 1
    elif args.command == "start":
        # Start server
        print(f"Starting MCP server {args.server_id}...")
        result = controller.start_server(args.server_id)
        if result["success"]:
            print(f"Server started: {result.get('message', 'Success')}")
        else:
            print(f"Error: {result.get('message', 'Unknown error')}")
            return 1
    elif args.command == "stop":
        # Stop server
        print(f"Stopping MCP server {args.server_id}...")
        result = controller.stop_server(args.server_id)
        if result["success"]:
            print(f"Server stopped: {result.get('message', 'Success')}")
        else:
            print(f"Error: {result.get('message', 'Unknown error')}")
            return 1
    elif args.command == "install":
        # Parse environment variables
        env = {}
        for env_var in args.env:
            try:
                key, value = env_var.split("=", 1)
                env[key] = value
            except ValueError:
                print(f"Invalid environment variable: {env_var}")
                return 1
        
        # Create server configuration
        server_config = {
            "name": args.name,
            "type": args.type,
            "command": args.command,
            "args": args.args,
            "env": env
        }
        
        if args.description:
            server_config["description"] = args.description
        
        # Install server
        print(f"Installing MCP server {args.name}...")
        result = controller.install_server(server_config)
        if result["success"]:
            print(f"Server installed with ID {result['server_id']}")
        else:
            print(f"Error: {result.get('message', 'Unknown error')}")
            return 1
    elif args.command == "uninstall":
        # Uninstall server
        print(f"Uninstalling MCP server {args.server_id}...")
        result = controller.uninstall_server(args.server_id)
        if result["success"]:
            print(f"Server uninstalled: {result.get('message', 'Success')}")
        else:
            print(f"Error: {result.get('message', 'Unknown error')}")
            return 1
    elif args.command == "logs":
        # Get logs
        if args.follow:
            print(f"Following logs for MCP server {args.server_id}...")
            last_logs = []
            try:
                while True:
                    result = controller.get_server_logs(args.server_id, args.limit)
                    if result["success"]:
                        logs = result["logs"]
                        
                        # Only print new logs
                        if last_logs:
                            last_timestamp = last_logs[-1]["timestamp"]
                            new_logs = [log for log in logs if log["timestamp"] > last_timestamp]
                            for log in new_logs:
                                print(f"[{log['timestamp']}] [{log['type']}] {log['message']}")
                        else:
                            # First time, print all logs
                            for log in logs:
                                print(f"[{log['timestamp']}] [{log['type']}] {log['message']}")
                        
                        last_logs = logs
                    else:
                        print(f"Error: {result.get('message', 'Unknown error')}")
                        return 1
                    
                    # Sleep for a bit
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nExiting...")
        else:
            print(f"Getting logs for MCP server {args.server_id}...")
            result = controller.get_server_logs(args.server_id, args.limit)
            if result["success"]:
                logs = result["logs"]
                if not logs:
                    print("No logs available")
                else:
                    for log in logs:
                        print(f"[{log['timestamp']}] [{log['type']}] {log['message']}")
            else:
                print(f"Error: {result.get('message', 'Unknown error')}")
                return 1
    else:
        parser.print_help()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
