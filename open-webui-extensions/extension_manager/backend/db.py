"""
Database utilities for extension management
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any

logger = logging.getLogger("extension_db")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

class ExtensionDatabase:
    """
    Simple JSON-based database for storing extension data
    """
    
    def __init__(self, db_path: str = None):
        """
        Initialize the database
        
        Args:
            db_path: Path to the database file
        """
        if db_path is None:
            # Default to extensions.json in the data directory
            data_dir = os.environ.get('OPEN_WEBUI_DATA_DIR', 'data')
            db_path = os.path.join(data_dir, 'extensions.json')
        
        self.db_path = db_path
        self.data = self._load_data()
        
        # Ensure the database directory exists
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
    
    def _load_data(self) -> Dict[str, Any]:
        """
        Load data from the database file
        
        Returns:
            Dictionary containing the database data
        """
        if not os.path.exists(self.db_path):
            return {"extensions": {}}
        
        try:
            with open(self.db_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading extension database: {e}")
            return {"extensions": {}}
    
    def _save_data(self) -> bool:
        """
        Save data to the database file
        
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(self.db_path, 'w') as f:
                json.dump(self.data, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving extension database: {e}")
            return False
    
    def get_all_extensions(self) -> Dict[str, Any]:
        """
        Get all extensions from the database
        
        Returns:
            Dictionary of extension data
        """
        return self.data.get("extensions", {})
    
    def get_extension(self, extension_id: str) -> Optional[Dict[str, Any]]:
        """
        Get an extension from the database
        
        Args:
            extension_id: ID of the extension
            
        Returns:
            Extension data if found, None otherwise
        """
        return self.data.get("extensions", {}).get(extension_id)
    
    def save_extension(self, extension_id: str, extension_data: Dict[str, Any]) -> bool:
        """
        Save an extension to the database
        
        Args:
            extension_id: ID of the extension
            extension_data: Extension data to save
            
        Returns:
            True if successful, False otherwise
        """
        if "extensions" not in self.data:
            self.data["extensions"] = {}
        
        self.data["extensions"][extension_id] = extension_data
        return self._save_data()
    
    def update_extension(self, extension_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update an extension in the database
        
        Args:
            extension_id: ID of the extension
            updates: Dictionary of fields to update
            
        Returns:
            True if successful, False otherwise
        """
        extension = self.get_extension(extension_id)
        if not extension:
            return False
        
        # Update extension with new data
        extension.update(updates)
        
        # Save updated extension
        return self.save_extension(extension_id, extension)
    
    def delete_extension(self, extension_id: str) -> bool:
        """
        Delete an extension from the database
        
        Args:
            extension_id: ID of the extension
            
        Returns:
            True if successful, False otherwise
        """
        if extension_id in self.data.get("extensions", {}):
            del self.data["extensions"][extension_id]
            return self._save_data()
        return True
