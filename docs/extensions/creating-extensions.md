# Creating Extensions for Open WebUI

This guide will help you create extensions for Open WebUI. Extensions allow you to add new features, UI components, API endpoints, model adapters, tools, and themes to Open WebUI.

## Extension Types

Open WebUI supports several types of extensions:

1. **UI Extensions**: Add new UI components to Open WebUI
2. **API Extensions**: Add new API endpoints
3. **Model Adapters**: Integrate new AI models
4. **Tool Extensions**: Add new tools or capabilities to the system
5. **Theme Extensions**: Customize the appearance of Open WebUI

## Extension Structure

A basic extension structure looks like this:

```
my-extension/
├── manifest.json            # Extension metadata
├── index.js                 # Main extension code
├── components/              # UI components (for UI extensions)
│   └── MyComponent.svelte   # Example Svelte component
├── static/                  # Static assets
│   ├── icon.png             # Extension icon
│   └── ...                  # Other static assets
└── README.md                # Extension documentation
```

## Creating a Manifest

Every extension needs a manifest file (`manifest.json`) that defines its metadata:

```json
{
  "id": "my-extension",
  "name": "My Extension",
  "version": "1.0.0",
  "description": "A description of my extension",
  "author": "Your Name",
  "homepage": "https://github.com/yourusername/my-extension",
  "repository": "https://github.com/yourusername/my-extension",
  "license": "MIT",
  "type": "ui",
  "main": "index.js",
  "icon": "icon.png",
  "tags": ["ui", "example"],
  "settings": [
    {
      "id": "exampleSetting",
      "name": "Example Setting",
      "description": "An example setting",
      "type": "string",
      "default": "default value"
    }
  ]
}
```

### Manifest Fields

| Field | Description | Required |
|-------|-------------|----------|
| `id` | Unique identifier for the extension | Yes |
| `name` | Display name of the extension | Yes |
| `version` | Version number (semver) | Yes |
| `description` | Description of the extension | Yes |
| `author` | Author name | Yes |
| `homepage` | Homepage URL | No |
| `repository` | Repository URL | No |
| `license` | License identifier | No |
| `type` | Extension type or array of types | Yes |
| `main` | Main entry point file | Yes |
| `icon` | Path to icon (relative to static directory) | No |
| `tags` | Array of tags | No |
| `settings` | Array of setting definitions | No |

## Extension Code

The main extension code is typically in an `index.js` file that exports a default class extending one of the base extension classes.

### UI Extension Example

```javascript
import { UIExtension } from 'open-webui-extensions';
import MyComponent from './components/MyComponent.svelte';
import { StandardHooks } from 'open-webui-extensions';

export default class MyUIExtension extends UIExtension {
  async initialize() {
    console.log('My UI Extension initialized');
    
    // Register hooks
    this.registerHook({
      name: StandardHooks.UI_CHAT_SIDEBAR,
      handler: this.handleChatSidebar.bind(this),
      priority: 10
    });
  }
  
  async activate() {
    console.log('My UI Extension activated');
  }
  
  async deactivate() {
    console.log('My UI Extension deactivated');
  }
  
  handleChatSidebar(context) {
    return {
      component: MyComponent,
      props: {
        // Pass settings to the component
        setting: this.settings.exampleSetting
      }
    };
  }
  
  getUIComponents() {
    return new Map([
      ['chat-sidebar', () => Promise.resolve(MyComponent)]
    ]);
  }
}
```

### API Extension Example

```javascript
import { APIExtension } from 'open-webui-extensions';

export default class MyAPIExtension extends APIExtension {
  async initialize() {
    console.log('My API Extension initialized');
  }
  
  async activate() {
    console.log('My API Extension activated');
  }
  
  async deactivate() {
    console.log('My API Extension deactivated');
  }
  
  getAPIEndpoints() {
    return new Map([
      ['/api/my-extension/hello', this.handleHelloEndpoint.bind(this)]
    ]);
  }
  
  async handleHelloEndpoint(request) {
    return {
      status: 200,
      body: {
        message: 'Hello from my extension!'
      }
    };
  }
}
```

## Extension Settings

Extensions can define settings that users can configure through the Extension Manager. Settings are defined in the manifest file:

```json
"settings": [
  {
    "id": "stringSetting",
    "name": "String Setting",
    "description": "A string setting",
    "type": "string",
    "default": "default value",
    "placeholder": "Enter a value"
  },
  {
    "id": "numberSetting",
    "name": "Number Setting",
    "description": "A number setting",
    "type": "number",
    "default": 42,
    "validation": {
      "min": 0,
      "max": 100
    }
  },
  {
    "id": "booleanSetting",
    "name": "Boolean Setting",
    "description": "A boolean setting",
    "type": "boolean",
    "default": true
  },
  {
    "id": "selectSetting",
    "name": "Select Setting",
    "description": "A select setting",
    "type": "select",
    "default": "option1",
    "options": [
      { "value": "option1", "label": "Option 1" },
      { "value": "option2", "label": "Option 2" },
      { "value": "option3", "label": "Option 3" }
    ]
  }
]
```

## Using Hooks

Hooks allow extensions to integrate with different parts of Open WebUI. The framework provides a set of standard hooks:

```javascript
// UI hooks
StandardHooks.UI_ADMIN_MENU
StandardHooks.UI_ADMIN_SETTINGS
StandardHooks.UI_CHAT_SIDEBAR
StandardHooks.UI_CHAT_MESSAGE
StandardHooks.UI_CHAT_INPUT
StandardHooks.UI_HEADER
StandardHooks.UI_SETTINGS

// Model hooks
StandardHooks.MODEL_INIT
StandardHooks.MODEL_LOAD
StandardHooks.MODEL_REQUEST
StandardHooks.MODEL_RESPONSE

// Tool hooks
StandardHooks.TOOL_REGISTER
StandardHooks.TOOL_EXECUTE

// Theme hooks
StandardHooks.THEME_LOAD

// Lifecycle hooks
StandardHooks.INIT
StandardHooks.ACTIVATE
StandardHooks.DEACTIVATE
StandardHooks.UNINSTALL
```

Register hooks in your extension's `initialize` method:

```javascript
this.registerHook({
  name: StandardHooks.UI_CHAT_SIDEBAR,
  handler: this.handleChatSidebar.bind(this),
  priority: 10 // Higher priority hooks run first
});
```

## Building and Packaging Extensions

To build and package an extension:

1. Create all the necessary files as described above
2. Package the files into a ZIP archive
3. The ZIP structure should match the extension structure, with the manifest.json at the root
4. Install the extension through the Extension Manager in Open WebUI

## Example Extensions

Check out the examples in the `examples/extensions` directory for complete extension examples:

- `hello-world`: A simple UI extension example
- `theme-dark`: A theme extension example
- `tool-calculator`: A tool extension example

## Best Practices

- Use unique IDs for your extensions to avoid conflicts
- Follow semantic versioning for your extension versions
- Document your extension's functionality and settings
- Test your extension thoroughly before publishing
- Use the provided base classes and hooks for integration
- Handle errors gracefully
- Clean up resources when your extension is deactivated or uninstalled
