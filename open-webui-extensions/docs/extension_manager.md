# Open WebUI Extension Manager

The Extension Manager provides an interface for managing extensions in Open WebUI.

## Table of Contents

- [Overview](#overview)
- [Using the Extension Manager](#using-the-extension-manager)
  - [Viewing Installed Extensions](#viewing-installed-extensions)
  - [Installing Extensions](#installing-extensions)
  - [Enabling and Disabling Extensions](#enabling-and-disabling-extensions)
  - [Uninstalling Extensions](#uninstalling-extensions)
  - [Configuring Extensions](#configuring-extensions)
- [Extension Manager API](#extension-manager-api)
- [Security Considerations](#security-considerations)

## Overview

The Extension Manager is a component of Open WebUI that allows administrators to:

- View installed extensions
- Install new extensions
- Enable or disable extensions
- Configure extension settings
- Uninstall extensions

It provides both a user interface in the admin settings and a REST API for managing extensions programmatically.

## Using the Extension Manager

### Viewing Installed Extensions

1. Log in to Open WebUI as an administrator
2. Navigate to **Settings > Extensions**
3. View the list of installed extensions

Each extension card shows:
- Extension name and description
- Version and author information
- Current status (enabled, disabled, or error)
- Type of extension (UI, API, model, tool, or theme)

### Installing Extensions

#### Method 1: Upload Extension Files

1. Navigate to **Settings > Extensions**
2. Click the **Add Extension** button
3. Fill in the extension details:
   - Name
   - Description
   - Version
   - Author
   - Type
   - Entry Point
   - Configuration (optional)
4. Click **Install**

#### Method 2: Install from Directory

If you have the extension files on your server:

1. Place the extension files in the `extensions` directory
2. Navigate to **Settings > Extensions**
3. Click the **Refresh** button
4. The extension should appear in the list

### Enabling and Disabling Extensions

1. Navigate to **Settings > Extensions**
2. Find the extension you want to enable or disable
3. Click the **Enable** or **Disable** button on the extension card

Enabling an extension will:
- Load the extension
- Initialize its components
- Make its features available in Open WebUI

Disabling an extension will:
- Unload the extension
- Remove its components from Open WebUI
- Keep its files and configuration for future use

### Uninstalling Extensions

1. Navigate to **Settings > Extensions**
2. Find the extension you want to uninstall
3. Click the **Uninstall** button on the extension card
4. Confirm the uninstallation

Uninstalling an extension will:
- Disable the extension
- Remove its files and configuration
- Remove it from the list of installed extensions

### Configuring Extensions

Some extensions provide configuration options:

1. Navigate to **Settings > Extensions**
2. Find the extension you want to configure
3. Click the **Configure** button on the extension card (if available)
4. Update the extension's configuration
5. Click **Save**

## Extension Manager API

The Extension Manager provides a REST API for managing extensions programmatically:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/extensions` | GET | List all installed extensions |
| `/api/extensions/{id}` | GET | Get details for a specific extension |
| `/api/extensions` | POST | Install a new extension |
| `/api/extensions/{id}` | DELETE | Uninstall an extension |
| `/api/extensions/{id}/enable` | POST | Enable an extension |
| `/api/extensions/{id}/disable` | POST | Disable an extension |
| `/api/extensions/{id}` | PATCH | Update an extension's configuration |
| `/api/extensions/{id}/reload` | POST | Reload an extension |

See the [Extension API documentation](extension_api.md) for more details.

## Security Considerations

Extensions run with the same privileges as Open WebUI itself. This means they can:

- Access the file system
- Make network requests
- Modify the user interface
- Interact with AI models
- Access user data

To mitigate security risks:

1. **Only install extensions from trusted sources**
2. **Review extension code before installation**
3. **Keep extensions updated to the latest versions**
4. **Disable extensions that you are not using**
5. **Monitor extension behavior for any suspicious activity**

The Extension Manager verifies extension integrity during installation and loading, but it cannot guarantee that an extension is free from security vulnerabilities or malicious code.
