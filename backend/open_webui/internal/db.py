"""
Database utilities for Open WebUI.
"""

import json
import logging
from contextlib import contextmanager
from typing import Iterator, Any, Dict, TypeVar, cast, Type, Optional

from sqlalchemy import create_engine, Column, TypeDecorator, JSON, TEXT
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from ..config import get_settings

# Create logger
logger = logging.getLogger(__name__)

# Get settings
settings = get_settings()

# Create engine
engine = create_engine(settings.OPENWEBUI_DB_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base
Base = declarative_base()

# Custom JSON Field for SQLAlchemy
class JSONField(TypeDecorator):
    """
    Represents a JSON-serialized data structure in SQLAlchemy.
    Provides transparent serialization/deserialization of JSON data.
    """
    
    impl = TEXT
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        """Convert Python object to JSON string for storage."""
        if value is None:
            return None
        return json.dumps(value)
    
    def process_result_value(self, value, dialect):
        """Convert stored JSON string back to Python object."""
        if value is None:
            return None
        return json.loads(value)

@contextmanager
def get_db() -> Iterator[Session]:
    """
    Get database session.
    
    Returns:
        Iterator[Session]: Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
