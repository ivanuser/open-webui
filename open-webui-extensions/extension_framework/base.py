"""
Base classes for extension development
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Callable

# Setup logging
logger = logging.getLogger("extension_framework")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

class Extension(ABC):
    """
    Base class for all extensions
    """
    
    def __init__(self, name: str, description: str, version: str, author: str):
        """
        Initialize a new extension
        
        Args:
            name: Name of the extension
            description: Description of the extension
            version: Version string
            author: Author of the extension
        """
        self.name = name
        self.description = description
        self.version = version
        self.author = author
        self.config: Dict[str, Any] = {}
        self.hooks: Dict[str, List[Callable]] = {}
        
    @abstractmethod
    def initialize(self) -> bool:
        """
        Initialize the extension
        
        Returns:
            True if initialization was successful, False otherwise
        """
        pass
        
    def shutdown(self) -> bool:
        """
        Shutdown the extension
        
        Returns:
            True if shutdown was successful, False otherwise
        """
        return True
        
    def get_config(self) -> Dict[str, Any]:
        """
        Get the extension configuration
        
        Returns:
            Extension configuration dictionary
        """
        return self.config
        
    def set_config(self, config: Dict[str, Any]) -> bool:
        """
        Set the extension configuration
        
        Args:
            config: Configuration dictionary
            
        Returns:
            True if configuration was set successfully, False otherwise
        """
        self.config = config
        return True
        
    def register_hook(self, hook_name: str, callback: Callable) -> None:
        """
        Register a hook callback
        
        Args:
            hook_name: Name of the hook to register for
            callback: Function to call when the hook is triggered
        """
        if hook_name not in self.hooks:
            self.hooks[hook_name] = []
            
        self.hooks[hook_name].append(callback)
        logger.debug(f"Registered hook {hook_name} for extension {self.name}")
        
    def get_hooks(self) -> Dict[str, List[Callable]]:
        """
        Get all registered hooks
        
        Returns:
            Dictionary of hook names to lists of callbacks
        """
        return self.hooks

class UIExtension(Extension):
    """
    Extension that adds UI components to Open WebUI
    """
    
    def __init__(self, name: str, description: str, version: str, author: str):
        """
        Initialize a new UI extension
        
        Args:
            name: Name of the extension
            description: Description of the extension
            version: Version string
            author: Author of the extension
        """
        super().__init__(name, description, version, author)
        self.components: Dict[str, Dict[str, Any]] = {}
        
    def initialize(self) -> bool:
        """
        Initialize the UI extension
        
        Returns:
            True if initialization was successful, False otherwise
        """
        logger.info(f"Initializing UI extension: {self.name}")
        return True
        
    def register_component(self, component_id: str, component_data: Dict[str, Any]) -> None:
        """
        Register a UI component
        
        Args:
            component_id: Unique identifier for the component
            component_data: Component data including type, props, etc.
        """
        self.components[component_id] = component_data
        logger.debug(f"Registered UI component {component_id} for extension {self.name}")
        
    def get_components(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all registered UI components
        
        Returns:
            Dictionary of component IDs to component data
        """
        return self.components

class APIExtension(Extension):
    """
    Extension that adds API endpoints to Open WebUI
    """
    
    def __init__(self, name: str, description: str, version: str, author: str):
        """
        Initialize a new API extension
        
        Args:
            name: Name of the extension
            description: Description of the extension
            version: Version string
            author: Author of the extension
        """
        super().__init__(name, description, version, author)
        self.routes = []
        
    def initialize(self) -> bool:
        """
        Initialize the API extension
        
        Returns:
            True if initialization was successful, False otherwise
        """
        logger.info(f"Initializing API extension: {self.name}")
        return True
        
    def register_routes(self, app) -> None:
        """
        Register API routes with the FastAPI app
        
        Args:
            app: FastAPI application instance
        """
        # This method should be implemented by subclasses
        # to register their routes with the provided app
        pass

class ModelExtension(Extension):
    """
    Extension that adds new AI models to Open WebUI
    """
    
    def __init__(self, name: str, description: str, version: str, author: str):
        """
        Initialize a new model extension
        
        Args:
            name: Name of the extension
            description: Description of the extension
            version: Version string
            author: Author of the extension
        """
        super().__init__(name, description, version, author)
        self.models: Dict[str, Dict[str, Any]] = {}
        
    def initialize(self) -> bool:
        """
        Initialize the model extension
        
        Returns:
            True if initialization was successful, False otherwise
        """
        logger.info(f"Initializing model extension: {self.name}")
        return True
        
    def register_model(self, model_id: str, model_data: Dict[str, Any]) -> None:
        """
        Register an AI model
        
        Args:
            model_id: Unique identifier for the model
            model_data: Model data including type, configuration, etc.
        """
        self.models[model_id] = model_data
        logger.debug(f"Registered model {model_id} for extension {self.name}")
        
    def get_models(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all registered models
        
        Returns:
            Dictionary of model IDs to model data
        """
        return self.models

class ToolExtension(Extension):
    """
    Extension that adds new tools or capabilities to Open WebUI
    """
    
    def __init__(self, name: str, description: str, version: str, author: str):
        """
        Initialize a new tool extension
        
        Args:
            name: Name of the extension
            description: Description of the extension
            version: Version string
            author: Author of the extension
        """
        super().__init__(name, description, version, author)
        self.tools: Dict[str, Dict[str, Any]] = {}
        
    def initialize(self) -> bool:
        """
        Initialize the tool extension
        
        Returns:
            True if initialization was successful, False otherwise
        """
        logger.info(f"Initializing tool extension: {self.name}")
        return True
        
    def register_tool(self, tool_id: str, tool_data: Dict[str, Any]) -> None:
        """
        Register a tool
        
        Args:
            tool_id: Unique identifier for the tool
            tool_data: Tool data including type, configuration, etc.
        """
        self.tools[tool_id] = tool_data
        logger.debug(f"Registered tool {tool_id} for extension {self.name}")
        
    def get_tools(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all registered tools
        
        Returns:
            Dictionary of tool IDs to tool data
        """
        return self.tools

class ThemeExtension(Extension):
    """
    Extension that customizes the appearance of Open WebUI
    """
    
    def __init__(self, name: str, description: str, version: str, author: str):
        """
        Initialize a new theme extension
        
        Args:
            name: Name of the extension
            description: Description of the extension
            version: Version string
            author: Author of the extension
        """
        super().__init__(name, description, version, author)
        self.theme_data: Dict[str, Any] = {}
        
    def initialize(self) -> bool:
        """
        Initialize the theme extension
        
        Returns:
            True if initialization was successful, False otherwise
        """
        logger.info(f"Initializing theme extension: {self.name}")
        return True
        
    def set_theme_data(self, theme_data: Dict[str, Any]) -> None:
        """
        Set theme data
        
        Args:
            theme_data: Theme data including colors, fonts, etc.
        """
        self.theme_data = theme_data
        logger.debug(f"Set theme data for extension {self.name}")
        
    def get_theme_data(self) -> Dict[str, Any]:
        """
        Get theme data
        
        Returns:
            Theme data dictionary
        """
        return self.theme_data
