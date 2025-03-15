# Open WebUI Extension System

A framework for developing, installing, and managing extensions for [Open WebUI](https://github.com/open-webui/open-webui).

## Overview

The Open WebUI Extension System provides:

- **Extension Manager**: Admin interface for managing extensions
- **Extension Framework**: Core libraries and interfaces for extension development
- **Extension Registry**: System for discovering and loading extensions
- **Extension API**: Standard interfaces for extensions to integrate with Open WebUI

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Creating Extensions](#creating-extensions)
- [Documentation](#documentation)
- [Example Extensions](#example-extensions)
- [Contributing](#contributing)
- [License](#license)

## Installation

### Method 1: Using the Install Script

1. Clone the repository:
   ```bash
   git clone https://github.com/open-webui/open-webui-extensions.git
   cd open-webui-extensions
   ```

2. Run the install script:
   ```bash
   python install.py --open-webui-dir /path/to/open-webui
   ```

### Method 2: Using Pip

1. Install the package:
   ```bash
   pip install open-webui-extensions
   ```

2. Run the installer:
   ```bash
   open-webui-extensions-install --open-webui-dir /path/to/open-webui
   ```

### Method 3: Manual Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/open-webui/open-webui-extensions.git
   ```

2. Copy the files to the appropriate directories:
   ```bash
   cp -r open-webui-extensions/extension_manager /path/to/open-webui/
   cp -r open-webui-extensions/extension_framework /path/to/open-webui/
   cp -r open-webui-extensions/example_extension /path/to/open-webui/extensions/example
   ```

3. Install dependencies:
   ```bash
   cd open-webui-extensions
   pip install -e .
   ```

## Usage

After installation, you can use the Extension Manager in Open WebUI:

1. Log in to Open WebUI as an administrator
2. Navigate to **Settings > Extensions**
3. Manage your extensions through the user interface

## Creating Extensions

To create your own extension:

1. Use the example extension as a template:
   ```bash
   cp -r example_extension my_extension
   ```

2. Edit the extension files to implement your functionality
3. Install the extension through the Extension Manager

For more details, see the [Creating Extensions](docs/creating_extensions.md) guide.

## Documentation

- [Creating Extensions](docs/creating_extensions.md): Guide to creating extensions
- [Extension API](docs/extension_api.md): API reference for extension development
- [Extension Manager](docs/extension_manager.md): Guide to using the Extension Manager

## Example Extensions

The repository includes an example extension that demonstrates how to use the Extension System:

- **Example Extension**: A simple UI extension that adds a sidebar item

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
