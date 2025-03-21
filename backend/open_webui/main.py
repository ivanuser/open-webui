"""
Open WebUI main application
"""

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

from . import constants
from .config import get_config
from .models.auth import User, get_current_active_user
from .routers import (
    auths, 
    channels, 
    chats, 
    configs, 
    evaluations, 
    files, 
    folders, 
    funcs, 
    groups, 
    images, 
    memories, 
    models, 
    prompts, 
    retrievals, 
    users, 
    mcp
)
from .socket import ChatSocketManager
from .tasks import schedule_tasks

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler.
    Initialize/cleanup code before the application starts/shutdowns.
    """
    # Initialize FastAPI Cache
    FastAPICache.init(InMemoryBackend())

    # Initialize FastAPI Limiter
    redis_url = os.environ.get("REDIS_URL")

    if not redis_url:
        await FastAPILimiter.init(None)
    else:
        # Redis rate limiter implementation
        import redis.asyncio as redis

        redis_connection = redis.from_url(redis_url)
        await FastAPILimiter.init(redis_connection)

    # Schedule tasks
    await schedule_tasks()

    yield

    # Cleanup code here


# Initialize app
app = FastAPI(
    title="OpenWebUI API",
    root_path=constants.ROOT_PATH,
    lifespan=lifespan,
)

# Configure CORS middleware
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiter - 100 requests per minute
rate_limiter = RateLimiter(times=100, seconds=60)

# Include routers
app.include_router(auths.router, prefix="/api")
app.include_router(configs.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(chats.router, prefix="/api")
app.include_router(channels.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(memories.router, prefix="/api")
app.include_router(images.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(folders.router, prefix="/api")
app.include_router(prompts.router, prefix="/api")
app.include_router(retrievals.router, prefix="/api")
app.include_router(evaluations.router, prefix="/api")
app.include_router(funcs.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(mcp.router, prefix="/api")

# Socket manager
chat_socket_manager = ChatSocketManager()

# Mount socket
app.add_websocket_route(
    "/api/socket",
    chat_socket_manager.handler,
    dependencies=[Depends(get_current_active_user)],
)

# Mount static files
static_files_dir = os.path.dirname(os.path.abspath(__file__)) + "/static"

# Serve static files only if the directory exists (to avoid errors with unit tests)
if os.path.exists(static_files_dir):
    app.mount("/static", StaticFiles(directory=static_files_dir), name="static")


@app.get("/api/health", dependencies=[Depends(rate_limiter)])
async def health() -> Dict[str, Any]:
    """Health check endpoint"""
    # Get config
    config = get_config()

    return {"healthy": True, "version": config.version}


@app.get("/api/sse-health", dependencies=[Depends(rate_limiter)])
async def sse_health(request: Request) -> Dict[str, Any]:
    """SSE health check - checks if server sent events are working properly"""
    supports_sse = False

    if "text/event-stream" in request.headers.get("accept", ""):
        supports_sse = True

    return {"healthy": True, "supports_sse": supports_sse}


@app.get("/api/user", dependencies=[Depends(rate_limiter)])
async def get_user(current_user: User = Depends(get_current_active_user)) -> Dict[str, Any]:
    """Get current user"""
    return {"user": current_user}
