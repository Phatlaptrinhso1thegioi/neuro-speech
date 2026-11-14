#!/usr/bin/env bash
# scripts/setup.sh
# Sets up the NEURO-SPEECH environment and installs pinned dependencies.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=== NEURO-SPEECH Setup ==="
cd "$PROJECT_ROOT"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment in venv/..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Upgrading pip and installing pinned dependencies..."
pip install --upgrade pip
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
else
    pip install "numpy<2.0" "scipy>=1.10.0" "scikit-learn>=1.2.0" "pandas>=2.0.0" "mne>=1.5.0" "moabb>=1.0.0" "matplotlib>=3.7.0" "pytest>=7.4.0" "fastapi>=0.100.0" "uvicorn>=0.23.0" "pydantic>=2.0.0" "httpx>=0.24.0"
    pip freeze > requirements.txt
fi

echo "Running system health check..."
python3 scripts/health_check.py

echo "=== Setup complete! ==="
