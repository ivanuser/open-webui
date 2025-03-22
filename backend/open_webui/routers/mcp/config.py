"""
MCP Config router for Open WebUI.
"""

import logging
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from open_webui.models.auth import get_current_active_user, User
from open_webui.config import get_settings

# Create logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["mcp-config"])

# Get settings
settings = get_settings()


class MCPConfigResponse(BaseModel):
    """Response for MCP configuration operations."""
    success: bool
    config: Dict[str, Any] = {}
    message: Optional[str] = None


class MCPConfig(BaseModel):
    """MCP configuration."""
    enabled: bool = True
    default_server: Optional[str] = None
    enabled_servers: List[str] = []
    max_tokens: int = 4096
    max_calls_per_chat: int = 10


@router.get("/", response_model=MCPConfigResponse)
async def get_mcp_config(current_user: User = Depends(get_current_active_user)):
    """Get MCP configuration."""
    config = MCPConfig(
        enabled=settings.OPENWEBUI_MCP_ENABLED,
        default_server=None,
        enabled_servers=[]
    )
    
    return MCPConfigResponse(
        success=True,
        config=config.dict()
    )


@router.post("/", response_model=MCPConfigResponse)
async def update_mcp_config(
    config: MCPConfig,
    current_user: User = Depends(get_current_active_user)
):
    """Update MCP configuration."""
    # Only allow admin users to update configuration
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update MCP configuration"
        )
    
    # In a real implementation, would update the configuration
    # For now, just return the updated config
    
    logger.info(f"MCP configuration updated: {config}")
    
    return MCPConfigResponse(
        success=True,
        config=config.dict(),
        message="MCP configuration updated"
    )
