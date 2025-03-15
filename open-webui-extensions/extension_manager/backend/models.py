"""
Database models for extension management
"""

import uuid
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class ExtensionType(str, Enum):
    """Types of extensions that can be registered"""
    UI = "ui"
    API = "api"
    MODEL = "model"
    TOOL = "tool"
    THEME = "theme"
    
class ExtensionStatus(str, Enum):
    """Status of an extension"""
    ENABLED = "enabled"
    DISABLED = "disabled"
    ERROR = "error"

class Extension(BaseModel):
    """Extension database model"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    version: str
    author: str
    type: ExtensionType
    entry_point: str
    status: ExtensionStatus = ExtensionStatus.DISABLED
    config: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        orm_mode = True

class ExtensionCreate(BaseModel):
    """Schema for creating a new extension"""
    name: str
    description: str
    version: str
    author: str
    type: ExtensionType
    entry_point: str
    config: Dict[str, Any] = {}

class ExtensionUpdate(BaseModel):
    """Schema for updating an extension"""
    name: Optional[str] = None
    description: Optional[str] = None
    version: Optional[str] = None
    author: Optional[str] = None
    type: Optional[ExtensionType] = None
    entry_point: Optional[str] = None
    status: Optional[ExtensionStatus] = None
    config: Optional[Dict[str, Any]] = None

class ExtensionList(BaseModel):
    """Schema for listing extensions"""
    extensions: List[Extension]
    
def create_tables(database):
    """
    Create necessary tables in the database
    
    Args:
        database: Database connection
    """
    # This function would create tables using the provided database connection
    # For example, with SQLAlchemy:
    # Extension.__table__.create(database.engine, checkfirst=True)
    
    # For simplicity, this is a placeholder
    pass
