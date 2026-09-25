import hashlib
import time
from typing import List, Dict, Optional
from openai import OpenAI
import google.generativeai as genai
from chromadb.utils import embedding_functions
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

class HybridEmbeddingService:
    """Production-grade dense semantic embedding generator service.
    
    Order of preference:
    1. OpenAI text-embedding-3-large (3072 dim) or configured model if OPENAI_API_KEY is present
    2. Google Gemini text-embedding-004 (768 dim) if GEMINI_API_KEY is present
    3. ChromaDB's local ONNX all-MiniLM-L6-v2 (384 dim) for 100% reliable local semantic search
    """

    def __init__(self):
        self.model_name = settings.DEFAULT_EMBEDDING_MODEL
        self.openai_api_key = settings.OPENAI_API_KEY
        self.gemini_api_key = settings.GEMINI_API_KEY
        self.batch_size = settings.EMBEDDING_BATCH_SIZE
        
        self.openai_client: Optional[OpenAI] = None
        self.gemini_configured: bool = False
        self._local_ef = None
        self._active_backend: str = "local_onnx"
        self._max_cache_entries: int = 2048

        # 1. Initialize OpenAI if key configured
        if self.openai_api_key:
            try:
                self.openai_client = OpenAI(api_key=self.openai_api_key)
                self._active_backend = "openai"
                logger.info(f"[EmbeddingService] OpenAI embedding client initialized ({self.model_name}).")
            except Exception as e:
                logger.warning(f"[EmbeddingService] OpenAI embedding init failed: {e}")

        # 2. Initialize Gemini if key configured and OpenAI not active
        if not self.openai_client and self.gemini_api_key:
            try:
                genai.configure(api_key=self.gemini_api_key)
                self.gemini_configured = True
                self._active_backend = "gemini"
                logger.info("[EmbeddingService] Gemini embedding configured (models/text-embedding-004).")
            except Exception as e:
                logger.warning(f"[EmbeddingService] Gemini embedding init failed: {e}")

        # In-memory embedding cache mapping content_hash -> float vector
        self._embedding_cache: Dict[str, List[float]] = {}

    @property
    def local_ef(self):
        """Lazy load local ONNX all-MiniLM-L6-v2 embedding function."""
        if self._local_ef is None:
            try:
                self._local_ef = embedding_functions.DefaultEmbeddingFunction()
                logger.info("[EmbeddingService] Local ONNX all-MiniLM-L6-v2 embedding function loaded.")
            except Exception as e:
                logger.error(f"[EmbeddingService] Failed to load local ONNX embedding: {e}", exc_info=True)
                raise RuntimeError(f"Failed to initialize local ONNX embedding model: {e}")
        return self._local_ef

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generate dense semantic embeddings with in-memory caching and batching."""
        if not texts:
            return []

        start_time = time.time()
        normalized_inputs = [t.strip() if isinstance(t, str) and t.strip() else "empty_chunk" for t in texts]

        embeddings_result: List[Optional[List[float]]] = [None] * len(normalized_inputs)
        uncached_indices: List[int] = []
        uncached_texts: List[str] = []

        # 1. Lookup cached embeddings
        for idx, text in enumerate(normalized_inputs):
            cache_key = self._compute_content_hash(text)
            if cache_key in self._embedding_cache:
                embeddings_result[idx] = self._embedding_cache[cache_key]
            else:
                uncached_indices.append(idx)
                uncached_texts.append(text)

        # 2. Batch process uncached texts via active provider or local ONNX model
        if uncached_texts:
            new_embeddings = self._generate_batch_embeddings(uncached_texts)
            for idx, text, emb in zip(uncached_indices, uncached_texts, new_embeddings):
                cache_key = self._compute_content_hash(text)
                if len(self._embedding_cache) >= self._max_cache_entries:
                    try:
                        self._embedding_cache.pop(next(iter(self._embedding_cache)))
                    except Exception:
                        pass
                self._embedding_cache[cache_key] = emb
                embeddings_result[idx] = emb

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            f"\n========================\n"
            f"EMBEDDING\n"
            f"Active Backend: {self._active_backend}\n"
            f"Chunks Embedded: {len(texts)}\n"
            f"Time: {elapsed_ms}ms\n"
            f"========================"
        )

        return [emb for emb in embeddings_result if emb is not None]

    def embed_query(self, query: str) -> List[float]:
        """Generate dense semantic embedding for a single search query."""
        cleaned = query.strip() if query and query.strip() else "search query"
        results = self.embed_documents([cleaned])
        if not results:
            raise RuntimeError(f"Embedding failed to generate vector for query: '{query}'")
        return results[0]

    def _generate_batch_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings using active provider or fallback to local ONNX model."""
        # 1. OpenAI embeddings
        if self._active_backend == "openai" and self.openai_client:
            try:
                all_embeddings: List[List[float]] = []
                for i in range(0, len(texts), self.batch_size):
                    batch = texts[i : i + self.batch_size]
                    response = self.openai_client.embeddings.create(
                        model=self.model_name,
                        input=batch
                    )
                    all_embeddings.extend([data.embedding for data in response.data])
                return all_embeddings
            except Exception as e:
                logger.warning(f"[EmbeddingService] OpenAI embedding failed ({e}). Falling back to local ONNX model.")

        # 2. Gemini embeddings
        if self._active_backend == "gemini" and self.gemini_configured:
            try:
                all_embeddings: List[List[float]] = []
                for text in texts:
                    res = genai.embed_content(
                        model="models/text-embedding-004",
                        content=text,
                        task_type="retrieval_document"
                    )
                    all_embeddings.append(res["embedding"])
                return all_embeddings
            except Exception as e:
                logger.warning(f"[EmbeddingService] Gemini embedding failed ({e}). Falling back to local ONNX model.")

        # 3. Local ONNX all-MiniLM-L6-v2 semantic embeddings
        try:
            raw_embs = self.local_ef(texts)
            return [list(map(float, vec)) for vec in raw_embs]
        except Exception as e:
            logger.error(f"[EmbeddingService] Local ONNX embedding failed: {e}", exc_info=True)
            raise RuntimeError(f"Critical error: All embedding backends failed: {e}")

    def _compute_content_hash(self, text: str) -> str:
        """Compute SHA256 content hash with backend prefix for cache keys."""
        return f"{self._active_backend}_{hashlib.sha256(text.encode('utf-8')).hexdigest()}"

# Class Aliases & Singleton Exports
EmbeddingService = HybridEmbeddingService
embedding_service = HybridEmbeddingService()
