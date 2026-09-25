# DocMind AI — RAG Architecture & Pipeline Deep Dive

DocMind AI is an enterprise document intelligence and question-answering system powered by Retrieval-Augmented Generation (RAG). This document provides an architectural walkthrough of the entire lifecycle.

---

## 1. High-Level Architecture Diagram

```
[ DOCUMENT INGESTION ]
Document Upload ➔ Parsing & OCR ➔ Cleaning ➔ Hierarchical Chunking ➔ Dense Embedding ➔ ChromaDB Vector Store
                                                                                              │
                                                                                              ▼
[ CONVERSATIONAL RETRIEVAL ]
User Query ➔ Query Normalization & Intent ➔ Vector Search (Top-K) ➔ Deduplication ➔ Token-Bounded Context Assembly
                                                                                              │
                                                                                              ▼
                                                      Prompt Builder ➔ Multi-LLM Router (Claude/GPT/Gemini) ➔ SSE Token Stream
```

---

## 2. Ingestion Pipeline Breakdown

### Phase 1: Upload & File Handling
- **Route:** `POST /api/v1/documents/upload`
- **Supported Formats:** `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.png`, `.jpg`, `.jpeg`, `.webp`.
- **Validation:** MIME-type check, unique timestamp filename generation, storage in user-partitioned directory `data/uploads/user_{user_id}/`.
- **Database Tracking:** Document record created in SQLite with status `processing`.
- **Execution Model:** Fast HTTP response returning metadata; heavy processing handed off to asynchronous FastAPI `BackgroundTask`.

### Phase 2: Document Parsing & OCR (`app/rag/parsing/parser.py`)
- **PDF Extraction:** `pypdf.PdfReader` iterates through pages, injecting distinct structural boundaries: `\n--- [Page N] ---\n`.
- **Image Extraction:** `PIL.Image` + `pytesseract` OCR engine extracts visual text, formatting headers with bounding resolutions.
- **DOCX / TXT Extraction:** `python-docx` extracts paragraph blocks; plain text files normalized with UTF-8 fallback.

### Phase 3: Text Normalization & Cleaning
- **OCR Artifact Repair:** Reconnects hyphenated line-broken words (`com-\nmunication` ➔ `communication`).
- **Header/Footer Stripping:** Removes repetitive page count artifacts (`Page X of Y`).
- **Whitespace Consolidation:** Collapses redundant blank lines and tabs.

### Phase 4: Semantic Chunking (`app/rag/chunking/chunker.py`)
- **Engine:** `langchain_text_splitters.RecursiveCharacterTextSplitter`.
- **Separators:** Hierarchical structural delimiters prioritized by:
  `["\n# ", "\n## ", "\n### ", "\n#### ", "\n--- [Page ", "\n```", "\n\n", "\n|", "\n- ", "\n* ", "\n1. ", "\n", " ", ""]`.
- **Parameters:** `CHUNK_SIZE = 1200` characters, `CHUNK_OVERLAP = 200` characters.
- **Noise Filtering:** Discards non-semantic artifacts (pure punctuation, orphan page tags, chunks < 15 chars).
- **Metadata Tagging:** Enriches each chunk with `source`, `chunk_index`, `page_number`, and `content_type` (`heading`, `table`, `code`, `list`, `paragraph`).

### Phase 5: Dense Vector Embedding (`app/rag/embeddings/service.py`)
- **Primary:** OpenAI `text-embedding-3-large` (3072 dimensions) if `OPENAI_API_KEY` is present.
- **Secondary:** Google Gemini `models/text-embedding-004` (768 dimensions) if `GEMINI_API_KEY` is present.
- **Offline / Local Fallback:** ChromaDB's local ONNX `all-MiniLM-L6-v2` (384 dimensions) ensuring 100% reliable semantic search even with zero external API keys.
- **Caching:** In-memory SHA-256 hash map prevents redundant re-embedding.

### Phase 6: Vector Storage (`app/rag/vectorstore/chroma.py`)
- **Engine:** ChromaDB `PersistentClient` in `data/chromadb/`.
- **Distance Metric:** Cosine similarity (`hnsw:space = "cosine"`).
- **Collection Partitioning:** Isolated collection per document (`user_{user_id}_doc_{timestamp}_{uuid}`).

### Phase 7: Executive Auto-Summarization (`app/rag/pipeline/engine.py`)
- Samples representative chunks across the document.
- Synthesizes a clean 2–3 paragraph executive summary using `llm_router_service`.
- Updates SQLite Document record: `status = 'ready'`, `summary = ...`.

---

## 3. Conversational Retrieval & Generation Pipeline

### Phase 1: Query Normalization & Intent (`app/rag/query/analyzer.py`)
- Classifies query intent: `SUMMARY`, `DEFINITION`, `COMPARISON`, `LOCATION`, `TIMELINE`, `CITATION`, `LIST`, or `GENERAL`.
- Expands short/ambiguous queries (e.g., `"revenue"` ➔ `"revenue overview definition details explanation"`).

### Phase 2: Similarity Search & Candidate Pool Over-fetching (`app/rag/vectorstore/chroma.py`)
- Sub-second vector query against target document collection.
- In-memory LRU query cache for instant responses to identical repeated questions.
- Over-fetches candidate pool (`candidate_k = min(top_k * 3, 25)`) for downstream diversity filtering.

### Phase 3: Diversity Filtering & Near-Duplicate Suppression
- Generates 120-character snippet signatures.
- Discards redundant overlapping chunks to maximize information entropy across pages.

### Phase 4: Token-Bounded Context Assembly (`app/rag/pipeline/engine.py`)
- Bounded by `RAG_MAX_CONTEXT_TOKENS` (default 6,000 tokens / 24,000 chars) using `tiktoken` (`cl100k_base`).
- Avoids mid-sentence truncation by splitting candidates on sentence boundaries (`[.!?\n]`).
- Formats structured page references: `[Page N]\n<clean_text>`.

### Phase 5: Multi-Turn Prompt Assembly (`app/rag/prompts/builder.py`)
- Merges system instructions, attached document name, compressed context, past conversation turns (up to 10 recent messages), and the user's current question.

### Phase 6: Multi-LLM Router (`app/rag/generation/router.py`)
- Dispatches across:
  - **Anthropic Claude:** `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-opus`, `claude-3-5-haiku`.
  - **OpenAI:** `gpt-4o`, `gpt-4o-mini`.
  - **Google Gemini:** `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`.
- Resilient fallback logic when models are deprecated or keys are missing.

### Phase 7: Server-Sent Events (SSE) Streaming (`POST /api/v1/chat/stream`)
- Streams chunks in real time:
  - `data: {"type": "start", "thread_id": "...", "document_id": ...}`
  - `data: {"type": "token", "content": "word "}`
  - `data: {"type": "done", "message_id": 12, "thread_id": "..."}`
  - `data: {"type": "error", "error": "..."}` (on error)
