#!/usr/bin/env python3
"""
Installation script for the Open WebUI Extension System
"""

import os
import sys
import shutil
import argparse
import logging
import subprocess
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("extension_installer")

def ensure_dir(directory):
    """
    Ensure a directory exists
    """
    if not os.path.exists(directory):
        os.makedirs(directory)
        logger.info(f"Created directory: {directory}")

def copy_files(source_dir, target_dir):
    """
    Copy files from source to target directory
    """
    if not os.path.exists(source_dir):
        logger.error(f"Source directory does not exist: {source_dir}")
        return False
        
    ensure_dir(target_dir)
    
    # Copy all files and subdirectories
    for item in os.listdir(source_dir):
        source_item = os.path.join(source_dir, item)
        target_item = os.path.join(target_dir, item)
        
        if os.path.isdir(source_item):
            # Skip __pycache__ directories
            if item == "__pycache__":
                continue
                
            shutil.copytree(source_item, target_item, dirs_exist_ok=True)
            logger.info(f"Copied directory: {item}")
        else:
            shutil.copy2(source_item, target_item)
            logger.info(f"Copied file: {item}")
    
    return True

def install_dependencies():
    """
    Install Python dependencies
    """
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-e", "."])
        logger.info("Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Error installing dependencies: {e}")
        return False

def integrate_with_open_webui(open_webui_dir):
    """
    Integrate the extension system with Open WebUI
    """
    if not os.path.exists(open_webui_dir):
        logger.error(f"Open WebUI directory does not exist: {open_webui_dir}")
        return False
    
    # Create extensions directory
    extensions_dir = os.path.join(open_webui_dir, "extensions")
    ensure_dir(extensions_dir)
    
    # Copy example extension to extensions directory
    source_example_dir = "example_extension"
    target_example_dir = os.path.join(extensions_dir, "example")
    copy_files(source_example_dir, target_example_dir)
    
    # Create a README in the extensions directory
    readme_path = os.path.join(extensions_dir, "README.md")
    with open(readme_path, "w") as f:
        f.write("# Open WebUI Extensions\n\n")
        f.write("This directory contains installed extensions for Open WebUI.\n\n")
        f.write("Extensions can be managed through the Extension Manager in the admin settings.\n")
    
    logger.info("Integrated with Open WebUI successfully")
    return True

def main():
    """
    Main installation function
    """
    parser = argparse.ArgumentParser(description="Install Open WebUI Extension System")
    parser.add_argument("--open-webui-dir", help="Path to Open WebUI directory", default=".")
    args = parser.parse_args()
    
    # Get the directory of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Change to script directory
    os.chdir(script_dir)
    
    logger.info("Installing Open WebUI Extension System...")
    
    # Install dependencies
    logger.info("Installing dependencies...")
    install_dependencies()
    
    # Integrate with Open WebUI
    logger.info("Integrating with Open WebUI...")
    integrate_with_open_webui(args.open_webui_dir)
    
    logger.info("Installation complete!")
    logger.info("You can now use the Extension Manager in Open WebUI.")

if __name__ == "__main__":
    main()
