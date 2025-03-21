"""
Model Context Protocol (MCP) Implementation

This package provides a comprehensive implementation of the Model Context Protocol (MCP),
including server management, client functionality, and transport mechanisms.
"""

import logging

# Configure logging
logger = logging.getLogger("mcp")
logger.setLevel(logging.INFO)

# Create console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
console_handler.setFormatter(formatter)

# Add handler to logger
logger.addHandler(console_handler)

# Disable propagation to root logger
logger.propagate = False

__version__ = "1.0.0"

# Import subpackages
from . import server_manager
from . import client
from . import transport
from . import templates

__all__ = ["server_manager", "client", "transport", "templates", "__version__"]
