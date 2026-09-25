import os
import time
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.rag.embeddings.service import embedding_service
from app.core.logging import get_logger

logger = get_logger(__name__)

class ChromaVectorStore:
    """Production-grade Vector Storage & Database Operations for DocMind AI.
    
    Responsible exclusively for ChromaDB client lifecycle, collection management,
    vector persistence, and raw database queries. Higher-level retrieval strategies,
    diversity filtering, and caching are managed by the retrieval layer.
    """

    def __init__(self):
        os.makedirs(settings.CHROMADB_DIR, exist_ok=True)
        try:
            self.client = chromadb.PersistentClient(
                path=settings.CHROMADB_DIR,
                settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False)
            )
            logger.info("[VectorStore] Persistent ChromaDB client initialized successfully.")
        except Exception as e:
            logger.error(f"[VectorStore] Failed to initialize ChromaDB client: {e}", exc_info=True)
            self.client = None

    def get_or_create_collection(self, name: str, space: str = "cosine"):
        """Get an existing ChromaDB collection or create one if it does not exist."""
        if not self.client:
            return None
        return self.client.get_or_create_collection(
            name=name,
            metadata={"hnsw:space": space}
        )

    def get_collection(self, name: str):
        """Get an existing ChromaDB collection by name."""
        if not self.client:
            return None
        return self.client.get_collection(name=name)

    def add_document_chunks(
        self, collection_name: str, chunks: List[Any], document_id: int
    ) -> int:
        """Embed and insert text chunks into ChromaDB with enriched metadata."""
        if not chunks or not self.client:
            return 0

        start_time = time.time()
        try:
            collection = self.get_or_create_collection(name=collection_name)
            if not collection:
                return 0

            valid_chunks = [chunk for chunk in chunks if getattr(chunk, "page_content", "").strip()]
            if not valid_chunks:
                return 0

            texts = [chunk.page_content.strip() for chunk in valid_chunks]
            embeddings = embedding_service.embed_documents(texts)
            ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(valid_chunks))]

            metadatas = []
            for i, chunk in enumerate(valid_chunks):
                meta = getattr(chunk, "metadata", {}) or {}
                text_val = getattr(chunk, "page_content", "")
                page_num = 1
                if "--- [Page " in text_val:
                    try:
                        page_num = int(text_val.split("--- [Page ")[1].split("]")[0])
                    except Exception:
                        page_num = 1

                metadatas.append({
                    "document_id": document_id,
                    "chunk_index": i,
                    "page_number": page_num,
                    "source": meta.get("source", "")
                })

            collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas
            )

            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            total_vecs = collection.count() if collection else len(texts)
            logger.info(
                f"\n========================\n"
                f"VECTOR STORE\n"
                f"Collection: {collection_name}\n"
                f"Chunks inserted: {len(texts)}\n"
                f"Total vectors: {total_vecs}\n"
                f"Time: {elapsed_ms}ms\n"
                f"========================"
            )
            return len(texts)

        except Exception as e:
            logger.error(f"[VectorStore] Error adding chunks for doc_id={document_id}: {e}", exc_info=True)
            return 0

    def query_collection(
        self,
        collection_name: str,
        query_embeddings: List[List[float]],
        n_results: int = 10,
        include: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Perform a raw vector query against ChromaDB."""
        if not self.client:
            return {}

        collection = self.get_collection(name=collection_name)
        if not collection:
            raise KeyError(f"Collection '{collection_name}' not found")

        include_fields = include or ["documents", "metadatas", "distances"]
        return collection.query(
            query_embeddings=query_embeddings,
            n_results=n_results,
            include=include_fields
        )

    def delete_collection(self, collection_name: str) -> bool:
        """Remove collection from ChromaDB storage."""
        if not self.client:
            return False

        try:
            self.client.delete_collection(name=collection_name)
            logger.info(f"[VectorStore] Successfully deleted collection '{collection_name}'.")
            return True
        except Exception as e:
            logger.warning(f"[VectorStore] Could not delete collection '{collection_name}': {e}")
            return False

    def count_vectors(self, collection_name: str) -> int:
        """Return total number of vectors in a collection."""
        if not self.client:
            return 0
        try:
            col = self.get_collection(name=collection_name)
            return col.count() if col else 0
        except Exception:
            return 0

vector_store_service = ChromaVectorStore()
