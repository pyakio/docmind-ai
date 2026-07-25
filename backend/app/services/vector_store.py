import os
import logging
from typing import List, Dict, Any
import chromadb
from chromadb.config import Settings as ChromaSettings
from app.core.config import settings
from app.services.embedding import embedding_service

logger = logging.getLogger(__name__)

class ChromaVectorStore:
    """Manager for ChromaDB Vector Database storage, in-memory caching, and fast similarity retrieval."""

    def __init__(self):
        os.makedirs(settings.CHROMADB_DIR, exist_ok=True)
        self.client = chromadb.PersistentClient(
            path=settings.CHROMADB_DIR,
            settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False)
        )
        self._search_cache: Dict[str, List[Dict[str, Any]]] = {}

    def add_document_chunks(
        self, collection_name: str, chunks: List[Any], document_id: int
    ) -> int:
        """Embed and insert text chunks into ChromaDB vector collection."""
        if not chunks:
            return 0

        collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

        texts = [chunk.page_content for chunk in chunks]
        embeddings = embedding_service.embed_documents(texts)

        ids = [f"doc_{document_id}_chunk_{i}" for i in range(len(chunks))]
        metadatas = [
            {
                "document_id": document_id,
                "chunk_index": i,
                "source": chunk.metadata.get("source", "")
            }
            for i, chunk in enumerate(chunks)
        ]

        collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas
        )

        # Clear cache for this collection when new document is added
        self._search_cache = {k: v for k, v in self._search_cache.items() if not k.startswith(collection_name)}

        return len(chunks)

    def similarity_search(
        self, collection_name: str, query: str, top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Search vector database for top_k relevant text chunks with sub-second caching."""
        cache_key = f"{collection_name}:{query}:{top_k}"
        if cache_key in self._search_cache:
            return self._search_cache[cache_key]

        try:
            collection = self.client.get_collection(name=collection_name)
        except Exception:
            logger.warning(f"Collection {collection_name} not found in ChromaDB.")
            return []

        query_embedding = embedding_service.embed_query(query)

        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        retrieved_chunks = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
            dists = results["distances"][0] if "distances" in results else [0.0] * len(docs)

            for text, meta, dist in zip(docs, metas, dists):
                retrieved_chunks.append({
                    "text": text,
                    "metadata": meta,
                    "score": 1.0 - float(dist)
                })

        self._search_cache[cache_key] = retrieved_chunks
        return retrieved_chunks

    def delete_collection(self, collection_name: str):
        """Remove a collection from ChromaDB and purge search cache."""
        try:
            self.client.delete_collection(name=collection_name)
            self._search_cache = {k: v for k, v in self._search_cache.items() if not k.startswith(collection_name)}
        except Exception as e:
            logger.warning(f"Could not delete collection {collection_name}: {e}")

vector_store_service = ChromaVectorStore()
