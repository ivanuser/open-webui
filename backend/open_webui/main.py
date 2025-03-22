"""
Main module for Open WebUI.
"""

import os
import logging
import importlib.metadata
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .internal.paths import get_data_dir, get_server_dir, get_static_dir, get_storage_dir
from .internal.version import __version__
from .config import get_settings

from .models.auth import get_current_active_user, User
from .internal.logger import setup_logging

from .routers import (
    api,
    env,
    auths,
    configs,
    models,
    chat,
    events,
    tools,
    users,
    utils,
    storage,
    system,
    knowledge,
    evaluations,
    functions,
    mcp,
)

tags_metadata = [
    {"name": "api", "description": "External API operations"},
    {"name": "env", "description": "Environment variables"},
    {"name": "auths", "description": "Authentication operations"},
    {"name": "configs", "description": "Configuration operations"},
    {"name": "models", "description": "Model operations"},
    {"name": "chat", "description": "Chat operations"},
    {"name": "events", "description": "Event operations"},
    {"name": "tools", "description": "Tools operations"},
    {"name": "users", "description": "User operations"},
    {"name": "utils", "description": "Utility operations"},
    {"name": "storage", "description": "Storage operations"},
    {"name": "system", "description": "System operations"},
    {"name": "knowledge", "description": "Knowledge operations"},
    {"name": "evaluations", "description": "Evaluations operations"},
    {"name": "functions", "description": "Functions operations"},
    {"name": "mcp", "description": "Model Context Protocol operations"},
    {"name": "mcp-servers", "description": "MCP server operations"},
    {"name": "mcp-tools", "description": "MCP tool operations"},
    {"name": "mcp-config", "description": "MCP configuration operations"},
]

settings = get_settings()
logger = logging.getLogger("open-webui")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.debug("Starting application...")
    yield
    logger.debug("Shutting down application...")


def initialize_data_dirs():
    """
    Create the required directories if they don't exist
    """
    os.makedirs(get_data_dir(), exist_ok=True)
    os.makedirs(get_static_dir(), exist_ok=True)
    os.makedirs(get_storage_dir(), exist_ok=True)
    os.makedirs(get_server_dir(), exist_ok=True)


def create_app(
    memory_collection: Optional[List[str]] = None, init_dirs: bool = True
) -> FastAPI:
    """
    Create the FastAPI application with specified settings

    Args:
        memory_collection: List of memory collection endpoints
        init_dirs: Whether to initialize data directories

    Returns:
        The FastAPI application
    """
    setup_logging()

    if init_dirs:
        initialize_data_dirs()

    app = FastAPI(
        title="Open WebUI",
        description="Open WebUI API",
        version=__version__,
        openapi_tags=tags_metadata,
        lifespan=lifespan,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    app.include_router(api.router)
    app.include_router(env.router)
    app.include_router(auths.router)
    app.include_router(configs.router)
    app.include_router(models.router)
    app.include_router(chat.router)
    app.include_router(events.router)
    app.include_router(tools.router)
    app.include_router(users.router)
    app.include_router(utils.router)
    app.include_router(storage.router)
    app.include_router(system.router)
    app.include_router(knowledge.router)
    app.include_router(evaluations.router)
    app.include_router(functions.router)
    app.include_router(mcp.router)  # Add MCP router

    # Mount static files (storage)
    app.mount("/storage", StaticFiles(directory=get_storage_dir()), name="storage")

    # Global exception handler
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Uncaught exception: {str(exc)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    @app.get("/api/me")
    async def read_users_me(current_user: User = Depends(get_current_active_user)):
        return current_user

    return app
