"""
MCP (Model Context Protocol) Router

This module provides API endpoints for managing and interacting with MCP servers.
"""

import logging
import json
import os
import subprocess
import uuid
import requests
from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import JSONResponse

from ..models.auth import get_current_active_user, User
from ..config import get_settings
from ..internal.paths import get_mcp_dir, get_data_dir, ensure_dir

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/api/mcp",
    tags=["mcp"],
    dependencies=[Depends(get_current_active_user)]
)
settings = get_settings()

# --- Models ---

class MCPServerEnv(BaseModel):
    """Environment variables for an MCP server."""
    BRAVE_API_KEY: Optional[str] = None
    GITHUB_PERSONAL_ACCESS_TOKEN: Optional[str] = None
    
class MCPServer(BaseModel):
    """MCP Server configuration."""
    id: str
    name: str
    type: str
    description: Optional[str] = None
    command: str
    args: List[str] = []
    env: Optional[Dict[str, str]] = {}
    url: str
    status: str = "disconnected"
    apiKey: Optional[str] = None
    pid: Optional[int] = None

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

class MCPToolCall(BaseModel):
    """Model for executing a tool call on an MCP server."""
    serverId: str
    tool: str
    args: Dict[str, Any]

class MCPTool(BaseModel):
    """MCP Tool metadata."""
    name: str
    description: str
    parameters: Dict[str, Any]

class MCPServerStartResult(BaseModel):
    """Result of starting an MCP server."""
    success: bool
    server_id: str
    status: str
    pid: Optional[int] = None
    message: Optional[str] = None

class MCPServerResponse(BaseModel):
    """Response for MCP server operations."""
    success: bool
    servers: Optional[Dict[str, MCPServer]] = None
    server: Optional[MCPServer] = None
    message: Optional[str] = None

class MCPToolResponse(BaseModel):
    """Response for MCP tool operations."""
    success: bool
    result: Any
    error: Optional[str] = None

# --- Utilities ---

