"""
Claude Code CLI Integration Router
Provides integration with locally installed Claude Code CLI
"""

import asyncio
import json
import logging
import subprocess
import tempfile
import uuid
import time
from typing import Optional, AsyncGenerator
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from open_webui.utils.auth import get_admin_user, get_verified_user
from open_webui.constants import ERROR_MESSAGES
from open_webui.env import SRC_LOG_LEVELS

log = logging.getLogger(__name__)
log.setLevel(SRC_LOG_LEVELS["MAIN"])

router = APIRouter()


class ClaudeCodeConfig(BaseModel):
    enabled: bool = False
    command_path: str = "claude"  # Assumes global install
    working_directory: Optional[str] = None
    timeout: int = 300  # 5 minutes timeout for responses


# Store configuration in memory (in production, this should be in database)
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
    
    # Test if claude command exists
    if config.enabled:
        try:
            result = subprocess.run(
                [config.command_path, "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode != 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Claude Code CLI not found at {config.command_path}"
                )
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to verify Claude Code CLI: {str(e)}"
            )
    
    claude_code_config = config
    return {"status": "success", "config": claude_code_config}


@router.post("/chat/completions")
async def chat_completions(
    request: Request,
    body: dict,
    user=Depends(get_verified_user)
):
    """
    OpenAI-compatible chat completions endpoint for Claude Code CLI
    """
    if not claude_code_config.enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Claude Code is not enabled. Please enable it in settings."
        )
    
    # Extract messages from the OpenAI-format request
    messages = body.get("messages", [])
    stream = body.get("stream", False)
    model = body.get("model", "claude-code")
    
    # Check if the model requested is claude-code
    if model != "claude-code":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Model {model} is not supported by Claude Code router"
        )
    
    # Build conversation context
    conversation_parts = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        
        # Handle different content types
        if isinstance(content, list):
            # Handle multi-part messages (e.g., with images)
            text_parts = []
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    text_parts.append(part.get("text", ""))
                elif isinstance(part, str):
                    text_parts.append(part)
            content = " ".join(text_parts)
        
        if role == "system":
            conversation_parts.insert(0, f"System: {content}")
        elif role == "user":
            conversation_parts.append(f"User: {content}")
        elif role == "assistant":
            conversation_parts.append(f"Assistant: {content}")
    
    # Get the last user message as the main prompt
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
            detail="No user message found in conversation"
        )
    
    async def generate_response():
        """Stream response from Claude Code CLI"""
        try:
            # Create a temporary directory for Claude Code to work in
            with tempfile.TemporaryDirectory() as temp_dir:
                working_dir = claude_code_config.working_directory or temp_dir
                
                # Build the command
                # Note: Adjust these parameters based on Claude Code CLI's actual interface
                cmd = [
                    claude_code_config.command_path,
                    user_message
                ]
                
                # Add context if there's conversation history
                if len(conversation_parts) > 1:
                    # You might need to adjust this based on how Claude Code handles context
                    # For now, we'll just pass the last user message
                    pass
                
                # Start the subprocess
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=working_dir,
                    stdin=asyncio.subprocess.PIPE
                )
                
                # Send any context through stdin if needed
                # process.stdin.write(("\n".join(conversation_parts)).encode())
                # await process.stdin.drain()
                # process.stdin.close()
                
                # Stream the output
                buffer = ""
                while True:
                    try:
                        line = await asyncio.wait_for(
                            process.stdout.readline(),
                            timeout=1.0
                        )
                        
                        if not line:
                            break
                        
                        text = line.decode('utf-8')
                        buffer += text
                        
                        # Format as OpenAI SSE for streaming
                        if stream:
                            chunk = {
                                "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                                "object": "chat.completion.chunk",
                                "created": int(time.time()),
                                "model": model,
                                "choices": [{
                                    "index": 0,
                                    "delta": {"content": text},
                                    "finish_reason": None
                                }]
                            }
                            yield f"data: {json.dumps(chunk)}\n\n"
                    
                    except asyncio.TimeoutError:
                        # Check if process is still running
                        if process.returncode is not None:
                            break
                        continue
                
                # Wait for process to complete
                await process.wait()
                
                # Handle any errors
                if process.returncode != 0:
                    stderr = await process.stderr.read()
                    error_msg = stderr.decode('utf-8')
                    log.error(f"Claude Code error: {error_msg}")
                    
                    if stream:
                        error_chunk = {
                            "error": {
                                "message": f"Claude Code error: {error_msg}",
                                "type": "claude_code_error",
                                "code": "claude_code_error"
                            }
                        }
                        yield f"data: {json.dumps(error_chunk)}\n\n"
                
                # Send final message
                if stream:
                    # Send final chunk with finish_reason
                    final_chunk = {
                        "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                        "object": "chat.completion.chunk",
                        "created": int(time.time()),
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
                    # For non-streaming, return the complete response
                    response = {
                        "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                        "object": "chat.completion",
                        "created": int(time.time()),
                        "model": model,
                        "choices": [{
                            "index": 0,
                            "message": {
                                "role": "assistant",
                                "content": buffer.strip()
                            },
                            "finish_reason": "stop"
                        }],
                        "usage": {
                            "prompt_tokens": len(user_message.split()),
                            "completion_tokens": len(buffer.split()),
                            "total_tokens": len(user_message.split()) + len(buffer.split())
                        }
                    }
                    yield json.dumps(response)
        
        except Exception as e:
            log.exception(f"Error in Claude Code chat: {e}")
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
        # For non-streaming, collect all output and return as JSON
        response_gen = generate_response()
        response = ""
        async for chunk in response_gen:
            response = chunk  # Last chunk will be the complete response
        return JSONResponse(content=json.loads(response))


@router.get("/models")
async def get_claude_code_models(user=Depends(get_verified_user)):
    """
    Return Claude Code as an available model if enabled
    """
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
    """Check if Claude Code CLI is available and working"""
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
                "message": f"Claude Code CLI returned error: {result.stderr}"
            }
    
    except Exception as e:
        return {
            "status": "error", 
            "message": f"Failed to check Claude Code CLI: {str(e)}"
        }