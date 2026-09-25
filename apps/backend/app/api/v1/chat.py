import time
import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload

from app.db.database import get_db, SessionLocal
from app.db.models import User, Document, ChatMessage, ConversationThread
from app.api.v1.auth import get_current_user
from app.rag.pipeline.engine import rag_engine
from app.rag.generation.router import AVAILABLE_MODELS, DEFAULT_MODEL_ID
from app.schemas.chat import CreateThreadRequest, UpdateThreadRequest, ChatQueryRequest
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/chat", tags=["DocMind AI Chat Orchestrator"])

def utc_now() -> datetime:
    """Return timezone-aware current UTC datetime."""
    return datetime.now(timezone.utc)

def _resolve_chat_context(
    db: Session,
    user_id: int,
    document_id: Optional[int],
    thread_id: Optional[str],
    question_text: str
) -> tuple[Optional[Document], ConversationThread, List[Dict[str, str]]]:
    """Resolve document strictly isolated to user, guarantee thread existence, and construct history."""
    # 1. Document verification
    doc = None
    if document_id:
        doc = db.query(Document).filter(
            Document.id == document_id,
            Document.user_id == user_id
        ).first()
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Selected document was not found or does not belong to your account."
            )

    # 2. Thread resolution or creation
    thread = None
    if thread_id:
        thread = db.query(ConversationThread).filter(
            ConversationThread.id == thread_id,
            ConversationThread.user_id == user_id
        ).first()

    if not thread:
        thread_title = question_text[:30] + ("..." if len(question_text) > 30 else "")
        thread = ConversationThread(
            id=f"thread_{int(time.time() * 1000)}_{uuid.uuid4().hex[:6]}",
            user_id=user_id,
            title=thread_title
        )
        db.add(thread)
        db.commit()
        db.refresh(thread)

    # 3. Retrieve past messages for multi-turn history
    past_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.thread_id == thread.id, ChatMessage.user_id == user_id)
        .order_by(ChatMessage.created_at.asc())
        .limit(10)
        .all()
    )
    formatted_history: List[Dict[str, str]] = []
    for m in past_messages:
        if m.question:
            formatted_history.append({"role": "user", "content": m.question})
        if m.answer:
            formatted_history.append({"role": "assistant", "content": m.answer})

    return doc, thread, formatted_history

# --- Model Endpoints ---

@router.get("/models")
def list_available_models():
    """List available LLM models across Claude, OpenAI, and Gemini."""
    return {
        "models": AVAILABLE_MODELS,
        "default_model": DEFAULT_MODEL_ID
    }

# --- Thread Endpoints ---

@router.get("/threads")
def list_threads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all conversation threads with eager-loaded message counts (no N+1 queries)."""
    threads = (
        db.query(ConversationThread)
        .options(selectinload(ConversationThread.messages))
        .filter(ConversationThread.user_id == current_user.id)
        .order_by(ConversationThread.updated_at.desc())
        .all()
    )
    return [
        {
            "id": t.id,
            "title": t.title,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
            "message_count": len(t.messages)
        }
        for t in threads
    ]

@router.post("/threads", status_code=status.HTTP_201_CREATED)
def create_thread(
    req: CreateThreadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation thread."""
    thread_id = f"thread_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
    thread = ConversationThread(
        id=thread_id,
        user_id=current_user.id,
        title=req.title or "New Conversation"
    )
    db.add(thread)
    db.commit()
    db.refresh(thread)
    return {
        "id": thread.id,
        "title": thread.title,
        "created_at": thread.created_at,
        "updated_at": thread.updated_at
    }

