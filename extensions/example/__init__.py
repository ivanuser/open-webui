"""
Example Extension for Open WebUI
Demonstrates how to create a basic extension
"""

import logging
import os
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("example_extension")

class ExampleExtension:
    """Example extension that adds a simple UI component"""
    
    def __init__(self):
        self.name = "Example Extension"
        self.description = "An example extension that demonstrates the Open WebUI Extension System"
        self.version = "0.1.0"
        self.author = "Open WebUI Team"
        self.components = {}
        
        # Load configuration
        self.config = self.load_config()
    
    def initialize(self):
        """Initialize the extension"""
        logger.info("Initializing Example Extension")
        
        # Register a sidebar component
        self.components["sidebar_item"] = {
            "type": "link",
            "label": "Example Extension",
            "icon": "star",
            "route": "/example"
        }
        
        return True
    
    def shutdown(self):
        """Shutdown the extension"""
        logger.info("Shutting down Example Extension")
        return True
    
    def load_config(self):
        """Load extension configuration"""
        try:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            config_path = os.path.join(script_dir, "extension.json")
            
            with open(config_path, "r") as f:
                data = json.load(f)
                return data.get("config", {})
        except Exception as e:
            logger.error(f"Error loading configuration: {e}")
            return {}

# Create global instance
example_extension = None

def initialize():
    """Initialize the extension"""
    global example_extension
    example_extension = ExampleExtension()
    return example_extension.initialize()

def shutdown():
    """Shutdown the extension"""
    global example_extension
    if example_extension:
        return example_extension.shutdown()
    return True
