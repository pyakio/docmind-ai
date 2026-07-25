import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Document
from app.api.auth import get_current_user
from app.services.chunker import chunker_service
from app.services.vector_store import vector_store_service
from app.services.rag_engine import rag_engine

router = APIRouter(prefix="/documents", tags=["Documents & Vectors"])

UPLOAD_DIR = "./data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload document/image, perform chunking & ChromaDB vector indexing, and auto-generate 9-part summary."""
    allowed_extensions = [".pdf", ".docx", ".doc", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed_extensions)}"
        )

    user_upload_dir = os.path.join(UPLOAD_DIR, f"user_{current_user.id}")
    os.makedirs(user_upload_dir, exist_ok=True)

    file_path = os.path.join(user_upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)

    # 1. Extract text and create chunks via LangChain
    extracted_text = chunker_service.extract_text(file_path)
    chunks = chunker_service.create_chunks(extracted_text, source_filename=file.filename)

    # Estimate total pages
    total_pages = max(1, extracted_text.count("--- [Page "))

    # 2. Save Document metadata in database
    collection_name = f"user_{current_user.id}_doc_{int(os.path.getmtime(file_path))}"

    doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        file_type=ext,
        file_size=file_size,
        file_path=file_path,
        chunk_count=len(chunks),
        vector_collection_name=collection_name
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # 3. Embed & Index chunks in ChromaDB
    indexed_count = vector_store_service.add_document_chunks(
        collection_name=collection_name,
        chunks=chunks,
        document_id=doc.id
    )

    # 4. Generate Automatic Structured Document Summary immediately
    summary_result = rag_engine.generate_auto_summary(
        collection_name=collection_name,
        filename=file.filename,
        file_size_bytes=file_size,
        doc_type=ext,
        total_pages=total_pages
    )

    return {
        "message": "Document uploaded, indexed, and auto-summarized successfully.",
        "document": {
            "id": doc.id,
            "filename": doc.filename,
            "file_size": doc.file_size,
            "chunk_count": doc.chunk_count,
            "indexed_count": indexed_count,
            "vector_collection": doc.vector_collection_name,
            "uploaded_at": doc.uploaded_at,
            "total_pages": total_pages
        },
        "summary": summary_result["summary"]
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
        raise HTTPException(status_code=404, detail="Document not found")

    vector_store_service.delete_collection(doc.vector_collection_name)

    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception:
            pass

    db.delete(doc)
    db.commit()

    return {"message": f"Document '{doc.filename}' and vectors deleted successfully."}
