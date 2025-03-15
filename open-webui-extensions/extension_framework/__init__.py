"""
Open WebUI Extension Framework
Provides base classes and utilities for developing extensions
"""

from .base import Extension, UIExtension, APIExtension, ModelExtension, ToolExtension, ThemeExtension
from .decorators import extension_hook, extension_action, extension_config
from .hooks import register_hook, trigger_hook, get_hooks
from .utils import get_extension_path, get_extension_static_path

__all__ = [
    'Extension',
    'UIExtension',
    'APIExtension',
    'ModelExtension',
    'ToolExtension',
    'ThemeExtension',
    'extension_hook',
    'extension_action',
    'extension_config',
    'register_hook',
    'trigger_hook',
    'get_hooks',
    'get_extension_path',
    'get_extension_static_path'
]
