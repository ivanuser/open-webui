# Creating Extensions for Open WebUI

This guide will walk you through the process of creating extensions for Open WebUI.

## Table of Contents

- [Extension Structure](#extension-structure)
- [Developing an Extension](#developing-an-extension)
- [Extension Types](#extension-types)
- [Hooks and Integration Points](#hooks-and-integration-points)
- [Extension Manifest](#extension-manifest)
- [Testing Your Extension](#testing-your-extension)
- [Packaging Your Extension](#packaging-your-extension)

## Extension Structure

An Open WebUI extension typically has the following structure:

```
my_extension/
├── __init__.py                # Main entry point
├── extension.json             # Extension manifest
├── api.py                     # API endpoints (optional)
├── ui.py                      # UI components (optional)
├── static/                    # Static assets (optional)
│   ├── styles.css
│   └── scripts.js
└── README.md                  # Documentation
```

## Developing an Extension

### 1. Create the Directory Structure

Create a new directory for your extension:

```bash
mkdir my_extension
cd my_extension
```

### 2. Create the Extension Manifest

Create an `extension.json` file:

```json
{
  "name": "My Extension",
  "description": "A description of your extension",
  "version": "0.1.0",
  "author": "Your Name",
  "type": "ui",
  "entry_point": "__init__.py",
  "config": {
    "enabled": true
  },
  "dependencies": [],
  "compatibility": {
    "open_webui_version": ">=0.1.0"
  }
}
```

### 3. Create the Entry Point

Create an `__init__.py` file:

```python
"""
My Extension for Open WebUI
"""

import logging
from open_webui_extensions.extension_framework import UIExtension

# Setup logging
logger = logging.getLogger("my_extension")
logger.setLevel(logging.INFO)

class MyExtension(UIExtension):
    """My custom extension"""
    
    def __init__(self):
        super().__init__(
            name="My Extension",
            description="A description of your extension",
            version="0.1.0",
            author="Your Name"
        )
    
    def initialize(self):
        """Initialize the extension"""
        logger.info("Initializing My Extension")
        return True
        
    def shutdown(self):
        """Shutdown the extension"""
        logger.info("Shutting down My Extension")
        return True

# Create global instance
my_extension = None

def initialize():
    """Initialize the extension"""
    global my_extension
    my_extension = MyExtension()
    return my_extension.initialize()

def shutdown():
    """Shutdown the extension"""
    global my_extension
    if my_extension:
        return my_extension.shutdown()
    return True
```

## Extension Types

Open WebUI supports several types of extensions:

1. **UI Extensions**: Add new UI components to Open WebUI
2. **API Extensions**: Add new API endpoints
3. **Model Adapters**: Integrate new AI models
4. **Tool Extensions**: Add new tools or capabilities to the system
5. **Theme Extensions**: Customize the appearance of Open WebUI

Choose the appropriate base class for your extension type:

- `UIExtension` for UI extensions
- `APIExtension` for API extensions
- `ModelExtension` for model adapters
- `ToolExtension` for tool extensions
- `ThemeExtension` for theme extensions

## Hooks and Integration Points

Open WebUI provides hooks for extensions to integrate with the system:

### UI Hooks

- `ui.render.before`: Called before rendering the UI
- `ui.render.after`: Called after rendering the UI
- `ui.sidebar.render`: Called when rendering the sidebar
- `ui.navbar.render`: Called when rendering the navbar
- `ui.settings.render`: Called when rendering the settings page
- `ui.chat.render`: Called when rendering the chat interface
- `ui.chat.message.render`: Called when rendering a chat message

### API Hooks

- `api.startup`: Called when the API server is starting up
- `api.request.before`: Called before processing an API request
- `api.request.after`: Called after processing an API request

### Model Hooks

- `model.load`: Called when a model is being loaded
- `model.unload`: Called when a model is being unloaded
- `model.inference.before`: Called before model inference
- `model.inference.after`: Called after model inference

### Tool Hooks

- `tool.register`: Called when a tool is being registered
- `tool.execute.before`: Called before executing a tool
- `tool.execute.after`: Called after executing a tool

### Extension Hooks

- `extension.install`: Called when an extension is being installed
- `extension.uninstall`: Called when an extension is being uninstalled
- `extension.enable`: Called when an extension is being enabled
- `extension.disable`: Called when an extension is being disabled

## Extension Manifest

The `extension.json` file contains metadata about your extension:

```json
{
  "name": "My Extension",
  "description": "A description of your extension",
  "version": "0.1.0",
  "author": "Your Name",
  "type": "ui",
  "entry_point": "__init__.py",
  "config": {
    "enabled": true,
    "custom_option": "value"
  },
  "dependencies": [],
  "compatibility": {
    "open_webui_version": ">=0.1.0"
  }
}
```

## Testing Your Extension

To test your extension:

1. Place your extension directory in the Open WebUI extensions directory
2. Start Open WebUI
3. Go to the Extension Manager in the admin settings
4. Enable your extension
5. Test the functionality

## Packaging Your Extension

To package your extension for distribution:

1. Create a zip file containing your extension directory
2. Ensure the `extension.json` file is at the root of the zip file
3. Share the zip file with users

Users can install your extension through the Extension Manager by uploading the zip file.

## Example Extensions

For examples of extensions, see the [example_extension](https://github.com/open-webui/open-webui-extensions/tree/main/example_extension) directory in the repository.
