#!/usr/bin/env bash
set -euo pipefail

echo "Emory local setup (macOS/Linux)"
echo "This script installs dependencies and starts backend/frontend in separate terminals."

REPO_URL="https://github.com/keerthana9944/Emory.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BACKEND_PATH="$PROJECT_ROOT/backend"
FRONTEND_PATH="$PROJECT_ROOT/frontend"

if [[ ! -d "$BACKEND_PATH" || ! -d "$FRONTEND_PATH" ]]; then
  PROJECT_ROOT="$(pwd)/Emory"
  if [[ ! -d "$PROJECT_ROOT" ]]; then
    echo "Project not found nearby. Cloning repository..."
    git clone "$REPO_URL" "$PROJECT_ROOT"
  fi

  BACKEND_PATH="$PROJECT_ROOT/backend"
  FRONTEND_PATH="$PROJECT_ROOT/frontend"

  if [[ ! -d "$BACKEND_PATH" || ! -d "$FRONTEND_PATH" ]]; then
    echo "Could not locate backend/frontend after clone."
    exit 1
  fi
fi

echo "Checking backend prerequisites..."
echo "This project now uses an OpenAI-compatible hosted API for the backend."
echo "Make sure your backend env has AI_PROVIDER, AI_API_KEY, AI_BASE_URL, and MODEL set."

echo "Installing backend dependencies..."
cd "$BACKEND_PATH"
npm install

echo "Installing frontend dependencies..."
cd "$FRONTEND_PATH"
npm install

echo "Starting backend..."
(cd "$BACKEND_PATH" && npm start) &

sleep 1

echo "Starting frontend..."
(cd "$FRONTEND_PATH" && npm run dev) &

echo "Done. Open http://localhost:5173"
wait
