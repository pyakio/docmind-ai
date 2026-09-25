# DocMind AI — Project Structure & Architecture Guide

This document is the definitive architectural map of the DocMind AI repository for core engineers, contributors, and new team members.

---

## 1. Final Project Tree

```
docmind-ai/
├── apps/
│   ├── frontend/                         # React 19 + Vite 8 SPA
│   │   ├── public/                       # Static public assets (favicons, SVGs)
│   │   ├── src/
│   │   │   ├── app/                      # App root component and providers
│   │   │   │   └── App.jsx
│   │   │   ├── api/                      # Central Axios API client with token interceptor
│   │   │   │   └── client.js
│   │   │   ├── components/               # Presentation & layout components (Navbar, Hero, Footer, Features, ChatPreview, ErrorBoundary, ProtectedRoute)
│   │   │   ├── features/                 # Domain-driven feature modules
│   │   │   │   ├── auth/                 # GoogleAccountModal, SocialLoginButtons, AuthContext, useAuth, authService
│   │   │   │   ├── chat/                 # ChatSidebar, Composer, MessageList, chatService
│   │   │   │   └── documents/            # documentService
│   │   │   ├── pages/                    # Route pages (Landing, Login, Register, ForgotPassword, Chat, Upload, NotFound)
│   │   │   ├── routes/                   # AppRoutes route definitions
│   │   │   ├── index.css                 # Tailwind design system
│   │   │   └── main.jsx                  # Application entry point
│   │   ├── package.json                  # Frontend dependencies and build scripts
│   │   ├── vite.config.js                # Vite build configuration
│   │   ├── index.html                    # Single-page application HTML entry
│   │   └── README.md
│   │
│   └── backend/                          # Python FastAPI Production Backend
│       ├── app/
│       │   ├── api/
│       │   │   └── v1/                   # Versioned HTTP Controllers
│       │   │       ├── router.py         # Aggregator router mounting all v1 routes
│       │   │       ├── auth.py           # Register, Login, Me, Forgot Password, Google OAuth
│       │   │       ├── documents.py      # Upload, Status Polling, Auto Summary, Deletion
│       │   │       ├── chat.py           # Models, Thread CRUD, SSE Stream, Sync Query
│       │   │       └── health.py         # System healthcheck and model status
│       │   ├── core/                     # Core cross-cutting infrastructure
│       │   │   ├── config.py             # Pydantic Settings & environment variables
│       │   │   ├── security.py           # Bcrypt password hashing & JWT token handling
│       │   │   └── logging.py            # Rotating file and stdout logger
│       │   ├── db/                       # Relational database layer
│       │   │   ├── database.py           # SQLAlchemy engine, SessionLocal, init_db()
│       │   │   └── models.py             # Declarative models (User, Document, ConversationThread, ChatMessage)
│       │   ├── schemas/                  # Pydantic validation schemas
│       │   │   ├── auth.py               # Auth request/response schemas
│       │   │   ├── chat.py               # Chat & thread request/response schemas
│       │   │   └── documents.py          # Document request/response schemas
│       │   ├── workers/                  # Background worker jobs
│       │   │   └── ingestion_worker.py   # Asynchronous document parsing, chunking, embedding & indexing
│       │   ├── rag/                      # Complete Decomposed RAG Lifecycle
│       │   │   ├── parsing/              # PDF, DOCX, TXT, and OCR Image text extraction
│       │   │   │   └── parser.py
│       │   │   ├── chunking/             # Semantic recursive splitting & metadata enrichment
│       │   │   │   └── chunker.py
│       │   │   ├── embeddings/           # Dense embeddings (OpenAI, Gemini, local ONNX)
│       │   │   │   └── service.py
│       │   │   ├── vectorstore/          # ChromaDB collection lifecycle & raw storage operations
│       │   │   │   └── chroma.py
│       │   │   ├── retrieval/            # Semantic candidate retrieval, score normalization, deduplication
│       │   │   │   └── retriever.py
│       │   │   ├── query/                # Query understanding, intent classification & rewriting
│       │   │   │   ├── analyzer.py
│       │   │   │   └── models.py
│       │   │   ├── prompts/              # System instructions, prompt templates & assembly
│       │   │   │   ├── builder.py
│       │   │   │   ├── system.py
│       │   │   │   ├── qa.py
│       │   │   │   ├── summary.py
│       │   │   │   └── ocr.py
│       │   │   ├── generation/           # Multi-LLM provider router (Claude, OpenAI, Gemini)
│       │   │   │   └── router.py
│       │   │   └── pipeline/             # RAG Engine orchestrating retrieval, compression, generation
│       │   │       └── engine.py
│       │   └── main.py                   # FastAPI Application factory
│       ├── tests/                        # Backend test suites
│       │   ├── conftest.py               # Test discovery and path configuration
│       │   ├── smoke/                    # Architecture import smoke test
│       │   │   └── test_smoke.py
│       │   ├── rag/                      # RAG and embedding quality tests
│       │   │   └── test_rag_quality.py
│       │   ├── api/                      # End-to-end and API flow verification
│       │   │   ├── verify_all_qa_pass.py
│       │   │   └── test_live_server.py
│       │   └── verify_flow.py            # Complete end-to-end API test suite
│       ├── requirements.txt              # Backend Python dependencies
│       ├── .env.example                  # Backend environment template
│       └── README.md
│
├── data/                                 # Data root (git-ignored runtime storage)
│   ├── uploads/                          # User uploaded documents
│   ├── chromadb/                         # ChromaDB persistent vector database
│   └── docmind.db                        # SQLite relational database
│
├── docs/                                 # Centralized Documentation
│   ├── architecture/
│   │   └── PROJECT_STRUCTURE.md          # Architecture and structural guidelines (this file)
│   ├── api/
│   │   └── API_REFERENCE.md              # REST and SSE API endpoint specifications
│   ├── rag/
│   │   └── RAG_PIPELINE.md               # RAG ingestion and retrieval lifecycle
│   ├── development/
│   │   └── GETTING_STARTED.md            # Local developer onboarding
│   └── engineering-journal.md            # Architectural decisions log
│
├── scripts/                              # Automation scripts
│   ├── run_backend.sh                    # Launch FastAPI development server
│   └── run_frontend.sh                   # Launch Vite frontend dev server
│
├── infra/                                # Infrastructure and deployment
│   └── docker/
│       ├── Dockerfile.backend            # Production backend container with OCR tools
│       ├── Dockerfile.frontend           # Multi-stage frontend container with Nginx
│       └── nginx.conf                    # Nginx reverse proxy configuration
│
├── .github/
│   └── workflows/
│       └── ci.yml                        # GitHub Actions CI workflow
│
├── .gitignore                            # Production-grade gitignore
├── README.md                             # Repository root documentation
└── docker-compose.yml                    # Multi-container local orchestration
```

