# NEURO-SPEECH Operations Runbook

This guide contains end-to-end instructions for deploying, training, running, and troubleshooting the NEURO-SPEECH platform.

---

## 1. Prerequisites & Environment

- **Operating System**: macOS (tested on Darwin arm64), Linux (Ubuntu 22.04+), Windows 10/11 with PowerShell 7+.
- **Python**: Python 3.9 to 3.11 with `pip` and `venv`.
- **Node.js**: Node.js 20 LTS or 22 LTS with `npm`.
- **Optional**: Docker & Docker Compose v2.0+ (for containerized deployment).

---

## 2. Quickstart Installation

### 2.1 macOS / Linux
```bash
# 1. Clone or navigate to the repository
cd ~/Downloads/NEURO-SPEECH

# 2. Run the automated setup script
bash scripts/setup.sh

# 3. Initialize & seed the SQLite database with demo accounts
source venv/bin/activate
python3 scripts/seed_db.py

# 4. Install frontend dependencies
cd apps/web && npm install && cd ../..
```

### 2.2 Windows (PowerShell)
```powershell
# Open PowerShell as Administrator or regular user and navigate to root:
Set-Location -Path ~/Downloads/NEURO-SPEECH

# Run setup script
.\scripts\setup.ps1
```

### 2.3 Docker Compose (Production-like Deployment)
```bash
# Build and launch all containers bound strictly to 127.0.0.1
docker-compose up --build -d

# Check service status and health check
docker-compose ps
```
The Web UI will be accessible at `http://127.0.0.1:3000` and the Backend API at `http://127.0.0.1:8000`.

---

## 3. Pre-Seeded Demo Accounts & RBAC

The system includes pre-seeded demo accounts with role-based access control (RBAC):

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@neuro-speech.local` | `Admin@12345` | Full administrative rights, user management, audit logs, patient deletion, model activation. |
| **Researcher** | `researcher@neuro-speech.local` | `Researcher@12345` | Patient CRUD (cannot delete), BCI model training, model checkpoint uploads, audit view. |
| **Caregiver** | `caregiver@neuro-speech.local` | `Caregiver@12345` | Patient view/edit, Neural Speller, Survival phrases (F1–F4), Staff Override buttons. Cannot trigger training or delete patients. |

---

## 4. Dataset Download & Verification

NEURO-SPEECH operates on the **BNCI 2014-009** P300 Speller dataset as its verified Dataset of Record (Branch a: continuous EEG, per-flash row/column event codes Gr1–Gr12).

```bash
source venv/bin/activate

# Inspect dataset candidates in order
python3 scripts/inspect_dataset.py

# Download Subject 1 (under the 250MB limit)
python3 scripts/download_p300_dataset.py --subject 1 --max-size-mb 250
```

Dataset files land in `datasets/raw/bnci2014_009/` with cryptographic provenance recorded in `datasets/metadata/`.

---

## 5. Model Training & Evaluation

### 5.1 Shrinkage LDA Baseline (Operational Model)
Train the regularized LDA baseline on Sessions 0 & 1 and evaluate on held-out Session 2:
```bash
python3 scripts/train_p300.py
```
This produces:
- `models/checkpoints/p300_lda_baseline.pkl`
- `models/checkpoints/p300_lda_baseline.json`
- `models/checkpoints/grand_average_pz.png`

Evaluate the model independently on the held-out split:
```bash
python3 scripts/evaluate_p300.py
```

### 5.2 PyTorch CNN-Transformer Decoder (Optional M5)
Train the deep learning model featuring spatial conv, temporal conv, and Transformer self-attention:
```bash
python3 scripts/train_nn.py
```
Produces `models/checkpoints/nn_p300.pt` and `models/checkpoints/nn_p300.json`.

---

## 6. Running the Application

### 6.1 Local Development Mode
In Terminal 1 (Backend API):
```bash
source venv/bin/activate
uvicorn apps.api.app.main:app --host 127.0.0.1 --port 8000 --reload
```

In Terminal 2 (Frontend React App):
```bash
cd apps/web
npm run dev
```

### 6.2 Windows Execution Script
```powershell
# Launches both backend and frontend concurrently
.\scripts\run.ps1
```

---

## 7. Replay Engine & Demos

NEURO-SPEECH includes autonomous CLI replay and speller demonstrations:

### 7.1 Replay Engine Demo (M2a)
Streams held-out Session 2 continuous EEG, performs online causal SOS filtering with carried state, extracts stimulus-locked epochs, decodes characters, and measures real inference latencies:
```bash
python3 scripts/demo_m2a_replay.py
```

### 7.2 Neural Speller & Vietnamese Telex Demo (M2b)
Demonstrates the Speller state machine, Telex parsing with traditional tone placement (`hòa`), offline word prediction, and high-stakes two-step commit:
```bash
python3 scripts/demo_m2b_speller.py
```

---

## 8. Verification & Test Suites

Run all automated unit, integration, and property-based tests:

```bash
# Backend test suite (73 pytest tests)
source venv/bin/activate
pytest -v tests/

# Frontend test suite (15 Vitest tests)
cd apps/web && npm test

# System comprehensive health check
python3 scripts/health_check.py
```

---

## 9. Troubleshooting & Diagnostics

### 9.1 Database Locked (`sqlite3.OperationalError: database is locked`)
- **Cause**: Concurrent access during heavy parallel tests.
- **Resolution**: SQLite is configured in WAL (Write-Ahead Logging) mode with `timeout=30.0` and `PRAGMA busy_timeout = 30000`. If locks persist, restart the backend server or re-run `python3 scripts/seed_db.py`.

### 9.2 Scrubber Artifacts during Timeline Seek
- **Cause**: Seeking to a new timepoint without filter history creates step discontinuity.
- **Resolution**: The replay engine automatically performs a 2.0-second historical warm-up pass using `sosfilt` before broadcasting frames to the client.

### 9.3 Audio Chime or TTS Inaudible
- **Cause**: Modern web browsers require user gesture interaction before allowing Web Audio API or SpeechSynthesis to play sound.
- **Resolution**: Click anywhere in the UI (e.g. click "Start Replay" or any button) to initialize the browser's `AudioContext`.
