"""
MCP Server Templates

This module provides pre-configured templates for common MCP servers.
"""

from typing import Dict, List, Any

# Define standard MCP server templates
MCP_SERVER_TEMPLATES = {
    "filesystem": {
        "name": "Filesystem",
        "description": "Access and manipulate files in a directory",
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem"],
        "configFields": [
            {
                "name": "path",
                "type": "string",
                "description": "Path to the directory to expose",
                "required": True
            }
        ]
    },
    "brave-search": {
        "name": "Brave Search",
        "description": "Search the web using Brave Search API",
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-brave-search"],
        "configFields": [
            {
                "name": "BRAVE_API_KEY",
                "type": "string",
                "description": "Brave Search API Key",
                "required": True,
                "isEnv": True
            }
        ]
    },
    "github": {
        "name": "GitHub",
        "description": "Access and manage GitHub repositories",
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-github"],
        "configFields": [
            {
                "name": "GITHUB_PERSONAL_ACCESS_TOKEN",
                "type": "string",
                "description": "GitHub Personal Access Token",
                "required": True,
                "isEnv": True
            }
        ]
    },
    "memory": {
        "name": "Memory",
        "description": "Knowledge graph-based persistent memory",
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
}

def get_server_templates() -> Dict[str, Any]:
    """
    Get all available server templates
    
    Returns:
        Dict of server templates
    """
    return MCP_SERVER_TEMPLATES

def get_server_template(template_id: str) -> Dict[str, Any]:
    """
    Get a specific server template
    
    Args:
        template_id: ID of the template
        
    Returns:
        Server template configuration
    """
    return MCP_SERVER_TEMPLATES.get(template_id, {})

def generate_server_config(template_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate a server configuration from a template
    
    Args:
        template_id: ID of the template
        config: Configuration values
        
    Returns:
        Complete server configuration
    """
    template = get_server_template(template_id)
    if not template:
        raise ValueError(f"Unknown template: {template_id}")
    
    # Start with template defaults
    server_config = {
        "name": template.get("name", ""),
        "description": template.get("description", ""),
        "type": template.get("type", "stdio"),
        "command": template.get("command", ""),
        "args": template.get("args", []).copy(),
        "env": {},
        "status": "stopped"
    }
    
    # Add configuration values
    for field in template.get("configFields", []):
        field_name = field.get("name", "")
        if field_name in config:
            if field.get("isEnv", False):
                server_config["env"][field_name] = config[field_name]
            else:
                # For path, add it to the args
                if field_name == "path":
                    server_config["args"].append(config[field_name])
    
    # Add any custom fields
    for key, value in config.items():
        if key not in ["name", "description", "type", "command", "args", "env", "status"] and not any(
            field.get("name") == key for field in template.get("configFields", [])
        ):
            server_config[key] = value
    
    return server_config