---

## 2. Architecture Principles & Layer Separation

1. **API Layer (`app/api/v1/`):**
   Strictly handles HTTP request parsing, status codes, query parameter handling, and response delivery. Contains zero business logic, zero raw vector queries, and zero background worker tasks.

2. **Schemas Layer (`app/schemas/`):**
   Houses all Pydantic models for incoming request bodies and outgoing serialized responses. Decouples HTTP validation from ORM models.

3. **Core Layer (`app/core/`):**
   Contains cross-cutting configuration (`Settings`), security utilities (`bcrypt`, `JWT`), and centralized rotating logging.

4. **Database Layer (`app/db/`):**
   Manages SQLAlchemy engine, session lifecycle (`get_db` dependency), automatic table column migrations, and declarative ORM models (`User`, `Document`, `ConversationThread`, `ChatMessage`).

5. **Workers Layer (`app/workers/`):**
   Houses asynchronous jobs (such as `ingest_document_task`) dispatched via background tasks. Decouples long-running CPU/IO operations from synchronous request handlers.

6. **RAG Layer (`app/rag/`):**
   Logically separates every step of the RAG lifecycle:
   - `parsing/`: OCR and document extraction.
   - `chunking/`: Semantic text splitting.
   - `embeddings/`: Multi-provider vectorization.
   - `vectorstore/`: ChromaDB collection management and raw storage operations.
   - `retrieval/`: Semantic candidate retrieval, score normalization, deduplication.
   - `query/`: Intent classification and rewriting.
   - `prompts/`: Template management and prompt assembly.
   - `generation/`: Multi-LLM routing (Claude, OpenAI, Gemini) and SSE streaming.
   - `pipeline/`: End-to-end orchestration and context compression.

