"""
API endpoints for the example extension
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

# Create router
router = APIRouter()

@router.get("/example")
async def get_example_data():
    """
    Get example data
    """
    return {
        "message": "Hello from the Example Extension API!",
        "status": "success"
    }

@router.post("/example")
async def create_example_data(data: Dict[str, Any]):
    """
    Create example data
    """
    return {
        "message": "Data received by Example Extension API",
        "data": data,
        "status": "success"
    }

def register_routes(app):
    """
    Register routes with the FastAPI app
    
    Args:
        app: FastAPI application instance
    """
    app.include_router(
        router,
        prefix="/api/extensions/example",
        tags=["example-extension"],
    )
