"""
Extension registry for discovering and loading extensions
"""

import os
import importlib.util
import logging
import json
import sys
import shutil
from typing import Dict, List, Optional, Any, Tuple

from .models import Extension, ExtensionStatus, ExtensionType
from .db import ExtensionDatabase

# Setup logging
logger = logging.getLogger("extension_registry")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

class ExtensionRegistry:
    """
    Registry for discovering, loading, and managing extensions
    """
    
    def __init__(self, database=None):
        """
        Initialize the extension registry
        
        Args:
            database: Database connection for extension persistence
        """
        # Initialize database if not provided
        if database is None:
            self.database = ExtensionDatabase()
        else:
            self.database = database
            
        self.extensions: Dict[str, Extension] = {}
        self.loaded_extensions: Dict[str, Any] = {}
        
    def discover_extensions(self, extension_dirs: List[str] = None) -> List[Extension]:
        """
        Discover available extensions in the specified directories
        
        Args:
            extension_dirs: List of directories to search for extensions
            
        Returns:
            List of discovered extensions
        """
        if extension_dirs is None:
            # Default extension directories
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            extension_dirs = [
                os.path.join(root_dir, 'example_extension'),  # Example extension
                os.path.join(root_dir, '..', 'extensions')     # User-installed extensions
            ]
        
        discovered_extensions = []
        
        for extension_dir in extension_dirs:
            if not os.path.exists(extension_dir):
                logger.warning(f"Extension directory does not exist: {extension_dir}")
                continue
                
            logger.info(f"Discovering extensions in: {extension_dir}")
            
            if os.path.isdir(extension_dir):
                # Look for extensions in direct subdirectories
                for entry in os.listdir(extension_dir):
                    ext_path = os.path.join(extension_dir, entry)
                    
                    if os.path.isdir(ext_path):
                        # Check for extension manifest
                        manifest_path = os.path.join(ext_path, 'extension.json')
                        if os.path.exists(manifest_path):
                            try:
                                with open(manifest_path, 'r') as f:
                                    manifest = json.load(f)
                                
                                # Check database for extension status
                                db_entry = self.database.get_extension(manifest.get('id', entry))
                                
                                # If extension is marked as uninstalled in the database, skip it
                                if db_entry and db_entry.get('installed') is False:
                                    logger.info(f"Skipping uninstalled extension: {entry}")
                                    continue
                                
                                # Default status is enabled unless database says otherwise
                                status = ExtensionStatus.ENABLED
                                if db_entry and db_entry.get('status') == 'disabled':
                                    status = ExtensionStatus.DISABLED
                                
                                # Create extension from manifest
                                extension = Extension(
                                    name=manifest.get('name', entry),
                                    description=manifest.get('description', ''),
                                    version=manifest.get('version', '0.1.0'),
                                    author=manifest.get('author', 'Unknown'),
                                    type=manifest.get('type', 'ui'),
                                    entry_point=manifest.get('entry_point', '__init__.py'),
                                    status=status,
                                    config=manifest.get('config', {})
                                )
                                
                                # Add to discovered extensions
                                discovered_extensions.append(extension)
                                self.extensions[extension.id] = extension
                                logger.info(f"Discovered extension: {extension.name} (ID: {extension.id}, Status: {extension.status})")
                                
                                # Save to database if not already there
                                if not db_entry:
                                    self.database.save_extension(extension.id, {
                                        'name': extension.name,
                                        'version': extension.version,
                                        'status': extension.status,
                                        'installed': True,
                                        'config': extension.config
                                    })
                                
                            except Exception as e:
                                logger.error(f"Error loading extension manifest from {manifest_path}: {e}")
            
        return discovered_extensions
    
    def load_extension(self, extension_id: str) -> Tuple[bool, str]:
        """
        Load an extension by ID
        
        Args:
            extension_id: ID of the extension to load
            
        Returns:
            Tuple of (success, message)
        """
        if extension_id not in self.extensions:
            return False, f"Extension not found: {extension_id}"
        
        extension = self.extensions[extension_id]
        
        # If already loaded and enabled, return success
        if extension_id in self.loaded_extensions and extension.status == ExtensionStatus.ENABLED:
            return True, f"Extension already loaded: {extension.name}"
        
        # If disabled in database, don't load
        db_entry = self.database.get_extension(extension_id)
        if db_entry and db_entry.get('status') == 'disabled':
            extension.status = ExtensionStatus.DISABLED
            return False, f"Extension is disabled: {extension.name}"
        
        try:
            # Find extension directory
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            extension_dir = os.path.join(root_dir, 'example_extension')  # Default example
            
            # Check if extension exists in user-installed extensions
            user_ext_dir = os.path.join(root_dir, '..', 'extensions', extension.name)
            if os.path.exists(user_ext_dir):
                extension_dir = user_ext_dir
            
            # Get module path
            module_path = os.path.join(extension_dir, extension.entry_point)
            
            if not os.path.exists(module_path):
                extension.status = ExtensionStatus.ERROR
                return False, f"Entry point not found: {module_path}"
            
            # Load module
            module_name = f"open_webui_extension_{extension.name}"
            spec = importlib.util.spec_from_file_location(module_name, module_path)
            module = importlib.util.module_from_spec(spec)
            sys.modules[module_name] = module
            spec.loader.exec_module(module)
            
            # Initialize extension
            if hasattr(module, 'initialize'):
                module.initialize()
            
            self.loaded_extensions[extension_id] = module
            extension.status = ExtensionStatus.ENABLED
            
            # Update database
            self.database.update_extension(extension_id, {
                'status': 'enabled'
            })
            
            logger.info(f"Loaded extension: {extension.name} (ID: {extension_id})")
            return True, f"Extension loaded: {extension.name}"
            
        except Exception as e:
            extension.status = ExtensionStatus.ERROR
            logger.error(f"Error loading extension {extension.name}: {e}")
            return False, f"Error loading extension: {str(e)}"
    
    def unload_extension(self, extension_id: str) -> Tuple[bool, str]:
        """
        Unload an extension by ID
        
        Args:
            extension_id: ID of the extension to unload
            
        Returns:
            Tuple of (success, message)
        """
        if extension_id not in self.extensions:
            return False, f"Extension not found: {extension_id}"
        
        extension = self.extensions[extension_id]
        
        if extension_id not in self.loaded_extensions:
            return True, f"Extension not loaded: {extension.name}"
        
        try:
            module = self.loaded_extensions[extension_id]
            
            # Call shutdown function if available
            if hasattr(module, 'shutdown'):
                module.shutdown()
            
            # Remove from loaded extensions
            del self.loaded_extensions[extension_id]
            
            # Remove from sys.modules if added
            module_name = f"open_webui_extension_{extension.name}"
            if module_name in sys.modules:
                del sys.modules[module_name]
            
            extension.status = ExtensionStatus.DISABLED
            
            # Update database
            self.database.update_extension(extension_id, {
                'status': 'disabled'
            })
            
            logger.info(f"Unloaded extension: {extension.name} (ID: {extension_id})")
            return True, f"Extension unloaded: {extension.name}"
            
        except Exception as e:
            logger.error(f"Error unloading extension {extension.name}: {e}")
            return False, f"Error unloading extension: {str(e)}"
    
    def get_extension(self, extension_id: str) -> Optional[Extension]:
        """
        Get an extension by ID
        
        Args:
            extension_id: ID of the extension to get
            
        Returns:
            Extension if found, None otherwise
        """
        return self.extensions.get(extension_id)
    
    def get_extensions(self) -> List[Extension]:
        """
        Get all registered extensions
        
        Returns:
            List of all extensions
        """
        return list(self.extensions.values())
    
    def enable_extension(self, extension_id: str) -> Tuple[bool, str]:
        """
        Enable an extension by ID
        
        Args:
            extension_id: ID of the extension to enable
            
        Returns:
            Tuple of (success, message)
        """
        if extension_id not in self.extensions:
            return False, f"Extension not found: {extension_id}"
        
        # Update database first
        self.database.update_extension(extension_id, {
            'status': 'enabled'
        })
        
        # Load the extension
        success, message = self.load_extension(extension_id)
        if success:
            extension = self.extensions[extension_id]
            return True, f"Extension enabled: {extension.name}"
        
        return success, message
        
    def disable_extension(self, extension_id: str) -> Tuple[bool, str]:
        """
        Disable an extension by ID
        
        Args:
            extension_id: ID of the extension to disable
            
        Returns:
            Tuple of (success, message)
        """
        if extension_id not in self.extensions:
            return False, f"Extension not found: {extension_id}"
        
        # Update database first
        self.database.update_extension(extension_id, {
            'status': 'disabled'
        })
        
        # Unload the extension
        success, message = self.unload_extension(extension_id)
        if success:
            extension = self.extensions[extension_id]
            return True, f"Extension disabled: {extension.name}"
        
        return success, message
        
    def install_extension(self, extension_data: Dict[str, Any]) -> Tuple[bool, str, Optional[Extension]]:
        """
        Install a new extension
        
        Args:
            extension_data: Extension data including name, description, etc.
            
        Returns:
            Tuple of (success, message, extension)
        """
        try:
            # Create extension object
            extension = Extension(**extension_data)
            
            # Add to registry
            self.extensions[extension.id] = extension
            
            # Save to database
            self.database.save_extension(extension.id, {
                'name': extension.name,
                'version': extension.version,
                'status': extension.status,
                'installed': True,
                'config': extension.config
            })
                
            logger.info(f"Installed extension: {extension.name} (ID: {extension.id})")
            return True, f"Extension installed: {extension.name}", extension
            
        except Exception as e:
            logger.error(f"Error installing extension: {e}")
            return False, f"Error installing extension: {str(e)}", None
    
    def uninstall_extension(self, extension_id: str) -> Tuple[bool, str]:
        """
        Uninstall an extension by ID
        
        Args:
            extension_id: ID of the extension to uninstall
            
        Returns:
            Tuple of (success, message)
        """
        if extension_id not in self.extensions:
            return False, f"Extension not found: {extension_id}"
        
        extension = self.extensions[extension_id]
        
        # First, unload the extension if loaded
        if extension_id in self.loaded_extensions:
            success, message = self.unload_extension(extension_id)
            if not success:
                return False, f"Failed to unload extension: {message}"
        
        try:
            # Mark as uninstalled in database
            self.database.update_extension(extension_id, {
                'installed': False
            })
            
            # Remove from extension registry
            del self.extensions[extension_id]
            
            # Remove extension directory
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            user_ext_dir = os.path.join(root_dir, '..', 'extensions', extension.name)
            
            if os.path.exists(user_ext_dir):
                try:
                    shutil.rmtree(user_ext_dir)
                except Exception as e:
                    logger.warning(f"Failed to remove extension directory: {e}")
                    # Continue anyway, the extension is marked as uninstalled in the database
            
            logger.info(f"Uninstalled extension: {extension.name} (ID: {extension_id})")
            return True, f"Extension uninstalled: {extension.name}"
            
        except Exception as e:
            logger.error(f"Error uninstalling extension {extension.name}: {e}")
            return False, f"Error uninstalling extension: {str(e)}"
