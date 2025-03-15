# Example Extension for Open WebUI

This is an example extension that demonstrates how to build extensions for Open WebUI.

## Features

- Adds a sidebar link
- Demonstrates extension lifecycle (initialize, shutdown)
- Shows how to load configuration

## Installation

1. Copy this directory to your Open WebUI extensions directory
2. Restart Open WebUI
3. Enable the extension in the Extension Manager

## Configuration

The extension can be configured by editing the `extension.json` file:

```json
{
  "name": "Example Extension",
  "description": "An example extension that demonstrates the Open WebUI Extension System",
  "version": "0.1.0",
  "author": "Open WebUI Team",
  "type": "ui",
  "entry_point": "__init__.py",
  "config": {
    "enabled": true,
    "sidebar_position": "bottom",
    "sidebar_icon": "star"
  }
}
```

## Development

This extension serves as a template for developing your own extensions. Here's how to get started:

1. Copy this example extension to a new directory
2. Modify the `extension.json` file with your extension details
3. Update the `__init__.py` file to implement your functionality
4. Add any additional files and resources needed

For more information, see the [Extension Development Guide](https://github.com/open-webui/open-webui-extensions/docs/creating_extensions.md).
