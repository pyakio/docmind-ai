import re
import time
from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document as LCDocument
from app.core.config import settings
from app.rag.parsing.parser import document_parser
from app.core.logging import get_logger

logger = get_logger(__name__)

class DocumentChunker:
    """Production-grade Semantic Document Chunker for RAG.
    
    Performs OCR text cleaning, heading-aware & page-aware semantic splitting,
    content-type classification, metadata enrichment, and chunk quality filtering.
    """

    def __init__(
        self,
        chunk_size: int = settings.CHUNK_SIZE,
        chunk_overlap: int = settings.CHUNK_OVERLAP
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # Hierarchical semantic separators prioritized by structural boundaries
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=[
                "\n# ", "\n## ", "\n### ", "\n#### ",
                "\n--- [Page ",
                "\n```",
                "\n\n",
                "\n|",
                "\n- ", "\n* ", "\n1. ",
                "\n", " ", ""
            ]
        )

    def extract_text(self, file_path: str) -> str:
        """Extract plain text from file using DocumentParser."""
        return document_parser.extract_text(file_path)

    def create_chunks(self, text: str, source_filename: str = "") -> List[LCDocument]:
        """Split document text into quality semantic LangChain Document chunks enriched with metadata."""
        if not text or not text.strip():
            return []

        start_time = time.time()
        
        # 1. Clean raw input text
        cleaned_text = document_parser.clean_page_text(text)

        # 2. Hierarchical split via RecursiveCharacterTextSplitter
        base_docs = [LCDocument(page_content=cleaned_text, metadata={"source": source_filename})]
        raw_chunks = self.text_splitter.split_documents(base_docs)

        # 3. Enrich metadata & filter junk chunks
        processed_chunks: List[LCDocument] = []
        current_page = 1

        for chunk in raw_chunks:
            content = chunk.page_content.strip()

            # Track page marker
            if "--- [Page " in content:
                try:
                    current_page = int(content.split("--- [Page ")[1].split("]")[0])
                except Exception:
                    pass

            # Skip empty or junk noise chunks (e.g. chunks consisting ONLY of page markers)
            if self._is_junk_chunk(content):
                continue

            content_type = self._classify_content_type(content)

            chunk.metadata.update({
                "source": source_filename,
                "chunk_index": len(processed_chunks),
                "page_number": current_page,
                "content_type": content_type
            })

            processed_chunks.append(chunk)

        elapsed_ms = round((time.time() - start_time) * 1000, 2)
        avg_chunk_len = round(sum(len(c.page_content) for c in processed_chunks) / max(1, len(processed_chunks)), 1)
        logger.info(
            f"\n========================\n"
            f"CHUNKING\n"
            f"Chunks created: {len(processed_chunks)}\n"
            f"Average chunk length: {avg_chunk_len} chars\n"
            f"========================"
        )

        return processed_chunks

    def _is_junk_chunk(self, content: str) -> bool:
        """Filter out non-semantic noise chunks."""
        stripped = content.strip()
        if not stripped:
            return True

        # Remove page marker before evaluating length
        stripped_no_marker = re.sub(r"--- \[Page \d+\] ---", "", stripped).strip()
        if len(stripped_no_marker) < 15:
            return True

        # Ignore chunks consisting solely of punctuation/numbers
        if re.match(r"^[\d\s\W]+$", stripped_no_marker):
            return True

        return False

    def _classify_content_type(self, content: str) -> str:
        """Classify chunk content type for downstream retrieval weighting."""
        if content.startswith("#") or re.match(r"^[A-Z0-9\s]{3,40}\n", content):
            return "heading"
        elif "|" in content and "\n|" in content:
            return "table"
        elif content.startswith("```") or "def " in content or "function" in content:
            return "code"
        elif re.search(r"^\s*[-*•\d\.]+\s+", content, re.MULTILINE):
            return "list"
        return "paragraph"

chunker_service = DocumentChunker()
