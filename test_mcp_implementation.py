#!/usr/bin/env python
"""
MCP Implementation Test Script

This script tests the basic functionality of the MCP implementation.
"""

import os
import sys
import argparse
import logging
import asyncio
import json
from pathlib import Path

# Add the project directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from mcp.server_manager import MCPServerController
from mcp.templates import get_server_templates
from mcp.transport.stdio import StdioTransport

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("mcp-test")

async def test_controller(controller):
    """Test server controller functionality"""
    logger.info("Testing server controller...")
    
    # Test templates
    templates = get_server_templates()
    logger.info(f"Available templates: {', '.join(templates.keys())}")
    
    # Test server installation
    server_id = "test-server"
    test_dir = os.path.abspath(os.path.dirname(__file__))
    
    server_config = {
        "id": server_id,
        "name": "Test Filesystem Server",
        "type": "filesystem-py",
        "description": "Test server for filesystem operations",
        "command": "python",
        "args": ["filesystem_mcp_server.py", test_dir],
        "url": "http://localhost:3500"
    }
    
    # Install server
    logger.info("Installing test server...")
    result = controller.install_server(server_config)
    if not result["success"]:
        logger.error(f"Failed to install server: {result['message']}")
        return False
    
    # Start server
    logger.info("Starting test server...")
    result = controller.start_server(server_id)
    if not result["success"]:
        logger.error(f"Failed to start server: {result['message']}")
        return False
    
    # Wait for server to start
    logger.info("Waiting for server to start...")
    await asyncio.sleep(2)
    
    # Check server status
    logger.info("Checking server status...")
    result = controller.check_server_status(server_id)
    logger.info(f"Server status: {result}")
    
    # Stop server
    logger.info("Stopping test server...")
    result = controller.stop_server(server_id)
    if not result["success"]:
        logger.error(f"Failed to stop server: {result['message']}")
        return False
    
    # Uninstall server
    logger.info("Uninstalling test server...")
    result = controller.uninstall_server(server_id)
    if not result["success"]:
        logger.error(f"Failed to uninstall server: {result['message']}")
        return False
    
    logger.info("Server controller test completed successfully")
    return True

async def test_transport():
    """Test transport functionality"""
    logger.info("Testing transport...")
    
    # Create a temporary server
    test_dir = os.path.abspath(os.path.dirname(__file__))
    process = await asyncio.create_subprocess_exec(
        "python",
        "filesystem_mcp_server.py",
        test_dir,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    # Create transport
    transport = StdioTransport()
    transport.process = process
    
    # Initialize
    logger.info("Initializing transport...")
    initialized = await transport.initialize()
    if not initialized:
        logger.error("Failed to initialize transport")
        return False
    
    # List tools
    logger.info("Listing tools...")
    tools = await transport.list_tools()
    logger.info(f"Available tools: {[tool['name'] for tool in tools]}")
    
    # Call tool
    logger.info("Calling list_directory tool...")
    result = await transport.call_tool("list_directory", {"path": test_dir})
    logger.info(f"Tool result: {result}")
    
    # Shutdown
    logger.info("Shutting down transport...")
    await transport.shutdown()
    
    logger.info("Transport test completed successfully")
    return True

async def main():
    parser = argparse.ArgumentParser(description="Test MCP implementation")
    parser.add_argument("--controller", action="store_true", help="Test controller")
    parser.add_argument("--transport", action="store_true", help="Test transport")
    args = parser.parse_args()
    
    # Run all tests if none specified
    if not args.controller and not args.transport:
        args.controller = True
        args.transport = True
    
    success = True
    
    # Test controller
    if args.controller:
        controller = MCPServerController()
        if not await test_controller(controller):
            success = False
    
    # Test transport
    if args.transport:
        if not await test_transport():
            success = False
    
    if success:
        logger.info("All tests passed successfully")
        sys.exit(0)
    else:
        logger.error("Some tests failed")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
