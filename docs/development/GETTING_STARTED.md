# DocMind AI — Getting Started & Developer Guide

## Prerequisites
- Node.js (v18+ or v20+) & npm
- Python (v3.10, v3.11, or v3.12+)
- Tesseract OCR (optional, for image OCR)

---

## 1. Quick Start with Helper Scripts

```bash
# Terminal 1: Backend
./scripts/development/run_backend.sh

# Terminal 2: Frontend
./scripts/development/run_frontend.sh
```

---

## 2. Manual Local Setup

### Backend Setup (`apps/backend`)
```bash
cd apps/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY, OPENAI_API_KEY, or GEMINI_API_KEY

# Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup (`apps/frontend`)
```bash
cd apps/frontend

# Install packages
npm install

# Start Vite dev server
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) in your browser.

---

## 3. Running Verification Tests

```bash
# Run End-to-End flow verification
PYTHONPATH=apps/backend apps/backend/venv/bin/python apps/backend/tests/verify_flow.py

# Run RAG quality & embedding verification
PYTHONPATH=apps/backend apps/backend/venv/bin/python apps/backend/tests/rag/test_rag_quality.py

# Run smoke test
apps/backend/venv/bin/python apps/backend/tests/smoke/test_smoke.py

# Run Frontend production build
cd apps/frontend && npm run build
```

---

## 4. Docker Deployment

```bash
docker-compose up --build
```
Backend will be available on `http://localhost:8000`, frontend on `http://localhost:3000`.
