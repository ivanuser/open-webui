"""
Users router for Open WebUI.
"""

import logging
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ..models.auth import get_current_active_user, User, UserCreate

# Create logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/users",
    tags=["users"]
)

class UserUpdateRequest(BaseModel):
    """User update request."""
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    is_admin: Optional[bool] = None
    ui: Optional[Dict[str, Any]] = None


class UserResponse(BaseModel):
    """User response."""
    success: bool
    user: Optional[User] = None
    users: List[User] = []
    message: Optional[str] = None


@router.get("/me", response_model=UserResponse)
async def get_current_user(current_user: User = Depends(get_current_active_user)):
    """Get current user."""
    return UserResponse(
        success=True,
        user=current_user
    )


@router.put("/me", response_model=UserResponse)
async def update_current_user(
    update: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Update current user."""
    # Stub implementation - would update in a database
    # Create a copy of the current user
    updated_user = User(
        id=current_user.id,
        username=current_user.username,
        email=update.email or current_user.email,
        full_name=update.full_name or current_user.full_name,
        disabled=update.disabled if update.disabled is not None else current_user.disabled,
        is_admin=current_user.is_admin,  # Don't allow changing admin status
        ui_settings=update.ui or current_user.ui_settings
    )
    
    logger.info(f"User {current_user.username} updated")
    
    return UserResponse(
        success=True,
        user=updated_user
    )


@router.get("/", response_model=UserResponse)
async def get_users(current_user: User = Depends(get_current_active_user)):
    """Get all users."""
    # Only allow admin users to list all users
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to list users"
        )
    
    # Stub implementation - would fetch from a database
    users = [
        User(
            id=1,
            username="admin",
            email="admin@example.com",
            full_name="Admin User",
            is_admin=True
        ),
        User(
            id=2,
            username="user",
            email="user@example.com",
            full_name="Regular User",
            is_admin=False
        )
    ]
    
    return UserResponse(
        success=True,
        users=users
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Get user by ID."""
    # Only allow admin users or the user themselves
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    # Stub implementation - would fetch from a database
    users = {
        1: User(
            id=1,
            username="admin",
            email="admin@example.com",
            full_name="Admin User",
            is_admin=True
        ),
        2: User(
            id=2,
            username="user",
            email="user@example.com",
            full_name="Regular User",
            is_admin=False
        )
    }
    
    if user_id not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    return UserResponse(
        success=True,
        user=users[user_id]
    )


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    update: UserUpdateRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Update user by ID."""
    # Only allow admin users or the user themselves
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    # Stub implementation - would fetch from a database
    users = {
        1: User(
            id=1,
            username="admin",
            email="admin@example.com",
            full_name="Admin User",
            is_admin=True
        ),
        2: User(
            id=2,
            username="user",
            email="user@example.com",
            full_name="Regular User",
            is_admin=False
        )
    }
    
    if user_id not in users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    
    # Get existing user
    user = users[user_id]
    
    # Create updated user
    updated_user = User(
        id=user.id,
        username=user.username,
        email=update.email or user.email,
        full_name=update.full_name or user.full_name,
        disabled=update.disabled if update.disabled is not None else user.disabled,
        is_admin=update.is_admin if current_user.is_admin and update.is_admin is not None else user.is_admin,
        ui_settings=update.ui or user.ui_settings
    )
    
    logger.info(f"User {user.username} updated")
    
    return UserResponse(
        success=True,
        user=updated_user
    )


@router.post("/", response_model=UserResponse)
async def create_user(
    user_create: UserCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new user."""
    # Only allow admin users to create users
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create users"
        )
    
    # Stub implementation - would create in a database
    # Import here to avoid circular imports
    from ..models.auths import create_user as auth_create_user
    
    # Create user
    user = await auth_create_user(user_create)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User creation failed"
        )
    
    logger.info(f"User {user.username} created")
    
    return UserResponse(
        success=True,
        user=user
    )


@router.delete("/{user_id}", response_model=UserResponse)
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete user by ID."""
    # Only allow admin users to delete users
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete users"
        )
    
    # Don't allow deleting self
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete self"
        )
    
    # Stub implementation - would delete from a database
    logger.info(f"User {user_id} deleted")
    
    return UserResponse(
        success=True,
        message=f"User {user_id} deleted"
    )
