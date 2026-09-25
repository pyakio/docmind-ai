import os
import sys
from pathlib import Path

# Add apps/backend to sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

def test_imports():
    """Verify clean importability of all backend architecture packages."""
    from app.core.config import settings
    from app.core.security import verify_password, get_password_hash
    from app.db.database import Base, engine, SessionLocal
    from app.db.models import User, Document, ConversationThread, ChatMessage
    from app.schemas.auth import UserRegisterSchema, UserLoginSchema
    from app.schemas.chat import ChatQueryRequest
    from app.workers.ingestion_worker import ingest_document_task
    from app.rag.parsing.parser import document_parser
    from app.rag.chunking.chunker import chunker_service
    from app.rag.embeddings.service import embedding_service
    from app.rag.vectorstore.chroma import vector_store_service
    from app.rag.retrieval.retriever import document_retriever
    from app.rag.query.analyzer import query_understanding_engine
    from app.rag.prompts.builder import prompt_builder_service
    from app.rag.generation.router import llm_router_service
    from app.rag.pipeline.engine import rag_engine
    from app.main import app

    assert app is not None
    assert settings.PROJECT_NAME == "DocMind AI Backend"
    print("✓ All core backend, RAG, and API modules imported successfully without errors.")

if __name__ == "__main__":
    test_imports()
