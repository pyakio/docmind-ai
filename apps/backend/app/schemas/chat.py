from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class CreateThreadRequest(BaseModel):
    title: Optional[str] = "New Conversation"

class UpdateThreadRequest(BaseModel):
    title: str

class ChatQueryRequest(BaseModel):
    """User chat request payload."""
    thread_id: Optional[str] = Field(default=None, description="Conversation thread ID")
    document_id: Optional[int] = Field(default=None, description="Target document ID")
    question: str = Field(..., min_length=1, max_length=4000, description="User query")
    model_provider: Optional[str] = Field(default=None, description="Provider: anthropic, openai, gemini")
    model_name: Optional[str] = Field(default=None, description="Model identifier")

class ChatMessageResponse(BaseModel):
    id: int
    thread_id: Optional[str] = None
    document_id: Optional[int] = None
    document_name: Optional[str] = None
    question: str
    answer: str
    model_used: Optional[str] = None
    created_at: datetime

class ThreadResponse(BaseModel):
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0
