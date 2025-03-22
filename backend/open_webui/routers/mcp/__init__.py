"""
MCP (Model Context Protocol) Router Package.

This package provides API endpoints for managing and interacting with MCP servers.
"""

from fastapi import APIRouter

# Import sub-routers
from .servers import router as servers_router
from .tools import router as tools_router
from .config import router as config_router

# Create main router
router = APIRouter(
    prefix="/api/mcp",
    tags=["mcp"]
)

# Include sub-routers
router.include_router(servers_router, prefix="/servers")
router.include_router(tools_router, prefix="/tools")
router.include_router(config_router, prefix="/config")
