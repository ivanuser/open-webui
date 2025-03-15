"""
Utility functions for extension development
"""

import os
import json
import logging
import importlib.util
import sys
from typing import Any, Dict, List, Optional, Union

# Setup logging
logger = logging.getLogger("extension_utils")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

def get_extension_path(extension_name: str) -> str:
    """
    Get the absolute path to an extension directory
    
    Args:
        extension_name: Name of the extension
        
    Returns:
        Absolute path to the extension directory
    """
    # Check in default extension directory
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    example_dir = os.path.join(root_dir, 'example_extension')
    
    if extension_name == 'example':
        return example_dir
    
    # Check in user-installed extensions
    user_dir = os.path.join(root_dir, '..', 'extensions', extension_name)
    if os.path.exists(user_dir):
        return user_dir
    
    # If not found, return the default example directory
    logger.warning(f"Extension directory not found for {extension_name}, using example directory")
    return example_dir

def get_extension_static_path(extension_name: str) -> str:
    """
    Get the absolute path to an extension's static files directory
    
    Args:
        extension_name: Name of the extension
        
    Returns:
        Absolute path to the extension's static files directory
    """
    extension_path = get_extension_path(extension_name)
    static_path = os.path.join(extension_path, 'static')
    
    if not os.path.exists(static_path):
        os.makedirs(static_path)
        
    return static_path

def load_extension_module(extension_name: str, module_name: str) -> Optional[Any]:
    """
    Load a Python module from an extension
    
    Args:
        extension_name: Name of the extension
        module_name: Name of the module to load
        
    Returns:
        Loaded module if successful, None otherwise
    """
    extension_path = get_extension_path(extension_name)
    module_path = os.path.join(extension_path, f"{module_name}.py")
    
    if not os.path.exists(module_path):
        logger.error(f"Module not found: {module_path}")
        return None
    
    try:
        spec = importlib.util.spec_from_file_location(
            f"open_webui_extension_{extension_name}_{module_name}",
            module_path
        )
        module = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = module
        spec.loader.exec_module(module)
        
        return module
    except Exception as e:
        logger.error(f"Error loading module {module_name} from extension {extension_name}: {e}")
        return None

def load_extension_config(extension_name: str) -> Dict[str, Any]:
    """
    Load an extension's configuration
    
    Args:
        extension_name: Name of the extension
        
    Returns:
        Extension configuration dictionary
    """
    extension_path = get_extension_path(extension_name)
    config_path = os.path.join(extension_path, 'config.json')
    
    if not os.path.exists(config_path):
        logger.warning(f"Configuration file not found for extension {extension_name}")
        return {}
    
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading configuration for extension {extension_name}: {e}")
        return {}

def save_extension_config(extension_name: str, config: Dict[str, Any]) -> bool:
    """
    Save an extension's configuration
    
    Args:
        extension_name: Name of the extension
        config: Configuration dictionary to save
        
    Returns:
        True if the configuration was saved successfully, False otherwise
    """
    extension_path = get_extension_path(extension_name)
    config_path = os.path.join(extension_path, 'config.json')
    
    try:
        with open(config_path, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving configuration for extension {extension_name}: {e}")
        return False

def load_extension_manifest(extension_name: str) -> Dict[str, Any]:
    """
    Load an extension's manifest
    
    Args:
        extension_name: Name of the extension
        
    Returns:
        Extension manifest dictionary
    """
    extension_path = get_extension_path(extension_name)
    manifest_path = os.path.join(extension_path, 'extension.json')
    
    if not os.path.exists(manifest_path):
        logger.warning(f"Manifest file not found for extension {extension_name}")
        return {}
    
    try:
        with open(manifest_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error loading manifest for extension {extension_name}: {e}")
        return {}

def get_installed_extensions() -> List[str]:
    """
    Get a list of installed extensions
    
    Returns:
        List of extension names
    """
    # Define the extensions directory
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    extensions_dir = os.path.join(root_dir, '..', 'extensions')
    
    if not os.path.exists(extensions_dir):
        logger.warning(f"Extensions directory not found: {extensions_dir}")
        return []
    
    # Get subdirectories that contain extension.json
    extensions = []
    
    for entry in os.listdir(extensions_dir):
        entry_path = os.path.join(extensions_dir, entry)
        
        if os.path.isdir(entry_path):
            manifest_path = os.path.join(entry_path, 'extension.json')
            
            if os.path.exists(manifest_path):
                extensions.append(entry)
    
    return extensions
