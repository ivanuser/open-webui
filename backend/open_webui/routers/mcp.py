"""
MCP (Model Context Protocol) Router

This module provides API endpoints for managing and interacting with MCP servers.
"""

import logging
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..models.auth import get_current_active_user, User
from ..config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/api/mcp",
    tags=["mcp"],
    dependencies=[Depends(get_current_active_user)]
)
settings = get_settings()

# --- Models ---

class MCPServer(BaseModel):
    """MCP Server configuration."""
    id: str
    name: str
    url: str
    type: str
    description: Optional[str] = None
    is_active: bool = True
    auth_token: Optional[str] = None
    

class MCPServerCreate(BaseModel):
    """Model for creating a new MCP server."""
    name: str
    url: str
    type: str
    description: Optional[str] = None
    auth_token: Optional[str] = None


class MCPServerUpdate(BaseModel):
    """Model for updating an MCP server."""
    name: Optional[str] = None
    url: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    auth_token: Optional[str] = None


class MCPToolCall(BaseModel):
    """Model for executing a tool call on an MCP server."""
    server_id: str
    tool_name: str
    arguments: Dict[str, Any]


class MCPTool(BaseModel):
    """MCP Tool metadata."""
    name: str
    description: str
    parameters: Dict[str, Any]


# --- In-memory storage (will be replaced with DB storage) ---
mcp_servers: Dict[str, MCPServer] = {}


# --- Routes ---

@router.get("/servers", response_model=List[MCPServer])
async def get_mcp_servers(current_user: User = Depends(get_current_active_user)):
    """Get all configured MCP servers."""
    # In a production environment, this would filter by user/organization
    return list(mcp_servers.values())


@router.post("/servers", response_model=MCPServer, status_code=status.HTTP_201_CREATED)
async def create_mcp_server(
    server: MCPServerCreate, 
    current_user: User = Depends(get_current_active_user)
):
    """Create a new MCP server configuration."""
    # Generate a unique ID (in production, use UUID or similar)
    server_id = f"mcp-{len(mcp_servers) + 1}"
    
    # Create the server entry
    new_server = MCPServer(
        id=server_id,
        name=server.name,
        url=server.url,
        type=server.type,
        description=server.description,
        auth_token=server.auth_token,
        is_active=True
    )
    
    # Store it
    mcp_servers[server_id] = new_server
    
    logger.info(f"Created new MCP server: {server.name} ({server_id})")
    return new_server


@router.get("/servers/{server_id}", response_model=MCPServer)
async def get_mcp_server(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific MCP server configuration by ID."""
    if server_id not in mcp_servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    return mcp_servers[server_id]


@router.put("/servers/{server_id}", response_model=MCPServer)
async def update_mcp_server(
    server_id: str,
    server_update: MCPServerUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update an MCP server configuration."""
    if server_id not in mcp_servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    # Get the existing server
    existing_server = mcp_servers[server_id]
    
    # Update fields that are provided
    update_data = server_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing_server, key, value)
    
    # Save the updated server back to storage
    mcp_servers[server_id] = existing_server
    
    logger.info(f"Updated MCP server: {existing_server.name} ({server_id})")
    return existing_server


@router.delete("/servers/{server_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mcp_server(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete an MCP server configuration."""
    if server_id not in mcp_servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    # Delete the server
    server_name = mcp_servers[server_id].name
    del mcp_servers[server_id]
    
    logger.info(f"Deleted MCP server: {server_name} ({server_id})")


@router.post("/call-tool", status_code=status.HTTP_200_OK)
async def call_mcp_tool(
    tool_call: MCPToolCall,
    current_user: User = Depends(get_current_active_user)
):
    """Execute a tool call on an MCP server."""
    # This is a placeholder. In a real implementation, you would:
    # 1. Validate the server exists
    # 2. Connect to the MCP server at its URL
    # 3. Execute the tool call with the provided arguments
    # 4. Return the result
    
    if tool_call.server_id not in mcp_servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {tool_call.server_id} not found"
        )
    
    server = mcp_servers[tool_call.server_id]
    
    # This would be replaced with actual MCP client code
    logger.info(
        f"Tool call to {server.name}: {tool_call.tool_name} with args: {tool_call.arguments}"
    )
    
    # Return a dummy response for now
    return {
        "success": True,
        "result": f"Executed {tool_call.tool_name} on {server.name}",
        "details": f"Arguments: {tool_call.arguments}"
    }


@router.get("/servers/{server_id}/tools", response_model=List[MCPTool])
async def get_server_tools(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get available tools from an MCP server."""
    if server_id not in mcp_servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"MCP server with ID {server_id} not found"
        )
    
    server = mcp_servers[server_id]
    
    # This would be replaced with actual MCP client code to fetch tools
    # For now, return dummy tools based on server type
    if server.type == "filesystem":
        return [
            MCPTool(
                name="read_file",
                description="Read the contents of a file",
                parameters={"path": {"type": "string", "description": "Path to the file"}}
            ),
            MCPTool(
                name="write_file",
                description="Write content to a file",
                parameters={
                    "path": {"type": "string", "description": "Path to the file"},
                    "content": {"type": "string", "description": "Content to write"}
                }
            ),
            MCPTool(
                name="list_directory",
                description="List contents of a directory",
                parameters={"path": {"type": "string", "description": "Path to the directory"}}
            )
        ]
    else:
        # Generic tools for other server types
        return [
            MCPTool(
                name="example_tool",
                description=f"Example tool for {server.type} server",
                parameters={"param1": {"type": "string", "description": "Example parameter"}}
            )
        ]