def load_mcp_servers() -> Dict[str, MCPServer]:
    """Load MCP servers from the data file."""
    mcp_servers_file = os.path.join(get_data_dir(), "mcp_servers.json")
    
    if not os.path.exists(mcp_servers_file):
        return {}
    
    try:
        with open(mcp_servers_file, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading MCP servers: {e}")
        return {}

def save_mcp_servers(servers: Dict[str, MCPServer]) -> bool:
    """Save MCP servers to the data file."""
    mcp_servers_file = os.path.join(get_data_dir(), "mcp_servers.json")
    
    try:
        # Ensure data directory exists
        ensure_dir(get_data_dir())
        
        # Save the servers
        with open(mcp_servers_file, "w") as f:
            json.dump(servers, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving MCP servers: {e}")
        return False

def get_port_from_args(args: List[str]) -> int:
    """Extract port from command args."""
    port = 3500
    for i, arg in enumerate(args):
        if arg == "--port" and i < len(args) - 1:
            try:
                port = int(args[i + 1])
                break
            except (IndexError, ValueError):
                pass
    return port

def start_mcp_server_process(server: MCPServer) -> MCPServerStartResult:
    """Start an MCP server process."""
    try:
        # Create command with environment variables
        env = os.environ.copy()
        if server.env:
            env.update(server.env)
        
        # Start the process
        process = subprocess.Popen(
            [server.command] + server.args,
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            start_new_session=True  # Detach from parent process
        )
        
        # Update server status
        server.pid = process.pid
        server.status = "connected"
        
        return MCPServerStartResult(
            success=True,
            server_id=server.id,
            status="connected",
            pid=process.pid
        )
    except Exception as e:
        logger.error(f"Error starting MCP server {server.name}: {e}")
        return MCPServerStartResult(
            success=False,
            server_id=server.id,
            status="error",
            message=str(e)
        )

def stop_mcp_server_process(server: MCPServer) -> bool:
    """Stop an MCP server process."""
    if not server.pid:
        return False
    
    try:
        import signal
        import psutil
        
        # Check if process exists
        if not psutil.pid_exists(server.pid):
            logger.warning(f"MCP server process {server.pid} not found")
            return True
        
        # Terminate the process and all its children
        parent = psutil.Process(server.pid)
        for child in parent.children(recursive=True):
            child.terminate()
        
        parent.terminate()
        
        # Wait for processes to terminate
        gone, alive = psutil.wait_procs([parent] + parent.children(recursive=True), timeout=3)
        
        # Force kill if necessary
        for process in alive:
            process.kill()
        
        return True
    except Exception as e:
        logger.error(f"Error stopping MCP server {server.name}: {e}")
        return False

def call_mcp_tool_on_server(server: MCPServer, tool: str, args: Dict[str, Any]) -> Union[Dict[str, Any], str]:
    """Call a tool on an MCP server."""
    try:
        # Prepare the request
        headers = {
            "Content-Type": "application/json"
        }
        
        if server.apiKey:
            headers["Authorization"] = f"Bearer {server.apiKey}"
        
        # Create JSON-RPC request
        params = {"name": tool, "arguments": args}
        request_body = {
            "jsonrpc": "2.0",
            "method": "callTool",
            "params": params,
            "id": str(uuid.uuid4())
        }
        
        # Make the request
        response = requests.post(
            server.url,
            headers=headers,
            json=request_body,
            timeout=30  # 30 second timeout
        )
        
        # Check for errors
        if not response.ok:
            return f"Error: HTTP {response.status_code} - {response.text}"
        
        # Parse the response
        try:
            result = response.json()
            if "error" in result:
                return f"Error: {result['error']['message']}"
            
            return result.get("result", "No result returned")
        except Exception as e:
            return f"Error parsing response: {e}"
    except requests.exceptions.RequestException as e:
        return f"Error calling MCP server: {e}"
    except Exception as e:
        return f"Unexpected error: {e}"

def get_server_tools(server: MCPServer) -> List[MCPTool]:
    """Get tools available on an MCP server."""
    try:
        # Prepare the request
        headers = {
            "Content-Type": "application/json"
        }
        
        if server.apiKey:
            headers["Authorization"] = f"Bearer {server.apiKey}"
        
        # Create JSON-RPC request for listTools
        request_body = {
            "jsonrpc": "2.0",
            "method": "listTools",
            "params": {},
            "id": str(uuid.uuid4())
        }
        
        # Make the request
        response = requests.post(
            server.url,
            headers=headers,
            json=request_body,
            timeout=5  # 5 second timeout
        )
        
        # Check for errors
        if not response.ok:
            logger.error(f"Error getting tools from MCP server {server.name}: HTTP {response.status_code}")
            return []
        
        # Parse the response
        try:
            result = response.json()
            if "error" in result:
                logger.error(f"Error getting tools from MCP server {server.name}: {result['error']['message']}")
                return []
            
            # Extract tools from result
            tools_data = result.get("result", {}).get("tools", [])
            
            # Convert to MCPTool model
            tools = []
            for tool_data in tools_data:
                tools.append(MCPTool(
                    name=tool_data.get("name", "unknown"),
                    description=tool_data.get("description", ""),
                    parameters=tool_data.get("parameters", {})
                ))
            
            return tools
        except Exception as e:
            logger.error(f"Error parsing tools from MCP server {server.name}: {e}")
            return []
    except requests.exceptions.RequestException as e:
        logger.error(f"Error connecting to MCP server {server.name}: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error getting tools from MCP server {server.name}: {e}")
        return []

# --- Routes ---

@router.get("/servers", response_model=MCPServerResponse)
async def get_mcp_servers(current_user: User = Depends(get_current_active_user)):
    """Get all configured MCP servers."""
    # Load servers from persistent storage
    servers = load_mcp_servers()
    
    return MCPServerResponse(
        success=True,
        servers=servers
    )

@router.post("/servers", response_model=MCPServerResponse, status_code=status.HTTP_201_CREATED)
async def create_mcp_server(
    server: MCPServerCreate, 
    current_user: User = Depends(get_current_active_user)
):
    """Create a new MCP server configuration."""
    # Load existing servers
    servers = load_mcp_servers()
    
    # Generate a unique ID
    server_id = f"mcp-{str(uuid.uuid4())[:8]}"
    
    # Determine URL from port
    port = get_port_from_args(server.args)
    url = f"http://localhost:{port}"
    
    # Create the server entry
    new_server = MCPServer(
        id=server_id,
        name=server.name,
        type=server.type,
        command=server.command,
        args=server.args,
        env=server.env or {},
        description=server.description,
        url=url,
        apiKey=server.apiKey,
        status="disconnected"
    )
    
    # Add to servers
    servers[server_id] = new_server.dict()
    
    # Save servers
    if not save_mcp_servers(servers):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save MCP server configuration"
        )
    
    logger.info(f"Created new MCP server: {server.name} ({server_id})")
    
    return MCPServerResponse(
        success=True,
        server=new_server
    )

@router.get("/servers/{server_id}", response_model=MCPServerResponse)
async def get_mcp_server(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific MCP server configuration by ID."""
    # Load servers
    servers = load_mcp_servers()
    
    if server_id not in servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    return MCPServerResponse(
        success=True,
        server=MCPServer(**servers[server_id])
    )

@router.put("/servers/{server_id}", response_model=MCPServerResponse)
async def update_mcp_server(
    server_id: str,
    server_update: MCPServerUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update an MCP server configuration."""
    # Load servers
    servers = load_mcp_servers()
    
    if server_id not in servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    # Get the existing server
    existing_server = MCPServer(**servers[server_id])
    
    # Update fields that are provided
    update_data = server_update.dict(exclude_unset=True, exclude_none=True)
    
    for key, value in update_data.items():
        setattr(existing_server, key, value)
    
    # Update URL if port changed
    if "args" in update_data:
        port = get_port_from_args(existing_server.args)
        existing_server.url = f"http://localhost:{port}"
    
    # Save the updated server
    servers[server_id] = existing_server.dict()
    
    if not save_mcp_servers(servers):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save MCP server configuration"
        )
    
    logger.info(f"Updated MCP server: {existing_server.name} ({server_id})")
    
    return MCPServerResponse(
        success=True,
        server=existing_server
    )

@router.delete("/servers/{server_id}", response_model=MCPServerResponse)
async def delete_mcp_server(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete an MCP server configuration."""
    # Load servers
    servers = load_mcp_servers()
    
    if server_id not in servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    # Get the server for response
    server = MCPServer(**servers[server_id])
    
    # Stop the server if it's running
    if server.status == "connected" and server.pid:
        stop_mcp_server_process(server)
    
    # Delete the server
    del servers[server_id]
    
    # Save the updated servers
    if not save_mcp_servers(servers):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save MCP server configuration"
        )
    
    logger.info(f"Deleted MCP server: {server.name} ({server_id})")
    
    return MCPServerResponse(
        success=True,
        server=server,
        message=f"Server {server.name} deleted"
    )

@router.post("/servers/{server_id}/start", response_model=MCPServerResponse)
async def start_mcp_server(
    server_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    """Start an MCP server."""
    # Load servers
    servers = load_mcp_servers()
    
    if server_id not in servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    # Get the server
    server = MCPServer(**servers[server_id])
    
    # Check if already running
    if server.status == "connected" and server.pid:
        return MCPServerResponse(
            success=True,
            server=server,
            message=f"Server {server.name} is already running"
        )
    
    # Start the server
    result = start_mcp_server_process(server)
    
    if not result.success:
        return MCPServerResponse(
            success=False,
            server=server,
            message=f"Failed to start server: {result.message}"
        )
    
    # Update the server status
    server.status = "connected"
    server.pid = result.pid
    servers[server_id] = server.dict()
    
    # Save the updated servers
    if not save_mcp_servers(servers):
        # Try to stop the server if save failed
        background_tasks.add_task(stop_mcp_server_process, server)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save MCP server configuration"
        )
    
    logger.info(f"Started MCP server: {server.name} ({server_id})")
    
    return MCPServerResponse(
        success=True,
        server=server,
        message=f"Server {server.name} started"
    )

@router.post("/servers/{server_id}/stop", response_model=MCPServerResponse)
async def stop_mcp_server(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Stop an MCP server."""
    # Load servers
    servers = load_mcp_servers()
    
    if server_id not in servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    # Get the server
    server = MCPServer(**servers[server_id])
    
    # Check if not running
    if server.status != "connected" or not server.pid:
        return MCPServerResponse(
            success=True,
            server=server,
            message=f"Server {server.name} is not running"
        )
    
    # Stop the server
    success = stop_mcp_server_process(server)
    
    if not success:
        return MCPServerResponse(
            success=False,
            server=server,
            message=f"Failed to stop server {server.name}"
        )
    
    # Update the server status
    server.status = "disconnected"
    server.pid = None
    servers[server_id] = server.dict()
    
    # Save the updated servers
    if not save_mcp_servers(servers):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save MCP server configuration"
        )
    
    logger.info(f"Stopped MCP server: {server.name} ({server_id})")
    
    return MCPServerResponse(
        success=True,
        server=server,
        message=f"Server {server.name} stopped"
    )

@router.get("/servers/{server_id}/status", response_model=MCPServerResponse)
async def get_mcp_server_status(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get the status of an MCP server."""
    # Load servers
    servers = load_mcp_servers()
    
    if server_id not in servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    # Get the server
    server = MCPServer(**servers[server_id])
    
    # Check if the server is actually running
    if server.status == "connected" and server.pid:
        try:
            import psutil
            if not psutil.pid_exists(server.pid):
                # Update the server status
                server.status = "disconnected"
                server.pid = None
                servers[server_id] = server.dict()
                save_mcp_servers(servers)
        except ImportError:
            # psutil not available, skip check
            pass
    
    return MCPServerResponse(
        success=True,
        server=server
    )

@router.post("/tools/execute", response_model=MCPToolResponse)
async def execute_mcp_tool(
    tool_call: MCPToolCall,
    current_user: User = Depends(get_current_active_user)
):
    """Execute a tool call on an MCP server."""
    # Load servers
    servers = load_mcp_servers()
    
    if tool_call.serverId not in servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {tool_call.serverId} not found"
        )
    
    # Get the server
    server = MCPServer(**servers[tool_call.serverId])
    
    # Check if server is running
    if server.status != "connected":
        return MCPToolResponse(
            success=False,
            result=None,
            error=f"Server {server.name} is not running"
        )
    
    # Call the tool
    result = call_mcp_tool_on_server(server, tool_call.tool, tool_call.args)
    
    # Check if result is an error message
    if isinstance(result, str) and result.startswith("Error:"):
        return MCPToolResponse(
            success=False,
            result=None,
            error=result
        )
    
    return MCPToolResponse(
        success=True,
        result=result
    )

@router.get("/tools/{server_id}", response_model=Dict[str, Any])
async def get_mcp_server_tools_endpoint(
    server_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get available tools from an MCP server."""
    # Load servers
    servers = load_mcp_servers()
    
    if server_id not in servers:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MCP server with ID {server_id} not found"
        )
    
    # Get the server
    server = MCPServer(**servers[server_id])
    
    # Check if server is running
    if server.status != "connected":
        return {
            "success": False,
            "error": f"Server {server.name} is not running",
            "tools": []
        }
    
    # Get the tools
    tools = get_server_tools(server)
    
    return {
        "success": True,
        "tools": [tool.dict() for tool in tools]
    }

@router.get("/servers/templates", response_model=Dict[str, Any])
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
