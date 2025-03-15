"""
Example Extension for Open WebUI
Demonstrates how to create a basic extension
"""

import logging
from open_webui_extensions.extension_framework import UIExtension, extension_hook

# Setup logging
logger = logging.getLogger("example_extension")
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

class ExampleExtension(UIExtension):
    """Example extension that adds a simple UI component"""
    
    def __init__(self):
        super().__init__(
            name="Example Extension",
            description="An example extension that demonstrates the Open WebUI Extension System",
            version="0.1.0",
            author="Open WebUI Team"
        )
    
    def initialize(self):
        """Initialize the extension"""
        logger.info("Initializing Example Extension")
        
        # Register a sidebar component
        self.register_component(
            "sidebar_item",
            {
                "type": "link",
                "label": "Example Extension",
                "icon": "star",
                "route": "/example"
            }
        )
        
        return True
    
    def shutdown(self):
        """Shutdown the extension"""
        logger.info("Shutting down Example Extension")
        return True
    
    @extension_hook("ui.sidebar.render")
    def sidebar_hook(self, context):
        """Hook into sidebar rendering"""
        logger.debug("Example Extension sidebar hook called")
        return {
            "components": list(self.components.values())
        }

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
