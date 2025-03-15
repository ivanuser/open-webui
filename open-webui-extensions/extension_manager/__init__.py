"""
Open WebUI Extension Manager
Provides a framework for managing extensions in Open WebUI
"""

from importlib import import_module
import os
import sys
import logging

# Setup logging
logger = logging.getLogger("extension_manager")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Import backend components
try:
    from .backend.api import register_extension_routes
    from .backend.registry import ExtensionRegistry
    from .backend.models import Extension
except ImportError as e:
    logger.error(f"Error importing extension manager components: {e}")
    raise

# Global extension registry
extension_registry = None

def initialize_extension_manager(app=None, database=None):
    """
    Initialize the extension manager and register routes with the provided FastAPI app
    
    Args:
        app: FastAPI application instance
        database: Database connection
        
    Returns:
        ExtensionRegistry: The initialized extension registry
    """
    global extension_registry
    
    logger.info("Initializing Extension Manager")
    
    # Initialize the extension registry
    extension_registry = ExtensionRegistry(database)
    
    # Register API routes if app is provided
    if app:
        register_extension_routes(app, extension_registry)
        logger.info("Extension API routes registered")
    
    # Discover and load extensions
    extension_registry.discover_extensions()
    
    return extension_registry

def get_extension_registry():
    """
    Get the global extension registry instance
    
    Returns:
        ExtensionRegistry: The global extension registry
    """
    global extension_registry
    
    if extension_registry is None:
        logger.warning("Extension registry accessed before initialization")
        
    return extension_registry
