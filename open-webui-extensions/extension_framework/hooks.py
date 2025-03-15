"""
Hook system for extension integration
"""

import logging
from typing import Any, Callable, Dict, List, Optional

# Setup logging
logger = logging.getLogger("extension_hooks")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# Dictionary to store registered hooks
_hooks: Dict[str, List[Callable]] = {}

def register_hook(hook_name: str, callback: Callable) -> None:
    """
    Register a callback function for a hook
    
    Args:
        hook_name: Name of the hook to register for
        callback: Function to call when the hook is triggered
    """
    global _hooks
    
    if hook_name not in _hooks:
        _hooks[hook_name] = []
        
    _hooks[hook_name].append(callback)
    logger.debug(f"Registered hook callback for {hook_name}")

def trigger_hook(hook_name: str, *args, **kwargs) -> List[Any]:
    """
    Trigger a hook and call all registered callbacks
    
    Args:
        hook_name: Name of the hook to trigger
        *args: Positional arguments to pass to callbacks
        **kwargs: Keyword arguments to pass to callbacks
        
    Returns:
        List of return values from all callbacks
    """
    global _hooks
    
    if hook_name not in _hooks:
        logger.debug(f"No callbacks registered for hook {hook_name}")
        return []
        
    results = []
    
    for callback in _hooks[hook_name]:
        try:
            result = callback(*args, **kwargs)
            results.append(result)
        except Exception as e:
            logger.error(f"Error in hook callback for {hook_name}: {e}")
            
    return results

def get_hooks() -> Dict[str, List[Callable]]:
    """
    Get all registered hooks
    
    Returns:
        Dictionary of hook names to lists of callbacks
    """
    global _hooks
    return _hooks

# Define standard hooks
STANDARD_HOOKS = {
    # Lifecycle hooks
    "extension.initialize": "Called when an extension is being initialized",
    "extension.shutdown": "Called when an extension is being shut down",
    
    # UI hooks
    "ui.render.before": "Called before rendering the UI",
    "ui.render.after": "Called after rendering the UI",
    "ui.sidebar.render": "Called when rendering the sidebar",
    "ui.navbar.render": "Called when rendering the navbar",
    "ui.settings.render": "Called when rendering the settings page",
    "ui.chat.render": "Called when rendering the chat interface",
    "ui.chat.message.render": "Called when rendering a chat message",
    
    # API hooks
    "api.startup": "Called when the API server is starting up",
    "api.request.before": "Called before processing an API request",
    "api.request.after": "Called after processing an API request",
    
    # Model hooks
    "model.load": "Called when a model is being loaded",
    "model.unload": "Called when a model is being unloaded",
    "model.inference.before": "Called before model inference",
    "model.inference.after": "Called after model inference",
    
    # Tool hooks
    "tool.register": "Called when a tool is being registered",
    "tool.execute.before": "Called before executing a tool",
    "tool.execute.after": "Called after executing a tool",
    
    # Theme hooks
    "theme.apply": "Called when a theme is being applied",
    
    # Extension hooks
    "extension.install": "Called when an extension is being installed",
    "extension.uninstall": "Called when an extension is being uninstalled",
    "extension.enable": "Called when an extension is being enabled",
    "extension.disable": "Called when an extension is being disabled"
}
