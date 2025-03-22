"""
Routers package for Open WebUI.
"""

# Import all routers
from .api import router as api_router
from .env import router as env_router
from .auths import router as auths_router
from .configs import router as configs_router
from .models import router as models_router
from .chat import router as chat_router
from .events import router as events_router
from .tools import router as tools_router
from .users import router as users_router
from .utils import router as utils_router
from .storage import router as storage_router
from .system import router as system_router
from .knowledge import router as knowledge_router
from .evaluations import router as evaluations_router
from .functions import router as functions_router
from .mcp import router as mcp_router

# Export all routers
__all__ = [
    "api_router",
    "env_router",
    "auths_router",
    "configs_router",
    "models_router",
    "chat_router",
    "events_router",
    "tools_router",
    "users_router",
    "utils_router",
    "storage_router",
    "system_router",
    "knowledge_router",
    "evaluations_router",
    "functions_router",
    "mcp_router",
]
