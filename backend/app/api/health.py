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
            {"provider": "chatgpt", "models": ["gpt-4o", "gpt-4o-mini"]},
            {"provider": "gemini", "models": ["gemini-1.5-flash", "gemini-1.5-pro"]},
            {"provider": "llama", "models": ["llama3", "llama3.1"]}
        ]
    }
