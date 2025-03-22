"""
Models router for Open WebUI.
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
    prefix="/api/models",
    tags=["models"]
)

class ModelInfo(BaseModel):
    """Model information."""
    id: str
    name: str
    description: str
    provider: str
    tags: List[str] = []
    capabilities: List[str] = []


class ModelsResponse(BaseModel):
    """Models response."""
    success: bool
    models: List[ModelInfo] = []


@router.get("/", response_model=ModelsResponse)
async def get_models(current_user: User = Depends(get_current_active_user)):
    """Get available models."""
    # Stub implementation - would fetch from a real source
    models = [
        ModelInfo(
            id="gpt-3.5-turbo",
            name="GPT-3.5 Turbo",
            description="OpenAI's GPT-3.5 Turbo model",
            provider="openai",
            tags=["gpt", "openai", "chat"],
            capabilities=["chat", "function-calling"]
        ),
        ModelInfo(
            id="gpt-4",
            name="GPT-4",
            description="OpenAI's GPT-4 model",
            provider="openai",
            tags=["gpt", "openai", "chat"],
            capabilities=["chat", "function-calling", "vision"]
        ),
        ModelInfo(
            id="llama-2-70b",
            name="Llama 2 (70B)",
            description="Meta's Llama 2 model (70B parameter version)",
            provider="local",
            tags=["llama", "meta", "chat"],
            capabilities=["chat"]
        )
    ]
    
    return ModelsResponse(
        success=True,
        models=models
    )


@router.get("/{model_id}", response_model=ModelInfo)
async def get_model(
    model_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get model by ID."""
    # Stub implementation - would fetch from a real source
    models = {
        "gpt-3.5-turbo": ModelInfo(
            id="gpt-3.5-turbo",
            name="GPT-3.5 Turbo",
            description="OpenAI's GPT-3.5 Turbo model",
            provider="openai",
            tags=["gpt", "openai", "chat"],
            capabilities=["chat", "function-calling"]
        ),
        "gpt-4": ModelInfo(
            id="gpt-4",
            name="GPT-4",
            description="OpenAI's GPT-4 model",
            provider="openai",
            tags=["gpt", "openai", "chat"],
            capabilities=["chat", "function-calling", "vision"]
        ),
        "llama-2-70b": ModelInfo(
            id="llama-2-70b",
            name="Llama 2 (70B)",
            description="Meta's Llama 2 model (70B parameter version)",
            provider="local",
            tags=["llama", "meta", "chat"],
            capabilities=["chat"]
        )
    }
    
    if model_id not in models:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {model_id} not found"
        )
    
    return models[model_id]
