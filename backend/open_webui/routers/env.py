"""
Environment variables router for Open WebUI.
"""

import os
import logging
from typing import Dict, Any, List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..models.auth import get_current_active_user, User

# Create logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/env",
    tags=["env"]
)

class EnvResponse(BaseModel):
    """Environment variables response model."""
    success: bool
    data: Dict[str, str] = {}


@router.get("/", response_model=EnvResponse)
async def get_environment_variables(current_user: User = Depends(get_current_active_user)):
    """Get environment variables."""
    # Only allow admin users to access environment variables
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access environment variables"
        )
    
    # Get allowed environment variables
    # NOTE: Only expose safe variables
    allowed_env_vars = [
        "OPENWEBUI_HOST",
        "OPENWEBUI_PORT",
        "OPENWEBUI_LOG_LEVEL",
        "OPENWEBUI_EMBEDDING_MODEL",
        "OPENWEBUI_MCP_ENABLED"
    ]
    
    env_vars = {}
    for var in allowed_env_vars:
        env_vars[var] = os.environ.get(var, "")
    
    return EnvResponse(
        success=True,
        data=env_vars
    )
