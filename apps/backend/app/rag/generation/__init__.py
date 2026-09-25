"""Multi-LLM routing, generation, and streaming module for DocMind AI."""

from app.rag.generation.router import (
    MultiLLMRouter,
    AVAILABLE_MODELS,
    DEFAULT_MODEL_ID,
    ANTHROPIC_MODEL_MAP,
    OPENAI_MODEL_MAP,
    GEMINI_MODEL_MAP,
    llm_router_service,
)

__all__ = [
    "MultiLLMRouter",
    "AVAILABLE_MODELS",
    "DEFAULT_MODEL_ID",
    "ANTHROPIC_MODEL_MAP",
    "OPENAI_MODEL_MAP",
    "GEMINI_MODEL_MAP",
    "llm_router_service",
]
