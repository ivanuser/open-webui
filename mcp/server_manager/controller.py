"""
MCP Server Controller Module

This module provides functions for managing MCP server processes,
including starting, stopping, and monitoring servers.
"""

import os
import sys
import signal
import logging
import subprocess
import threading
import time
import json
import platform
from typing import Dict, List, Any, Optional, Tuple, Union
import requests
from urllib.parse import urlparse

from .config import get_config, MCPConfig

logger = logging.getLogger("mcp")

# Max time to wait for server to start (seconds)
SERVER_START_TIMEOUT = 30

# Map of running MCP server processes
running_servers = {}

class MCPServerController:
    """
    Controls MCP server processes
    """
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize MCP server controller
        
        Args:
            config_path: Path to the configuration file
        """
        self.config = get_config(config_path)
    
    def start_server(self, server_id: str) -> Dict[str, Any]:
        """
        Start an MCP server
        
        Args:
            server_id: ID of the server to start
            
        Returns:
            Dict with status of the operation
        """
        # Check if server is already running
        if server_id in running_servers:
            process_info = running_servers[server_id]
            
            # Check if process is still running
            if self._is_process_running(process_info["process"]):
                return {
                    "success": True,
                    "status": "running",
                    "message": "Server is already running",
                    "process_id": process_info["process"].pid
                }
        
        # Get server configuration
        server_config = self.config.get_server(server_id)
        if not server_config:
            return {
                "success": False,
                "status": "error",
                "message": f"Server with ID {server_id} not found"
            }
        
        try:
            # Prepare command and environment
            command = server_config.get("command")
            args = server_config.get("args", [])
            env = server_config.get("env", {})
            
            # Check if command is available
            if command == "uv":
                try:
                    # Try to run uv --version to check if it exists
                    subprocess.run([command, "--version"], 
                                  capture_output=True, 
                                  check=True)
                except (subprocess.SubprocessError, FileNotFoundError):
                    # uv not found, fall back to npx
                    logger.info("uv command not found, falling back to npx")
                    command = "npx"
                    
                    # If args contain uv-specific commands, adjust them
                    if args and args[0] == "run":
                        args = ["-y"] + args[1:]
            
            # Handle uvx fallback to npx
            if command == "uvx":
                try:
                    subprocess.run([command, "--version"], 
                                  capture_output=True, 
                                  check=True)
                except (subprocess.SubprocessError, FileNotFoundError):
                    logger.info("uvx command not found, falling back to npx")
                    command = "npx"
                    
                    if args:
                        args = ["-y"] + args
            
            # Add current environment
            full_env = os.environ.copy()
            full_env.update(env)
            
            # Determine server URL
            url = server_config.get("url")
            if not url:
                # Try to extract port from args
                port = self._extract_port_from_args(args)
                url = f"http://localhost:{port}"
            
            # Start the process
            logger.info(f"Starting MCP server {server_id} with command: {command} {' '.join(args)}")
            
            # Handle Windows vs Unix process creation
            try:
                if platform.system() == "Windows":
                    process = subprocess.Popen(
                        [command] + args,
                        env=full_env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
                    )
                else:
                    process = subprocess.Popen(
                        [command] + args,
                        env=full_env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.PIPE,
                        text=True,
                        preexec_fn=os.setsid
                    )
            except FileNotFoundError:
                logger.error(f"Command not found: {command}")
                return {
                    "success": False,
                    "status": "error",
                    "message": f"Command not found: {command}. Please make sure it's installed."
                }
            
            # Store process information
            process_info = {
                "process": process,
                "command": command,
                "args": args,
                "url": url,
                "start_time": time.time(),
                "status": "starting",
                "logs": []
            }
            
            running_servers[server_id] = process_info
            
            # Start log monitoring threads
            threading.Thread(
                target=self._monitor_process_output,
                args=(server_id, process.stdout, "stdout"),
                daemon=True
            ).start()
            
            threading.Thread(
                target=self._monitor_process_output,
                args=(server_id, process.stderr, "stderr"),
                daemon=True
            ).start()
            
            # Wait for server to become ready
            ready = self._wait_for_server_ready(server_id, url)
            
            if ready:
                # Update status in config
                self.config.update_server_status(server_id, "running")
                
                return {
                    "success": True,
                    "status": "running",
                    "message": "Server started successfully",
                    "process_id": process.pid,
                    "url": url
                }
            else:
                # Server failed to start
                self.stop_server(server_id)
                
                return {
                    "success": False,
                    "status": "error",
                    "message": "Server failed to respond within the timeout period"
                }
            
        except Exception as e:
            logger.error(f"Error starting MCP server {server_id}: {str(e)}")
            
            return {
                "success": False,
                "status": "error",
                "message": f"Error starting server: {str(e)}"
            }
    
    def stop_server(self, server_id: str) -> Dict[str, Any]:
        """
        Stop an MCP server
        
        Args:
            server_id: ID of the server to stop
            
        Returns:
            Dict with status of the operation
        """
        if server_id not in running_servers:
            return {
                "success": False,
                "status": "not_running",
                "message": "Server is not running"
            }
        
        process_info = running_servers[server_id]
        process = process_info["process"]
        
        try:
            # Attempt to gracefully terminate the process
            if platform.system() == "Windows":
                process.terminate()
            else:
                # On Unix, kill the entire process group
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            
            # Wait for process to terminate
            process.wait(timeout=5)
            
            # Remove from running servers
            del running_servers[server_id]
            
            # Update status in config
            self.config.update_server_status(server_id, "stopped")
            
            return {
                "success": True,
                "status": "stopped",
                "message": "Server stopped successfully"
            }
        except subprocess.TimeoutExpired:
            # Force kill if termination times out
            try:
                if platform.system() == "Windows":
                    process.kill()
                else:
                    os.killpg(os.getpgid(process.pid), signal.SIGKILL)
                
                # Remove from running servers
                del running_servers[server_id]
                
                # Update status in config
                self.config.update_server_status(server_id, "stopped")
                
                return {
                    "success": True,
                    "status": "stopped",
                    "message": "Server forcefully stopped"
                }
            except Exception as e:
                logger.error(f"Error forcefully stopping MCP server {server_id}: {str(e)}")
                
                return {
                    "success": False,
                    "status": "error",
                    "message": f"Error stopping server: {str(e)}"
                }
        except Exception as e:
            logger.error(f"Error stopping MCP server {server_id}: {str(e)}")
            
            return {
                "success": False,
                "status": "error",
                "message": f"Error stopping server: {str(e)}"
            }
    
    def check_server_status(self, server_id: str) -> Dict[str, Any]:
        """
        Check the status of an MCP server
        
        Args:
            server_id: ID of the server to check
            
        Returns:
            Dict with server status information
        """
        # Check if server is in our running processes map
        if server_id not in running_servers:
            # Check if server is configured
            server_config = self.config.get_server(server_id)
            if not server_config:
                return {
                    "success": False,
                    "status": "not_found",
                    "message": f"Server with ID {server_id} not found"
                }
            
            return {
                "success": True,
                "status": "stopped",
                "message": "Server is not running"
            }
        
        process_info = running_servers[server_id]
        process = process_info["process"]
        
        # Check if process is still running
        if not self._is_process_running(process):
            # Process terminated unexpectedly
            del running_servers[server_id]
            
            # Update status in config
            self.config.update_server_status(server_id, "stopped")
            
            return {
                "success": True,
                "status": "stopped",
                "message": "Server process has terminated"
            }
        
        # Check if server is responding
        url = process_info["url"]
        try:
            response = requests.get(f"{url}/health", timeout=2)
            if response.ok:
                return {
                    "success": True,
                    "status": "running",
                    "message": "Server is running and responsive",
                    "process_id": process.pid,
                    "url": url,
                    "uptime": time.time() - process_info["start_time"]
                }
            else:
                return {
                    "success": True,
                    "status": "unhealthy",
                    "message": f"Server returned status code {response.status_code}",
                    "process_id": process.pid,
                    "url": url
                }
        except requests.RequestException as e:
            return {
                "success": True,
                "status": "unreachable",
                "message": f"Server is running but not responding: {str(e)}",
                "process_id": process.pid,
                "url": url
            }
    
    def install_server(self, server_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Install an MCP server
        
        Args:
            server_config: Server configuration
            
        Returns:
            Dict with status of the operation
        """
        # Generate server ID if not provided
        server_id = server_config.get("id")
        if not server_id:
            import uuid
            server_id = str(uuid.uuid4())
            server_config["id"] = server_id
        
        # Add default values
        if "status" not in server_config:
            server_config["status"] = "stopped"
        
        # Save the configuration
        self.config.add_server(server_id, server_config)
        
        return {
            "success": True,
            "server_id": server_id,
            "message": "Server configuration installed successfully"
        }
    
    def uninstall_server(self, server_id: str) -> Dict[str, Any]:
        """
        Uninstall an MCP server
        
        Args:
            server_id: ID of the server to uninstall
            
        Returns:
            Dict with status of the operation
        """
        # Stop the server if it's running
        if server_id in running_servers:
            self.stop_server(server_id)
        
        # Remove the configuration
        if self.config.remove_server(server_id):
            return {
                "success": True,
                "message": "Server uninstalled successfully"
            }
        else:
            return {
                "success": False,
                "message": f"Server with ID {server_id} not found"
            }
    
    def get_server_logs(self, server_id: str, limit: int = 100) -> Dict[str, Any]:
        """
        Get logs for an MCP server
        
        Args:
            server_id: ID of the server
            limit: Maximum number of log entries to return
            
        Returns:
            Dict with log entries
        """
        if server_id not in running_servers:
            return {
                "success": False,
                "message": "Server is not running"
            }
        
        process_info = running_servers[server_id]
        logs = process_info.get("logs", [])
        
        return {
            "success": True,
            "logs": logs[-limit:] if limit > 0 else logs
        }
    
    def list_servers(self) -> Dict[str, Any]:
        """
        List all configured servers with their status
        
        Returns:
            Dict with server information
        """
        servers = {}
        
        # Get all configured servers
        for server_id, server_config in self.config.get_servers().items():
            # Check if server is running
            if server_id in running_servers:
                process_info = running_servers[server_id]
                status = "running" if self._is_process_running(process_info["process"]) else "stopped"
                
                servers[server_id] = {
                    **server_config,
                    "status": status,
                    "process_id": process_info["process"].pid if status == "running" else None,
                    "url": process_info["url"],
                    "uptime": time.time() - process_info["start_time"] if status == "running" else 0
                }
            else:
                servers[server_id] = {
                    **server_config,
                    "status": "stopped",
                    "process_id": None,
                    "url": server_config.get("url", "")
                }
        
        return {
            "success": True,
            "servers": servers
        }
    
    def _monitor_process_output(self, server_id: str, pipe, pipe_name: str) -> None:
        """
        Monitor process output and store logs
        
        Args:
            server_id: ID of the server
            pipe: Process pipe to monitor
            pipe_name: Name of the pipe (stdout/stderr)
        """
        for line in iter(pipe.readline, ''):
            if line:
                line = line.strip()
                if server_id in running_servers:
                    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
                    log_entry = {
                        "timestamp": timestamp,
                        "type": pipe_name,
                        "message": line
                    }
                    
                    # Store log entry
                    running_servers[server_id]["logs"].append(log_entry)
                    
                    # Limit log size
                    if len(running_servers[server_id]["logs"]) > 1000:
                        running_servers[server_id]["logs"] = running_servers[server_id]["logs"][-1000:]
                    
                    logger.debug(f"[MCP {server_id}] [{pipe_name}] {line}")
    
    def _wait_for_server_ready(self, server_id: str, url: str) -> bool:
        """
        Wait for the server to become ready
        
        Args:
            server_id: ID of the server
            url: URL to check
            
        Returns:
            True if server is ready, False if timeout
        """
        timeout = time.time() + SERVER_START_TIMEOUT
        
        while time.time() < timeout:
            if server_id not in running_servers:
                # Server was stopped
                return False
            
            try:
                # Try to connect to the health endpoint
                response = requests.get(f"{url}/health", timeout=2)
                if response.ok:
                    # Server is ready
                    running_servers[server_id]["status"] = "running"
                    return True
            except requests.RequestException:
                # Server not ready yet, wait and retry
                pass
            
            # Check if process is still running
            process = running_servers[server_id]["process"]
            if not self._is_process_running(process):
                return False
            
            # Wait before retrying
            time.sleep(1)
        
        return False
    
    def _is_process_running(self, process: subprocess.Popen) -> bool:
        """
        Check if a process is still running
        
        Args:
            process: Process to check
            
        Returns:
            True if process is running, False otherwise
        """
        if process.poll() is None:
            return True
        return False
    
    def _extract_port_from_args(self, args: List[str]) -> int:
        """
        Extract port from command arguments
        
        Args:
            args: Command arguments
            
        Returns:
            Port number (default: 3500)
        """
        port = 3500  # Default port
        
        for i, arg in enumerate(args):
            if arg == "--port" and i + 1 < len(args):
                try:
                    port = int(args[i + 1])
                    break
                except ValueError:
                    pass
        
        return port
