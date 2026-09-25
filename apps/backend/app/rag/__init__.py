"""DocMind AI RAG Architecture Package.

Provides clean decomposition of the RAG lifecycle:
- parsing: Text and OCR extraction from PDF, DOCX, TXT, and Images
- chunking: Hierarchical semantic text splitting with metadata enrichment
- embeddings: Dense semantic embeddings (OpenAI, Gemini, local ONNX)
- vectorstore: Persistent ChromaDB collection management and search
- query: Query intent detection, normalization, and rewriting
- prompts: AI instruction templates and prompt assembly
- generation: Multi-LLM provider routing (Claude, OpenAI, Gemini) and SSE streaming
- pipeline: End-to-end RAG query and auto-summarization orchestration
"""

from app.rag.parsing.parser import DocumentParser, document_parser
from app.rag.chunking.chunker import DocumentChunker, chunker_service
from app.rag.embeddings.service import HybridEmbeddingService, EmbeddingService, embedding_service
from app.rag.vectorstore.chroma import ChromaVectorStore, vector_store_service
from app.rag.query.analyzer import QueryUnderstandingEngine, query_understanding_engine
from app.rag.query.models import QueryAnalysis
from app.rag.prompts.builder import PromptBuilder, prompt_builder_service
from app.rag.generation.router import MultiLLMRouter, llm_router_service, AVAILABLE_MODELS, DEFAULT_MODEL_ID
from app.rag.pipeline.engine import RAGEngine, rag_engine

__all__ = [
    "DocumentParser",
    "document_parser",
    "DocumentChunker",
    "chunker_service",
    "HybridEmbeddingService",
    "EmbeddingService",
    "embedding_service",
    "ChromaVectorStore",
    "vector_store_service",
    "QueryUnderstandingEngine",
    "query_understanding_engine",
    "QueryAnalysis",
    "PromptBuilder",
    "prompt_builder_service",
    "MultiLLMRouter",
    "llm_router_service",
    "AVAILABLE_MODELS",
    "DEFAULT_MODEL_ID",
    "RAGEngine",
    "rag_engine",
]
