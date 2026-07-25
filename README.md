# DocMind AI - Intelligent Document Assistant

**DocMind AI** is an advanced, production-grade AI-powered document intelligence assistant built with **React, Vite, Python FastAPI, LangChain, ChromaDB, and Google Gemini 1.5 Flash**.

Designed with a sleek dark aesthetic combining **ChatGPT, Notion, and Linear**, DocMind AI enables instant automatic document summarization upon upload and human-expert conversational Q&A with exact page-level source citations.

---

## ✨ Key Features

- 🚀 **Instant Auto-Summarization**: Upload any PDF, DOCX, TXT, or Image (PNG, JPG, WEBP) and DocMind AI automatically indexes, extracts, and generates a structured summary without needing a prompt.
- 💬 **Human-Expert Conversational Q&A**: Answers questions naturally in simple, clear English — exactly like ChatGPT and Google Gemini.
- 📄 **Page-Level Citations**: Every document answer concludes with a clean source citation: `(Source: filename.pdf, Page 2)` or `(Source: filename.pdf, Pages 3 and 4)`.
- ⚡ **Sub-Second Search Caching**: In-memory vector query caching for fast, responsive answers.
- 🎨 **ChatGPT + Notion + Linear Aesthetics**: Ultra-minimal dark mode UI featuring rounded containers, smooth micro-animations, glassmorphism backdrop blurs, action toolbars (Copy, Retry, Feedback), and drag-and-drop uploads.
- 🔒 **Zero Debug Noise**: Technical metadata (RAG, Vector Search, Chunks, Embeddings, OCR, Confidence scores) is kept under the hood and never exposed to users.

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 19 with Vite 8
- **Styling**: Tailwind CSS with custom glassmorphism, glowing accents, and dark theme
- **Animations**: Framer Motion
- **Icons**: React Icons (`react-icons/fi`, `react-icons/hi2`)

### Backend
- **Framework**: Python FastAPI (Uvicorn async server)
- **Vector Database**: ChromaDB (Cosine similarity vector store)
- **LLM Routing**: Google Gemini 1.5 Flash with fallback logic
- **Document Chunking & OCR**: LangChain `RecursiveCharacterTextSplitter`, PyPDF, python-docx, Pillow, and Pytesseract OCR
- **Authentication & Database**: FastAPI JWT Auth, SQLAlchemy, and SQLite

---

## 📁 Repository Structure

```
docmind-ai/
├── backend/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── api/              # API endpoints (chat, documents, auth)
│   │   ├── core/             # Configuration & security settings
│   │   ├── db/               # SQLAlchemy models & database connection
│   │   └── services/         # RAG engine, LLM router, chunker, vector store
│   ├── data/                 # File upload storage & ChromaDB data
│   └── main.py               # FastAPI application entry point
├── public/                   # Public static assets
├── src/                      # React Frontend Source
│   ├── components/           # UI components (auth modals, error boundaries)
│   ├── context/              # React Auth Context & hooks
│   ├── pages/                # Landing & Chat pages
│   ├── services/             # Axios API client services
│   ├── main.jsx              # React app entry point
│   └── index.css             # Tailwind & design system CSS
├── package.json              # Frontend npm package manifest
└── README.md                 # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.10+)

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
# In the project root directory
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start using **DocMind AI**.

---

## 📄 License
MIT License. Created for production-grade document intelligence.
