import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocMind AI Backend"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "super-secret-docmind-ai-key-2026"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 Hours
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "sqlite:///./data/docmind.db"

    # Vector DB
    CHROMADB_DIR: str = "./data/chromadb"

    # LLM & Embedding Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

    DEFAULT_EMBEDDING_MODEL: str = "text-embedding-3-large"
    DEFAULT_LLM_MODEL: str = "gpt-4o"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
