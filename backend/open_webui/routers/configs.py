"""
Configuration router for Open WebUI.
"""

import logging
from typing import Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..models.auth import get_current_active_user, User

# Create logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/configs",
    tags=["configs"]
)

class ConfigResponse(BaseModel):
    """Configuration response model."""
    success: bool
    data: Dict[str, Any] = {}


@router.get("/", response_model=ConfigResponse)
async def get_configuration(current_user: User = Depends(get_current_active_user)):
    """Get application configuration."""
    # Only allow admin users to access full configuration
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access configuration"
        )
    
    # Get configuration
    config = {
        "app_name": "Open WebUI",
        "version": "1.0.0",
        "auth_enabled": True,
        "mcp_enabled": True
    }
    
    return ConfigResponse(
        success=True,
        data=config
    )


@router.post("/update", response_model=ConfigResponse)
async def update_configuration(
    config: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Update application configuration."""
    # Only allow admin users to update configuration
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update configuration"
        )
    
    # Update configuration
    # (This is a stub, real implementation would persist changes)
    logger.info(f"Configuration update requested: {config}")
    
    return ConfigResponse(
        success=True,
        data=config
    )
