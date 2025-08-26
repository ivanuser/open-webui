"""
Simple Claude Code CLI Integration Router
Provides basic integration with locally installed Claude Code CLI
"""

import asyncio
import json
import logging
import subprocess
import uuid
import time
from typing import Optional
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from open_webui.utils.auth import get_admin_user, get_verified_user
from open_webui.constants import ERROR_MESSAGES
from open_webui.env import SRC_LOG_LEVELS

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MAIN"])

router = APIRouter()


class ClaudeCodeConfig(BaseModel):
    enabled: bool = True  # Default to enabled for testing
    command_path: str = "claude"
    timeout: int = 60  # 60 seconds timeout


# Store configuration
claude_code_config = ClaudeCodeConfig()


@router.get("/config")
async def get_claude_code_config(user=Depends(get_admin_user)):
    """Get Claude Code configuration"""
    return claude_code_config


@router.post("/config")
async def update_claude_code_config(
    config: ClaudeCodeConfig, 
    user=Depends(get_admin_user)
):
    """Update Claude Code configuration"""
    global claude_code_config
    claude_code_config = config
    return {"status": "success", "config": claude_code_config}


@router.post("/chat/completions")
async def chat_completions(
    request: Request,
    body: dict,
    user=Depends(get_verified_user)
):
    """
    Simplified OpenAI-compatible chat completions endpoint for Claude Code CLI
    """
    log.error(f"=== CLAUDE CODE CALLED ===")
    log.error(f"Body keys: {list(body.keys())}")
    log.error(f"Stream: {body.get('stream')}")
    log.error(f"Model: {body.get('model')}")
    
    if not claude_code_config.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Claude Code is not enabled"
        )
    
    # Extract messages
    messages = body.get("messages", [])
    stream = False  # Force non-streaming for now to debug
    model = body.get("model", "claude-code")
    
    # Get the last user message
    user_message = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            content = msg.get("content", "")
            if isinstance(content, list):
                text_parts = []
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        text_parts.append(part.get("text", ""))
                    elif isinstance(part, str):
                        text_parts.append(part)
                user_message = " ".join(text_parts)
            else:
                user_message = content
            break
    
    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No user message found"
        )
    
    log.error(f"User message extracted: {user_message[:100] if user_message else 'None'}")
    log.error(f"Command path: {claude_code_config.command_path}")
    
    async def generate_response():
        """Generate response from Claude CLI"""
        try:
            # Simple subprocess call
            cmd = [claude_code_config.command_path, '--print', user_message]
            log.error(f"Running command: {' '.join(cmd[:2])}... Message: '{user_message}'")
            
            # Run the command with a timeout
            result = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            log.error(f"Process started with PID: {result.pid}")
            
            # Wait for completion with timeout
            try:
                stdout, stderr = await asyncio.wait_for(
                    result.communicate(),
                    timeout=claude_code_config.timeout
                )
                
                log.error(f"Process completed. Stdout: {len(stdout) if stdout else 0} bytes, Stderr: {len(stderr) if stderr else 0} bytes")
                
                response_text = ""
                if stdout:
                    response_text = stdout.decode('utf-8').strip()
                    log.error(f"Claude response: '{response_text[:200]}...' ({len(response_text)} chars total)")
                
                if not response_text:
                    response_text = "No response from Claude Code CLI."
                    log.error("Claude CLI returned empty response")
                
                # Stream or return the response
                if stream:
                    # Stream the response in chunks
                    chunk_id = f"chatcmpl-{uuid.uuid4().hex[:8]}"
                    created = int(time.time())
                    
                    # Send content chunks
                    for i in range(0, len(response_text), 50):
                        chunk = {
                            "id": chunk_id,
                            "object": "chat.completion.chunk",
                            "created": created,
                            "model": model,
                            "choices": [{
                                "index": 0,
                                "delta": {"content": response_text[i:i+50]},
                                "finish_reason": None
                            }]
                        }
                        yield f"data: {json.dumps(chunk)}\n\n"
                    
                    # Send final chunk with finish_reason
                    final_chunk = {
                        "id": chunk_id,
                        "object": "chat.completion.chunk",
                        "created": created,
                        "model": model,
                        "choices": [{
                            "index": 0,
                            "delta": {},
                            "finish_reason": "stop"
                        }]
                    }
                    yield f"data: {json.dumps(final_chunk)}\n\n"
                    yield "data: [DONE]\n\n"
                else:
                    # Return complete response
                    response = {
                        "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                        "object": "chat.completion",
                        "created": int(time.time()),
                        "model": model,
                        "choices": [{
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": response_text
                            },
                            "finish_reason": "stop"
                        }],
                        "usage": {
                            "prompt_tokens": len(user_message.split()),
                            "completion_tokens": len(response_text.split()),
                            "total_tokens": len(user_message.split()) + len(response_text.split())
                        }
                    }
                    yield json.dumps(response)
                
                if stderr:
                    error_msg = stderr.decode('utf-8').strip()
                    if error_msg and "error" in error_msg.lower():
                        log.error(f"Claude stderr: {error_msg}")
                        
            except asyncio.TimeoutError:
                log.error(f"Claude CLI timed out after {claude_code_config.timeout}s")
                error_response = {
                    "error": {
                        "message": f"Claude CLI timed out after {claude_code_config.timeout} seconds",
                        "type": "timeout_error",
                        "code": "timeout"
                    }
                }
                if stream:
                    yield f"data: {json.dumps(error_response)}\n\n"
                else:
                    yield json.dumps(error_response)
        
        except Exception as e:
            log.exception(f"Exception in Claude Code: {e}")
            error_response = {
                "error": {
                    "message": str(e),
                    "type": "internal_error",
                    "code": "internal_error"
                }
            }
            if stream:
                yield f"data: {json.dumps(error_response)}\n\n"
            else:
                yield json.dumps(error_response)
    
    if stream:
        return StreamingResponse(
            generate_response(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )
    else:
        # Non-streaming response
        response_gen = generate_response()
        response = ""
        async for chunk in response_gen:
            response = chunk
        
        try:
            parsed = json.loads(response) if response else {}
            return JSONResponse(content=parsed)
        except json.JSONDecodeError:
            return JSONResponse(content={"error": {"message": "Invalid response"}})


@router.get("/models")
async def get_claude_code_models():
    """Return Claude Code as an available model if enabled"""
    if not claude_code_config.enabled:
        return []
    
    return [{
        "id": "claude-code",
        "name": "Claude Code",
        "object": "model",
        "created": int(time.time()),
        "owned_by": "claude-code-cli",
        "info": {
            "description": "Claude with code execution capabilities via CLI",
            "context_length": 200000,
            "vision": True,
            "tools": True
        }
    }]


@router.get("/status")
async def get_claude_code_status(user=Depends(get_verified_user)):
    """Check if Claude Code CLI is available"""
    if not claude_code_config.enabled:
        return {
            "status": "disabled",
            "message": "Claude Code is not enabled"
        }
    
    try:
        result = subprocess.run(
            [claude_code_config.command_path, "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode == 0:
            return {
                "status": "active",
                "version": result.stdout.strip(),
                "message": "Claude Code CLI is working"
            }
        else:
            return {
                "status": "error",
                "message": f"Claude Code CLI error: {result.stderr}"
            }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to check Claude Code CLI: {str(e)}"
        }