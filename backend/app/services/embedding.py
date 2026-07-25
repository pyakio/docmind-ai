import logging
from typing import List
from openai import OpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenAIEmbeddingService:
    """Service for generating dense embeddings via OpenAI text-embedding-3-large."""

    def __init__(self):
        self.model_name = settings.DEFAULT_EMBEDDING_MODEL  # 'text-embedding-3-large'
        self.api_key = settings.OPENAI_API_KEY
        self.client = None

        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI Client: {e}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generate vector embeddings for a list of document chunk texts."""
        if not texts:
            return []

        if self.client:
            try:
                response = self.client.embeddings.create(
                    model=self.model_name,
                    input=texts
                )
                return [data.embedding for data in response.data]
            except Exception as e:
                logger.warning(f"OpenAI embedding call failed: {e}. Falling back to default embedding generator.")

        # Fallback pseudo-embedding generator (for offline / dev testing without API key)
        return [self._generate_fallback_embedding(t) for t in texts]

    def embed_query(self, query: str) -> List[float]:
        """Generate vector embedding for a single user search query."""
        results = self.embed_documents([query])
        return results[0] if results else []

    def _generate_fallback_embedding(self, text: str, dimension: int = 3072) -> List[float]:
        """Deterministic pseudo-embedding fallback vector of 3072 dimensions."""
        import hashlib
        import math
        
        vec = []
        for i in range(dimension):
            seed = f"{text}_{i}".encode("utf-8")
            hash_val = int(hashlib.md5(seed).hexdigest(), 16)
            # Normalize float between -1.0 and 1.0
            val = (hash_val % 200000 - 100000) / 100000.0
            vec.append(val)

        # Unit vector normalization
        norm = math.sqrt(sum(x * x for x in vec))
        return [x / norm for x in vec] if norm > 0 else vec

embedding_service = OpenAIEmbeddingService()
