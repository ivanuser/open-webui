"""
MCP API Router

This module initializes the MCP API routes.
"""

from fastapi import APIRouter

from .servers import router as servers_router
from .tools import router as tools_router

# Create main router
router = APIRouter(prefix="/mcp", tags=["mcp"])

# Include sub-routers
router.include_router(servers_router)
router.include_router(tools_router)
