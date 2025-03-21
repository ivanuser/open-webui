"""
MCP Tools API

This module provides API endpoints for executing MCP tools.
"""

from fastapi import APIRouter, Depends, HTTPException, Body, Path
from typing import Dict, List, Any, Optional
from pydantic import BaseModel, Field

from ....mcp.server_manager import MCPServerController
from ....mcp.client.executor import MCPToolExecutor
from ...models.auth import User, get_current_active_user

router = APIRouter(prefix="/tools")

# Initialize controller
controller = MCPServerController()

# Models
class ToolExecutionRequest(BaseModel):
    """Tool execution request"""
    server_id: str = Field(..., description="ID of the MCP server to use")
    tool: str = Field(..., description="Name of the tool to execute")
    args: Dict[str, Any] = Field(default_factory=dict, description="Tool arguments")

class ToolResult(BaseModel):
    """Tool execution result"""
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None

class ToolListResponse(BaseModel):
    """Tool list response"""
    success: bool
    tools: List[Dict[str, Any]]

@router.post("/execute", response_model=ToolResult)
async def execute_tool(
    request: ToolExecutionRequest = Body(...),
    user: User = Depends(get_current_active_user)
):
    """
    Execute an MCP tool
    """
    try:
        # Get server configuration
        server_list = controller.list_servers()
        
        if not server_list.get("success", False):
            raise HTTPException(status_code=500, detail="Failed to get server list")
        
        servers = server_list.get("servers", {})
        
        if request.server_id not in servers:
            raise HTTPException(status_code=404, detail=f"Server {request.server_id} not found")
        
        server_config = servers[request.server_id]
        
        # Check if server is running
        if server_config.get("status") != "running":
            # Try to start the server
            start_result = controller.start_server(request.server_id)
            
            if not start_result.get("success", False):
                raise HTTPException(
                    status_code=500, 
                    detail=f"Server {request.server_id} is not running and could not be started"
                )
        
        # Create executor
        executor = MCPToolExecutor(servers)
        
        # Execute tool
        result = await executor.execute_tool(
            request.server_id,
            request.tool,
            request.args
        )
        
        if "error" in result:
            return {
                "success": False,
                "error": result["error"]
            }
        
        return {
            "success": True,
            "result": result["result"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{server_id}", response_model=ToolListResponse)
async def list_tools(
    server_id: str = Path(..., description="Server ID"),
    user: User = Depends(get_current_active_user)
):
    """
    List tools available on an MCP server
    """
    try:
        # Get server configuration
        server_list = controller.list_servers()
        
        if not server_list.get("success", False):
            raise HTTPException(status_code=500, detail="Failed to get server list")
        
        servers = server_list.get("servers", {})
        
        if server_id not in servers:
            raise HTTPException(status_code=404, detail=f"Server {server_id} not found")
        
        server_config = servers[server_id]
        
        # Check if server is running
        if server_config.get("status") != "running":
            # Try to start the server
            start_result = controller.start_server(server_id)
            
            if not start_result.get("success", False):
                raise HTTPException(
                    status_code=500, 
                    detail=f"Server {server_id} is not running and could not be started"
                )
        
        # Initialize the appropriate transport
        from ....mcp.transport.stdio import StdioTransport
        from ....mcp.transport.sse import SSETransport
        
        server_type = server_config.get("type", "stdio")
        
        if server_type == "stdio":
            # We need to use the running process from the controller
            if server_id not in controller.running_servers:
                raise HTTPException(
                    status_code=500,
                    detail=f"Server {server_id} is not running through the process manager"
                )
            
            transport = StdioTransport(controller.running_servers[server_id]["process"])
            await transport.initialize()
        elif server_type == "sse":
            transport = SSETransport()
            await transport.connect(server_config.get("url"))
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported server type: {server_type}"
            )
        
        # List tools
        tools = await transport.list_tools()
        
        # Convert to Ollama format
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
        
        return {
            "success": True,
            "tools": ollama_tools
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
