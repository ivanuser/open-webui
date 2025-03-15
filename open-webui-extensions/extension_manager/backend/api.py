"""
API endpoints for extension management
"""

import logging
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from .models import Extension, ExtensionCreate, ExtensionUpdate, ExtensionList
from .registry import ExtensionRegistry

# Setup logging
logger = logging.getLogger("extension_api")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Create router
router = APIRouter()

def register_extension_routes(app, extension_registry: ExtensionRegistry):
    """
    Register extension API routes with the FastAPI app
    
    Args:
        app: FastAPI application instance
        extension_registry: Extension registry instance
    """
    # Include the router with a prefix
    app.include_router(
        router,
        prefix="/api/extensions",
        tags=["extensions"],
        dependencies=[],
    )
    
    # Store registry in app state for dependency injection
    app.state.extension_registry = extension_registry

async def get_extension_registry(app):
    """
    Dependency to get the extension registry
    
    Args:
        app: FastAPI application instance
        
    Returns:
        ExtensionRegistry: The extension registry
    """
    return app.state.extension_registry

# API Routes

@router.get("/", response_model=ExtensionList)
async def list_extensions(
    registry: ExtensionRegistry = Depends(get_extension_registry)
):
    """
    List all installed extensions
    """
    extensions = registry.get_extensions()
    return ExtensionList(extensions=extensions)

@router.get("/{extension_id}", response_model=Extension)
async def get_extension(
    extension_id: str,
    registry: ExtensionRegistry = Depends(get_extension_registry)
):
    """
    Get details for a specific extension
    """
    extension = registry.get_extension(extension_id)
    if not extension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Extension not found: {extension_id}"
        )
    return extension

@router.post("/", response_model=Extension)
async def install_extension(
    extension: ExtensionCreate,
    registry: ExtensionRegistry = Depends(get_extension_registry)
):
    """
    Install a new extension
    """
    success, message, new_extension = registry.install_extension(extension.dict())
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    return new_extension

@router.delete("/{extension_id}")
async def uninstall_extension(
    extension_id: str,
    registry: ExtensionRegistry = Depends(get_extension_registry)
):
    """
    Uninstall an extension
    """
    success, message = registry.uninstall_extension(extension_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    return {"message": message}

@router.post("/{extension_id}/enable")
async def enable_extension(
    extension_id: str,
    registry: ExtensionRegistry = Depends(get_extension_registry)
):
    """
    Enable an extension
    """
    success, message = registry.enable_extension(extension_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    return {"message": message}

@router.post("/{extension_id}/disable")
async def disable_extension(
    extension_id: str,
    registry: ExtensionRegistry = Depends(get_extension_registry)
):
    """
    Disable an extension
    """
    success, message = registry.disable_extension(extension_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )
    return {"message": message}

@router.patch("/{extension_id}", response_model=Extension)
async def update_extension(
    extension_id: str,
    extension_update: ExtensionUpdate,
    registry: ExtensionRegistry = Depends(get_extension_registry)
):
    """
    Update an extension's configuration
    """
    # Get the current extension
    extension = registry.get_extension(extension_id)
    if not extension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Extension not found: {extension_id}"
        )
    
    # Update fields
    update_data = extension_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(extension, key, value)
    
    # Update in database if available
    if registry.database:
        # Update extension in database
        # This is a placeholder for actual database update
        pass
    
    return extension

@router.post("/{extension_id}/reload")
async def reload_extension(
    extension_id: str,
    registry: ExtensionRegistry = Depends(get_extension_registry)
):
    """
    Reload an extension
    """
    # First unload
    unload_success, unload_message = registry.unload_extension(extension_id)
    if not unload_success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to unload extension: {unload_message}"
        )
    
    # Then load again
    load_success, load_message = registry.load_extension(extension_id)
    if not load_success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to reload extension: {load_message}"
        )
    
    return {"message": f"Extension reloaded: {load_message}"}
