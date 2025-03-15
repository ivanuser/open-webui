"""
Decorators for extension development
"""

import functools
import inspect
from typing import Any, Callable, Dict, List, Optional, Union

from .hooks import register_hook

def extension_hook(hook_name: str):
    """
    Decorator for registering a function as a hook callback
    
    Args:
        hook_name: Name of the hook to register for
        
    Returns:
        Decorator function
    """
    def decorator(func):
        # Register the function with the hook system
        register_hook(hook_name, func)
        
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
            
        # Add metadata to the function
        wrapper.__extension_hook__ = hook_name
        
        return wrapper
        
    return decorator

def extension_action(action_name: str, description: str = ""):
    """
    Decorator for registering a function as an extension action
    
    Args:
        action_name: Name of the action
        description: Description of the action
        
    Returns:
        Decorator function
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
            
        # Add metadata to the function
        wrapper.__extension_action__ = {
            "name": action_name,
            "description": description,
            "parameters": inspect.signature(func).parameters
        }
        
        return wrapper
        
    return decorator

def extension_config(config_name: str, config_type: Any = str, default_value: Any = None, description: str = ""):
    """
    Decorator for a property getter/setter to make it part of the extension configuration
    
    Args:
        config_name: Name of the configuration option
        config_type: Type of the configuration option
        default_value: Default value for the configuration option
        description: Description of the configuration option
        
    Returns:
        Decorator function
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return func(*args, **kwargs)
            
        # Add metadata to the function
        wrapper.__extension_config__ = {
            "name": config_name,
            "type": config_type,
            "default": default_value,
            "description": description
        }
        
        return wrapper
        
    return decorator
