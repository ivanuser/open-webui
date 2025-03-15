# Open WebUI Extension API

This document describes the API for extensions in Open WebUI.

## Table of Contents

- [Extension Framework API](#extension-framework-api)
- [Extension Registry API](#extension-registry-api)
- [Hook System API](#hook-system-api)
- [REST API Endpoints](#rest-api-endpoints)
- [Frontend Integration](#frontend-integration)

## Extension Framework API

The Extension Framework provides base classes and utilities for developing extensions:

### Base Classes

#### `Extension`

Base class for all extensions:

```python
class Extension:
    def __init__(self, name, description, version, author)
    def initialize() -> bool
    def shutdown() -> bool
    def get_config() -> Dict[str, Any]
    def set_config(config: Dict[str, Any]) -> bool
    def register_hook(hook_name: str, callback: Callable) -> None
    def get_hooks() -> Dict[str, List[Callable]]
```

#### `UIExtension`

Extension for adding UI components:

```python
class UIExtension(Extension):
    def register_component(component_id: str, component_data: Dict[str, Any]) -> None
    def get_components() -> Dict[str, Dict[str, Any]]
```

#### `APIExtension`

Extension for adding API endpoints:

```python
class APIExtension(Extension):
    def register_routes(app) -> None
```

#### `ModelExtension`

Extension for adding AI models:

```python
class ModelExtension(Extension):
    def register_model(model_id: str, model_data: Dict[str, Any]) -> None
    def get_models() -> Dict[str, Dict[str, Any]]
```

#### `ToolExtension`

Extension for adding tools:

```python
class ToolExtension(Extension):
    def register_tool(tool_id: str, tool_data: Dict[str, Any]) -> None
    def get_tools() -> Dict[str, Dict[str, Any]]
```

#### `ThemeExtension`

Extension for customizing appearance:

```python
class ThemeExtension(Extension):
    def set_theme_data(theme_data: Dict[str, Any]) -> None
    def get_theme_data() -> Dict[str, Any]
```

### Decorators

#### `extension_hook`

Register a function as a hook callback:

```python
@extension_hook(hook_name: str)
def my_hook_callback(context):
    # Hook implementation
    pass
```

#### `extension_action`

Register a function as an extension action:

```python
@extension_action(action_name: str, description: str = "")
def my_action(param1, param2):
    # Action implementation
    pass
```

#### `extension_config`

Mark a property as part of the extension configuration:

```python
@extension_config(config_name: str, config_type: Any = str, default_value: Any = None, description: str = "")
def get_my_config():
    return self._my_config
```

### Utility Functions

```python
def get_extension_path(extension_name: str) -> str
def get_extension_static_path(extension_name: str) -> str
def load_extension_module(extension_name: str, module_name: str) -> Optional[Any]
def load_extension_config(extension_name: str) -> Dict[str, Any]
def save_extension_config(extension_name: str, config: Dict[str, Any]) -> bool
def load_extension_manifest(extension_name: str) -> Dict[str, Any]
def get_installed_extensions() -> List[str]
```

## Extension Registry API

The Extension Registry manages extensions:

```python
class ExtensionRegistry:
    def discover_extensions(extension_dirs: List[str] = None) -> List[Extension]
    def load_extension(extension_id: str) -> Tuple[bool, str]
    def unload_extension(extension_id: str) -> Tuple[bool, str]
    def get_extension(extension_id: str) -> Optional[Extension]
    def get_extensions() -> List[Extension]
    def enable_extension(extension_id: str) -> Tuple[bool, str]
    def disable_extension(extension_id: str) -> Tuple[bool, str]
    def install_extension(extension_data: Dict[str, Any]) -> Tuple[bool, str, Optional[Extension]]
    def uninstall_extension(extension_id: str) -> Tuple[bool, str]
```

## Hook System API

The Hook System allows extensions to integrate with Open WebUI:

```python
def register_hook(hook_name: str, callback: Callable) -> None
def trigger_hook(hook_name: str, *args, **kwargs) -> List[Any]
def get_hooks() -> Dict[str, List[Callable]]
```

### Standard Hooks

- `extension.initialize`: Called when an extension is being initialized
- `extension.shutdown`: Called when an extension is being shut down
- `ui.render.before`: Called before rendering the UI
- `ui.render.after`: Called after rendering the UI
- `ui.sidebar.render`: Called when rendering the sidebar
- `ui.navbar.render`: Called when rendering the navbar
- `ui.settings.render`: Called when rendering the settings page
- `ui.chat.render`: Called when rendering the chat interface
- `ui.chat.message.render`: Called when rendering a chat message
- `api.startup`: Called when the API server is starting up
- `api.request.before`: Called before processing an API request
- `api.request.after`: Called after processing an API request
- `model.load`: Called when a model is being loaded
- `model.unload`: Called when a model is being unloaded
- `model.inference.before`: Called before model inference
- `model.inference.after`: Called after model inference
- `tool.register`: Called when a tool is being registered
- `tool.execute.before`: Called before executing a tool
- `tool.execute.after`: Called after executing a tool
- `theme.apply`: Called when a theme is being applied
- `extension.install`: Called when an extension is being installed
- `extension.uninstall`: Called when an extension is being uninstalled
- `extension.enable`: Called when an extension is being enabled
- `extension.disable`: Called when an extension is being disabled

## REST API Endpoints

The Extension Manager provides REST API endpoints for managing extensions:

### List Extensions

```
GET /api/extensions
```

Response:
```json
{
  "extensions": [
    {
      "id": "extension-id",
      "name": "Extension Name",
      "description": "Extension description",
      "version": "0.1.0",
      "author": "Author Name",
      "type": "ui",
      "entry_point": "__init__.py",
      "status": "enabled",
      "config": {},
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### Get Extension

```
GET /api/extensions/{extension_id}
```

Response:
```json
{
  "id": "extension-id",
  "name": "Extension Name",
  "description": "Extension description",
  "version": "0.1.0",
  "author": "Author Name",
  "type": "ui",
  "entry_point": "__init__.py",
  "status": "enabled",
  "config": {},
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Install Extension

```
POST /api/extensions
```

Request:
```json
{
  "name": "Extension Name",
  "description": "Extension description",
  "version": "0.1.0",
  "author": "Author Name",
  "type": "ui",
  "entry_point": "__init__.py",
  "config": {}
}
```

Response:
```json
{
  "id": "extension-id",
  "name": "Extension Name",
  "description": "Extension description",
  "version": "0.1.0",
  "author": "Author Name",
  "type": "ui",
  "entry_point": "__init__.py",
  "status": "disabled",
  "config": {},
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Uninstall Extension

```
DELETE /api/extensions/{extension_id}
```

Response:
```json
{
  "message": "Extension uninstalled: Extension Name"
}
```

### Enable Extension

```
POST /api/extensions/{extension_id}/enable
```

Response:
```json
{
  "message": "Extension enabled: Extension Name"
}
```

### Disable Extension

```
POST /api/extensions/{extension_id}/disable
```

Response:
```json
{
  "message": "Extension disabled: Extension Name"
}
```

### Update Extension

```
PATCH /api/extensions/{extension_id}
```

Request:
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "config": {
    "option1": "value1"
  }
}
```

Response:
```json
{
  "id": "extension-id",
  "name": "Updated Name",
  "description": "Updated description",
  "version": "0.1.0",
  "author": "Author Name",
  "type": "ui",
  "entry_point": "__init__.py",
  "status": "enabled",
  "config": {
    "option1": "value1"
  },
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Reload Extension

```
POST /api/extensions/{extension_id}/reload
```

Response:
```json
{
  "message": "Extension reloaded: Extension Name"
}
```

## Frontend Integration

Extensions can integrate with the Open WebUI frontend in several ways:

### UI Components

UI extensions can register components to be rendered in various parts of the UI:

```python
extension.register_component(
    "sidebar_item", 
    {
        "type": "link",
        "label": "My Extension",
        "icon": "star",
        "route": "/my-extension"
    }
)
```

### Routes

Extensions can add new routes to the application:

```python
# In ui.py
def get_ui_components():
    return {
        "pages": [{
            "name": "MyPage",
            "route": "/my-extension",
            "component": "MyPage.svelte",
            "icon": "star"
        }],
        "nav_items": [{
            "label": "My Extension",
            "route": "/my-extension",
            "icon": "star",
            "position": "sidebar"
        }]
    }
```

### Static Assets

Extensions can serve static assets like CSS, JavaScript, and images:

```
/static/extensions/{extension_name}/{asset_path}
```

For example:

```html
<link rel="stylesheet" href="/static/extensions/my-extension/styles.css">
<script src="/static/extensions/my-extension/script.js"></script>
<img src="/static/extensions/my-extension/icon.png">
```
