"""
MCP Tools router for Open WebUI.
"""

import logging
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from open_webui.models.auth import get_current_active_user, User
from open_webui.mcp.server_manager import MCPServerController

# Create logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["mcp-tools"])

# Create server controller
server_controller = MCPServerController()


class MCPToolCall(BaseModel):
    """Model for executing a tool call on an MCP server."""
    serverId: str
    tool: str
    args: Dict[str, Any]


class MCPToolResponse(BaseModel):
    """Response for MCP tool operations."""
    success: bool
    result: Any = None
    error: Optional[str] = None


@router.post("/execute", response_model=MCPToolResponse)
async def execute_mcp_tool(
    tool_call: MCPToolCall,
    current_user: User = Depends(get_current_active_user)
):
    """Execute a tool call on an MCP server."""
    result = server_controller.execute_tool(
        tool_call.serverId,
        tool_call.tool,
        tool_call.args
    )
    
    if not result["success"]:
        return MCPToolResponse(
            success=False,
            error=result.get("error", "Error executing tool")
        )
    
    return MCPToolResponse(
        success=True,
        result=result.get("result")
    )


@router.get("/{server_id}", response_model=Dict[str, Any])
async def get_mcp_server_tools_endpoint(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get available tools from an MCP server."""
    result = server_controller.get_server_tools(server_id)
    
    if not result["success"]:
        return {
            "success": False,
            "error": result.get("error", "Error getting server tools"),
            "tools": []
        }
    
    return {
        "success": True,
        "tools": result.get("tools", [])
    }
