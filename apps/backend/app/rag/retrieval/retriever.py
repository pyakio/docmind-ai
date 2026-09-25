import re
import time
from typing import List, Dict, Any, Optional
from app.rag.vectorstore.chroma import vector_store_service
from app.rag.embeddings.service import embedding_service
from app.core.logging import get_logger

logger = get_logger(__name__)

class DocumentRetriever:
    """Canonical RAG Retrieval Strategy for DocMind AI.
    
    Coordinates candidate retrieval, query caching, similarity score normalization,
    metadata filtering, and context diversity deduplication.
    
    Conceptual dependency:
        retrieval → vectorstore
    """

    def __init__(self, vector_store=vector_store_service, embedding_svc=embedding_service):
        self.vector_store = vector_store
        self.embedding_service = embedding_svc
        self._search_cache: Dict[str, List[Dict[str, Any]]] = {}
        self._max_cache_size: int = 500

    def retrieve(
        self, collection_name: str, query: str, top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks with candidate expansion, score normalization, and deduplication."""
        if not query or not query.strip():
            return []

        start_time = time.time()
        normalized_query = query.strip().lower()
        cache_key = f"{collection_name}:{normalized_query}:{top_k}"

        if cache_key in self._search_cache:
            logger.debug(f"[Retriever] Cache hit for collection '{collection_name}'")
            return self._search_cache[cache_key]

        try:
            # 1. Generate dense query embedding
            query_embedding = self.embedding_service.embed_query(query)

            # 2. Query vector store with expanded candidate pool (for reranking & diversity)
            candidate_k = min(top_k * 3, 25)
            raw_results = self.vector_store.query_collection(
                collection_name=collection_name,
                query_embeddings=[query_embedding],
                n_results=candidate_k
            )

            raw_chunks: List[Dict[str, Any]] = []
            if raw_results and "documents" in raw_results and raw_results["documents"]:
                docs = raw_results["documents"][0]
                metas = raw_results["metadatas"][0] if "metadatas" in raw_results else [{}] * len(docs)
                dists = raw_results["distances"][0] if "distances" in raw_results else [0.0] * len(docs)

                for text, meta, dist in zip(docs, metas, dists):
                    # Cosine distance to similarity score normalization (0.0 to 1.0)
                    sim_score = max(0.0, min(1.0, 1.0 - float(dist)))
                    raw_chunks.append({
                        "text": text,
                        "metadata": meta,
                        "score": round(sim_score, 4)
                    })

            # 3. Context diversity filtering and deduplication
            filtered_chunks = self.filter_and_rank_results(raw_chunks, target_k=top_k)

            # 4. Store in search cache with capacity bound
            if len(self._search_cache) >= self._max_cache_size:
                try:
                    self._search_cache.pop(next(iter(self._search_cache)))
                except Exception:
                    pass
            self._search_cache[cache_key] = filtered_chunks

            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            logger.info(f"[Retriever] Retrieved {len(filtered_chunks)} chunks for collection '{collection_name}' in {elapsed_ms}ms.")

            return filtered_chunks

        except Exception as e:
            logger.error(f"[Retriever] Error retrieving from '{collection_name}': {e}", exc_info=True)
            return []

    def filter_and_rank_results(
        self, raw_chunks: List[Dict[str, Any]], target_k: int
    ) -> List[Dict[str, Any]]:
        """Remove near-duplicates and prioritize context diversity across document sections."""
        if not raw_chunks:
            return []

        # Sort by similarity score descending
        sorted_chunks = sorted(raw_chunks, key=lambda x: x.get("score", 0.0), reverse=True)

        accepted_chunks = []
        seen_snippets = set()

        for chunk in sorted_chunks:
            text = chunk.get("text", "").strip()
            if not text:
                continue

            # Create snippet signature for deduplication
            snippet_sig = re.sub(r"\s+", " ", text[:120].lower())
            if snippet_sig in seen_snippets:
                continue

            seen_snippets.add(snippet_sig)
            accepted_chunks.append(chunk)

            if len(accepted_chunks) >= target_k:
                break

        return accepted_chunks

    def purge_cache(self, collection_name: Optional[str] = None):
        """Purge retrieval cache entries for a collection or entirely."""
        if collection_name:
            self._search_cache = {
                k: v for k, v in self._search_cache.items() if not k.startswith(f"{collection_name}:")
            }
        else:
            self._search_cache.clear()

document_retriever = DocumentRetriever()
