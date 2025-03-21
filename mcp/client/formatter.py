"""
MCP Message Formatter

This module handles formatting and conversion between different message formats
used by MCP and Ollama.
"""

import json
import re
import logging
from typing import Dict, List, Any, Optional, Union

logger = logging.getLogger("mcp")

class MCPFormatter:
    """
    Formatter for converting between MCP and Ollama message formats
    """
    @staticmethod
    def ollama_to_mcp(ollama_message: Dict[str, Any]) -> Dict[str, Any]:
        """
        Convert Ollama message format to MCP format
        
        Args:
            ollama_message: Message in Ollama format
            
        Returns:
            Message in MCP format
        """
        # MCP RPC request format
        mcp_request = {
            "jsonrpc": "2.0",
            "method": "callTool",
            "params": {
                "name": "",
                "arguments": {}
            },
            "id": 1
        }
        
        # Extract tool name and arguments from Ollama message
        tool_call = None
        
        # Check for tool_calls field (used in recent Ollama versions)
        if "tool_calls" in ollama_message and ollama_message["tool_calls"]:
            tool_call = ollama_message["tool_calls"][0]
            
            # Extract name and arguments
            if isinstance(tool_call, dict):
                function = tool_call.get("function", {})
                name = function.get("name", "")
                
                # Parse arguments
                args = function.get("arguments", "{}")
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except json.JSONDecodeError:
                        args = {}
                
                mcp_request["params"]["name"] = name
                mcp_request["params"]["arguments"] = args
        
        # Check for content that might contain a tool call
        elif "content" in ollama_message:
            content = ollama_message["content"]
            
            # Try to extract tool call from content
            tool_call = MCPFormatter.extract_tool_call_from_content(content)
            
            if tool_call:
                mcp_request["params"]["name"] = tool_call.get("name", "")
                mcp_request["params"]["arguments"] = tool_call.get("arguments", {})
        
        return mcp_request
    
    @staticmethod
    def mcp_to_ollama(mcp_result: Dict[str, Any], tool_call_id: str = None) -> Dict[str, Any]:
        """
        Convert MCP result to Ollama format
        
        Args:
            mcp_result: Result from MCP server
            tool_call_id: Optional tool call ID for Ollama
            
        Returns:
            Result in Ollama format
        """
        # Format for Ollama tool response
        ollama_response = {
            "role": "tool",
            "content": ""
        }
        
        # Add tool_call_id if provided
        if tool_call_id:
            ollama_response["tool_call_id"] = tool_call_id
        
        # Extract result content
        if "result" in mcp_result:
            result = mcp_result["result"]
            
            # Handle different result types
            if isinstance(result, dict):
                ollama_response["content"] = json.dumps(result, indent=2)
            elif isinstance(result, list):
                ollama_response["content"] = json.dumps(result, indent=2)
            else:
                ollama_response["content"] = str(result)
        elif "error" in mcp_result:
            ollama_response["content"] = f"Error: {mcp_result['error']}"
        else:
            ollama_response["content"] = "No result returned from tool"
        
        return ollama_response
    
    @staticmethod
    def extract_tool_call_from_content(content: str) -> Optional[Dict[str, Any]]:
        """
        Extract tool call from a message content string
        
        Args:
            content: Message content string
            
        Returns:
            Tool call object or None if no tool call found
        """
        # Look for JSON code blocks
        json_pattern = r"```json\s*([\s\S]*?)\s*```"
        matches = re.findall(json_pattern, content)
        
        if not matches:
            # Try to find JSON object not in code block
            try:
                # Look for anything that might be a JSON object
                json_object_pattern = r"\{[\s\S]*?\}"
                matches = re.findall(json_object_pattern, content)
            except:
                return None
        
        for match in matches:
            try:
                # Parse JSON
                data = json.loads(match)
                
                # Check if it's a valid tool call
                # Format 1: { "action": "tool_name", "params": { ... } }
                if "action" in data and ("params" in data or "parameters" in data):
                    params = data.get("params") or data.get("parameters") or {}
                    
                    return {
                        "name": data["action"],
                        "arguments": params
                    }
                
                # Format 2: { "tool": "tool_name", "tool_input": { ... } }
                elif "tool" in data and "tool_input" in data:
                    return {
                        "name": data["tool"],
                        "arguments": data["tool_input"]
                    }
                
                # Format 3: { "name": "tool_name", "arguments": { ... } }
                elif "name" in data and "arguments" in data:
                    return {
                        "name": data["name"],
                        "arguments": data["arguments"]
                    }
            except json.JSONDecodeError:
                # Not valid JSON, try next match
                continue
        
        return None
    
    @staticmethod
    def generate_tool_call_id() -> str:
        """
        Generate a unique tool call ID
        
        Returns:
            Tool call ID string
        """
        import uuid
        return f"call-{uuid.uuid4()}"
    
    @staticmethod
    def enhance_messages_with_tool_results(
        messages: List[Dict[str, Any]], 
        tool_results: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Enhance messages with tool results
        
        Args:
            messages: Original messages
            tool_results: Tool execution results
            
        Returns:
            Enhanced messages
        """
        if not tool_results:
            return messages
        
        return messages + tool_results
    
    @staticmethod
    def format_system_prompt_with_tools(system_prompt: str, tools: List[Dict[str, Any]]) -> str:
        """
        Format system prompt with tool definitions
        
        Args:
            system_prompt: Original system prompt
            tools: Available tools
            
        Returns:
            Enhanced system prompt
        """
        if not tools:
            return system_prompt
        
        # Create tool instructions
        tool_instructions = "You have access to the following tools:\n\n"
        
        for tool in tools:
            function = tool.get("function", {})
            name = function.get("name", "")
            description = function.get("description", "")
            
            tool_instructions += f"- {name}: {description}\n"
        
        tool_instructions += """
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
        
        # Combine with original prompt
        if system_prompt:
            return f"{system_prompt}\n\n{tool_instructions}"
        else:
            return tool_instructions
