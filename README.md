# NEURO-SPEECH — Non-Invasive BCI System

Research & Assistive-Technology Prototype — Not a certified medical diagnostic device.

NEURO-SPEECH is an assistive-communication research prototype designed for people with severe motor and speech impairments:
**EEG signal → P300 detection → Character decoding → Vietnamese Telex buffer and word suggestions → Explicit user confirmation → Text-to-speech.**

## Core Architecture
- **Layer 1 (Neural Decoder)**: Causal SOS continuous filtering, stimulus-locked epoching (-100 to +800 ms), Shrinkage Linear Discriminant Analysis (LDA) with temporal decimation.
- **Layer 2 (Language Prediction)**: Offline Vietnamese Telex composition and word suggestions (strictly separated from Layer 1, never edits raw decodes without explicit user confirmation).
- **Two Operating Modes**:
  - *Neural Writing Studio*: Row/column matrix speller with streaming epoch decoding and suggestion commits.
  - *Quick Survival Communication*: High-contrast emergency phrases (F1–F4) with two-step commit.

## Milestone Status
- [x] **M1**: Dataset reality check, causal preprocessing, and Shrinkage LDA baseline.
- [x] **M2a**: Replay engine and streaming decode (WebSocket & REST).
- [x] **M2b**: Speller logic, Vietnamese Telex, and offline word suggestions.
- [x] **M3**: Frontend application (Tabs 1 & 2: Monitoring & Neural Speller).
- [x] **M4**: Role-based authentication, patient records, survival communication, model management, and API security.
- [ ] **M5**: PyTorch CNN-Transformer decoder & Docker Compose.
- [ ] **M6**: Complete Frontend & Product Experience.

## Pre-Seeded Demo Accounts (M4)
| Role | Username | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin@neuro-speech.local` | `Admin@12345` | Full system control, user management, audit logs, model activation |
| **Researcher** | `researcher` | `researcher@neuro-speech.local` | `Researcher@12345` | Patients CRUD, model training/upload, replay telemetry, audit logs |
| **Caregiver** | `caregiver` | `caregiver@neuro-speech.local` | `Caregiver@12345` | Patient view/edit, Survival communication, Neural speller, staff override |

## Getting Started
```bash
# 1. Setup virtual environment and pinned dependencies
bash scripts/setup.sh

# 2. Inspect candidate datasets
source venv/bin/activate
python3 scripts/inspect_dataset.py

# 3. Train LDA baseline model
python3 scripts/train_p300.py

# 4. Evaluate strictly on held-out test split
python3 scripts/evaluate_p300.py

# 5. Run test suite
pytest -v tests/
```
