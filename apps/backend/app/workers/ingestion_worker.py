import time
from sqlalchemy.orm import Session
from app.db.database import SessionLocal
from app.db.models import Document
from app.rag.chunking.chunker import chunker_service
from app.rag.vectorstore.chroma import vector_store_service
from app.rag.pipeline.engine import rag_engine
from app.core.logging import get_logger

logger = get_logger(__name__)

def ingest_document_task(
    doc_id: int,
    file_path: str,
    user_id: int,
    collection_name: str,
    filename: str,
    ext: str,
    file_size: int
):
    """Background worker task to extract, chunk, embed, index in ChromaDB, and generate auto-summary."""
    db: Session = SessionLocal()
    start_time = time.time()
    try:
        logger.info(f"[IngestionWorker] Ingesting doc_id={doc_id} ('{filename}')...")
        
        # 1. Extract text and create semantic chunks
        extracted_text = chunker_service.extract_text(file_path)
        if not extracted_text or not extracted_text.strip():
            raise ValueError(f"Could not extract readable text from '{filename}'.")

        chunks = chunker_service.create_chunks(extracted_text, source_filename=filename)
        if not chunks:
            raise ValueError(f"No valid text chunks generated from '{filename}'.")

        total_pages = max(1, extracted_text.count("--- [Page "))

        # 2. Embed & Index chunks in ChromaDB
        indexed_count = vector_store_service.add_document_chunks(
            collection_name=collection_name,
            chunks=chunks,
            document_id=doc_id
        )

        # 3. Generate Auto Summary
        summary_result = rag_engine.generate_auto_summary(
            collection_name=collection_name,
            filename=filename,
            file_size_bytes=file_size,
            doc_type=ext,
            total_pages=total_pages
        )
        summary_text = summary_result.get("summary", "")

        # 4. Update Document status to ready
        doc = db.query(Document).filter(Document.id == doc_id).first()
        if doc:
            doc.chunk_count = len(chunks)
            doc.status = "ready"
            doc.summary = summary_text
            db.commit()

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            f"[IngestionWorker] Successfully ingested doc_id={doc_id} for user_id={user_id} "
            f"in {elapsed_ms}ms with {indexed_count} indexed chunks."
        )

    except Exception as e:
        logger.error(f"[IngestionWorker] Ingestion failed for doc_id={doc_id}: {e}", exc_info=True)
        try:
            db.rollback()
            doc = db.query(Document).filter(Document.id == doc_id).first()
            if doc:
                doc.status = "failed"
                doc.error_message = str(e)[:200]
                db.commit()
        except Exception as rollback_err:
            logger.error(f"[IngestionWorker] Failed to record failure state for doc_id={doc_id}: {rollback_err}")
    finally:
        db.close()
