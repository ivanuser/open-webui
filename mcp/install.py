#!/usr/bin/env python
"""
MCP Installation Script

This script installs the MCP package and its dependencies.
"""

import os
import sys
import subprocess
import argparse
import shutil
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("mcp-install")

def check_python_version():
    """Check if Python version is 3.9 or higher"""
    if sys.version_info < (3, 9):
        logger.error("Python 3.9 or higher is required")
        sys.exit(1)
    return True

def check_dependencies():
    """Check if dependencies are installed"""
    try:
        import pip
        return True
    except ImportError:
        logger.error("pip is not installed")
        sys.exit(1)

def install_package(dev=False):
    """Install the package"""
    try:
        if dev:
            # Install in development mode
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-e", "."])
        else:
            # Install in normal mode
            subprocess.check_call([sys.executable, "-m", "pip", "install", "."])
        
        logger.info("MCP package installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install package: {e}")
        sys.exit(1)

def install_modelcontextprotocol():
    """Install MCP package from PyPI"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "mcp"])
        logger.info("modelcontextprotocol package installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install modelcontextprotocol: {e}")
        sys.exit(1)

def install_server_packages():
    """Install MCP server packages"""
    try:
        # Install filesystem server
        subprocess.check_call([sys.executable, "-m", "pip", "install", "uv"])
        
        # If npx is available, install Node.js packages
        if shutil.which("npx"):
            subprocess.check_call(["npx", "-y", "@modelcontextprotocol/server-filesystem"])
            logger.info("Installed @modelcontextprotocol/server-filesystem")
        else:
            logger.warning("npx not found, skipping Node.js packages installation")
        
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install server packages: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Install MCP package")
    parser.add_argument("--dev", action="store_true", help="Install in development mode")
    parser.add_argument("--servers", action="store_true", help="Install MCP server packages")
    args = parser.parse_args()
    
    logger.info("Starting MCP installation")
    
    # Check Python version
    check_python_version()
    
    # Check dependencies
    check_dependencies()
    
    # Install MCP package
    install_modelcontextprotocol()
    
    # Install the package
    install_package(dev=args.dev)
    
    # Install server packages if requested
    if args.servers:
        install_server_packages()
    
    logger.info("MCP installation completed successfully")

if __name__ == "__main__":
    main()
