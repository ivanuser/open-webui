"""
API routers module

This module initializes all API routers.
"""

from fastapi import APIRouter

from .auths import router as auths_router
from .users import router as users_router
from .configs import router as configs_router
from .models import router as models_router
from .chats import router as chats_router
from .messages import router as messages_router
from .channels import router as channels_router
from .prompts import router as prompts_router
from .folders import router as folders_router
from .functions import router as functions_router
from .endpoints import router as endpoints_router
from .groups import router as groups_router
from .knowledge import router as knowledge_router
from .files import router as files_router
from .memories import router as memories_router
from .evaluations import router as evaluations_router
from .tools import router as tools_router
from .images import router as images_router
from .audio import router as audio_router
from .mcp import router as mcp_router

# Create main router
router = APIRouter(prefix="/api")

# Include all routers
router.include_router(auths_router)
router.include_router(users_router)
router.include_router(configs_router)
router.include_router(models_router)
router.include_router(chats_router)
router.include_router(messages_router)
router.include_router(channels_router)
router.include_router(prompts_router)
router.include_router(folders_router)
router.include_router(functions_router)
router.include_router(endpoints_router)
router.include_router(groups_router)
router.include_router(knowledge_router)
router.include_router(files_router)
router.include_router(memories_router)
router.include_router(evaluations_router)
router.include_router(tools_router)
router.include_router(images_router)
router.include_router(audio_router)
router.include_router(mcp_router)  # Add MCP router
