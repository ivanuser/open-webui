"""
Authentication models for Open WebUI.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, Field

from open_webui.models.users import UserModel, Users
from open_webui.config import get_settings

# Create logger
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Authentication constants
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


class User(BaseModel):
    """User model."""
    
    id: int
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: bool = False
    is_admin: bool = False
    ui_settings: Optional[Dict[str, Any]] = None
    
    model_config = {
        "from_attributes": True
    }


class UserCreate(BaseModel):
    """User creation model."""
    
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None


class UserInDB(User):
    """User in database model."""
    
    hashed_password: str


def verify_password(plain_password, hashed_password):
    """Verify password against hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    """Get hash of password."""
    return pwd_context.hash(password)


async def get_user(username: str):
    """Get user by username."""
    
    # Use Users.get_by_username to fetch user from database
    db_user = await Users.get_by_username(username)
    
    if db_user is None:
        return None
    
    # Convert SQLAlchemy model to Pydantic model
    user_dict = {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "disabled": db_user.disabled,
        "is_admin": db_user.is_admin,
        "hashed_password": db_user.hashed_password,
        "ui_settings": db_user.ui_settings
    }
    
    return UserInDB(**user_dict)


async def authenticate_user(username: str, password: str):
    """Authenticate user."""
    
    # Get user from database
    user = await get_user(username)
    
    if not user:
        return False
    
    # Verify password
    if not verify_password(password, user.hashed_password):
        return False
    
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create access token."""
    
    to_encode = data.copy()
    
    # Set expiry time
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    # Encode token
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt


async def get_current_user(token: str):
    """Get current user from token."""
    
    # Decode token
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        
        if username is None:
            return None
        
        token_data = TokenData(username=username)
    except JWTError:
        return None
    
    # Get user from database
    user = await get_user(token_data.username)
    
    if user is None:
        return None
    
    return user


async def create_user(user_data: UserCreate):
    """Create new user."""
    
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user data
    user_dict = user_data.dict(exclude={"password"})
    user_dict["hashed_password"] = hashed_password
    
    # Create user in database
    db_user = await Users.create(user_dict)
    
    if db_user is None:
        return None
    
    # Convert SQLAlchemy model to Pydantic model
    user_out = User(
        id=db_user.id,
        username=db_user.username,
        email=db_user.email,
        full_name=db_user.full_name,
        disabled=db_user.disabled,
        is_admin=db_user.is_admin,
        ui_settings=db_user.ui_settings
    )
    
    return user_out
