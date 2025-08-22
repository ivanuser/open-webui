#!/usr/bin/env python3
"""
Simple backend server for testing Claude Code integration
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock Claude Code config endpoint
@app.get("/api/v1/claude-code/config")
async def get_claude_code_config():
    return {
        "enabled": True,
        "command_path": "claude",
        "working_directory": None
    }

# Mock Claude Code models endpoint
@app.get("/api/v1/claude-code/models")
async def get_claude_code_models():
    return [{
        "id": "claude-code",
        "name": "Claude Code (Mock)",
        "object": "model",
        "created": 1700000000,
        "owned_by": "claude-code-cli",
        "info": {
            "description": "Claude Code CLI integration (Mock for testing)",
            "context_length": 200000,
            "vision": True,
            "tools": True
        }
    }]

# Mock main models endpoint
@app.get("/api/models")
@app.get("/api/v1/models")
async def get_models():
    return {
        "data": [{
            "id": "claude-code",
            "name": "Claude Code (Mock)",
            "object": "model",
            "created": 1700000000,
            "owned_by": "claude-code-cli"
        }]
    }

# Mock config endpoint - required by frontend
@app.get("/api/v1/config")
async def get_config():
    return {
        "features": {
            "auth": False,
            "enable_signup": True,
            "enable_login": True,
            "enable_direct_connections": True
        },
        "name": "Open WebUI (Test)",
        "version": "0.6.23",
        "default_models": ["claude-code"],
        "webhook_url": None,
        "show_admin_details": True,
        "admin_email": None,
        "auth_trusted_email_header": None,
        "enable_image_generation": False,
        "enable_community_sharing": False,
        "enable_message_rating": True,
        "enable_api_key": True,
        "audio": {},
        "ollama": {
            "enabled": False,
            "base_urls": []
        },
        "openai": {
            "enabled": False,
            "base_urls": []
        }
    }

# Mock backend config endpoint
@app.get("/api/config")
async def get_backend_config():
    return get_config()

# Mock version endpoint
@app.get("/api/v1/version")
async def get_version():
    return {"version": "0.6.23"}

# Mock auth endpoint (bypass auth)
@app.get("/api/v1/auths")
async def get_auths():
    return {
        "ENABLE_SIGNUP": True,
        "ENABLE_LOGIN": True,
        "DEFAULT_USER_ROLE": "user"
    }

# Mock signin endpoint
@app.post("/api/v1/auths/signin")
async def signin(request: Request):
    return {
        "token": "test-token-123",
        "token_type": "Bearer",
        "id": "test-user",
        "email": "test@example.com",
        "name": "Test User",
        "role": "admin",
        "profile_image_url": None
    }

# Mock user info endpoint
@app.get("/api/v1/users/me")
async def get_me():
    return {
        "id": "test-user",
        "email": "test@example.com",
        "name": "Test User",
        "role": "admin",
        "profile_image_url": None
    }

# Mock settings endpoints
@app.get("/api/v1/configs")
async def get_configs():
    return {}

@app.get("/api/v1/models/config")
async def get_models_config():
    return {
        "DEFAULT_MODELS": ["claude-code"],
        "MODEL_FILTER_ENABLED": False,
        "MODEL_FILTER_LIST": []
    }

# Health check
@app.get("/api/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    print("Starting simple backend server on http://localhost:8080")
    print("Frontend should be running on http://localhost:5173")
    uvicorn.run(app, host="0.0.0.0", port=8080)