---

## 3. Data Flow Diagram

```
User Document Upload
       │
       ▼
HTTP Endpoint (app/api/v1/documents.py)
       │
       ▼ (spawns BackgroundTask)
Ingestion Worker (app/workers/ingestion_worker.py)
       ├── 1. Parser (app/rag/parsing/parser.py) ➔ Extract text with [Page N] tags
       ├── 2. Chunker (app/rag/chunking/chunker.py) ➔ Semantic LangChain chunks
       ├── 3. Embedder (app/rag/embeddings/service.py) ➔ Dense float vectors
       ├── 4. VectorStore (app/rag/vectorstore/chroma.py) ➔ ChromaDB insertion
       └── 5. Pipeline (app/rag/pipeline/engine.py) ➔ Auto-summary generation & DB update
```

```
User Chat Query
       │
       ▼
HTTP Endpoint (app/api/v1/chat.py: /stream or /query)
       │
       ▼
RAG Engine (app/rag/pipeline/engine.py)
       ├── 1. Query Analyzer (app/rag/query/analyzer.py) ➔ Normalize and classify intent
       ├── 2. VectorStore (app/rag/vectorstore/chroma.py) ➔ Top-K candidate search
       ├── 3. Deduplication & Filtering ➔ Remove near-duplicates
       ├── 4. Context Compressor ➔ Pack sentences up to token budget
       ├── 5. Prompt Builder (app/rag/prompts/builder.py) ➔ Context + History + Query
       └── 6. LLM Router (app/rag/generation/router.py) ➔ Stream tokens via SSE
```

---

## 4. Developer Extension Guide

### How to add a new API endpoint?
1. Define request/response schemas in `apps/backend/app/schemas/`.
2. Add router endpoints in `apps/backend/app/api/v1/<domain>.py`.
3. If creating a new domain, register the router in `apps/backend/app/api/v1/router.py`.

### How to add a new RAG Retriever or Search Strategy?
1. Add retrieval logic to `apps/backend/app/rag/vectorstore/chroma.py` or create a new retriever under `apps/backend/app/rag/retrieval/`.
2. Integrate the search strategy in `apps/backend/app/rag/pipeline/engine.py:query_document()`.

### How to add a new Embedding Provider?
1. Open `apps/backend/app/rag/embeddings/service.py`.
2. Add provider configuration check in `__init__()`.
3. Add provider call method in `_generate_batch_embeddings()`.
4. Add new model settings to `apps/backend/app/core/config.py`.

### How to add a new LLM Provider?
1. Open `apps/backend/app/rag/generation/router.py`.
2. Add the models to `AVAILABLE_MODELS` list.
3. Implement `_call_<provider>()` and `_stream_<provider>()` methods in `MultiLLMRouter`.
4. Add provider routing check in `_resolve_provider_and_model()`.

### How to add a new Frontend Feature or Page?
1. Create a directory under `apps/frontend/src/features/<feature_name>/` for co-located components and services.
2. If it's a top-level route view, add a page under `apps/frontend/src/pages/<PageName>/`.
3. Register the route in `apps/frontend/src/routes/AppRoutes.jsx`.

### How to add a new Test?
- RAG / Embedding tests: Add to `apps/backend/tests/rag/`.
- API / Flow tests: Add to `apps/backend/tests/api/`.
- Smoke / Import tests: Add to `apps/backend/tests/smoke/`.

### How to add a new Background Worker?
1. Define the worker function in `apps/backend/app/workers/`.
2. Dispatch via FastAPI `BackgroundTasks.add_task(...)` from your API router.
