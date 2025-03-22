"""
Events router for Open WebUI.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

from ..models.auth import get_current_active_user, User

# Create logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/events",
    tags=["events"]
)

class Event(BaseModel):
    """Event model."""
    id: str
    type: str
    data: Dict[str, Any] = {}
    created_at: datetime = datetime.utcnow()


class EventsResponse(BaseModel):
    """Events response."""
    success: bool
    events: List[Event] = []
    message: Optional[str] = None


@router.get("/", response_model=EventsResponse)
async def get_events(current_user: User = Depends(get_current_active_user)):
    """Get all events."""
    # Stub implementation - would fetch from a database
    events = [
        Event(
            id="1",
            type="chat_created",
            data={"chat_id": "1", "title": "Chat 1"},
            created_at=datetime.utcnow()
        ),
        Event(
            id="2",
            type="message_added",
            data={"chat_id": "1", "message_id": "1", "role": "user"},
            created_at=datetime.utcnow()
        ),
        Event(
            id="3",
            type="message_added",
            data={"chat_id": "1", "message_id": "2", "role": "assistant"},
            created_at=datetime.utcnow()
        )
    ]
    
    return EventsResponse(
        success=True,
        events=events
    )


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time events."""
    await websocket.accept()
    
    try:
        # In a real implementation, would validate token and get user
        # For stub purposes, just echo messages back
        while True:
            data = await websocket.receive_text()
            
            try:
                # Echo the message back
                await websocket.send_text(f"Echo: {data}")
            except Exception as e:
                logger.error(f"Error sending message: {e}")
                await websocket.send_text(f"Error: {str(e)}")
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
