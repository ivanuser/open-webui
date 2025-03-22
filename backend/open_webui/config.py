"""
Configuration management for Open WebUI.

This module provides configuration settings loaded from environment variables
with reasonable defaults.
"""

import os
import logging
from functools import lru_cache
from typing import Optional, List, Dict, Any

from pydantic import Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

class Settings(BaseSettings):
    """Application settings loaded from environment variables with defaults."""
    
    # General settings
    OPENWEBUI_HOST: str = Field("0.0.0.0", env="OPENWEBUI_HOST")
    OPENWEBUI_PORT: int = Field(8080, env="OPENWEBUI_PORT")
    OPENWEBUI_BASE_DIR: str = Field(os.path.expanduser("~/.openwebui"), env="OPENWEBUI_BASE_DIR")
    OPENWEBUI_DATA_DIR: Optional[str] = Field(None, env="OPENWEBUI_DATA_DIR")
    OPENWEBUI_STATIC_DIR: Optional[str] = Field(None, env="OPENWEBUI_STATIC_DIR")
    OPENWEBUI_STORAGE_DIR: Optional[str] = Field(None, env="OPENWEBUI_STORAGE_DIR")
    OPENWEBUI_SERVER_DIR: Optional[str] = Field(None, env="OPENWEBUI_SERVER_DIR")
    OPENWEBUI_MCP_DIR: Optional[str] = Field(None, env="OPENWEBUI_MCP_DIR")
    
    # Authentication settings
    WEBUI_AUTH: bool = Field(True, env="WEBUI_AUTH")
    WEBUI_SECRET_KEY: str = Field("default_insecure_key", env="WEBUI_SECRET_KEY")
    WEBUI_JWT_EXPIRY_TIME: int = Field(60 * 24 * 30, env="WEBUI_JWT_EXPIRY_TIME")  # 30 days in minutes
    
    # Database settings
    OPENWEBUI_DB_URL: str = Field("sqlite:///.openwebui.db", env="OPENWEBUI_DB_URL")
    
    # Logging settings
    OPENWEBUI_LOG_LEVEL: str = Field("INFO", env="OPENWEBUI_LOG_LEVEL")
    
    # MCP settings
    OPENWEBUI_MCP_ENABLED: bool = Field(True, env="OPENWEBUI_MCP_ENABLED")
    OPENWEBUI_MCP_SERVERS_FILE: str = Field("mcp_servers.json", env="OPENWEBUI_MCP_SERVERS_FILE")
    
    # Model settings
    OPENWEBUI_EMBEDDING_MODEL: str = Field(
        "sentence-transformers/all-MiniLM-L6-v2", 
        env="OPENWEBUI_EMBEDDING_MODEL"
    )
    
    @validator("OPENWEBUI_LOG_LEVEL")
    def validate_log_level(cls, v):
        """Validate log level."""
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            return "INFO"
        return v.upper()
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

@lru_cache()
def get_settings() -> Settings:
    """
    Get application settings.
    
    Returns:
        Settings: Application settings
    """
    try:
        settings = Settings()
        
        # Log selected settings at debug level
        logger.debug(f"Host: {settings.OPENWEBUI_HOST}")
        logger.debug(f"Port: {settings.OPENWEBUI_PORT}")
        logger.debug(f"Base dir: {settings.OPENWEBUI_BASE_DIR}")
        logger.debug(f"Log level: {settings.OPENWEBUI_LOG_LEVEL}")
        
        return settings
    except Exception as e:
        logger.error(f"Error loading settings: {e}")
        # Provide fallback settings in case of error
        return Settings(
            OPENWEBUI_HOST="0.0.0.0",
            OPENWEBUI_PORT=8080,
            WEBUI_SECRET_KEY="INSECURE_DEFAULT_KEY_CHANGE_ME",
            OPENWEBUI_LOG_LEVEL="INFO"
        )
