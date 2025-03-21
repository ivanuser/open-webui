"""
MCP-Ollama Bridge

This module provides a bridge between Ollama and MCP servers,
enabling Ollama models to use MCP tools.
"""

import os
import subprocess
import json
import logging
import asyncio
import threading
import time
from typing import Dict, List, Any, Optional, Tuple, Union

import requests

logger = logging.getLogger("mcp")

class OllamaMCPBridge:
    """
    Bridge between Ollama and MCP servers
    """
    def __init__(self, server_config: Dict[str, Any]):
        """
        Initialize the Ollama-MCP bridge
        
        Args:
            server_config: MCP server configuration
        """
        self.server_config = server_config
        self.server_url = server_config.get("url", "")
        self.tools = []
        self.tool_map = {}
    
    async def initialize(self) -> bool:
        """
        Initialize the bridge by discovering available tools
        
        Returns:
            True if initialization succeeded, False otherwise
        """
        try:
            # Discover available tools
            tools = await self.discover_tools()
            
            if not tools:
                logger.error(f"No tools found on MCP server {self.server_config.get('name')}")
                return False
            
            self.tools = tools
            
            # Create tool map for quick lookup
            self.tool_map = {tool["name"]: tool for tool in tools}
            
            return True
        except Exception as e:
            logger.error(f"Error initializing MCP bridge: {str(e)}")
            return False
    
    async def discover_tools(self) -> List[Dict[str, Any]]:
        """
        Discover tools available on the MCP server
        
        Returns:
            List of tool definitions
        """
        try:
            # Send listTools request to MCP server
            request_data = {
                "jsonrpc": "2.0",
                "method": "listTools",
                "params": {},
                "id": 1
            }
            
            response = requests.post(
                self.server_url,
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"Error discovering tools: {response.status_code} - {response.text}")
                return []
            
            response_data = response.json()
            
            if "error" in response_data:
                logger.error(f"Error in listTools response: {response_data['error']}")
                return []
            
            if "result" not in response_data or "tools" not in response_data["result"]:
                logger.error("Invalid listTools response: missing tools")
                return []
            
            # Extract tools from response
            tools = response_data["result"]["tools"]
            
            # Convert tools to Ollama format
            return self._convert_tools_to_ollama_format(tools)
        except Exception as e:
            logger.error(f"Error discovering tools: {str(e)}")
            return []
    
    async def execute_tool(self, tool_name: str, tool_args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a tool on the MCP server
        
        Args:
            tool_name: Name of the tool to execute
            tool_args: Arguments for the tool
            
        Returns:
            Tool execution result
        """
        try:
            # Check if tool exists
            if tool_name not in self.tool_map:
                return {
                    "error": f"Tool not found: {tool_name}",
                    "status": "error"
                }
            
            # Send callTool request to MCP server
            request_data = {
                "jsonrpc": "2.0",
                "method": "callTool",
                "params": {
                    "name": tool_name,
                    "arguments": tool_args
                },
                "id": 2
            }
            
            response = requests.post(
                self.server_url,
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"Error executing tool: {response.status_code} - {response.text}")
                return {
                    "error": f"HTTP error: {response.status_code}",
                    "status": "error"
                }
            
            response_data = response.json()
            
            if "error" in response_data:
                logger.error(f"Error in callTool response: {response_data['error']}")
                return {
                    "error": str(response_data["error"]),
                    "status": "error"
                }
            
            if "result" not in response_data:
                logger.error("Invalid callTool response: missing result")
                return {
                    "error": "Invalid response from MCP server",
                    "status": "error"
                }
            
            # Extract result
            result = response_data["result"]
            
            return {
                "result": result,
                "status": "success"
            }
        except Exception as e:
            logger.error(f"Error executing tool: {str(e)}")
            return {
                "error": str(e),
                "status": "error"
            }
    
    def format_tools_for_ollama(self) -> List[Dict[str, Any]]:
        """
        Format tools for Ollama's function calling format
        
        Returns:
            List of formatted tool definitions
        """
        return self.tools
    
    def generate_system_prompt(self) -> str:
        """
        Generate a system prompt with tool instructions for Ollama
        
        Returns:
            System prompt string
        """
        # Create a special prompt that works with Ollama models
        prompt = f"You have access to the following tools via the Model Context Protocol:\n\n"
        
        for tool in self.tools:
            name = tool.get("function", {}).get("name", "")
            description = tool.get("function", {}).get("description", "")
            
            prompt += f"- {name}: {description}\n"
        
        prompt += """
When you need to use a tool, respond with a JSON object in this format inside a code block:

```json
{
  "action": "tool_name",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

Always wrap the JSON in a code block with ```json and ``` markers.
Use tools directly when they're appropriate for the task.
Wait for tool results before continuing.
"""
        
        return prompt
    
    def extract_tool_call(self, response: str) -> Optional[Dict[str, Any]]:
        """
        Extract tool call from an Ollama model's response
        
        Args:
            response: Ollama model response
            
        Returns:
            Tool call object or None if no tool call found
        """
        # Look for JSON code blocks
        import re
        
        # Pattern to match json code blocks
        json_pattern = r"```json\s*([\s\S]*?)\s*```"
        matches = re.findall(json_pattern, response)
        
        if not matches:
            # Try to find JSON object not in code block
            try:
                # Look for anything that might be a JSON object
                json_object_pattern = r"\{[\s\S]*?\}"
                matches = re.findall(json_object_pattern, response)
            except:
                return None
        
        for match in matches:
            try:
                # Parse JSON
                data = json.loads(match)
                
                # Check if it's a valid tool call
                if "action" in data and ("params" in data or "parameters" in data):
                    params = data.get("params") or data.get("parameters") or {}
                    
                    return {
                        "name": data["action"],
                        "arguments": params
                    }
            except json.JSONDecodeError:
                # Not valid JSON, try next match
                continue
        
        return None
    
    def _convert_tools_to_ollama_format(self, tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Convert MCP tools to Ollama function calling format
        
        Args:
            tools: List of MCP tool definitions
            
        Returns:
            List of Ollama-compatible tool definitions
        """
        ollama_tools = []
        
        for tool in tools:
            name = tool.get("name", "")
            description = tool.get("description", "Unknown tool")
            input_schema = tool.get("inputSchema", {})
            
            # Create Ollama function definition
            ollama_tool = {
                "type": "function",
                "function": {
                    "name": name,
                    "description": description,
                    "parameters": input_schema
                }
            }
            
            ollama_tools.append(ollama_tool)
        
        return ollama_tools
