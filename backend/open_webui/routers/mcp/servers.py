"""
MCP Server router for Open WebUI.
"""

import logging
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel

from open_webui.models.auth import get_current_active_user, User
from open_webui.mcp.server_manager import MCPServerController

# Create logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["mcp-servers"])

# Create server controller
server_controller = MCPServerController()


class MCPServerCreate(BaseModel):
    """Model for creating a new MCP server."""
    name: str
    type: str
    command: str
    args: List[str] = []
    env: Optional[Dict[str, str]] = {}
    description: Optional[str] = None
    apiKey: Optional[str] = None


class MCPServerUpdate(BaseModel):
    """Model for updating an MCP server."""
    name: Optional[str] = None
    type: Optional[str] = None
    command: Optional[str] = None
    args: Optional[List[str]] = None
    env: Optional[Dict[str, str]] = None
    description: Optional[str] = None
    apiKey: Optional[str] = None
    status: Optional[str] = None
    pid: Optional[int] = None


class MCPServerResponse(BaseModel):
    """Response for MCP server operations."""
    success: bool
    servers: Optional[Dict[str, Any]] = None
    server: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


@router.get("/", response_model=MCPServerResponse)
async def get_mcp_servers(current_user: User = Depends(get_current_active_user)):
    """Get all configured MCP servers."""
    servers = server_controller.get_all_servers()
    
    # Convert to dict for response
    server_dict = {}
    for server_id, server in servers.items():
        server_dict[server_id] = server.dict()
    
    return MCPServerResponse(
        success=True,
        servers=server_dict
    )


@router.post("/", response_model=MCPServerResponse, status_code=status.HTTP_201_CREATED)
async def create_mcp_server(
    server: MCPServerCreate, 
    current_user: User = Depends(get_current_active_user)
):
    """Create a new MCP server configuration."""
    # Create the server
    result = server_controller.create_server(server.dict())
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create MCP server"
        )
    
    logger.info(f"Created new MCP server: {server.name}")
    
    return MCPServerResponse(
        success=True,
        server=result.dict()
    )


@router.get("/{server_id}", response_model=MCPServerResponse)
async def get_mcp_server(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific MCP server configuration by ID."""
    server = server_controller.get_server(server_id)
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    return MCPServerResponse(
        success=True,
        server=server.dict()
    )


@router.put("/{server_id}", response_model=MCPServerResponse)
async def update_mcp_server(
    server_id: str,
    server_update: MCPServerUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update an MCP server configuration."""
    result = server_controller.update_server(server_id, server_update.dict(exclude_unset=True, exclude_none=True))
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    logger.info(f"Updated MCP server: {result.name} ({server_id})")
    
    return MCPServerResponse(
        success=True,
        server=result.dict()
    )


@router.delete("/{server_id}", response_model=MCPServerResponse)
async def delete_mcp_server(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete an MCP server configuration."""
    server = server_controller.get_server(server_id)
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    result = server_controller.delete_server(server_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete MCP server"
        )
    
    logger.info(f"Deleted MCP server: {server.name} ({server_id})")
    
    return MCPServerResponse(
        success=True,
        message=f"Server {server.name} deleted"
    )


@router.post("/{server_id}/start", response_model=MCPServerResponse)
async def start_mcp_server(
    server_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    """Start an MCP server."""
    result = server_controller.start_server(server_id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Failed to start MCP server")
        )
    
    # Get updated server
    server = server_controller.get_server(server_id)
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    logger.info(f"Started MCP server: {server.name} ({server_id})")
    
    return MCPServerResponse(
        success=True,
        server=server.dict(),
        message=result.get("message", f"Server {server.name} started")
    )


@router.post("/{server_id}/stop", response_model=MCPServerResponse)
async def stop_mcp_server(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Stop an MCP server."""
    result = server_controller.stop_server(server_id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("error", "Failed to stop MCP server")
        )
    
    # Get updated server
    server = server_controller.get_server(server_id)
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    logger.info(f"Stopped MCP server: {server.name} ({server_id})")
    
    return MCPServerResponse(
        success=True,
        server=server.dict(),
        message=result.get("message", f"Server {server.name} stopped")
    )


@router.get("/{server_id}/status", response_model=MCPServerResponse)
async def get_mcp_server_status(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get the status of an MCP server."""
    result = server_controller.get_server_status(server_id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=result.get("error", f"MCP server with ID {server_id} not found")
        )
    
    # Get updated server
    server = server_controller.get_server(server_id)
    
    if not server:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    return MCPServerResponse(
        success=True,
        server=server.dict()
    )


@router.get("/templates", response_model=Dict[str, Any])
async def get_mcp_server_templates(
    current_user: User = Depends(get_current_active_user)
):
    """Get MCP server templates."""
    # Define standard templates
    templates = {
        "filesystem": {
            "name": "Filesystem",
            "description": "Access files on the local filesystem",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem@latest", "--port", "3500", "/tmp"],
            "env": {},
            "type": "filesystem"
        },
        "filesystem-py": {
            "name": "Filesystem (Python)",
            "description": "Access files on the local filesystem (Python implementation)",
            "command": "python",
            "args": ["filesystem_mcp_server.py", "--port", "3500", "/tmp"],
            "env": {},
            "type": "filesystem-py"
        },
        "brave-search": {
            "name": "Brave Search",
            "description": "Search the web using Brave Search API",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-brave-search@latest", "--port", "3502"],
            "env": {
                "BRAVE_API_KEY": ""
            },
            "type": "brave-search"
        },
        "github": {
            "name": "GitHub",
            "description": "Access GitHub repositories and perform actions",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-github@latest", "--port", "3503"],
            "env": {
                "GITHUB_PERSONAL_ACCESS_TOKEN": ""
            },
            "type": "github"
        }
    }
    
    return {
        "success": True,
        "templates": templates
    }
