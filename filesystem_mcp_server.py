#!/usr/bin/env python
"""
Filesystem MCP Server

This server implements the Model Context Protocol (MCP) for filesystem operations.
It allows an LLM to interact with files and directories on your system.
"""

import os
import sys
import glob
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

from mcp.server.fastmcp import FastMCP, Context, Image

# Create MCP server with a descriptive name
mcp = FastMCP("Filesystem MCP Server", 
              description="Provides tools for interacting with the local filesystem")

# Get allowed directories from command line arguments or use current directory
ALLOWED_DIRS = sys.argv[1:] if len(sys.argv) > 1 else [os.getcwd()]
ALLOWED_DIRS = [os.path.abspath(d) for d in ALLOWED_DIRS]

print(f"Starting Filesystem MCP Server with allowed directories: {ALLOWED_DIRS}")

def is_path_allowed(path: str) -> bool:
    """Check if a path is within allowed directories."""
    abs_path = os.path.abspath(path)
    return any(abs_path.startswith(allowed_dir) for allowed_dir in ALLOWED_DIRS)

def format_size(size_bytes: int) -> str:
    """Format file size in a human-readable format."""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} PB"

def format_timestamp(timestamp: float) -> str:
    """Format timestamp as a readable date."""
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

@mcp.tool()
def read_file(path: str) -> str:
    """
    Read the complete contents of a file from the file system.
    
    Args:
        path: The path to the file to read.
        
    Returns:
        The contents of the file as a string.
    """
    if not is_path_allowed(path):
        return f"Error: Access to {path} is not allowed. Allowed directories are: {', '.join(ALLOWED_DIRS)}"
    
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except Exception as e:
        return f"Error reading file: {str(e)}"

@mcp.tool()
def read_multiple_files(paths: List[str]) -> Dict[str, str]:
    """
    Read the contents of multiple files simultaneously.
    
    Args:
        paths: List of file paths to read.
        
    Returns:
        Dictionary mapping file paths to their contents.
    """
    results = {}
    for path in paths:
        if not is_path_allowed(path):
            results[path] = f"Error: Access to {path} is not allowed"
            continue
        
        try:
            with open(path, 'r', encoding='utf-8') as f:
                results[path] = f.read()
        except Exception as e:
            results[path] = f"Error reading file: {str(e)}"
            
    return results

@mcp.tool()
def write_file(path: str, content: str) -> str:
    """
    Create a new file or completely overwrite an existing file with new content.
    
    Args:
        path: The path where the file should be created or overwritten.
        content: The content to write to the file.
        
    Returns:
        Status message indicating success or failure.
    """
    if not is_path_allowed(path):
        return f"Error: Access to {path} is not allowed. Allowed directories are: {', '.join(ALLOWED_DIRS)}"
    
    try:
        # Create parent directories if they don't exist
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"Successfully wrote {len(content)} characters to {path}"
    except Exception as e:
        return f"Error writing file: {str(e)}"

@mcp.tool()
def create_directory(path: str) -> str:
    """
    Create a new directory or ensure it exists. Can create nested directories.
    
    Args:
        path: The path where the directory should be created.
        
    Returns:
        Status message indicating success or failure.
    """
    if not is_path_allowed(path):
        return f"Error: Access to {path} is not allowed. Allowed directories are: {', '.join(ALLOWED_DIRS)}"
    
    try:
        os.makedirs(path, exist_ok=True)
        return f"Successfully created directory at {path}"
    except Exception as e:
        return f"Error creating directory: {str(e)}"

@mcp.tool()
def list_directory(path: str) -> str:
    """
    Get a detailed listing of all files and directories in a specified path.
    
    Args:
        path: The directory path to list.
        
    Returns:
        A formatted string with file and directory listings.
    """
    if not is_path_allowed(path):
        return f"Error: Access to {path} is not allowed. Allowed directories are: {', '.join(ALLOWED_DIRS)}"
    
    try:
        if not os.path.exists(path):
            return f"Error: Path {path} does not exist"
        
        if not os.path.isdir(path):
            return f"Error: Path {path} is not a directory"
        
        items = os.listdir(path)
        result = f"Directory listing for {path}:\n"
        
        directories = []
        files = []
        
        for item in items:
            item_path = os.path.join(path, item)
            if os.path.isdir(item_path):
                directories.append(f"[DIR] {item}")
            else:
                size = os.path.getsize(item_path)
                files.append(f"[FILE] {item} ({format_size(size)})")
        
        # Sort and add directories
        if directories:
            result += "\nDirectories:\n" + "\n".join(sorted(directories))
        
        # Sort and add files
        if files:
            result += "\n\nFiles:\n" + "\n".join(sorted(files))
        
        if not directories and not files:
            result += "\nDirectory is empty."
            
        return result
    except Exception as e:
        return f"Error listing directory: {str(e)}"

