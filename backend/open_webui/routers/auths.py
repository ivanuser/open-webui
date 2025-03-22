"""
Authentication router for Open WebUI.
"""

import logging
from datetime import timedelta
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from open_webui.models.auths import (
    User, UserCreate, Token, authenticate_user,
    create_access_token, get_current_user, create_user
)
from open_webui.config import get_settings

# Create logger
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create router
router = APIRouter(
    prefix="/api/auth",
    tags=["auths"]
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")


async def get_current_active_user(token: str = Depends(oauth2_scheme)):
    """Get current active user."""
    
    # Check if authentication is disabled
    if not settings.WEBUI_AUTH:
        # Return dummy admin user if auth is disabled
        return User(
            id=1,
            username="admin",
            is_admin=True
        )
    
    # Get current user from token
    current_user = await get_current_user(token)
    
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if current_user.disabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return current_user


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login to get access token."""
    
    # Check if authentication is disabled
    if not settings.WEBUI_AUTH:
        # Return dummy token if auth is disabled
        access_token = create_access_token(
            data={"sub": "admin"}
        )
        return {"access_token": access_token, "token_type": "bearer"}
    
    # Authenticate user
    user = await authenticate_user(form_data.username, form_data.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.WEBUI_JWT_EXPIRY_TIME)
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=User)
async def register_user(user_data: UserCreate):
    """Register new user."""
    
    # Check if authentication is disabled
    if not settings.WEBUI_AUTH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authentication is disabled"
        )
    
    # Create user
    user = await create_user(user_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User registration failed"
        )
    
    return user


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user."""
    
    return current_user


@router.post("/me/settings", response_model=User)
async def update_user_settings(
    settings: Dict[str, Any],
    current_user: User = Depends(get_current_active_user)
):
    """Update user settings."""
    
    # Check if authentication is disabled
    if not settings.WEBUI_AUTH:
        return current_user
    
    # Update user settings in database
    from open_webui.models.users import Users
    
    updated_user = await Users.update_settings(current_user.id, settings)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update user settings"
        )
    
    # Convert SQLAlchemy model to Pydantic model
    user_out = User(
        id=updated_user.id,
        username=updated_user.username,
        email=updated_user.email,
        full_name=updated_user.full_name,
        disabled=updated_user.disabled,
        is_admin=updated_user.is_admin,
        ui_settings=updated_user.ui_settings
    )
    
    return user_out
