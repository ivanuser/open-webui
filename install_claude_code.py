#!/usr/bin/env python3
"""
Claude Code Integration Installer
Automatically adds Claude Code functionality to Open WebUI
"""

import os
import sys
import json
import shutil
import subprocess
import argparse
from pathlib import Path
from typing import Dict, Any, Optional

# ANSI color codes
GREEN = '\033[0;32m'
YELLOW = '\033[1;33m'
RED = '\033[0;31m'
BLUE = '\033[0;34m'
NC = '\033[0m'  # No Color

def print_color(text: str, color: str = NC):
    """Print colored text"""
    print(f"{color}{text}{NC}")

def print_header():
    """Print installer header"""
    print_color("\n" + "="*60, BLUE)
    print_color("Claude Code Integration Installer for Open WebUI", BLUE)
    print_color("="*60 + "\n", BLUE)

def check_openwebui_installation() -> Optional[Path]:
    """Check if Open WebUI is installed and return the path"""
    print("Checking for Open WebUI installation...")
    
    # Check common installation paths
    possible_paths = [
        Path.cwd(),
        Path("/app"),  # Docker installation
        Path("/opt/open-webui"),
        Path.home() / "open-webui",
    ]
    
    for path in possible_paths:
        main_py = path / "backend" / "open_webui" / "main.py"
        if main_py.exists():
            print_color(f"✓ Found Open WebUI at: {path}", GREEN)
            return path
    
    # Check if we're in a subdirectory
    current = Path.cwd()
    while current != current.parent:
        main_py = current / "backend" / "open_webui" / "main.py"
        if main_py.exists():
            print_color(f"✓ Found Open WebUI at: {current}", GREEN)
            return current
        current = current.parent
    
    return None

