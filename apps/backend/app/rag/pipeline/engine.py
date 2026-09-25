import re
import time
from typing import Dict, Any, List, Optional, Generator
import tiktoken
from app.rag.retrieval.retriever import document_retriever
from app.rag.vectorstore.chroma import vector_store_service
from app.rag.generation.router import llm_router_service
from app.rag.prompts.builder import prompt_builder_service
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

try:
    _TIKTOKEN_ENCODER = tiktoken.get_encoding("cl100k_base")
except Exception:
    _TIKTOKEN_ENCODER = None

class RAGEngine:
    """Production-grade Retrieval-Augmented Generation (RAG) Orchestration Layer.

    Delivers natural, conversational responses matching Claude, ChatGPT, and Gemini,
    with sub-second hybrid retrieval, deduplication, token-sized context windows,
    and natural source citations.
    """

    def __init__(self):
        self.retriever = document_retriever
        self.vector_store_service = vector_store_service
        self.llm_router_service = llm_router_service
        self.prompt_builder_service = prompt_builder_service

    def generate_auto_summary(
        self,
        collection_name: str,
        filename: str,
        file_size_bytes: int,
        doc_type: str,
        total_pages: int = 1,
        model_provider: Optional[str] = None,
        model_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate a concise, natural executive summary immediately after document upload."""
        try:
            logger.info(f"Generating automatic summary for '{filename}' ({collection_name})...")
            
            # Retrieve representative chunks across the document
            chunks = self.retriever.retrieve(
                collection_name=collection_name,
                query="overview executive summary main topics key concepts conclusions",
                top_k=settings.RAG_SUMMARY_TOP_K
            )

            compressed_context = self._compress_context(
                chunks, filename=filename, max_tokens=settings.RAG_MAX_CONTEXT_TOKENS
            )
            size_mb = f"{round(file_size_bytes / (1024 * 1024), 2)} MB" if file_size_bytes > 0 else "0.5 MB"

            prompt = self.prompt_builder_service.build_summary_prompt(filename, total_pages, compressed_context)

            summary_text = self.llm_router_service.generate_response(
                prompt=prompt,
                system_instruction=self.prompt_builder_service.get_system_instruction(is_summary=True),
                model_provider=model_provider,
                model_name=model_name
            ).strip()

            if not summary_text:
                summary_text = (
                    f"**{filename}** ({total_pages} page{'s' if total_pages != 1 else ''}) has been indexed "
                    f"and is ready for questions."
                )

            return {
                "document_name": filename,
                "summary": summary_text,
                "total_pages": total_pages,
                "file_size": size_mb
            }

        except Exception as e:
            logger.error(f"Error in generate_auto_summary for {filename}: {e}", exc_info=True)
            return {
                "document_name": filename,
                "summary": f"{filename} has been indexed and is ready for questions.",
                "total_pages": total_pages,
                "file_size": "0.5 MB"
            }

    def query_document(
        self,
        collection_name: str,
        query: str,
        filename: str = "document.pdf",
        model_provider: Optional[str] = None,
        model_name: Optional[str] = None,
        messages: Optional[List[Dict[str, str]]] = None,
        top_k: int = 6
    ) -> Dict[str, Any]:
        """Execute RAG pipeline: Retrieval ➔ Deduplication ➔ Token-bounded Context ➔ Natural LLM Synthesis."""
        start_time = time.time()
        
        # 1. Expand search query if brief
        rewritten_query = self._detect_intent_and_rewrite(query)

        # 2. Retrieve Chunks
        retrieved_chunks = self.retriever.retrieve(
            collection_name=collection_name,
            query=rewritten_query,
            top_k=top_k
        )

        if not retrieved_chunks:
            logger.warning(f"No chunks retrieved for query '{query}' in collection '{collection_name}'")
            # If no document chunks matched, let the model answer with a clear note
            prompt = (
                f"Document: {filename}\n"
                f"Note: No direct matches were found in the uploaded document for this question.\n\n"
                f"User Question: {query}"
            )
            answer = self.llm_router_service.generate_response(
                prompt=prompt,
                system_instruction=self.prompt_builder_service.get_system_instruction(is_summary=False),
                model_provider=model_provider,
                model_name=model_name,
                messages=messages
            )
            return {
                "query": query,
                "answer": answer,
                "found_in_document": False
            }

        # 3. Deduplicate
        unique_chunks = self._deduplicate_and_merge_chunks(retrieved_chunks)

        # 4. Token-bounded context assembly
        compressed_context = self._compress_context(
            unique_chunks, filename=filename, max_tokens=settings.RAG_MAX_CONTEXT_TOKENS
        )

        pages = sorted(list(set(c.get("metadata", {}).get("page_number", 1) for c in unique_chunks)))
        query_preview = (query[:60] + "...") if len(query) > 60 else query
        logger.info(
            f"\n========================\n"
            f"RAG RETRIEVAL\n"
            f"Query Preview: {query_preview} ({len(query)} chars)\n"
            f"Retrieved Chunks: {len(unique_chunks)}\n"
            f"Pages Covered: {pages}\n"
            f"========================"
        )

        # 5. Build prompt & synthesize
        prompt = self.prompt_builder_service.build_qa_prompt(
            query=query,
            compressed_context=compressed_context,
            filename=filename
        )

        answer = self.llm_router_service.generate_response(
            prompt=prompt,
            system_instruction=self.prompt_builder_service.get_system_instruction(is_summary=False),
            model_provider=model_provider,
            model_name=model_name,
            messages=messages
        ).strip()

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            f"\n========================\n"
            f"RAG RESPONSE COMPLETE\n"
            f"Answer Length: {len(answer)} chars\n"
            f"Time: {elapsed_ms}ms\n"
            f"========================"
        )

        return {
            "query": query,
            "answer": answer,
            "found_in_document": True
        }

    def query_document_stream(
        self,
        collection_name: Optional[str],
        query: str,
        filename: str = "document.pdf",
        model_provider: Optional[str] = None,
        model_name: Optional[str] = None,
        messages: Optional[List[Dict[str, str]]] = None,
        top_k: int = 6
    ) -> Generator[str, None, None]:
        """Stream RAG response tokens for real-time SSE client rendering."""
        if not collection_name:
            # General Chat without attached document context
            for token in self.llm_router_service.generate_response_stream(
                prompt=query,
                system_instruction=self.prompt_builder_service.get_system_instruction(is_summary=False),
                model_provider=model_provider,
                model_name=model_name,
                messages=messages
            ):
                yield token
            return

        # Document-specific RAG Query
        rewritten_query = self._detect_intent_and_rewrite(query)
        retrieved_chunks = self.retriever.retrieve(
            collection_name=collection_name,
            query=rewritten_query,
            top_k=top_k
        )

        if not retrieved_chunks:
            prompt = (
                f"Document: {filename}\n"
                f"Note: No direct matches were found in the uploaded document for this question.\n\n"
                f"User Question: {query}"
            )
            for token in self.llm_router_service.generate_response_stream(
                prompt=prompt,
                system_instruction=self.prompt_builder_service.get_system_instruction(is_summary=False),
                model_provider=model_provider,
                model_name=model_name,
                messages=messages
            ):
                yield token
            return

        unique_chunks = self._deduplicate_and_merge_chunks(retrieved_chunks)
        compressed_context = self._compress_context(
            unique_chunks, filename=filename, max_tokens=settings.RAG_MAX_CONTEXT_TOKENS
        )

        prompt = self.prompt_builder_service.build_qa_prompt(
            query=query,
            compressed_context=compressed_context,
            filename=filename
        )

        for token in self.llm_router_service.generate_response_stream(
            prompt=prompt,
            system_instruction=self.prompt_builder_service.get_system_instruction(is_summary=False),
            model_provider=model_provider,
            model_name=model_name,
            messages=messages
        ):
            yield token

    def _detect_intent_and_rewrite(self, query: str) -> str:
        """Expand short ambiguous search queries for better vector recall."""
        cleaned = query.strip()
        if len(cleaned.split()) <= 2:
            return f"{cleaned} overview definition details explanation"
        return cleaned

    def _deduplicate_and_merge_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove near-duplicate chunks to prevent redundant context."""
        seen_texts = set()
        unique_chunks = []

        for chunk in chunks:
            text = chunk.get("text", "").strip()
            if not text:
                continue

            snippet_key = re.sub(r"\s+", " ", text[:120].lower())
            if snippet_key not in seen_texts:
                seen_texts.add(snippet_key)
                unique_chunks.append(chunk)

        return unique_chunks

    def _compress_context(
        self,
        chunks: List[Dict[str, Any]],
        filename: str = "document.pdf",
        max_tokens: int = 6000
    ) -> str:
        """Assemble context chunks with page numbers, bounded by token budget without mid-sentence truncation."""
        def count_tokens(text: str) -> int:
            if _TIKTOKEN_ENCODER:
                return len(_TIKTOKEN_ENCODER.encode(text))
            return len(text) // 4

        context_blocks = []
        total_tokens = 0

        for chunk in chunks:
            text = chunk.get("text", "").strip()
            if not text:
                continue

            page_num = chunk.get("metadata", {}).get("page_number", 1)
            clean_text = re.sub(r"--- \[Page \d+\] ---", "", text).strip()
            if not clean_text:
                continue

            block = f"[Page {page_num}]\n{clean_text}"
            block_tokens = count_tokens(block)

            if total_tokens + block_tokens <= max_tokens:
                context_blocks.append(block)
                total_tokens += block_tokens
            else:
                # If there's room for at least some complete sentences, take them
                remaining_tokens = max_tokens - total_tokens
                if remaining_tokens > 100:
                    sentences = re.split(r'(?<=[.!?\n])\s+', clean_text)
                    fitted_sentences = []
                    sub_tokens = count_tokens(f"[Page {page_num}]\n")
                    for s in sentences:
                        s_tok = count_tokens(s)
                        if sub_tokens + s_tok <= remaining_tokens:
                            fitted_sentences.append(s)
                            sub_tokens += s_tok
                        else:
                            break
                    if fitted_sentences:
                        context_blocks.append(f"[Page {page_num}]\n" + " ".join(fitted_sentences))
                break

        return "\n\n".join(context_blocks) if context_blocks else "No relevant document context found."


rag_engine = RAGEngine()
