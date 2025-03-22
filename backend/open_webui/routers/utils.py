"""
Utility router for Open WebUI.
"""

import logging
import time
import platform
import psutil
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..models.auth import get_current_active_user, User
from ..config import get_settings

# Create logger
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create router
router = APIRouter(
    prefix="/api/utils",
    tags=["utils"]
)

class UtilResponse(BaseModel):
    """Utility response."""
    success: bool
    data: Dict[str, Any] = {}
    message: Optional[str] = None


@router.get("/status", response_model=UtilResponse)
async def get_status():
    """Get system status."""
    status_info = {
        "online": True,
        "timestamp": int(time.time())
    }
    
    return UtilResponse(
        success=True,
        data=status_info
    )


@router.get("/system", response_model=UtilResponse)
async def get_system_info(current_user: User = Depends(get_current_active_user)):
    """Get system information."""
    # Only allow admin users to access system information
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access system information"
        )
    
    # Get system information
    system_info = {
        "os": platform.system(),
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "cpu_count": psutil.cpu_count(),
        "memory_total": psutil.virtual_memory().total,
        "memory_available": psutil.virtual_memory().available,
        "memory_percent": psutil.virtual_memory().percent,
        "disk_total": psutil.disk_usage("/").total,
        "disk_used": psutil.disk_usage("/").used,
        "disk_free": psutil.disk_usage("/").free,
        "disk_percent": psutil.disk_usage("/").percent
    }
    
    return UtilResponse(
        success=True,
        data=system_info
    )


@router.get("/ping", response_model=UtilResponse)
async def ping():
    """Ping endpoint."""
    return UtilResponse(
        success=True,
        message="pong"
    )