def check_node_installed() -> bool:
    """Check if Node.js is installed"""
    try:
        result = subprocess.run(["node", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print_color(f"✓ Node.js installed: {result.stdout.strip()}", GREEN)
            return True
    except FileNotFoundError:
        pass
    
    print_color("✗ Node.js not installed", RED)
    return False

def check_claude_cli_installed() -> bool:
    """Check if Claude CLI is installed"""
    try:
        result = subprocess.run(["claude", "--version"], capture_output=True, text=True)
        if result.returncode == 0:
            print_color(f"✓ Claude CLI installed: {result.stdout.strip()}", GREEN)
            return True
    except FileNotFoundError:
        pass
    
    print_color("✗ Claude CLI not installed", YELLOW)
    return False

def install_node() -> bool:
    """Install Node.js"""
    print("\nInstalling Node.js...")
    
    system = subprocess.run(["uname", "-s"], capture_output=True, text=True).stdout.strip().lower()
    
    if system == "linux":
        # Linux installation
        commands = [
            "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
            "sudo apt-get install -y nodejs"
        ]
    elif system == "darwin":
        # macOS installation
        commands = ["brew install node"]
    else:
        print_color("Please install Node.js manually from https://nodejs.org", YELLOW)
        return False
    
    for cmd in commands:
        print(f"Running: {cmd}")
        result = subprocess.run(cmd, shell=True)
        if result.returncode != 0:
            print_color("Failed to install Node.js", RED)
            return False
    
    return check_node_installed()

def install_claude_cli() -> bool:
    """Install Claude CLI"""
    print("\nInstalling Claude CLI...")
    
    cmd = "npm install -g @anthropic-ai/claude-code"
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True)
    
    if result.returncode != 0:
        print_color("Failed to install Claude CLI", RED)
        return False
    
    return check_claude_cli_installed()

def get_oauth_token() -> Optional[str]:
    """Get OAuth token from user"""
    print("\n" + "-"*40)
    print_color("Claude Pro OAuth Token Setup", BLUE)
    print("-"*40)
    
    print("\nTo use Claude Code, you need a Claude Pro subscription.")
    print("Get your OAuth token by running:")
    print_color("  npx @anthropic-ai/claude-code login", YELLOW)
    print("\nThe token will start with 'sk-ant-oat01-'")
    
    token = input("\nEnter your Claude OAuth token (or 'skip' to configure later): ").strip()
    
    if token.lower() == 'skip':
        return None
    
    if not token.startswith("sk-ant-oat01-"):
        print_color("Warning: Token format seems incorrect", YELLOW)
        confirm = input("Continue anyway? (y/n): ").lower()
        if confirm != 'y':
            return None
    
    return token

def create_backup(openwebui_path: Path) -> bool:
    """Create backup of existing files"""
    print("\nCreating backup...")
    
    backup_dir = openwebui_path / "backup_claude_code"
    backup_dir.mkdir(exist_ok=True)
    
    files_to_backup = [
        "backend/open_webui/main.py",
        "backend/open_webui/utils/models.py",
        "backend/open_webui/utils/chat.py"
    ]
    
    for file_path in files_to_backup:
        src = openwebui_path / file_path
        if src.exists():
            dst = backup_dir / file_path
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
            print(f"  Backed up: {file_path}")
    
    print_color(f"✓ Backup created at: {backup_dir}", GREEN)
    return True

def install_backend_files(openwebui_path: Path) -> bool:
    """Install backend router and configuration files"""
    print("\nInstalling backend components...")
    
    # Create the integrated router file
    router_path = openwebui_path / "backend" / "open_webui" / "routers" / "claude_code_integrated.py"
    
    # Check if our router file exists in the current directory
    local_router = Path("backend/open_webui/routers/claude_code_integrated.py")
    if local_router.exists():
        shutil.copy2(local_router, router_path)
        print_color(f"✓ Installed Claude Code router", GREEN)
    else:
        print_color("✗ Router file not found in installation package", RED)
        return False
    
    return True

def install_frontend_files(openwebui_path: Path) -> bool:
    """Install frontend components"""
    print("\nInstalling frontend components...")
    
    # Install the Claude Code settings component
    component_path = openwebui_path / "src" / "lib" / "components" / "admin" / "Settings" / "ClaudeCode.svelte"
    component_path.parent.mkdir(parents=True, exist_ok=True)
    
    local_component = Path("src/lib/components/admin/Settings/ClaudeCode.svelte")
    if local_component.exists():
        shutil.copy2(local_component, component_path)
        print_color(f"✓ Installed admin panel component", GREEN)
    
    # Install API client
    api_path = openwebui_path / "src" / "lib" / "apis" / "claudecode.ts"
    local_api = Path("src/lib/apis/claudecode.ts")
    if local_api.exists():
        shutil.copy2(local_api, api_path)
        print_color(f"✓ Installed API client", GREEN)
    
    return True

def configure_claude_code(openwebui_path: Path, oauth_token: Optional[str]) -> bool:
    """Configure Claude Code settings"""
    print("\nConfiguring Claude Code...")
    
    data_dir = openwebui_path / "backend" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    
    config_file = data_dir / "claude_code_config.json"
    
    config = {
        "enabled": bool(oauth_token),
        "oauth_token": oauth_token,
        "command_path": "claude",
        "timeout": 60,
        "auto_install": True,
        "stream_responses": False,
        "max_context_messages": 10
    }
    
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print_color(f"✓ Configuration saved to: {config_file}", GREEN)
    
    if oauth_token:
        # Set environment variable
        os.environ["CLAUDE_CODE_OAUTH_TOKEN"] = oauth_token
        print_color("✓ OAuth token configured", GREEN)
    
    return True

def test_integration(oauth_token: Optional[str]) -> bool:
    """Test Claude Code integration"""
    if not oauth_token:
        print_color("\nSkipping integration test (no OAuth token configured)", YELLOW)
        return True
    
    print("\nTesting Claude Code integration...")
    
    try:
        cmd = ["claude", "--print", "Hello"]
        env = os.environ.copy()
        env["CLAUDE_CODE_OAUTH_TOKEN"] = oauth_token
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=10, env=env)
        
        if result.returncode == 0 and result.stdout:
            print_color("✓ Claude Code integration test successful", GREEN)
            print(f"  Response preview: {result.stdout[:100]}...")
            return True
        else:
            print_color("✗ Integration test failed", RED)
            if result.stderr:
                print(f"  Error: {result.stderr}")
            return False
    except subprocess.TimeoutExpired:
        print_color("✗ Test timed out", RED)
        return False
    except Exception as e:
        print_color(f"✗ Test failed: {e}", RED)
        return False

