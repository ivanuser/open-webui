"""
MCP Server Manager for Open WebUI.

This module provides functionality for managing MCP servers.
"""

import json
import logging
import os
import subprocess
import time
import uuid
import psutil
import requests
from typing import Dict, Any, List, Optional, Union

from pydantic import BaseModel, Field

from open_webui.internal.paths import get_data_dir, get_mcp_dir, ensure_dir

# Create logger
logger = logging.getLogger(__name__)

# MCP server data file
DEFAULT_SERVER_FILE = os.path.join(get_data_dir(), "mcp_servers.json")


class MCPServer(BaseModel):
    """MCP Server configuration."""
    id: str
    name: str
    type: str
    description: Optional[str] = None
    command: str
    args: List[str] = []
    env: Optional[Dict[str, str]] = {}
    url: str
    status: str = "disconnected"
    apiKey: Optional[str] = None
    pid: Optional[int] = None


class MCPServerController:
    """Controller for managing MCP servers."""
    
    def __init__(self, server_file: Optional[str] = None):
        """
        Initialize the server controller.
        
        Args:
            server_file: Path to the server configuration file.
        """
        self.server_file = server_file or DEFAULT_SERVER_FILE
        self.servers: Dict[str, MCPServer] = {}
        self.load_servers()
    
    def load_servers(self) -> Dict[str, MCPServer]:
        """
        Load servers from the configuration file.
        
        Returns:
            Dict[str, MCPServer]: Dictionary of server configurations.
        """
        if not os.path.exists(self.server_file):
            self.servers = {}
            return self.servers
        
        try:
            with open(self.server_file, "r") as f:
                server_data = json.load(f)
            
            servers = {}
            for server_id, server_config in server_data.items():
                servers[server_id] = MCPServer(**server_config)
            
            self.servers = servers
            return self.servers
        except Exception as e:
            logger.error(f"Error loading server configurations: {e}")
            self.servers = {}
            return self.servers
    
    def save_servers(self) -> bool:
        """
        Save servers to the configuration file.
        
        Returns:
            bool: True if successful, False otherwise.
        """
        try:
            # Ensure data directory exists
            ensure_dir(os.path.dirname(self.server_file))
            
            # Prepare server data for serialization
            server_data = {}
            for server_id, server in self.servers.items():
                server_data[server_id] = server.dict()
            
            # Save to file
            with open(self.server_file, "w") as f:
                json.dump(server_data, f, indent=2)
            
            return True
        except Exception as e:
            logger.error(f"Error saving server configurations: {e}")
            return False
    
    def get_server(self, server_id: str) -> Optional[MCPServer]:
        """
        Get a server configuration by ID.
        
        Args:
            server_id: Server ID
            
        Returns:
            Optional[MCPServer]: Server configuration or None if not found.
        """
        return self.servers.get(server_id)
    
    def get_all_servers(self) -> Dict[str, MCPServer]:
        """
        Get all server configurations.
        
        Returns:
            Dict[str, MCPServer]: Dictionary of server configurations.
        """
        return self.servers
    
    def create_server(self, server: Dict[str, Any]) -> Optional[MCPServer]:
        """
        Create a new server configuration.
        
        Args:
            server: Server configuration data
            
        Returns:
            Optional[MCPServer]: Created server configuration or None if failed.
        """
        try:
            # Generate a unique ID if not provided
            if "id" not in server:
                server["id"] = f"mcp-{str(uuid.uuid4())[:8]}"
            
            # Create the server object
            server_obj = MCPServer(**server)
            
            # Add to the server dictionary
            self.servers[server_obj.id] = server_obj
            
            # Save the configurations
            self.save_servers()
            
            return server_obj
        except Exception as e:
            logger.error(f"Error creating server configuration: {e}")
            return None
    
    def update_server(self, server_id: str, server_update: Dict[str, Any]) -> Optional[MCPServer]:
        """
        Update a server configuration.
        
        Args:
            server_id: Server ID
            server_update: Updated server configuration data
            
        Returns:
            Optional[MCPServer]: Updated server configuration or None if failed.
        """
        try:
            # Check if the server exists
            if server_id not in self.servers:
                return None
            
            # Get the existing server
            server = self.servers[server_id]
            
            # Update the server object
            for key, value in server_update.items():
                if hasattr(server, key) and value is not None:
                    setattr(server, key, value)
            
            # Save the configurations
            self.save_servers()
            
            return server
        except Exception as e:
            logger.error(f"Error updating server configuration: {e}")
            return None
    
    def delete_server(self, server_id: str) -> bool:
        """
        Delete a server configuration.
        
        Args:
            server_id: Server ID
            
        Returns:
            bool: True if successful, False otherwise.
        """
        try:
            # Check if the server exists
            if server_id not in self.servers:
                return False
            
            # Get the server
            server = self.servers[server_id]
            
            # Stop the server if running
            if server.status == "connected" and server.pid:
                self.stop_server(server_id)
            
            # Delete the server
            del self.servers[server_id]
            
            # Save the configurations
            self.save_servers()
            
            return True
        except Exception as e:
            logger.error(f"Error deleting server configuration: {e}")
            return False
    
    def start_server(self, server_id: str) -> Dict[str, Any]:
        """
        Start a server.
        
        Args:
            server_id: Server ID
            
        Returns:
            Dict[str, Any]: Result of the operation.
        """
        try:
            # Check if the server exists
            if server_id not in self.servers:
                return {
                    "success": False,
                    "error": f"Server {server_id} not found"
                }
            
            # Get the server
            server = self.servers[server_id]
            
            # Check if already running
            if server.status == "connected" and server.pid:
                # Check if process still exists
                try:
                    process = psutil.Process(server.pid)
                    if process.is_running():
                        return {
                            "success": True,
                            "message": f"Server {server.name} is already running",
                            "pid": server.pid
                        }
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    # Process doesn't exist or can't be accessed, reset status
                    server.status = "disconnected"
                    server.pid = None
            
            # Create command with environment variables
            env = os.environ.copy()
            if server.env:
                env.update(server.env)
            
            # Create MCP directory if it doesn't exist
            mcp_dir = get_mcp_dir()
            ensure_dir(mcp_dir)
            
            # Create full command
            command = [server.command] + server.args
            
            # Start the process
            try:
                process = subprocess.Popen(
                    command,
                    env=env,
                    cwd=mcp_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    start_new_session=True  # Detach from parent process
                )
                
                # Update server status
                server.status = "connected"
                server.pid = process.pid
                
                # Save the configurations
                self.save_servers()
                
                return {
                    "success": True,
                    "message": f"Server {server.name} started",
                    "pid": process.pid
                }
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Error starting server: {str(e)}"
                }
        except Exception as e:
            logger.error(f"Error starting server: {e}")
            return {
                "success": False,
                "error": f"Error starting server: {str(e)}"
            }
    
    def stop_server(self, server_id: str) -> Dict[str, Any]:
        """
        Stop a server.
        
        Args:
            server_id: Server ID
            
        Returns:
            Dict[str, Any]: Result of the operation.
        """
        try:
            # Check if the server exists
            if server_id not in self.servers:
                return {
                    "success": False,
                    "error": f"Server {server_id} not found"
                }
            
            # Get the server
            server = self.servers[server_id]
            
            # Check if running
            if server.status != "connected" or not server.pid:
                return {
                    "success": True,
                    "message": f"Server {server.name} is not running"
                }
            
            # Stop the process
            try:
                process = psutil.Process(server.pid)
                for child in process.children(recursive=True):
                    child.terminate()
                process.terminate()
                
                # Wait for processes to terminate
                gone, alive = psutil.wait_procs([process], timeout=3)
                
                # Force kill if necessary
                if alive:
                    for p in alive:
                        p.kill()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                # Process doesn't exist or can't be accessed, that's fine
                pass
            except Exception as e:
                logger.error(f"Error stopping server process: {e}")
            
            # Update server status
            server.status = "disconnected"
            server.pid = None
            
            # Save the configurations
            self.save_servers()
            
            return {
                "success": True,
                "message": f"Server {server.name} stopped"
            }
        except Exception as e:
            logger.error(f"Error stopping server: {e}")
            return {
                "success": False,
                "error": f"Error stopping server: {str(e)}"
            }
    
    def get_server_status(self, server_id: str) -> Dict[str, Any]:
        """
        Get server status.
        
        Args:
            server_id: Server ID
            
        Returns:
            Dict[str, Any]: Server status.
        """
        try:
            # Check if the server exists
            if server_id not in self.servers:
                return {
                    "success": False,
                    "error": f"Server {server_id} not found"
                }
            
            # Get the server
            server = self.servers[server_id]
            
            # Check if the process is still running
            if server.status == "connected" and server.pid:
                try:
                    process = psutil.Process(server.pid)
                    if not process.is_running():
                        # Process doesn't exist, update status
                        server.status = "disconnected"
                        server.pid = None
                        self.save_servers()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    # Process doesn't exist or can't be accessed, update status
                    server.status = "disconnected"
                    server.pid = None
                    self.save_servers()
            
            return {
                "success": True,
                "status": server.status,
                "pid": server.pid
            }
        except Exception as e:
            logger.error(f"Error getting server status: {e}")
            return {
                "success": False,
                "error": f"Error getting server status: {str(e)}"
            }
    
    def execute_tool(self, server_id: str, tool: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a tool on an MCP server.
        
        Args:
            server_id: Server ID
            tool: Tool name
            args: Tool arguments
            
        Returns:
            Dict[str, Any]: Tool execution result.
        """
        try:
            # Check if the server exists
            if server_id not in self.servers:
                return {
                    "success": False,
                    "error": f"Server {server_id} not found"
                }
            
            # Get the server
            server = self.servers[server_id]
            
            # Check if running
            if server.status != "connected":
                return {
                    "success": False,
                    "error": f"Server {server.name} is not running"
                }
            
            # Prepare the request
            headers = {
                "Content-Type": "application/json"
            }
            
            if server.apiKey:
                headers["Authorization"] = f"Bearer {server.apiKey}"
            
            # Create JSON-RPC request
            params = {"name": tool, "arguments": args}
            request_body = {
                "jsonrpc": "2.0",
                "method": "callTool",
                "params": params,
                "id": str(uuid.uuid4())
            }
            
            # Execute the tool call
            response = requests.post(
                server.url,
                headers=headers,
                json=request_body,
                timeout=30  # 30 second timeout
            )
            
            # Check for errors
            if not response.ok:
                return {
                    "success": False,
                    "error": f"Error: HTTP {response.status_code} - {response.text}"
                }
            
            # Parse the response
            result = response.json()
            
            if "error" in result:
                return {
                    "success": False,
                    "error": result["error"]["message"]
                }
            
            return {
                "success": True,
                "result": result.get("result", "No result returned")
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Error executing tool: {e}")
            return {
                "success": False,
                "error": f"Error connecting to MCP server: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Error executing tool: {e}")
            return {
                "success": False,
                "error": f"Error executing tool: {str(e)}"
            }
    
    def get_server_tools(self, server_id: str) -> Dict[str, Any]:
        """
        Get tools available on an MCP server.
        
        Args:
            server_id: Server ID
            
        Returns:
            Dict[str, Any]: List of available tools.
        """
        try:
            # Check if the server exists
            if server_id not in self.servers:
                return {
                    "success": False,
                    "error": f"Server {server_id} not found"
                }
            
            # Get the server
            server = self.servers[server_id]
            
            # Check if running
            if server.status != "connected":
                return {
                    "success": False,
                    "error": f"Server {server.name} is not running"
                }
            
            # Prepare the request
            headers = {
                "Content-Type": "application/json"
            }
            
            if server.apiKey:
                headers["Authorization"] = f"Bearer {server.apiKey}"
            
            # Create JSON-RPC request for listTools
            request_body = {
                "jsonrpc": "2.0",
                "method": "listTools",
                "params": {},
                "id": str(uuid.uuid4())
            }
            
            # Get the tools
            response = requests.post(
                server.url,
                headers=headers,
                json=request_body,
                timeout=5  # 5 second timeout
            )
            
            # Check for errors
            if not response.ok:
                return {
                    "success": False,
                    "error": f"Error: HTTP {response.status_code} - {response.text}"
                }
            
            # Parse the response
            result = response.json()
            
            if "error" in result:
                return {
                    "success": False,
                    "error": result["error"]["message"]
                }
            
            # Extract tools from result
            tools = result.get("result", {}).get("tools", [])
            
            return {
                "success": True,
                "tools": tools
            }
        except requests.exceptions.RequestException as e:
            logger.error(f"Error getting server tools: {e}")
            return {
                "success": False,
                "error": f"Error connecting to MCP server: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Error getting server tools: {e}")
            return {
                "success": False,
                "error": f"Error getting server tools: {str(e)}"
            }