@router.patch("/threads/{thread_id}")
def update_thread_title(
    thread_id: str,
    req: UpdateThreadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rename a conversation thread."""
    thread = db.query(ConversationThread).filter(
        ConversationThread.id == thread_id,
        ConversationThread.user_id == current_user.id
    ).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    
    thread.title = req.title.strip()
    thread.updated_at = utc_now()
    db.commit()
    return {"id": thread.id, "title": thread.title}

@router.delete("/threads/{thread_id}")
def delete_thread(
    thread_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation thread and all its messages."""
    thread = db.query(ConversationThread).filter(
        ConversationThread.id == thread_id,
        ConversationThread.user_id == current_user.id
    ).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    
    db.delete(thread)
    db.commit()
    return {"message": "Conversation thread deleted successfully."}

@router.get("/threads/{thread_id}/messages")
def get_thread_messages(
    thread_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve full conversation messages for a thread."""
    thread = db.query(ConversationThread).filter(
        ConversationThread.id == thread_id,
        ConversationThread.user_id == current_user.id
    ).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.thread_id == thread_id, ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [
        {
            "id": m.id,
            "thread_id": m.thread_id,
            "document_id": m.document_id,
            "document_name": m.document.filename if m.document else None,
            "question": m.question,
            "answer": m.answer,
            "model_used": m.model_used,
            "created_at": m.created_at
        }
        for m in messages
    ]

# --- Chat & Streaming Endpoints ---

@router.post("/stream")
def stream_rag_chat(
    req: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Server-Sent Events (SSE) streaming chat endpoint with multi-turn memory and robust error events."""
    question_text = req.question.strip()
    if not question_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty.")

    doc, thread, formatted_history = _resolve_chat_context(
        db=db,
        user_id=current_user.id,
        document_id=req.document_id,
        thread_id=req.thread_id,
        question_text=question_text
    )

    collection_name = doc.vector_collection_name if doc else None
    filename_to_pass = doc.filename if doc else "document.pdf"
    user_id = current_user.id
    thread_id = thread.id
    doc_id = doc.id if doc else None
    model_provider = req.model_provider
    model_name = req.model_name

    def sse_event_generator():
        collected_tokens = []
        try:
            # Yield initial metadata
            yield f"data: {json.dumps({'type': 'start', 'thread_id': thread_id, 'document_id': doc_id})}\n\n"

            # Stream tokens
            for token in rag_engine.query_document_stream(
                collection_name=collection_name,
                query=question_text,
                filename=filename_to_pass,
                model_provider=model_provider,
                model_name=model_name,
                messages=formatted_history
            ):
                collected_tokens.append(token)
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

            full_answer = "".join(collected_tokens)

            # Save ChatMessage in DB only if we got a response
            if full_answer:
                worker_db: Session = SessionLocal()
                try:
                    msg = ChatMessage(
                        thread_id=thread_id,
                        user_id=user_id,
                        document_id=doc_id,
                        question=question_text,
                        answer=full_answer,
                        model_used=model_name or (model_provider or "DocMind Engine")
                    )
                    worker_db.add(msg)
                    
                    # Update thread timestamp
                    thr = worker_db.query(ConversationThread).filter(ConversationThread.id == thread_id).first()
                    if thr:
                        thr.updated_at = utc_now()
                        if thr.title == "New Conversation":
                            thr.title = question_text[:30] + ("..." if len(question_text) > 30 else "")
                    
                    worker_db.commit()
                    msg_id = msg.id
                finally:
                    worker_db.close()
            else:
                msg_id = None

            yield f"data: {json.dumps({'type': 'done', 'message_id': msg_id, 'thread_id': thread_id})}\n\n"

        except Exception as e:
            logger.error(f"[ChatStream] Streaming failed: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

    return StreamingResponse(sse_event_generator(), media_type="text/event-stream")

@router.post("/query")
def query_rag_chat(
    req: ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Synchronous chat endpoint with multi-turn memory and strict error handling."""
    question_text = req.question.strip()
    if not question_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Question cannot be empty.")

    doc, thread, formatted_history = _resolve_chat_context(
        db=db,
        user_id=current_user.id,
        document_id=req.document_id,
        thread_id=req.thread_id,
        question_text=question_text
    )

    collection_name = doc.vector_collection_name if doc else None
    filename_to_pass = doc.filename if doc else "document.pdf"

    try:
        if collection_name:
            result = rag_engine.query_document(
                collection_name=collection_name,
                query=question_text,
                filename=filename_to_pass,
                model_provider=req.model_provider,
                model_name=req.model_name,
                messages=formatted_history
            )
            answer_text = result["answer"]
            found = result.get("found_in_document", True)
        else:
            # General chat
            answer_text = rag_engine.llm_router_service.generate_response(
                prompt=question_text,
                model_provider=req.model_provider,
                model_name=req.model_name,
                messages=formatted_history
            )
            found = True

        chat_record = ChatMessage(
            thread_id=thread.id,
            user_id=current_user.id,
            document_id=doc.id if doc else None,
            question=question_text,
            answer=answer_text,
            model_used=req.model_name or (req.model_provider or "DocMind Engine")
        )
        db.add(chat_record)
        thread.updated_at = utc_now()
        if thread.title == "New Conversation":
            thread.title = question_text[:30] + ("..." if len(question_text) > 30 else "")

        db.commit()
        db.refresh(chat_record)

        return {
            "id": chat_record.id,
            "thread_id": thread.id,
            "document_id": doc.id if doc else None,
            "document_name": filename_to_pass if doc else None,
            "question": question_text,
            "answer": answer_text,
            "found_in_document": found,
            "created_at": chat_record.created_at
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ChatQuery] Query failed: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.delete("/messages/{message_id}")
def delete_chat_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a single message permanently."""
    msg = db.query(ChatMessage).filter(
        ChatMessage.id == message_id,
        ChatMessage.user_id == current_user.id
    ).first()

    if not msg:
        raise HTTPException(status_code=404, detail="Message not found.")

    db.delete(msg)
    db.commit()
    return {"message": "Message deleted successfully."}
