"""
User models for Open WebUI.
"""

import datetime
from typing import Optional, Dict, Any, List

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from open_webui.internal.db import Base, JSONField, get_db

class UserModel(Base):
    """User model for database."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    ui_settings = Column(JSONField, nullable=True)

class Users:
    """User operations."""
    
    @staticmethod
    async def get_by_username(username: str):
        """Get user by username."""
        with get_db() as db:
            return db.query(UserModel).filter(UserModel.username == username).first()
    
    @staticmethod
    async def get_by_id(user_id: int):
        """Get user by ID."""
        with get_db() as db:
            return db.query(UserModel).filter(UserModel.id == user_id).first()
    
    @staticmethod
    async def create(user_data: Dict[str, Any]):
        """Create new user."""
        with get_db() as db:
            user = UserModel(**user_data)
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
    
    @staticmethod
    async def update(user_id: int, user_data: Dict[str, Any]):
        """Update existing user."""
        with get_db() as db:
            user = db.query(UserModel).filter(UserModel.id == user_id).first()
            
            if not user:
                return None
            
            for key, value in user_data.items():
                setattr(user, key, value)
            
            db.commit()
            db.refresh(user)
            return user
    
    @staticmethod
    async def delete(user_id: int):
        """Delete user."""
        with get_db() as db:
            user = db.query(UserModel).filter(UserModel.id == user_id).first()
            
            if not user:
                return False
            
            db.delete(user)
            db.commit()
            return True
    
    @staticmethod
    async def list():
        """List all users."""
        with get_db() as db:
            return db.query(UserModel).all()
    
    @staticmethod
    async def update_settings(user_id: int, settings: Dict[str, Any]):
        """Update user UI settings."""
        with get_db() as db:
            user = db.query(UserModel).filter(UserModel.id == user_id).first()
            
            if not user:
                return None
            
            if user.ui_settings is None:
                user.ui_settings = {}
            
            # Update settings
            user.ui_settings.update(settings)
            
            db.commit()
            db.refresh(user)
            return user
