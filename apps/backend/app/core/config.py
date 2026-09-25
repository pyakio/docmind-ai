import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory hierarchy
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent  # apps/backend
PROJECT_ROOT = BACKEND_DIR.parent.parent  # docmind-ai root

def _resolve_default_data_dir() -> Path:
    """Resolve data directory prioritizing shared root data/ with fallback to backend local data/."""
    root_data = PROJECT_ROOT / "data"
    backend_data = BACKEND_DIR / "data"
    if root_data.exists():
        return root_data
    if backend_data.exists():
        return backend_data
    root_data.mkdir(parents=True, exist_ok=True)
    return root_data

DEFAULT_DATA_DIR = _resolve_default_data_dir()

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocMind AI Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    INSECURE_FALLBACK_SECRET: str = "docmind-super-secure-jwt-secret-key-prod-2026"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "docmind-super-secure-jwt-secret-key-prod-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Hours
    ALGORITHM: str = "HS256"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
    ]

    # Reverse Proxy & Network Security Settings
    # When False (default): client IP is derived strictly from TCP socket peer (request.client.host).
    # When True: client IP can be derived from X-Forwarded-For / X-Real-IP (only safe behind trusted reverse proxy).
    TRUST_PROXY_HEADERS: bool = os.getenv("TRUST_PROXY_HEADERS", "false").lower() in ("true", "1", "yes")

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DATA_DIR}/docmind.db")

    # Vector DB
    CHROMADB_DIR: str = os.getenv("CHROMADB_DIR", str(DEFAULT_DATA_DIR / "chromadb"))

    # Uploads Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(DEFAULT_DATA_DIR / "uploads"))

    # LLM & Embedding API Keys
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    # Document Chunking Settings
    CHUNK_SIZE: int = 1200
    CHUNK_OVERLAP: int = 200

    # RAG Retrieval & Context Compression Settings
    RAG_DEFAULT_TOP_K: int = 6
    RAG_SUMMARY_TOP_K: int = 8
    RAG_MAX_CONTEXT_TOKENS: int = 6000
    RAG_MAX_CONTEXT_CHARS: int = 24000

    # LLM Generation & Routing Settings
    DEFAULT_EMBEDDING_MODEL: str = "text-embedding-3-large"
    DEFAULT_LLM_PROVIDER: str = "anthropic"
    DEFAULT_ANTHROPIC_MODEL: str = "claude-3-5-sonnet-20241022"
    DEFAULT_GEMINI_MODEL: str = "gemini-1.5-flash"
    DEFAULT_OPENAI_MODEL: str = "gpt-4o"
    LLM_TEMPERATURE: float = 0.3
    LLM_MAX_TOKENS: int = 2048
    LLM_MAX_RETRIES: int = 2
    LLM_RETRY_DELAY: float = 1.0

    # Embedding Settings
    EMBEDDING_DIMENSION: int = 3072
    EMBEDDING_BATCH_SIZE: int = 64

    # Document Upload & Storage Settings
    ALLOWED_EXTENSIONS: List[str] = [
        ".pdf", ".docx", ".doc", ".txt", ".md", ".png", ".jpg", ".jpeg", ".webp"
    ]
    MAX_UPLOAD_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB

    model_config = SettingsConfigDict(
        env_file=(".env", str(PROJECT_ROOT / ".env"), str(BACKEND_DIR / ".env")),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

def validate_secret_key_configuration(settings_obj: Settings = settings) -> None:
    """Validate that production environments require a secure, non-empty SECRET_KEY.
    
    Raises:
        RuntimeError: If ENVIRONMENT is production and SECRET_KEY is missing, empty,
                      or matches the insecure fallback secret.
    """
    is_prod = (settings_obj.ENVIRONMENT or "").strip().lower() in ["production", "prod"]
    secret = (settings_obj.SECRET_KEY or "").strip()

    if is_prod:
        if not secret or secret == settings_obj.INSECURE_FALLBACK_SECRET:
            raise RuntimeError(
                "FATAL: Insecure or missing SECRET_KEY in production environment. "
                "You must configure a strong, unique SECRET_KEY via environment variable or .env file before running in production."
            )

