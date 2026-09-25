from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings, validate_secret_key_configuration
from app.db.database import init_db
from app.api.v1.router import api_router
from app.core.logging import logger

# Production Secret Enforcement: Refuse startup if in production without valid secret
validate_secret_key_configuration(settings)

# Development notification if fallback secret is in use
if settings.SECRET_KEY == settings.INSECURE_FALLBACK_SECRET:
    logger.warning(
        "[DEVELOPMENT NOTICE] Application is running with the default fallback SECRET_KEY. "
        "Set SECRET_KEY in your environment or .env file before deploying to production."
    )

# Initialize Database tables & run schema updates
init_db()
logger.info("[Main] Database initialized and verified.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Python FastAPI backend for DocMind AI featuring password security, ChromaDB vector database, LangChain chunking, OpenAI embeddings, and Multi-LLM RAG support (Claude, ChatGPT, Gemini).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to DocMind AI Backend API",
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
