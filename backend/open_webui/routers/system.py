"""
System router for Open WebUI.
"""

import logging
import os
import platform
import psutil
import subprocess
from typing import Dict, Any, List, Optional

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
    prefix="/api/system",
    tags=["system"]
)

class SystemResponse(BaseModel):
    """System response."""
    success: bool
    data: Dict[str, Any] = {}
    message: Optional[str] = None


@router.get("/info", response_model=SystemResponse)
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
        "release": platform.release(),
        "version": platform.version(),
        "processor": platform.processor(),
        "architecture": platform.architecture(),
        "hostname": platform.node(),
        "python_version": platform.python_version(),
        "cpu_count": psutil.cpu_count(),
        "cpu_percent": psutil.cpu_percent(interval=0.1),
        "memory_total": psutil.virtual_memory().total,
        "memory_available": psutil.virtual_memory().available,
        "memory_percent": psutil.virtual_memory().percent,
        "disk_total": psutil.disk_usage("/").total,
        "disk_used": psutil.disk_usage("/").used,
        "disk_free": psutil.disk_usage("/").free,
        "disk_percent": psutil.disk_usage("/").percent,
        "network_interfaces": [interface for interface in psutil.net_if_addrs().keys()]
    }
    
    return SystemResponse(
        success=True,
        data=system_info
    )


@router.get("/processes", response_model=SystemResponse)
async def get_processes(current_user: User = Depends(get_current_active_user)):
    """Get running processes."""
    # Only allow admin users to access process information
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access process information"
        )
    
    # Get processes
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'username', 'status', 'cpu_percent', 'memory_percent']):
        try:
            processes.append(proc.info)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    
    return SystemResponse(
        success=True,
        data={"processes": processes}
    )


@router.get("/version", response_model=SystemResponse)
async def get_version():
    """Get application version."""
    # Get app version
    from ..internal.version import __version__
    
    return SystemResponse(
        success=True,
        data={"version": __version__}
    )


@router.post("/restart", response_model=SystemResponse)
async def restart_application(current_user: User = Depends(get_current_active_user)):
    """Restart the application."""
    # Only allow admin users to restart the application
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to restart the application"
        )
    
    # Stub implementation - would restart the application
    # In a real implementation, would use a proper restart mechanism
    logger.info("Application restart requested")
    
    # For demonstration purposes, just return success
    return SystemResponse(
        success=True,
        message="Application restart requested"
    )
