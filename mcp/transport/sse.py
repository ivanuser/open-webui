"""
SSE MCP Transport

This module implements the Server-Sent Events (SSE) transport for MCP,
allowing communication with MCP servers via HTTP/SSE.
"""

import os
import json
import logging
import asyncio
import time
import uuid
import aiohttp
from typing import Dict, List, Any, Optional, Union, Tuple

logger = logging.getLogger("mcp")

class SSETransport:
    """
    MCP transport via Server-Sent Events (SSE)
    """
    def __init__(self, url: str = None):
        """
        Initialize SSE transport
        
        Args:
            url: MCP server URL
        """
        self.url = url
        self.client_id = str(uuid.uuid4())
        self.request_id = 0
        self.pending_requests = {}
        self.initialized = False
        self.server_info = {}
        self.capabilities = {}
        self.sse_task = None
        self.session = None
    
    async def connect(self, url: str, headers: Dict[str, str] = None) -> bool:
        """
        Connect to an MCP server via SSE
        
        Args:
            url: Server URL
            headers: Optional HTTP headers
            
        Returns:
            True if connection successful, False otherwise
        """
        try:
            self.url = url
            
            # Create HTTP session
            self.session = aiohttp.ClientSession(
                headers=headers or {}
            )
            
            # Start SSE listener
            self.sse_task = asyncio.create_task(self._listen_sse())
            
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
        Shutdown the SSE connection
        
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
            
            # Cancel SSE task
            if self.sse_task:
                self.sse_task.cancel()
                try:
                    await self.sse_task
                except asyncio.CancelledError:
                    pass
            
            # Close session
            if self.session:
                await self.session.close()
                self.session = None
            
            self.initialized = False
            
            return True
        except Exception as e:
            logger.error(f"Error shutting down MCP server connection: {str(e)}")
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
        if not self.session:
            raise RuntimeError("MCP server connection is not established")
        
        # Create future for the response
        request_id = request["id"]
        future = asyncio.Future()
        self.pending_requests[request_id] = future
        
        # Send request
        try:
            async with self.session.post(
                f"{self.url}/jsonrpc",
                json=request,
                headers={"Content-Type": "application/json"}
            ) as resp:
                if resp.status != 202:
                    # Non-202 status means synchronous response
                    response = await resp.json()
                    
                    # Remove pending request
                    if request_id in self.pending_requests:
                        del self.pending_requests[request_id]
                    
                    return response
        except Exception as e:
            # Remove pending request
            if request_id in self.pending_requests:
                del self.pending_requests[request_id]
            
            raise RuntimeError(f"Error sending request: {str(e)}")
        
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
        if not self.session:
            raise RuntimeError("MCP server connection is not established")
        
        # Send notification
        async with self.session.post(
            f"{self.url}/jsonrpc",
            json=notification,
            headers={"Content-Type": "application/json"}
        ) as resp:
            if resp.status != 202:
                logger.warning(f"Unexpected status code for notification: {resp.status}")
    
    async def _listen_sse(self) -> None:
        """
        Listen for SSE events from the server
        """
        try:
            while True:
                try:
                    async with self.session.get(
                        f"{self.url}/sse/{self.client_id}",
                        headers={"Accept": "text/event-stream"}
                    ) as resp:
                        if resp.status != 200:
                            logger.error(f"SSE connection failed: {resp.status}")
                            await asyncio.sleep(5)
                            continue
                        
                        # Process SSE stream
                        async for line in resp.content:
                            line = line.decode("utf-8").strip()
                            
                            if not line:
                                continue
                            
                            if line.startswith("data: "):
                                data = line[6:]
                                
                                try:
                                    message = json.loads(data)
                                    
                                    # Handle response
                                    if "id" in message:
                                        request_id = message["id"]
                                        
                                        if request_id in self.pending_requests:
                                            # Resolve the future
                                            future = self.pending_requests[request_id]
                                            future.set_result(message)
                                            
                                            # Remove pending request
                                            del self.pending_requests[request_id]
                                    elif "method" in message:
                                        # It's a notification, log it
                                        logger.debug(f"MCP server notification: {message['method']}")
                                except json.JSONDecodeError:
                                    logger.error(f"Error parsing JSON from SSE: {data}")
                except aiohttp.ClientError as e:
                    logger.error(f"SSE connection error: {str(e)}")
                    await asyncio.sleep(5)
        except asyncio.CancelledError:
            # Task was cancelled, exit gracefully
            pass
        except Exception as e:
            logger.error(f"Error in SSE listener: {str(e)}")
    
    def _get_next_id(self) -> int:
        """
        Get the next request ID
        
        Returns:
            Request ID
        """
        self.request_id += 1
        return self.request_id
