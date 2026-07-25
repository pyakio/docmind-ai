# DocMind AI - Python FastAPI Backend

FastAPI backend for **DocMind AI**, providing secure authentication with password hashing, document chunking, vector storage via **ChromaDB**, OpenAI `text-embedding-3-large` embeddings, and a multi-model RAG engine supporting **ChatGPT (OpenAI)**, **Google Gemini**, and **Llama 3 (Meta)**.

---

## Features Overview

1. **Password Hashing & Authentication**:
   - Secure user registration and login endpoints.
   - Password hashing powered by `passlib` with `bcrypt`.
   - JWT (JSON Web Token) bearer authorization.

2. **Document Ingestion & Chunking**:
   - Supports `.pdf`, `.docx`, `.doc`, `.txt`, and `.md` file formats.
   - Text extraction and LangChain `RecursiveCharacterTextSplitter`.

3. **Vector Database (ChromaDB)**:
   - Persistent vector storage powered by `chromadb`.
   - Cosine similarity search for top-k document context retrieval.

4. **Embeddings Engine**:
   - OpenAI `text-embedding-3-large` (3072 dimensions) for semantic embeddings.

5. **Multi-LLM RAG Engine**:
   - Dynamically switch model providers on query:
     - **ChatGPT**: OpenAI `gpt-4o` / `gpt-4o-mini`
     - **Google Gemini**: `gemini-1.5-flash` / `gemini-1.5-pro`
     - **Llama**: Local Ollama `llama3` / `llama3.1`

---

## Directory Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── auth.py         # /api/v1/auth - Register, Login, Me
│   │   ├── documents.py    # /api/v1/documents - Upload, Index, Delete
│   │   ├── chat.py         # /api/v1/chat - Multi-LLM RAG Query
│   │   └── health.py       # /api/v1/health - Service Health Check
│   ├── core/
│   │   ├── config.py       # Pydantic Settings & Env vars
│   │   └── security.py     # Bcrypt Password Hashing & JWT Utils
│   ├── db/
│   │   ├── database.py     # SQLAlchemy Engine & Session
│   │   └── models.py       # User, Document, ChatMessage DB Models
│   ├── services/
│   │   ├── chunker.py      # LangChain Document Text Splitter
│   │   ├── embedding.py    # OpenAI text-embedding-3-large Service
│   │   ├── vector_store.py # ChromaDB Vector Collection Manager
│   │   ├── llm_router.py   # ChatGPT, Gemini & Llama Router
│   │   └── rag_engine.py   # Retrieval-Augmented Generation Pipeline
│   └── main.py             # FastAPI App Entrypoint
├── data/                   # DB storage & ChromaDB data directory
├── requirements.txt        # Python Dependencies
├── .env.example            # Environment variables template
└── README.md
```

---

## Quick Start & Setup

### 1. Create Python Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate   # On Windows
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env` and set your API keys:

```bash
cp .env.example .env
```

Edit `.env`:
```env
OPENAI_API_KEY="sk-..."
GEMINI_API_KEY="AIza..."
OLLAMA_BASE_URL="http://localhost:11434"
```

### 4. Run the Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at:
- **API Root**: `http://localhost:8000/`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## API Endpoint Reference

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` - Create user account (returns JWT token & hashes password with bcrypt)
- `POST /api/v1/auth/login` - Authenticate user credentials
- `GET /api/v1/auth/me` - Get current user profile

### Documents & Vectors (`/api/v1/documents`)
- `POST /api/v1/documents/upload` - Upload PDF/DOCX/TXT document, chunk with LangChain, and store vectors in ChromaDB
- `GET /api/v1/documents` - List all uploaded user documents
- `DELETE /api/v1/documents/{id}` - Delete document and purge its ChromaDB vectors

### Multi-LLM RAG Chat (`/api/v1/chat`)
- `POST /api/v1/chat/query` - Perform RAG query against ChromaDB vectors. Body params:
  ```json
  {
    "document_id": 1,
    "question": "What are the main findings in this document?",
    "model_provider": "chatgpt", // Options: 'chatgpt', 'gemini', 'llama'
    "model_name": "gpt-4o"      // Options: 'gpt-4o', 'gemini-1.5-flash', 'llama3'
  }
  ```
- `GET /api/v1/chat/history` - Retrieve query history
