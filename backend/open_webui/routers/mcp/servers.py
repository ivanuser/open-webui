"""
MCP Server Management API

This module provides API endpoints for managing MCP servers.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body, Path
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

from ....mcp.server_manager import MCPServerController
from ....mcp.templates import get_server_templates, generate_server_config
from ...models.auth import User, get_current_active_user

router = APIRouter(prefix="/servers")

# Initialize controller
controller = MCPServerController()

# Models
class ServerConfig(BaseModel):
    """Server configuration"""
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    type: str
    command: str
    args: List[str]
    env: Dict[str, str] = {}
    url: Optional[str] = None
    apiKey: Optional[str] = None
    
class ServerResponse(BaseModel):
    """Server response"""
    id: str
    name: str
    description: Optional[str] = None
    type: str
    command: str
    args: List[str]
    env: Dict[str, str] = {}
    url: Optional[str] = None
    status: str
    process_id: Optional[int] = None
    uptime: Optional[float] = None
    
class ServerStatusUpdate(BaseModel):
    """Server status update"""
    status: str

class ServerListResponse(BaseModel):
    """Server list response"""
    success: bool
    servers: Dict[str, Any]

class ServerResponse(BaseModel):
    """Server operation response"""
    success: bool
    message: str
    server_id: Optional[str] = None
    status: Optional[str] = None
    process_id: Optional[int] = None
    url: Optional[str] = None

class LogEntry(BaseModel):
    """Log entry"""
    timestamp: str
    type: str
    message: str

class LogsResponse(BaseModel):
    """Logs response"""
    success: bool
    logs: Optional[List[LogEntry]] = None
    message: Optional[str] = None

class TemplateResponse(BaseModel):
    """Template response"""
    success: bool
    templates: Dict[str, Any]

@router.get("/", response_model=ServerListResponse)
async def list_servers(
    user: User = Depends(get_current_active_user)
):
    """
    List all configured MCP servers
    """
    try:
        result = controller.list_servers()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ServerResponse)
async def create_server(
    server: ServerConfig,
    user: User = Depends(get_current_active_user)
):
    """
    Create a new MCP server configuration
    """
    try:
        result = controller.install_server(server.dict(exclude_unset=True))
        return {
            "success": result["success"],
            "message": result["message"],
            "server_id": result.get("server_id")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/templates", response_model=TemplateResponse)
async def get_templates(
    user: User = Depends(get_current_active_user)
):
    """
    Get available MCP server templates
    """
    try:
        templates = get_server_templates()
        return {
            "success": True,
            "templates": templates
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{server_id}", response_model=ServerResponse)
async def get_server(
    server_id: str = Path(..., description="Server ID"),
    user: User = Depends(get_current_active_user)
):
    """
    Get a specific MCP server configuration
    """
    try:
        result = controller.check_server_status(server_id)
        
        if not result.get("success", False):
            raise HTTPException(status_code=404, detail=f"Server {server_id} not found")
        
        return {
            "success": True,
            "message": result.get("message", ""),
            "server_id": server_id,
            "status": result.get("status"),
            "process_id": result.get("process_id"),
            "url": result.get("url")
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{server_id}", response_model=ServerResponse)
async def update_server(
    server: ServerConfig,
    server_id: str = Path(..., description="Server ID"),
    user: User = Depends(get_current_active_user)
):
    """
    Update an MCP server configuration
    """
    try:
        # Stop the server if it's running
        status_result = controller.check_server_status(server_id)
        if status_result.get("status") == "running":
            controller.stop_server(server_id)
        
        # Update server configuration
        server_dict = server.dict(exclude_unset=True)
        server_dict["id"] = server_id  # Ensure ID is set
        
        result = controller.install_server(server_dict)
        
        return {
            "success": result["success"],
            "message": result["message"],
            "server_id": result.get("server_id")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{server_id}", response_model=ServerResponse)
async def delete_server(
    server_id: str = Path(..., description="Server ID"),
    user: User = Depends(get_current_active_user)
):
    """
    Delete an MCP server configuration
    """
    try:
        result = controller.uninstall_server(server_id)
        
        return {
            "success": result["success"],
            "message": result["message"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{server_id}/start", response_model=ServerResponse)
async def start_server(
    server_id: str = Path(..., description="Server ID"),
    user: User = Depends(get_current_active_user)
):
    """
    Start an MCP server
    """
    try:
        result = controller.start_server(server_id)
        
        return {
            "success": result["success"],
            "message": result["message"],
            "status": result.get("status"),
            "process_id": result.get("process_id"),
            "url": result.get("url")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{server_id}/stop", response_model=ServerResponse)
async def stop_server(
    server_id: str = Path(..., description="Server ID"),
    user: User = Depends(get_current_active_user)
):
    """
    Stop an MCP server
    """
    try:
        result = controller.stop_server(server_id)
        
        return {
            "success": result["success"],
            "message": result["message"],
            "status": result.get("status")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{server_id}/logs", response_model=LogsResponse)
async def get_server_logs(
    server_id: str = Path(..., description="Server ID"),
    limit: int = Query(100, description="Maximum number of log entries to return"),
    user: User = Depends(get_current_active_user)
):
    """
    Get logs for an MCP server
    """
    try:
        result = controller.get_server_logs(server_id, limit)
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
