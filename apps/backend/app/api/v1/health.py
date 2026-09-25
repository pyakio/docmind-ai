from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(tags=["Health & Status"])

@router.get("/health")
def health_check():
    """Health check endpoint confirming API status, models, and configuration."""
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "embedding_model": settings.DEFAULT_EMBEDDING_MODEL,
        "vector_database": "ChromaDB",
        "supported_llms": [
            {"provider": "anthropic", "models": ["claude-sonnet-5", "claude-opus-5", "claude-haiku-4-5"]},
            {"provider": "openai", "models": ["gpt-5.6-terra", "gpt-5.6-sol", "gpt-5.6-luna", "gpt-4o", "gpt-4o-mini"]},
            {"provider": "gemini", "models": ["gemini-3.6-flash", "gemini-3.1-pro-preview", "gemini-3.5-flash-lite", "gemini-1.5-flash"]}
        ]
    }
