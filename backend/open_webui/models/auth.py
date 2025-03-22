"""
Authentication models and utilities for Open WebUI.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel, Field

from ..config import get_settings

# Create logger
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create security scheme
security = HTTPBearer()

# Secret key for JWT
SECRET_KEY = settings.WEBUI_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.WEBUI_JWT_EXPIRY_TIME


class Token(BaseModel):
    """Token model."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data model."""
    username: Optional[str] = None


class UserCreate(BaseModel):
    """User creation model."""
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None


class User(BaseModel):
    """User model."""
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: bool = False
    is_admin: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    ui_settings: Optional[Dict[str, Any]] = None


class UserInDB(User):
    """User in database model."""
    hashed_password: str


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create access token.
    
    Args:
        data (dict): Data to encode
        expires_delta (Optional[timedelta], optional): Expiry time. Defaults to None.
    
    Returns:
        str: Access token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


def verify_token(token: str) -> Optional[TokenData]:
    """
    Verify token.
    
    Args:
        token (str): Token to verify
    
    Returns:
        Optional[TokenData]: Token data if valid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            return None
        
        return TokenData(username=username)
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Get current user from token.
    
    Args:
        credentials (HTTPAuthorizationCredentials, optional): Credentials. Defaults to Depends(security).
    
    Raises:
        HTTPException: If credentials are invalid
    
    Returns:
        User: Current user
    """
    # Check if authentication is disabled
    if not settings.WEBUI_AUTH:
        # Return dummy admin user if auth is disabled
        return User(
            id=1,
            username="admin",
            is_admin=True
        )
    
    # Verify token
    token_data = verify_token(credentials.credentials)
    
    if token_data is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Here you would normally fetch the user from the database
    # For now, we'll just return a dummy user
    user = User(
        id=1,
        username=token_data.username,
        is_admin=True
    )
    
    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get current active user.
    
    Args:
        current_user (User, optional): Current user. Defaults to Depends(get_current_user).
    
    Raises:
        HTTPException: If user is disabled
    
    Returns:
        User: Current active user
    """
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    return current_user