@mcp.tool()
def move_file(source: str, destination: str) -> str:
    """
    Move or rename files and directories.
    
    Args:
        source: Source file or directory path.
        destination: Destination path.
        
    Returns:
        Status message indicating success or failure.
    """
    if not is_path_allowed(source) or not is_path_allowed(destination):
        return f"Error: Access to source or destination is not allowed. Allowed directories are: {', '.join(ALLOWED_DIRS)}"
    
    try:
        if os.path.exists(destination):
            return f"Error: Destination {destination} already exists"
        
        # Create parent directories if they don't exist
        os.makedirs(os.path.dirname(os.path.abspath(destination)), exist_ok=True)
        
        shutil.move(source, destination)
        return f"Successfully moved {source} to {destination}"
    except Exception as e:
        return f"Error moving file: {str(e)}"

@mcp.tool()
def search_files(path: str, pattern: str) -> str:
    """
    Recursively search for files and directories matching a pattern.
    
    Args:
        path: The starting directory path for the search.
        pattern: The search pattern (glob format).
        
    Returns:
        A list of matched files and directories.
    """
    if not is_path_allowed(path):
        return f"Error: Access to {path} is not allowed. Allowed directories are: {', '.join(ALLOWED_DIRS)}"
    
    try:
        if not os.path.exists(path):
            return f"Error: Path {path} does not exist"
        
        if not os.path.isdir(path):
            return f"Error: Path {path} is not a directory"
        
        # Construct search path with pattern
        search_path = os.path.join(path, "**", pattern)
        matches = glob.glob(search_path, recursive=True)
        
        if not matches:
            return f"No files matching '{pattern}' found in {path}"
        
        result = f"Found {len(matches)} matches for '{pattern}' in {path}:\n"
        for match in sorted(matches):
            item_type = "[DIR]" if os.path.isdir(match) else "[FILE]"
            relative_path = os.path.relpath(match, path)
            result += f"{item_type} {relative_path}\n"
            
        return result
    except Exception as e:
        return f"Error searching files: {str(e)}"

@mcp.tool()
def get_file_info(path: str) -> str:
    """
    Retrieve detailed metadata about a file or directory.
    
    Args:
        path: Path to the file or directory.
        
    Returns:
        Formatted string with file metadata.
    """
    if not is_path_allowed(path):
        return f"Error: Access to {path} is not allowed. Allowed directories are: {', '.join(ALLOWED_DIRS)}"
    
    try:
        if not os.path.exists(path):
            return f"Error: Path {path} does not exist"
        
        stats = os.stat(path)
        is_dir = os.path.isdir(path)
        
        info = {
            "Path": path,
            "Type": "Directory" if is_dir else "File",
            "Size": format_size(stats.st_size) if not is_dir else "N/A",
            "Created": format_timestamp(stats.st_ctime),
            "Modified": format_timestamp(stats.st_mtime),
            "Accessed": format_timestamp(stats.st_atime),
            "Permissions": oct(stats.st_mode)[-3:],
        }
        
        result = "File Information:\n"
        max_key_len = max(len(key) for key in info.keys())
        for key, value in info.items():
            result += f"{key.ljust(max_key_len)}: {value}\n"
            
        return result
    except Exception as e:
        return f"Error getting file info: {str(e)}"

@mcp.tool()
def list_allowed_directories() -> str:
    """
    Returns the list of directories that this server is allowed to access.
    
    Returns:
        Formatted string with allowed directories.
    """
    result = "This MCP server has access to the following directories:\n"
    for i, directory in enumerate(ALLOWED_DIRS, 1):
        result += f"{i}. {directory}\n"
    return result

if __name__ == "__main__":
    mcp.run()
