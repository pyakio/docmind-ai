# 🧠 DocMind AI — Enterprise Conversational Document Intelligence

DocMind AI is a production-grade Document Question-Answering application powered by Retrieval-Augmented Generation (RAG). It enables users to upload complex documents (PDFs, Word documents, text files, and images), automatically extract and index their contents with high-dimensional dense embeddings, and ask questions through a real-time conversational interface with sub-second token streaming and page-level source citations.

---

## ✨ Key Features

- 💬 **Human-Grade Conversational Q&A**: Answers questions naturally in simple, clear English with contextual multi-turn conversation memory.
- 📄 **Page-Level Citations**: Every claim grounded in an uploaded document cites its exact page origin: `(Source: contract.pdf, Page 4)`.
- ⚡ **Sub-Second Vector Search Caching**: In-memory query caching and candidate diversity filtering across ChromaDB vector collections.
- 🔀 **Multi-LLM Routing**: Dynamic dispatch across **Anthropic Claude** (`claude-3-7-sonnet`, `claude-3-5-sonnet`), **OpenAI** (`gpt-4o`, `gpt-4o-mini`), and **Google Gemini** (`gemini-1.5-flash`, `gemini-1.5-pro`).
- 🧩 **Resilient Hybrid Embeddings**: Seamless generation with OpenAI `text-embedding-3-large`, Google Gemini `text-embedding-004`, or local offline ONNX `all-MiniLM-L6-v2`.
- 📊 **Automated Executive Summaries**: Immediate synthesis of concise 2–3 paragraph executive summaries upon document upload.
- 🎨 **Modern Minimalist UI**: ChatGPT + Linear dark-mode aesthetic with smooth animations, action toolbars, and responsive sidebars.

---

## 🏗️ Architecture Overview

The repository is structured as a production-grade monorepo cleanly isolating frontend, backend, data, and infrastructure:

```
docmind-ai/
├── apps/
│   ├── frontend/             # React 19 + Vite 8 SPA (Tailwind CSS, Framer Motion)
│   └── backend/              # Python FastAPI Server (SQLAlchemy, ChromaDB, LangChain)
├── data/                     # Shared runtime data storage (git-ignored)
│   ├── uploads/              # Uploaded user documents
│   ├── chromadb/             # ChromaDB persistent vector index
│   └── docmind.db            # SQLite relational database
├── docs/                     # Architectural and API documentation
│   ├── architecture/         # Project structure & design principles
│   ├── api/                  # REST & SSE API reference
│   ├── rag/                  # RAG ingestion and retrieval lifecycle
│   ├── development/          # Local setup & developer guides
│   └── engineering-journal.md# Engineering decision logs
├── scripts/                  # Development automation scripts
│   ├── run_backend.sh        # Starts FastAPI backend with venv & reload
│   └── run_frontend.sh       # Starts React Vite frontend dev server
├── infra/                    # Deployment & containerization
│   └── docker/               # Dockerfiles & Nginx reverse proxy configuration
├── .github/                  # CI/CD Workflows
│   └── workflows/ci.yml      # Automated build & test pipeline
├── docker-compose.yml        # Multi-container orchestration
└── README.md
```

---

## 🔄 RAG Pipeline Flow

```
DOCUMENT INGESTION
   Upload (PDF / DOCX / TXT / Image)
      ↓
   Parsing & OCR (apps/backend/app/rag/parsing)
      ↓
   Cleaning & Normalization (Hyphen repair, header stripping)
      ↓
   Semantic Chunking (apps/backend/app/rag/chunking)
      ↓
   Dense Embedding (apps/backend/app/rag/embeddings)
      ↓
   Vector Storage (apps/backend/app/rag/vectorstore)
      ↓
   Auto-Summary Generation (apps/backend/app/rag/pipeline)

CONVERSATIONAL RETRIEVAL & GENERATION
   User Query
      ↓
   Query Understanding & Intent (apps/backend/app/rag/query)
      ↓
   Similarity Search & Over-fetching (apps/backend/app/rag/vectorstore)
      ↓
   Diversity Filtering & Deduplication (apps/backend/app/rag/pipeline)
      ↓
   Token-Bounded Context Compression (Sentence boundary preserved)
      ↓
   Prompt Synthesis (apps/backend/app/rag/prompts)
      ↓
   Multi-LLM Routing (apps/backend/app/rag/generation)
      ↓
   Real-Time Server-Sent Events (SSE) Token Stream
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 8, Tailwind CSS, Framer Motion, Axios, React Icons, React Router 7 |
| **Backend API** | FastAPI, Uvicorn, Pydantic v2, Pydantic-Settings |
| **Database & Auth** | SQLAlchemy 2.0, SQLite, Passlib (Bcrypt), Python-Jose (JWT) |
| **Vector DB** | ChromaDB (Cosine similarity vector space) |
| **RAG & Chunking** | LangChain RecursiveCharacterTextSplitter, PyPDF, python-docx, Pillow, Pytesseract |
| **Embedding Models**| OpenAI `text-embedding-3-large`, Gemini `text-embedding-004`, ChromaDB ONNX `all-MiniLM-L6-v2` |
| **LLM Providers** | Anthropic Claude SDK, OpenAI SDK, Google Generative AI |
| **DevOps & Infra** | Docker, Docker Compose, Nginx, GitHub Actions |

---

## 🚀 Getting Started

### 1. Quick Start via Development Scripts

```bash
# Terminal 1: Launch Backend API (port 8000)
./scripts/development/run_backend.sh

# Terminal 2: Launch Frontend (port 5173)
./scripts/development/run_frontend.sh
```

### 2. Manual Setup

#### Backend Setup
```bash
cd apps/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Configure your ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup
```bash
cd apps/frontend
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173).

---

## 🧪 Testing & Verification

```bash
# 1. Run Backend End-to-End Flow Test
PYTHONPATH=apps/backend apps/backend/venv/bin/python apps/backend/tests/verify_flow.py

# 2. Run RAG Embedding & Quality Verification
PYTHONPATH=apps/backend apps/backend/venv/bin/python apps/backend/tests/rag/test_rag_quality.py

# 3. Run Repository Smoke Tests
apps/backend/venv/bin/python apps/backend/tests/smoke/test_smoke.py

# 4. Run Frontend Production Build & Linting
cd apps/frontend && npm run lint && npm run build
```

---

## 🐳 Docker Orchestration

Run the entire platform with a single command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger Documentation: `http://localhost:8000/docs`

---

## 📖 Documentation Index
- [Architecture & Structural Guide](docs/architecture/PROJECT_STRUCTURE.md)
- [RAG Ingestion & Query Deep Dive](docs/rag/RAG_PIPELINE.md)
- [REST & Streaming API Reference](docs/api/API_REFERENCE.md)
- [Local Development Onboarding](docs/development/GETTING_STARTED.md)
- [Engineering Journal & Decisions](docs/engineering-journal.md)

---

## 📄 License
MIT License. Created for production-grade document intelligence.
