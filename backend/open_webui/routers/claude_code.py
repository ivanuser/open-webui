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
# Initialize with enabled=True by default for testing
claude_code_config = ClaudeCodeConfig(enabled=True)


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
    log.info(f"Claude Code chat_completions called with body keys: {body.keys()}")
    
    if not claude_code_config.enabled:
        log.warning("Claude Code is not enabled")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Claude Code is not enabled. Please enable it in settings."
        )
    
    # Extract messages from the OpenAI-format request
    messages = body.get("messages", [])
    stream = body.get("stream", False)
    model = body.get("model", "claude-code")
    
    log.info(f"Claude Code processing: model={model}, stream={stream}, messages count={len(messages)}")
    
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
                log.info(f"Using working directory: {working_dir}")
                
                # Build the command with proper Claude CLI arguments
                # Use regular output instead of stream-json for better reliability
                cmd = [
                    claude_code_config.command_path,
                    '--print',
                    user_message
                ]
                
                log.info(f"Executing Claude Code command: {' '.join(cmd[:2])}... (with message)")
                
                # Start the subprocess
                process = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=working_dir,
                    stdin=asyncio.subprocess.PIPE
                )
                
                log.info(f"Claude Code process started with PID: {process.pid}")
                
                # Send any context through stdin if needed
                # process.stdin.write(("\n".join(conversation_parts)).encode())
                # await process.stdin.drain()
                # process.stdin.close()
                
                # Stream the output - Claude CLI returns plain text
                buffer = ""
                full_response = ""
                
                # Read all output from Claude CLI
                try:
                    # Read the complete output with a reasonable timeout
                    stdout, stderr = await asyncio.wait_for(
                        process.communicate(),
                        timeout=30.0  # 30 second timeout for complete response
                    )
                    
                    return_code = process.returncode
                    log.info(f"Claude Code process completed with return code: {return_code}")
                    
                    if stdout:
                        full_response = stdout.decode('utf-8').strip()
                        buffer = full_response
                        log.info(f"Claude CLI response received: {len(full_response)} chars")
                        
                        # Stream the response in chunks if streaming is enabled
                        if stream and full_response:
                            # Split response into chunks for streaming
                            chunk_size = 100
                            for i in range(0, len(full_response), chunk_size):
                                chunk_text = full_response[i:i+chunk_size]
                                chunk = {
                                    "id": f"chatcmpl-{uuid.uuid4().hex[:8]}",
                                    "object": "chat.completion.chunk",
                                    "created": int(time.time()),
                                    "model": model,
                                    "choices": [{
                                        "index": 0,
                                        "delta": {"content": chunk_text},
                                        "finish_reason": None
                                    }]
                                }
                                yield f"data: {json.dumps(chunk)}\n\n"
                    
                    if stderr:
                        error_msg = stderr.decode('utf-8').strip()
                        if error_msg and "error" in error_msg.lower():
                            log.warning(f"Claude CLI stderr: {error_msg}")
                
                except asyncio.TimeoutError:
                    log.error("Claude CLI timed out waiting for response")
                    process.terminate()
                    await asyncio.sleep(1)
                    if process.returncode is None:
                        process.kill()
                    return_code = -1
                    error_response = {
                        "error": {
                            "message": "Claude CLI timed out",
                            "type": "timeout_error",
                            "code": "timeout"
                        }
                    }
                    if stream:
                        yield f"data: {json.dumps(error_response)}\n\n"
                
                
                # Handle any errors
                if return_code != 0 and return_code != -1:  # -1 is timeout, already handled
                    log.error(f"Claude Code failed with return code {return_code}")
                    
                    if stream:
                        error_chunk = {
                            "error": {
                                "message": f"Claude Code error (code {return_code})",
                                "type": "claude_code_error",
                                "code": "claude_code_error"
                            }
                        }
                        yield f"data: {json.dumps(error_chunk)}\n\n"
                else:
                    log.info(f"Claude Code completed successfully. Buffer length: {len(buffer)}")
                
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
            log.exception(f"Exception in Claude Code chat: {e}")
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
        log.info("Processing non-streaming Claude Code response")
        response_gen = generate_response()
        response = ""
        async for chunk in response_gen:
            response = chunk  # Last chunk will be the complete response
        
        log.info(f"Final response length: {len(response)}")
        try:
            parsed_response = json.loads(response) if response else {}
            log.info(f"Returning parsed response: {list(parsed_response.keys()) if isinstance(parsed_response, dict) else 'not a dict'}")
            return JSONResponse(content=parsed_response)
        except json.JSONDecodeError as e:
            log.error(f"Failed to parse Claude Code response as JSON: {e}. Raw response: {response[:200]}")
            return JSONResponse(content={"error": {"message": "Invalid response from Claude Code", "raw": response[:500]}})


@router.get("/models")
async def get_claude_code_models():
    """
    Return Claude Code as an available model if enabled
    Note: No authentication required for listing models
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