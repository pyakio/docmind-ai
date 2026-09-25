"""API v1 package containing HTTP endpoints for DocMind AI."""

from app.api.v1.router import api_router
from app.api.v1 import health, auth, documents, chat

__all__ = ["api_router", "health", "auth", "documents", "chat"]
