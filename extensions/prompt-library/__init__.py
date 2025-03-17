"""
Prompt Library Extension for Open WebUI
"""

import os
import sys
import json
from pathlib import Path

def initialize():
    """
    Initialize the extension and register sidebar item
    """
    # Log initialization
    print("Initializing Prompt Library extension")
    
    try:
        # Add hook for sidebar integration
        register_sidebar_item()
        return True
    except Exception as e:
        print(f"Error initializing Prompt Library extension: {e}")
        return False

def register_sidebar_item():
    """
    Register sidebar item for the extension
    This function creates a sidebar.json file that will be read by the UI
    """
    try:
        # Get the extension directory
        extension_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Create the sidebar data
        sidebar_data = {
            "id": "prompt-library",
            "label": "Prompt Library",
            "icon": "BookOpen",
            "href": "/extensions/prompt-library",
            "order": 50
        }
        
        # Save to sidebar.json in the extension directory
        sidebar_path = os.path.join(extension_dir, "sidebar.json")
        with open(sidebar_path, 'w') as f:
            json.dump(sidebar_data, f, indent=2)
        
        print(f"Registered sidebar item: {sidebar_path}")
        return True
    except Exception as e:
        print(f"Error registering sidebar item: {e}")
        return False

def shutdown():
    """
    Shutdown the extension and remove sidebar item
    """
    print("Shutting down Prompt Library extension")
    
    try:
        # Remove sidebar integration
        unregister_sidebar_item()
        return True
    except Exception as e:
        print(f"Error shutting down Prompt Library extension: {e}")
        return False

def unregister_sidebar_item():
    """
    Unregister sidebar item for the extension
    """
    try:
        # Get the extension directory
        extension_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Remove sidebar.json
        sidebar_path = os.path.join(extension_dir, "sidebar.json")
        if os.path.exists(sidebar_path):
            os.remove(sidebar_path)
        
        print(f"Unregistered sidebar item: {sidebar_path}")
        return True
    except Exception as e:
        print(f"Error unregistering sidebar item: {e}")
        return False
