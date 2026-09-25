"""Background job workers for DocMind AI."""

from app.workers.ingestion_worker import ingest_document_task

__all__ = [
    "ingest_document_task",
]
