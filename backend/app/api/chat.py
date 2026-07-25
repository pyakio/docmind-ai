from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Document, ChatMessage
from app.api.auth import get_current_user
from app.services.rag_engine import rag_engine

router = APIRouter(prefix="/chat", tags=["Multi-LLM RAG Chat"])

class ChatQueryRequest(BaseModel):
    document_id: int
    question: str
    model_provider: Optional[str] = "chatgpt"  # 'chatgpt', 'gemini', 'llama'
    model_name: Optional[str] = None           # 'gpt-4o', 'gemini-1.5-flash', 'llama3'

@router.post("/query")
def query_rag_chat(
    req: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Execute RAG query against ChromaDB vectors using selected LLM model (ChatGPT, Gemini, or Llama)."""
    # 1. Verify Document exists or grab user's latest uploaded document
    doc = db.query(Document).filter(
        Document.id == req.document_id,
        Document.user_id == current_user.id
    ).first()

    if not doc:
        doc = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.uploaded_at.desc()).first()

    if not doc:
        doc = db.query(Document).order_by(Document.id.desc()).first()

    collection_name = doc.vector_collection_name if doc else f"user_{current_user.id}_default"

    # 2. Run RAG Engine query
    filename_to_pass = doc.filename if doc else "document.pdf"
    result = rag_engine.query_document(
        collection_name=collection_name,
        query=req.question,
        filename=filename_to_pass,
        model_provider=req.model_provider,
        model_name=req.model_name
    )

    # 3. Save ChatMessage to DB
    chat_record = ChatMessage(
        user_id=current_user.id,
        document_id=doc.id if doc else None,
        question=req.question,
        answer=result["answer"],
        model_used=result.get("model_name", "gemini-1.5-flash")
    )
    db.add(chat_record)
    db.commit()
    db.refresh(chat_record)

    return {
        "id": chat_record.id,
        "document_id": doc.id if doc else None,
        "document_name": filename_to_pass,
        "question": req.question,
        "answer": result["answer"],
        "found_in_document": result.get("found_in_document", True),
        "created_at": chat_record.created_at
    }

@router.get("/history")
def get_chat_history(
    document_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve chat history strictly isolated for the logged-in user."""
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if document_id:
        query = query.filter(ChatMessage.document_id == document_id)

    messages = query.order_by(ChatMessage.created_at.asc()).limit(100).all()
    return [
        {
            "id": m.id,
            "document_id": m.document_id,
            "question": m.question,
            "answer": m.answer,
            "model_used": m.model_used,
            "created_at": m.created_at
        }
        for m in messages
    ]

@router.delete("/history")
def clear_chat_history(
    document_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently delete chat history for the logged-in user."""
    query = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id)
    if document_id:
        query = query.filter(ChatMessage.document_id == document_id)

    deleted_count = query.delete(synchronize_session=False)
    db.commit()
    return {
        "message": f"Deleted {deleted_count} chat messages permanently.",
        "deleted_count": deleted_count
    }

@router.delete("/messages/{message_id}")
def delete_chat_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Permanently delete a specific chat message for the logged-in user."""
    msg = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.user_id == current_user.id
    ).first()

    if not msg:
        raise HTTPException(status_code=404, detail="Chat message not found.")

    db.delete(msg)
    db.commit()
    return {"message": "Chat message deleted permanently."}
