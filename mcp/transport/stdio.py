"""
STDIO MCP Transport

This module implements the STDIO transport for MCP,
allowing communication with MCP servers via standard input/output.
"""

import os
import sys
import json
import logging
import asyncio
import threading
import time
from typing import Dict, List, Any, Optional, Union, Tuple, BinaryIO, TextIO

logger = logging.getLogger("mcp")

class StdioTransport:
    """
    MCP transport via STDIO
    """
    def __init__(self, process: Optional[asyncio.subprocess.Process] = None):
        """
        Initialize STDIO transport
        
        Args:
            process: Optional subprocess.Process object
        """
        self.process = process
        self.request_id = 0
        self.pending_requests = {}
        self.initialized = False
        self.server_info = {}
        self.capabilities = {}
    
    async def connect(self, command: str, args: List[str], env: Dict[str, str] = None) -> bool:
        """
        Connect to an MCP server via STDIO
        
        Args:
            command: Command to run
            args: Command arguments
            env: Environment variables
            
        Returns:
            True if connection successful, False otherwise
        """
        try:
            # Start the server process
            full_env = os.environ.copy()
            if env:
                full_env.update(env)
            
            # Create the process
            self.process = await asyncio.create_subprocess_exec(
                command,
                *args,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=full_env
            )
            
            # Start reader thread for stderr
            threading.Thread(
                target=self._read_stderr,
                daemon=True
            ).start()
            
            # Start reader task for stdout
            asyncio.create_task(self._read_stdout())
            
            # Initialize the server
            initialized = await self.initialize()
            
            return initialized
        except Exception as e:
            logger.error(f"Error connecting to MCP server: {str(e)}")
            return False
    
    async def initialize(self) -> bool:
        """
        Initialize the MCP server
        
        Returns:
            True if initialization successful, False otherwise
        """
        try:
            # Create initialization request
            request = {
                "jsonrpc": "2.0",
                "method": "initialize",
                "params": {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {
                        "tools": {}
                    },
                    "clientInfo": {
                        "name": "open-webui-mcp-client",
                        "version": "1.0.0"
                    }
                },
                "id": self._get_next_id()
            }
            
            # Send request
            response = await self.send_request(request)
            
            if not response or "error" in response:
                logger.error(f"Error initializing MCP server: {response.get('error')}")
                return False
            
            if "result" not in response:
                logger.error("Invalid initialization response: missing result")
                return False
            
            # Store server info and capabilities
            self.server_info = {
                "name": response["result"].get("serverInfo", {}).get("name", "Unknown Server"),
                "version": response["result"].get("serverInfo", {}).get("version", "Unknown Version"),
                "protocolVersion": response["result"].get("protocolVersion", "Unknown")
            }
            
            self.capabilities = response["result"].get("capabilities", {})
            self.initialized = True
            
            logger.info(f"Connected to MCP server: {self.server_info['name']} {self.server_info['version']}")
            
            return True
        except Exception as e:
            logger.error(f"Error initializing MCP server: {str(e)}")
            return False
    
    async def shutdown(self) -> bool:
        """
        Shutdown the MCP server
        
        Returns:
            True if shutdown successful, False otherwise
        """
        if not self.initialized:
            return True
        
        try:
            # Create shutdown request
            request = {
                "jsonrpc": "2.0",
                "method": "shutdown",
                "params": {},
                "id": self._get_next_id()
            }
            
            # Send request
            response = await self.send_request(request)
            
            # Create exit notification
            exit_notification = {
                "jsonrpc": "2.0",
                "method": "exit",
                "params": {}
            }
            
            # Send exit notification
            await self.send_notification(exit_notification)
            
            # Close the process
            if self.process:
                self.process.terminate()
                await self.process.wait()
            
            self.initialized = False
            
            return True
        except Exception as e:
            logger.error(f"Error shutting down MCP server: {str(e)}")
            return False
    
    async def list_tools(self) -> List[Dict[str, Any]]:
        """
        List tools available on the MCP server
        
        Returns:
            List of tool definitions
        """
        if not self.initialized:
            logger.error("Cannot list tools: server not initialized")
            return []
        
        try:
            # Check if tools capability is available
            if "tools" not in self.capabilities:
                logger.error("Server does not support tools capability")
                return []
            
            # Create listTools request
            request = {
                "jsonrpc": "2.0",
                "method": "listTools",
                "params": {},
                "id": self._get_next_id()
            }
            
            # Send request
            response = await self.send_request(request)
            
            if not response or "error" in response:
                logger.error(f"Error listing tools: {response.get('error')}")
                return []
            
            if "result" not in response or "tools" not in response["result"]:
                logger.error("Invalid listTools response: missing tools")
                return []
            
            return response["result"]["tools"]
        except Exception as e:
            logger.error(f"Error listing tools: {str(e)}")
            return []
    
    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call a tool on the MCP server
        
        Args:
            tool_name: Name of the tool to call
            arguments: Tool arguments
            
        Returns:
            Tool execution result
        """
        if not self.initialized:
            logger.error("Cannot call tool: server not initialized")
            return {"error": "Server not initialized"}
        
        try:
            # Create callTool request
            request = {
                "jsonrpc": "2.0",
                "method": "callTool",
                "params": {
                    "name": tool_name,
                    "arguments": arguments
                },
                "id": self._get_next_id()
            }
            
            # Send request
            response = await self.send_request(request)
            
            if not response or "error" in response:
                error = response.get("error", "Unknown error")
                logger.error(f"Error calling tool {tool_name}: {error}")
                return {"error": str(error)}
            
            if "result" not in response:
                logger.error("Invalid callTool response: missing result")
                return {"error": "Invalid response from MCP server"}
            
            return {"result": response["result"]}
        except Exception as e:
            logger.error(f"Error calling tool {tool_name}: {str(e)}")
            return {"error": str(e)}
    
    async def send_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Send a request to the MCP server and wait for response
        
        Args:
            request: JSON-RPC request object
            
        Returns:
            Response object
        """
        if not self.process or self.process.stdin.is_closing():
            raise RuntimeError("MCP server process is not running")
        
        # Create future for the response
        request_id = request["id"]
        future = asyncio.Future()
        self.pending_requests[request_id] = future
        
        # Send request
        request_json = json.dumps(request) + "\n"
        self.process.stdin.write(request_json.encode("utf-8"))
        await self.process.stdin.drain()
        
        try:
            # Wait for response with timeout
            response = await asyncio.wait_for(future, timeout=30)
            return response
        except asyncio.TimeoutError:
            # Remove pending request
            if request_id in self.pending_requests:
                del self.pending_requests[request_id]
            
            raise TimeoutError(f"Request {request_id} timed out")
    
    async def send_notification(self, notification: Dict[str, Any]) -> None:
        """
        Send a notification to the MCP server
        
        Args:
            notification: JSON-RPC notification object
        """
        if not self.process or self.process.stdin.is_closing():
            raise RuntimeError("MCP server process is not running")
        
        # Send notification
        notification_json = json.dumps(notification) + "\n"
        self.process.stdin.write(notification_json.encode("utf-8"))
        await self.process.stdin.drain()
    
    async def _read_stdout(self) -> None:
        """
        Read from stdout and process responses
        """
        if not self.process or not self.process.stdout:
            return
        
        while True:
            try:
                # Read line from stdout
                line = await self.process.stdout.readline()
                
                if not line:
                    break
                
                # Decode line
                line_str = line.decode("utf-8").strip()
                
                if not line_str:
                    continue
                
                # Parse JSON
                try:
                    response = json.loads(line_str)
                    
                    # Check if it's a response
                    if "id" in response:
                        request_id = response["id"]
                        
                        if request_id in self.pending_requests:
                            # Resolve the future
                            future = self.pending_requests[request_id]
                            future.set_result(response)
                            
                            # Remove pending request
                            del self.pending_requests[request_id]
                    elif "method" in response:
                        # It's a notification, log it
                        logger.debug(f"MCP server notification: {response['method']}")
                except json.JSONDecodeError:
                    logger.error(f"Error parsing JSON from stdout: {line_str}")
            except Exception as e:
                logger.error(f"Error reading from stdout: {str(e)}")
                break
    
    def _read_stderr(self) -> None:
        """
        Read from stderr and log messages
        """
        if not self.process or not self.process.stderr:
            return
        
        while True:
            try:
                # Read line from stderr
                line = self.process.stderr.readline()
                
                if not line:
                    break
                
                # Decode line
                line_str = line.decode("utf-8").strip()
                
                if line_str:
                    logger.debug(f"MCP server stderr: {line_str}")
            except Exception as e:
                logger.error(f"Error reading from stderr: {str(e)}")
                break
    
    def _get_next_id(self) -> int:
        """
        Get the next request ID
        
        Returns:
            Request ID
        """
        self.request_id += 1
        return self.request_id
