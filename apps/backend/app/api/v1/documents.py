import os
import re
import time
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Document
from app.api.v1.auth import get_current_user
from app.workers.ingestion_worker import ingest_document_task
from app.rag.vectorstore.chroma import vector_store_service
from app.rag.pipeline.engine import rag_engine
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/documents", tags=["Documents & Vectors"])

UPLOAD_DIR = settings.UPLOAD_DIR
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload document/image, enforce size/type limits, and start asynchronous ChromaDB indexing."""
    raw_filename = Path(file.filename or "document.txt").name
    ext = os.path.splitext(raw_filename)[1].lower()

    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    user_upload_dir = os.path.join(UPLOAD_DIR, f"user_{current_user.id}")
    os.makedirs(user_upload_dir, exist_ok=True)

    # Sanitize filename to prevent directory traversal
    clean_name = re.sub(r"[^\w\s.-]", "", raw_filename).strip()
    clean_name = re.sub(r"\s+", "_", clean_name) or f"upload_{int(time.time())}{ext}"
    safe_filename = f"{int(time.time())}_{clean_name}"
    file_path = os.path.join(user_upload_dir, safe_filename)
    
    # Stream file to disk while enforcing max file size
    chunk_size = 1024 * 1024  # 1MB chunks
    file_size = 0
    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(chunk_size):
                file_size += len(chunk)
                if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
                    buffer.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"File exceeds maximum allowed upload size of {max_mb} MB."
                    )
                buffer.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        logger.error(f"[Upload] File write error for user_id={current_user.id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save uploaded file on server."
        )
    collection_name = f"user_{current_user.id}_doc_{int(time.time())}_{uuid.uuid4().hex[:6]}"

    # Save initial Document record in DB with 'processing' status
    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_type=ext,
        file_size=file_size,
        file_path=file_path,
        chunk_count=0,
        vector_collection_name=collection_name,
        status="processing"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Launch background task for extraction, chunking, and embedding
    background_tasks.add_task(
        ingest_document_task,
        doc_id=doc.id,
        file_path=file_path,
        user_id=current_user.id,
        collection_name=collection_name,
        filename=file.filename,
        ext=ext,
        file_size=file_size
    )

    return {
        "message": "Document uploaded and processing started.",
        "document": {
            "id": doc.id,
            "filename": doc.filename,
            "file_size": doc.file_size,
            "status": doc.status,
            "vector_collection": doc.vector_collection_name,
            "uploaded_at": doc.uploaded_at
        }
    }

@router.get("/status/{document_id}")
def get_document_status(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Poll ingestion status and get auto-summary when ready."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    return {
        "id": doc.id,
        "filename": doc.filename,
        "status": doc.status,
        "chunk_count": doc.chunk_count,
        "summary": doc.summary,
        "error_message": doc.error_message,
        "uploaded_at": doc.uploaded_at
    }

@router.get("/auto-summary/{document_id}")
def get_auto_summary(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch auto-generated structured summary for a document."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if doc.summary:
        return {
            "document_name": doc.filename,
            "summary": doc.summary,
            "status": doc.status
        }

    summary_result = rag_engine.generate_auto_summary(
        collection_name=doc.vector_collection_name,
        filename=doc.filename,
        file_size_bytes=doc.file_size,
        doc_type=doc.file_type
    )
    return summary_result

@router.get("")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all uploaded documents for the current user."""
    docs = db.query(Document).filter(Document.user_id == current_user.id).order_by(Document.uploaded_at.desc()).all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "chunk_count": d.chunk_count,
            "status": d.status,
            "summary": d.summary,
            "vector_collection_name": d.vector_collection_name,
            "uploaded_at": d.uploaded_at
        }
        for d in docs
    ]

@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document and its ChromaDB vector collection."""
    doc = db.query(Document).filter(Document.id == document_id, Document.user_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    vector_store_service.delete_collection(doc.vector_collection_name)

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except OSError as err:
            logger.warning(f"[Documents] Could not delete disk file '{doc.file_path}': {err}")

    db.delete(doc)
    db.commit()

    return {"message": f"Document '{doc.filename}' and vectors deleted successfully."}
