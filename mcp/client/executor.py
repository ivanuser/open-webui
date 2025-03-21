"""
MCP Tool Executor

This module handles executing tool calls on MCP servers.
"""

import json
import logging
import asyncio
import time
from typing import Dict, List, Any, Optional, Union

import requests

from .formatter import MCPFormatter

logger = logging.getLogger("mcp")

class MCPToolExecutor:
    """
    Executes tool calls on MCP servers
    """
    def __init__(self, server_configs: Dict[str, Any]):
        """
        Initialize tool executor
        
        Args:
            server_configs: Dictionary of server configurations
        """
        self.server_configs = server_configs
        self.formatter = MCPFormatter()
    
    async def execute_tool(
        self, 
        server_id: str, 
        tool_name: str, 
        arguments: Dict[str, Any],
        timeout: int = 30
    ) -> Dict[str, Any]:
        """
        Execute a tool on an MCP server
        
        Args:
            server_id: ID of the server to use
            tool_name: Name of the tool to execute
            arguments: Tool arguments
            timeout: Timeout in seconds
            
        Returns:
            Tool execution result
        """
        # Check if server exists
        if server_id not in self.server_configs:
            return {
                "error": f"Unknown server: {server_id}",
                "status": "error"
            }
        
        # Get server configuration
        server_config = self.server_configs[server_id]
        server_url = server_config.get("url", "")
        
        if not server_url:
            return {
                "error": "Server URL not configured",
                "status": "error"
            }
        
        # Prepare MCP request
        request_data = {
            "jsonrpc": "2.0",
            "method": "callTool",
            "params": {
                "name": tool_name,
                "arguments": arguments
            },
            "id": int(time.time())  # Use timestamp as request ID
        }
        
        try:
            # Execute tool
            headers = {"Content-Type": "application/json"}
            
            # Add authentication if configured
            if "apiKey" in server_config:
                headers["Authorization"] = f"Bearer {server_config['apiKey']}"
            
            response = await self._make_request(server_url, request_data, headers, timeout)
            
            return response
        except Exception as e:
            logger.error(f"Error executing tool {tool_name} on server {server_id}: {str(e)}")
            
            return {
                "error": str(e),
                "status": "error"
            }
    
    async def _make_request(
        self, 
        url: str, 
        data: Dict[str, Any], 
        headers: Dict[str, str],
        timeout: int
    ) -> Dict[str, Any]:
        """
        Make an HTTP request to the MCP server
        
        Args:
            url: Server URL
            data: Request data
            headers: Request headers
            timeout: Timeout in seconds
            
        Returns:
            Response data
        """
        try:
            # Use requests in a thread to avoid blocking
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: requests.post(
                    url,
                    json=data,
                    headers=headers,
                    timeout=timeout
                )
            )
            
            if response.status_code != 200:
                return {
                    "error": f"HTTP error: {response.status_code} - {response.text}",
                    "status": "error"
                }
            
            response_data = response.json()
            
            if "error" in response_data:
                return {
                    "error": str(response_data["error"]),
                    "status": "error"
                }
            
            if "result" not in response_data:
                return {
                    "error": "Invalid response from MCP server: missing result",
                    "status": "error"
                }
            
            return {
                "result": response_data["result"],
                "status": "success"
            }
        except requests.exceptions.Timeout:
            return {
                "error": f"Request to MCP server timed out after {timeout} seconds",
                "status": "error"
            }
        except requests.exceptions.RequestException as e:
            return {
                "error": f"Request to MCP server failed: {str(e)}",
                "status": "error"
            }
        except json.JSONDecodeError:
            return {
                "error": "Invalid JSON response from MCP server",
                "status": "error"
            }
        except Exception as e:
            return {
                "error": f"Unexpected error: {str(e)}",
                "status": "error"
            }
