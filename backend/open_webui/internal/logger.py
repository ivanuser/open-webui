"""
Logging configuration for Open WebUI.
"""

import logging
import sys
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path
from ..config import get_settings

def setup_logging():
    """
    Set up logging configuration.
    """
    try:
        settings = get_settings()
        log_level = getattr(logging, settings.OPENWEBUI_LOG_LEVEL)
    except (ImportError, AttributeError):
        # Fallback to INFO if settings can't be loaded
        log_level = logging.INFO
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] [%(name)s] %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Clear existing handlers
    if root_logger.handlers:
        for handler in root_logger.handlers:
            root_logger.removeHandler(handler)
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(log_level)
    root_logger.addHandler(console_handler)
    
    # Try to set up file logging if possible
    try:
        # Get log directory from settings or use default
        log_dir = os.environ.get("OPENWEBUI_LOG_DIR")
        if not log_dir:
            # Use base directory or home directory
            base_dir = os.environ.get("OPENWEBUI_BASE_DIR", os.path.expanduser("~/.openwebui"))
            log_dir = os.path.join(base_dir, "logs")
        
        # Create logs directory if it doesn't exist
        Path(log_dir).mkdir(parents=True, exist_ok=True)
        
        # File handler with rotation
        log_file = os.path.join(log_dir, "open-webui.log")
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5
        )
        file_handler.setFormatter(formatter)
        file_handler.setLevel(log_level)
        root_logger.addHandler(file_handler)
        
        logging.getLogger("open-webui").info(f"Logging to file: {log_file}")
    except Exception as e:
        logging.getLogger("open-webui").warning(f"Could not set up file logging: {e}")
    
    # Set lower log levels for noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    
    # Return configured logger for convenience
    return logging.getLogger("open-webui")
