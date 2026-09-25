#!/usr/bin/env bash
set -e

# Resolve repository root
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="${ROOT_DIR}/apps/frontend"

echo "=========================================="
echo "⚡ Starting DocMind AI React Frontend"
echo "=========================================="

cd "${FRONTEND_DIR}"
exec npm run dev
