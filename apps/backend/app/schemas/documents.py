from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class DocumentMeta(BaseModel):
    id: int
    filename: str
    file_size: int
    status: str
    vector_collection: str
    uploaded_at: datetime

class DocumentUploadResponse(BaseModel):
    message: str
    document: DocumentMeta

class DocumentStatusResponse(BaseModel):
    id: int
    filename: str
    status: str
    chunk_count: int
    summary: Optional[str] = None
    error_message: Optional[str] = None
    uploaded_at: datetime

class DocumentListItem(BaseModel):
    id: int
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    status: str
    summary: Optional[str] = None
    vector_collection_name: str
    uploaded_at: datetime
