"""
Storage router for Open WebUI.
"""

import logging
import os
import uuid
from typing import Dict, Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..models.auth import get_current_active_user, User
from ..internal.paths import get_storage_dir

# Create logger
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/api/storage",
    tags=["storage"]
)

class StorageObject(BaseModel):
    """Storage object."""
    id: str
    name: str
    size: int
    type: str
    created_at: int
    modified_at: int
    path: str
    metadata: Dict[str, Any] = {}


class StorageResponse(BaseModel):
    """Storage response."""
    success: bool
    object: Optional[StorageObject] = None
    objects: List[StorageObject] = []
    message: Optional[str] = None


@router.get("/", response_model=StorageResponse)
async def list_storage_objects(current_user: User = Depends(get_current_active_user)):
    """List storage objects."""
    # Stub implementation - would scan storage directory
    storage_dir = get_storage_dir()
    objects = []
    
    try:
        # List files in storage directory
        for file_name in os.listdir(storage_dir):
            file_path = os.path.join(storage_dir, file_name)
            
            # Get file information
            if os.path.isfile(file_path):
                file_stat = os.stat(file_path)
                
                objects.append(StorageObject(
                    id=str(uuid.uuid4()),
                    name=file_name,
                    size=file_stat.st_size,
                    type=os.path.splitext(file_name)[1],
                    created_at=int(file_stat.st_ctime),
                    modified_at=int(file_stat.st_mtime),
                    path=file_name
                ))
    except Exception as e:
        logger.error(f"Error listing storage objects: {e}")
        
    return StorageResponse(
        success=True,
        objects=objects
    )


@router.post("/upload", response_model=StorageResponse)
async def upload_file(
    file: UploadFile = File(...),
    metadata: str = Form("{}"),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a file."""
    # Stub implementation - would save file to storage directory
    storage_dir = get_storage_dir()
    
    try:
        # Generate unique file name
        file_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"{file_id}{file_ext}"
        file_path = os.path.join(storage_dir, file_name)
        
        # Save file
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Get file information
        file_stat = os.stat(file_path)
        
        # Create storage object
        object = StorageObject(
            id=file_id,
            name=file.filename,
            size=file_stat.st_size,
            type=file_ext,
            created_at=int(file_stat.st_ctime),
            modified_at=int(file_stat.st_mtime),
            path=file_name,
            metadata={"original_name": file.filename}
        )
        
        logger.info(f"File uploaded: {file.filename}")
        
        return StorageResponse(
            success=True,
            object=object
        )
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )


@router.get("/{file_id}", response_class=FileResponse)
async def get_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get a file."""
    # Stub implementation - would fetch file from storage directory
    storage_dir = get_storage_dir()
    
    # Look for files with the given ID (prefix)
    matching_files = []
    for file_name in os.listdir(storage_dir):
        if file_name.startswith(file_id):
            matching_files.append(file_name)
    
    if not matching_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File {file_id} not found"
        )
    
    # Return the first matching file
    file_path = os.path.join(storage_dir, matching_files[0])
    
    return FileResponse(
        path=file_path,
        filename=matching_files[0]  # Original file name would be stored in metadata
    )


@router.delete("/{file_id}", response_model=StorageResponse)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a file."""
    # Stub implementation - would delete file from storage directory
    storage_dir = get_storage_dir()
    
    # Look for files with the given ID (prefix)
    matching_files = []
    for file_name in os.listdir(storage_dir):
        if file_name.startswith(file_id):
            matching_files.append(file_name)
    
    if not matching_files:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File {file_id} not found"
        )
    
    # Delete the first matching file
    file_path = os.path.join(storage_dir, matching_files[0])
    os.remove(file_path)
    
    logger.info(f"File deleted: {matching_files[0]}")
    
    return StorageResponse(
        success=True,
        message=f"File {file_id} deleted"
    )
