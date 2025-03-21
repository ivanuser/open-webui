"""
MCP Server Configuration Module

This module handles the configuration and management of MCP servers,
including loading, validating, and persisting configuration.
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger("mcp")

# Default configuration file path
DEFAULT_CONFIG_PATH = os.path.join(os.path.expanduser("~"), ".open-webui", "mcp_config.json")

class MCPConfig:
    """
    Manages MCP server configurations
    """
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize MCP configuration manager
        
        Args:
            config_path: Path to the configuration file
        """
        self.config_path = config_path or DEFAULT_CONFIG_PATH
        self.config = {}
        self.load_config()
    
    def load_config(self) -> None:
        """
        Load configuration from file
        """
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    self.config = json.load(f)
                logger.info(f"Loaded MCP configuration from {self.config_path}")
            else:
                logger.info(f"No configuration file found at {self.config_path}, creating default")
                self._create_default_config()
        except Exception as e:
            logger.error(f"Error loading MCP configuration: {e}")
            self._create_default_config()
    
    def _create_default_config(self) -> None:
        """
        Create default configuration
        """
        self.config = {
            "version": "1.0.0",
            "servers": {}
        }
        self.save_config()
    
    def save_config(self) -> None:
        """
        Save configuration to file
        """
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            
            with open(self.config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info(f"Saved MCP configuration to {self.config_path}")
        except Exception as e:
            logger.error(f"Error saving MCP configuration: {e}")
    
    def get_servers(self) -> Dict[str, Any]:
        """
        Get all configured servers
        
        Returns:
            Dict of server configurations
        """
        return self.config.get("servers", {})
    
    def get_server(self, server_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific server configuration
        
        Args:
            server_id: ID of the server
            
        Returns:
            Server configuration or None if not found
        """
        return self.config.get("servers", {}).get(server_id)
    
    def add_server(self, server_id: str, server_config: Dict[str, Any]) -> None:
        """
        Add or update a server configuration
        
        Args:
            server_id: ID of the server
            server_config: Server configuration
        """
        if "servers" not in self.config:
            self.config["servers"] = {}
        
        self.config["servers"][server_id] = server_config
        self.save_config()
    
    def remove_server(self, server_id: str) -> bool:
        """
        Remove a server configuration
        
        Args:
            server_id: ID of the server
            
        Returns:
            True if server was removed, False if not found
        """
        if server_id in self.config.get("servers", {}):
            del self.config["servers"][server_id]
            self.save_config()
            return True
        return False
    
    def update_server_status(self, server_id: str, status: str) -> bool:
        """
        Update a server's status
        
        Args:
            server_id: ID of the server
            status: New status
            
        Returns:
            True if server was updated, False if not found
        """
        if server_id in self.config.get("servers", {}):
            self.config["servers"][server_id]["status"] = status
            self.save_config()
            return True
        return False

# Global config instance
_config_instance = None

def get_config(config_path: Optional[str] = None) -> MCPConfig:
    """
    Get the global MCP configuration instance
    
    Args:
        config_path: Optional path to configuration file
        
    Returns:
        MCPConfig instance
    """
    global _config_instance
    if _config_instance is None:
        _config_instance = MCPConfig(config_path)
    return _config_instance
