#!/usr/bin/env bash
set -e

# Resolve repository root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/apps/backend"

echo "=========================================="
echo "🚀 Starting DocMind AI FastAPI Backend"
echo "=========================================="

cd "${BACKEND_DIR}"

# Activate virtualenv if present
if [ -d "${BACKEND_DIR}/venv" ]; then
    source "${BACKEND_DIR}/venv/bin/activate"
elif [ -d "${ROOT_DIR}/backend/venv" ]; then
    source "${ROOT_DIR}/backend/venv/bin/activate"
fi

export PYTHONPATH="${BACKEND_DIR}:${PYTHONPATH}"

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