def print_next_steps(openwebui_path: Path, oauth_token: Optional[str]):
    """Print next steps for the user"""
    print_color("\n" + "="*60, GREEN)
    print_color("Installation Complete!", GREEN)
    print_color("="*60, GREEN)
    
    print("\nNext steps:")
    
    step = 1
    
    if not oauth_token:
        print(f"\n{step}. Get your Claude OAuth token:")
        print_color("   npx @anthropic-ai/claude-code login", YELLOW)
        step += 1
    
    print(f"\n{step}. Restart Open WebUI:")
    if (openwebui_path / "docker-compose.yaml").exists():
        print_color("   docker-compose restart", YELLOW)
    else:
        print_color("   Restart your Open WebUI service", YELLOW)
    step += 1
    
    print(f"\n{step}. Configure in Admin Panel:")
    print("   - Go to Admin Settings > Claude Code")
    if not oauth_token:
        print("   - Enter your OAuth token")
    print("   - Enable Claude Code")
    print("   - Test the integration")
    step += 1
    
    print(f"\n{step}. Use Claude Code:")
    print("   - Select 'Claude Code' from the model dropdown in chat")
    print("   - Start coding with Claude!")
    
    print("\n" + "-"*60)
    print("For support, visit: https://github.com/open-webui/open-webui")
    print("-"*60 + "\n")

def main():
    """Main installation function"""
    parser = argparse.ArgumentParser(description='Install Claude Code integration for Open WebUI')
    parser.add_argument('--path', type=str, help='Path to Open WebUI installation')
    parser.add_argument('--token', type=str, help='Claude OAuth token')
    parser.add_argument('--skip-node', action='store_true', help='Skip Node.js installation')
    parser.add_argument('--skip-cli', action='store_true', help='Skip Claude CLI installation')
    parser.add_argument('--no-backup', action='store_true', help='Skip backup creation')
    
    args = parser.parse_args()
    
    print_header()
    
    # Step 1: Find Open WebUI installation
    if args.path:
        openwebui_path = Path(args.path)
        if not (openwebui_path / "backend" / "open_webui" / "main.py").exists():
            print_color(f"Error: Open WebUI not found at {openwebui_path}", RED)
            sys.exit(1)
    else:
        openwebui_path = check_openwebui_installation()
        if not openwebui_path:
            print_color("Error: Could not find Open WebUI installation", RED)
            print("Please run this script from the Open WebUI directory or use --path")
            sys.exit(1)
    
    # Step 2: Check/Install Node.js
    if not args.skip_node:
        if not check_node_installed():
            if not install_node():
                print_color("Warning: Node.js installation failed", YELLOW)
                print("Please install Node.js manually")
    
    # Step 3: Check/Install Claude CLI
    if not args.skip_cli:
        if not check_claude_cli_installed():
            if check_node_installed():
                if not install_claude_cli():
                    print_color("Warning: Claude CLI installation failed", YELLOW)
                    print("Please run: npm install -g @anthropic-ai/claude-code")
    
    # Step 4: Get OAuth token
    oauth_token = args.token
    if not oauth_token:
        oauth_token = get_oauth_token()
    
    # Step 5: Create backup
    if not args.no_backup:
        create_backup(openwebui_path)
    
    # Step 6: Install files
    backend_ok = install_backend_files(openwebui_path)
    frontend_ok = install_frontend_files(openwebui_path)
    
    if not backend_ok:
        print_color("Error: Backend installation failed", RED)
        sys.exit(1)
    
    # Step 7: Configure
    configure_claude_code(openwebui_path, oauth_token)
    
    # Step 8: Test
    if oauth_token:
        test_integration(oauth_token)
    
    # Step 9: Print next steps
    print_next_steps(openwebui_path, oauth_token)

if __name__ == "__main__":
    main()