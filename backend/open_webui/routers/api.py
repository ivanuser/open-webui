"""
External API router for Open WebUI.
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
    prefix="/api",
    tags=["api"]
)

class ApiResponse(BaseModel):
    """API response model."""
    success: bool
    message: str
    data: Dict[str, Any] = {}


@router.get("/", response_model=ApiResponse)
async def get_api_status():
    """Get API status."""
    return ApiResponse(
        success=True,
        message="API is running",
        data={"version": "1.0.0"}
    )


@router.get("/info", response_model=ApiResponse)
async def get_api_info(current_user: User = Depends(get_current_active_user)):
    """Get API information."""
    return ApiResponse(
        success=True,
        message="API information",
        data={
            "version": "1.0.0",
            "name": "Open WebUI API",
            "description": "API for Open WebUI"
        }
    )
