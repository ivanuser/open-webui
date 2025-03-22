"""
Functions router for Open WebUI.
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..models.auth import get_current_active_user, User

# Create logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/functions",
    tags=["functions"]
)

class FunctionParameter(BaseModel):
    """Function parameter."""
    name: str
    type: str
    description: str
    required: bool = True
    default: Optional[Any] = None
    enum: Optional[List[str]] = None


class Function(BaseModel):
    """Function model."""
    id: str
    name: str
    description: str
    parameters: Dict[str, Dict[str, Any]] = {}
    created_at: datetime
    updated_at: datetime
    enabled: bool = True
    metadata: Dict[str, Any] = {}


class FunctionResponse(BaseModel):
    """Function response."""
    success: bool
    function: Optional[Function] = None
    functions: List[Function] = []
    message: Optional[str] = None


@router.get("/", response_model=FunctionResponse)
async def get_functions(current_user: User = Depends(get_current_active_user)):
    """Get all functions."""
    # Stub implementation - would fetch from a database
    functions = [
        Function(
            id="1",
            name="weather",
            description="Get weather information for a location",
            parameters={
                "location": {
                    "type": "string",
                    "description": "The location to get weather information for",
                    "required": True
                },
                "units": {
                    "type": "string",
                    "description": "The units to use (metric or imperial)",
                    "required": False,
                    "default": "metric",
                    "enum": ["metric", "imperial"]
                }
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        Function(
            id="2",
            name="calculator",
            description="Perform mathematical calculations",
            parameters={
                "expression": {
                    "type": "string",
                    "description": "The mathematical expression to evaluate",
                    "required": True
                }
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    ]
    
    return FunctionResponse(
        success=True,
        functions=functions
    )


class FunctionCreate(BaseModel):
    """Function creation model."""
    name: str
    description: str
    parameters: Dict[str, Dict[str, Any]] = {}


@router.post("/", response_model=FunctionResponse)
async def create_function(
    function: FunctionCreate,
    current_user: User = Depends(get_current_active_user)
):
    """Create a new function."""
    # Stub implementation - would create in a database
    new_function = Function(
        id=str(uuid.uuid4()),
        name=function.name,
        description=function.description,
        parameters=function.parameters,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    logger.info(f"Function created: {function.name}")
    
    return FunctionResponse(
        success=True,
        function=new_function
    )


@router.get("/{function_id}", response_model=FunctionResponse)
async def get_function(
    function_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get function by ID."""
    # Stub implementation - would fetch from a database
    functions = {
        "1": Function(
            id="1",
            name="weather",
            description="Get weather information for a location",
            parameters={
                "location": {
                    "type": "string",
                    "description": "The location to get weather information for",
                    "required": True
                },
                "units": {
                    "type": "string",
                    "description": "The units to use (metric or imperial)",
                    "required": False,
                    "default": "metric",
                    "enum": ["metric", "imperial"]
                }
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        "2": Function(
            id="2",
            name="calculator",
            description="Perform mathematical calculations",
            parameters={
                "expression": {
                    "type": "string",
                    "description": "The mathematical expression to evaluate",
                    "required": True
                }
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    }
    
    if function_id not in functions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Function {function_id} not found"
        )
    
    return FunctionResponse(
        success=True,
        function=functions[function_id]
    )


class FunctionUpdate(BaseModel):
    """Function update model."""
    name: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[Dict[str, Dict[str, Any]]] = None
    enabled: Optional[bool] = None


@router.put("/{function_id}", response_model=FunctionResponse)
async def update_function(
    function_id: str,
    function_update: FunctionUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update function."""
    # Stub implementation - would update in a database
    functions = {
        "1": Function(
            id="1",
            name="weather",
            description="Get weather information for a location",
            parameters={
                "location": {
                    "type": "string",
                    "description": "The location to get weather information for",
                    "required": True
                },
                "units": {
                    "type": "string",
                    "description": "The units to use (metric or imperial)",
                    "required": False,
                    "default": "metric",
                    "enum": ["metric", "imperial"]
                }
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        ),
        "2": Function(
            id="2",
            name="calculator",
            description="Perform mathematical calculations",
            parameters={
                "expression": {
                    "type": "string",
                    "description": "The mathematical expression to evaluate",
                    "required": True
                }
            },
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
    }
    
    if function_id not in functions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Function {function_id} not found"
        )
    
    # Get existing function
    function = functions[function_id]
    
    # Update function
    updated_function = Function(
        id=function.id,
        name=function_update.name or function.name,
        description=function_update.description or function.description,
        parameters=function_update.parameters or function.parameters,
        created_at=function.created_at,
        updated_at=datetime.utcnow(),
        enabled=function_update.enabled if function_update.enabled is not None else function.enabled,
        metadata=function.metadata
    )
    
    logger.info(f"Function updated: {updated_function.name}")
    
    return FunctionResponse(
        success=True,
        function=updated_function
    )


@router.delete("/{function_id}", response_model=FunctionResponse)
async def delete_function(
    function_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete function."""
    # Stub implementation - would delete from a database
    logger.info(f"Function deleted: {function_id}")
    
    return FunctionResponse(
        success=True,
        message=f"Function {function_id} deleted"
    )


class FunctionCall(BaseModel):
    """Function call model."""
    function_id: str
    parameters: Dict[str, Any] = {}


class FunctionCallResponse(BaseModel):
    """Function call response."""
    success: bool
    result: Any
    error: Optional[str] = None


@router.post("/call", response_model=FunctionCallResponse)
async def call_function(
    function_call: FunctionCall,
    current_user: User = Depends(get_current_active_user)
):
    """Call a function."""
    # Stub implementation - would execute function
    logger.info(f"Function call: {function_call.function_id} with parameters {function_call.parameters}")
    
    # Simple function calling logic - in a real implementation, would have proper dispatching
    if function_call.function_id == "1":  # Weather
        if "location" not in function_call.parameters:
            return FunctionCallResponse(
                success=False,
                error="Missing required parameter 'location'"
            )
        
        return FunctionCallResponse(
            success=True,
            result=f"Weather for {function_call.parameters['location']}: 20°C, Sunny"
        )
    elif function_call.function_id == "2":  # Calculator
        if "expression" not in function_call.parameters:
            return FunctionCallResponse(
                success=False,
                error="Missing required parameter 'expression'"
            )
        
        # Very basic calculator logic - in a real implementation, would use a proper expression parser
        try:
            result = eval(function_call.parameters["expression"])
            return FunctionCallResponse(
                success=True,
                result=result
            )
        except Exception as e:
            return FunctionCallResponse(
                success=False,
                error=f"Error evaluating expression: {str(e)}"
            )
    else:
        return FunctionCallResponse(
            success=False,
            error=f"Unknown function ID: {function_call.function_id}"
        )
