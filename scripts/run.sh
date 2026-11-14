#!/usr/bin/env bash
# ==============================================================================
# NEURO-SPEECH — Unified Server Launcher
# Launches both FastAPI Backend (port 8000) and Vite Web Frontend (port 3000)
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "============================================================"
echo "      NEURO-SPEECH — Research-Grade BCI Platform"
echo "============================================================"

# Check Python venv
if [ ! -d "venv" ]; then
    echo "[!] Virtual environment 'venv' not found. Creating..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check Node modules
if [ ! -d "apps/web/node_modules" ]; then
    echo "[!] Node modules not found. Installing..."
    (cd apps/web && npm install)
fi

# Clean up any lingering processes on ports 8000 and 3000
echo "[*] Ensuring ports 8000 and 3000 are free..."
PIDS_8000=$(lsof -ti :8000 2>/dev/null || true)
if [ -n "$PIDS_8000" ]; then
    echo "    Stopping lingering process on port 8000 (PIDs: $PIDS_8000)..."
    kill -9 $PIDS_8000 2>/dev/null || true
fi

PIDS_3000=$(lsof -ti :3000 2>/dev/null || true)
if [ -n "$PIDS_3000" ]; then
    echo "    Stopping lingering process on port 3000 (PIDs: $PIDS_3000)..."
    kill -9 $PIDS_3000 2>/dev/null || true
fi

# Cleanup function on script exit
cleanup() {
    echo ""
    echo "[*] Shutting down NEURO-SPEECH services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    wait "$BACKEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
    echo "[✓] All services stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# Start Backend
echo "[*] Starting FastAPI Backend on http://0.0.0.0:8000..."
uvicorn apps.api.app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "[*] Waiting for Backend to be ready..."
RETRIES=15
while [ $RETRIES -gt 0 ]; do
    if curl -s http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1; then
        echo "    [✓] Backend is ready and responding at http://127.0.0.1:8000"
        break
    fi
    sleep 1
    RETRIES=$((RETRIES - 1))
done

if [ $RETRIES -eq 0 ]; then
    echo "    [✗] Timed out waiting for Backend."
    exit 1
fi

# Start Frontend
echo "[*] Starting Vite Dev Server on http://0.0.0.0:3000..."
(cd apps/web && npm run dev -- --host 0.0.0.0 --port 3000) &
FRONTEND_PID=$!

# Wait for frontend to be ready
sleep 2

echo ""
echo "============================================================"
echo "    🚀 NEURO-SPEECH IS RUNNING!"
echo "============================================================"
echo "  👉 Web Application:     http://localhost:3000"
echo "  👉 Fallback IP:         http://127.0.0.1:3000"
echo "  👉 Interactive API Docs: http://localhost:8000/docs"
echo ""
echo "  Demo Accounts:"
echo "    • Admin:      admin      / Admin@12345"
echo "    • Researcher: researcher / Researcher@12345"
echo "    • Caregiver:  caregiver  / Caregiver@12345"
echo "============================================================"
echo "Press Ctrl+C to stop all servers."
echo ""

# Wait for either process to exit
wait -n $BACKEND_PID $FRONTEND_PID || true
