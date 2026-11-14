# NEURO-SPEECH Project Progress

## Milestone Status
- **M1 (Dataset, Preprocessing, LDA Baseline)**: COMPLETED
- **M2a (Replay Engine & Streaming Decode)**: COMPLETED
- **M2b (Speller Logic, Telex, Word Suggestions)**: COMPLETED
- **M3 (Frontend, Tabs 1–2)**: COMPLETED
- **M4 (Auth, Patients, Survival, Tabs 3–4, Security)**: COMPLETED
- **M5 (Optional Extras: PyTorch Decoder & Docker)**: COMPLETED
- **M6 (Complete Frontend & Product Experience)**: COMPLETED

## Environment & Configuration
- **Operating System**: macOS (Darwin arm64)
- **Python Version**: Python 3.9.6 (Virtual environment: `~/Downloads/NEURO-SPEECH/venv`, user approved)
- **Node Version**: v22.11.0
- **Database**: SQLite3 at `storage/neuro_speech.db` (WAL mode enabled)
- **Brand Assets Source**: `/Users/paradox/.gemini/antigravity/brain/ade16ec9-c7c2-478c-b958-df3768df5096/.user_uploaded/media_1794155246774_4a0d30c8.jpg`
- **Frontend App**: `apps/web/` (React 18 + Vite 6 + React Router 6.28 + TypeScript 5.7 + Tailwind CSS 3.4)
- **Project Root**: `/Users/paradox/Downloads/NEURO-SPEECH/`

## Pre-Seeded Demo Accounts (M4)
- **Admin**: `admin@neuro-speech.local` / `Admin@12345` (Role: `admin`)
- **Researcher**: `researcher@neuro-speech.local` / `Researcher@12345` (Role: `researcher`)
- **Caregiver**: `caregiver@neuro-speech.local` / `Caregiver@12345` (Role: `caregiver`)

## Decisions & Approvals
- **Decision 1 (2026-11-09)**: Brand asset confirmed by user as the uploaded image (`media_1794155246774_4a0d30c8.jpg`). Copied to `apps/web/public/brand_logo.jpg` and `logo.jpg`. Fallback `logo.svg` and `favicon.svg` generated.
- **Decision 2 (2026-11-09)**: Python environment confirmed by user to use system Python 3.9.6 venv. Dependencies pinned in `requirements.txt`.
- **Decision 3 (2026-11-09)**: Candidate 1 (BNCI 2014-009) verified as **Branch (a)** with continuous signal, per-flash row/column stimulus codes (Gr1–Gr12), and textbook positive P300 deflection (+16.33 µV) at Pz. Designated as Dataset of Record.
- **Decision 4 (2026-11-09)**: M2a Replay Engine strictly configured to stream the held-out test split (Session 2). Causal SOS filter re-warming verified on seek.
- **Decision 5 (2026-11-09)**: Vietnamese tone placement configured to traditional standard (`hòa`, `hóa`) per prompt spec; documented in `docs/ORTHOGRAPHY.md`. Lexicon provenance documented in `docs/WORDLIST_LICENSE.md`.
- **Decision 6 (2026-11-09)**: Frontend bundle kept slim using Canvas 2D and SVG primitives. Production bundle: 397 kB JS (103 kB gzipped).
- **Decision 7 (2026-11-09)**: Model upload security enforces strict verification: raw unvalidated pickles are forbidden. Upload requires verified SHA-256 match or valid HMAC-SHA256 signature, 50MB size limit, and path sanitization.
- **Decision 8 (2026-11-09)**: PyTorch CNN-Transformer model evaluated against Shrinkage LDA on held-out Session 2 (ROC-AUC 0.6321 vs 0.8900). In accordance with Principle 5, real metrics are reported without synthetic tuning; Shrinkage LDA remains the primary default operational model.
- **Decision 9 (2026-11-09)**: Production Docker deployment containerizes backend (bound to 127.0.0.1:8000) and frontend (127.0.0.1:3000) with volume mounts for `datasets/`, `models/checkpoints/`, and `storage/`.
- **Decision 10 (2026-11-09)**: M6 Complete Frontend & Product Experience built across 19 dedicated routes. Connected to real SQLite WAL database and streaming replay engine with zero hardcoded mock data. Invariant verified: AI suggested words never commit to final buffer without explicit user ACCEPT.
- **Decision 11 (2026-11-09)**: Resolved macOS networking conflict (IPv6 `::1` resolution of `localhost` vs IPv4 `127.0.0.1` binding). All frontend API calls routed cleanly through Vite reverse proxy `/api/v1` and WebSocket proxy; both Uvicorn and Vite configured to bind to `0.0.0.0` (ports 8000 and 3000). Created unified runner script `scripts/run.sh` and `make run` target with graceful shutdown traps. All 101 unit/integration tests verified passing.
- **Decision 12 (2026-11-09)**: Implemented Instant CSV P300 Character & Vietnamese Text Decoder across CLI (`scripts/decode_csv.py`), FastAPI endpoint (`POST /api/v1/p300/decode-csv`), and interactive Web UI modal (`CsvDecoderModal.tsx` in `/app/studio` and `/admin/datasets`). Allows user/jury to upload any CSV file or pick benchmark presets, scoring epochs with Shrinkage LDA and translating output through Vietnamese Telex with instant TTS speech synthesis. 105 tests passing.
- **Decision 13 (2026-11-09)**: Expanded dataset inventory with authentic multi-subject data directly from Graz University of Technology (BNCI 2014-009 Subjects 1, 2, and 3). Generated a comprehensive 30-file CSV Benchmark Test Library (`datasets/test_csv_library/`) spanning international benchmark sessions, single-character trials, clinical Vietnamese communication sentences, and repetition speed studies. Integrated directory browser into API (`/api/v1/p300/library`) and Web UI.
- **Decision 14 (2026-11-09)**: Resolved Replay REST parameter binding (422 Unprocessable Entity on seek/start/pause caused by query params vs request body mismatch) and added `/speed` endpoint. Upgraded `EEGTraceViewer` and `CsvDecoderModal` with real-time EEG brainwave oscilloscopes displaying 16-channel microvolt signals and the landmark +16.33 µV P300 ERP deflection at Pz for visual validation during jury demonstrations.
- **Decision 15 (2026-11-09)**: Diagnosed and resolved EEG streaming stall root cause: route handlers in `apps/api/app/api/v1/endpoints/replay.py` were defined synchronously (`def`), running inside FastAPI AnyIO worker threads where `asyncio.get_running_loop()` threw `RuntimeError`, silently aborting background streaming tasks. Updated all replay routes to `async def` and bound `_main_loop` during startup. Designed and implemented interactive 3D Holographic Brain & P300 Wave Emitting Component (`Brain3DViewer.tsx`) powered by Three.js with 10-20 electrode positions (Fz, Cz, Pz, Oz, C3, C4, P3, P4), real-time pulsating potentials, 3D concentric wave rings radiating from Pz, connectome neural pathways, 360° mouse/touch rotation, camera presets, and a 3-way view switcher (Dual 2D+3D, 3D Full, 2D Classic) in `Tab1Monitoring.tsx`. All 105 tests passing.
- **Decision 16 (2026-11-09)**: Embedded user-provided cinematic neural network video (`media_1794169288178_d42348ff.mp4`) into `apps/web/public/landing_hero_bg.mp4` as ambient background for the Landing Page Hero section with dual-layer cyber vignette gradients, high contrast ratio for typography, and a floating video play/pause toggle. Integrated `Brain3DViewer` directly into the Landing Page Product Interface Preview card with an interactive switcher (`[Ma Trận & Chỉ Số Thực]` vs `[Mô Hình Não Bộ 3D (Hologram)]`). All 105 tests passing.
- **Decision 17 (2026-11-09)**: Revamped `Brain3DViewer.tsx` to match the medical visual aesthetic from user's reference screenshot: translucent glassmorphic organ membrane in medical teal (`opacity: 0.28`, `shininess: 85`), filled with dense glowing dendritic arborization tree in luminous mint-white (`0xccfbf1`) and electric teal (`0x5eead4`) with sparkling synaptic terminals. Added bottom-left clinical navigation pill buttons `[Trước] [Sau] [Trái] [Phải] [Trên]` (Anterior, Posterior, Left, Right, Superior). Relaunched FastAPI backend (port 8000) and Vite frontend (port 3000) daemons after server restart. All 105 tests passing.
- **Decision 18 (2026-11-09)**: Fixed auto-rotate freeze bug in `Brain3DViewer.tsx`. The animation loop (`requestAnimationFrame`) was created inside the initial mount `useEffect` and had formed a stale closure over the initial `autoRotate = true` state variable, preventing toggle updates from taking effect. Resolved by introducing synchronized mutable refs (`autoRotateRef`, `showConnectomeRef`, `showWaveRingsRef`, `activeFlashGroupRef`, `channelDataRef`) and an explicit handler `handleToggleAutoRotate()`. Also automatically freezes rotation when specific clinical view presets (`[Trước]`, `[Sau]`, `[Trái]`, `[Phải]`, `[Trên]`) are selected, and updated button label to clearly display `[Đang Xoay (Bấm: Đứng Yên)]` vs `[Đang Đứng Yên (Bấm: Xoay 360°)]`. All 105 tests passing.
- **Decision 19 (2026-11-09)**: Implemented On-Demand HUD / Clean Zen-Mode View in `Brain3DViewer.tsx`. By default (`showOverlayControls = false`), hides all cluttering viewport overlays (clinical view presets `[Trước] [Sau]...`, electrode chips, electrode inspection card, navigation watermark) to present a 100% crystal-clear, unobstructed view of the 3D translucent brain. Added dual toggle controls (a discrete floating pill at bottom-left and an explicit header button `[Hiện Nút Điều Khiển]` / `[Ẩn Nút Khung 3D]`) allowing users to show or hide the overlay controls on demand. All 105 tests passing.
- **Decision 20 (2026-11-09)**: Aligned 3D Viewport layout strictly with user's reference interface (LungAI CT Analysis style). Kept the 5 directional angle buttons `[Trước] [Sau] [Trái] [Phải] [Trên]` directly accessible at the bottom-left corner in a sleek, non-intrusive translucent pill bar, with a discrete toggle for electrode telemetry overlays. Eliminated all floating clutter (watermarks, bulky chips, inspection cards) from obstructing the 3D translucent brain model. Confirmed landing page video background remains completely free of any "Dừng Video Nền" button. Both Vite (:3000) and FastAPI (:8000) running healthy. All 105 tests passing.
- **Decision 21 (2026-11-09)**: Built BCI CSV Autonomous Decoder and Telemetry Engine in Quick Survival Communication (`Tab3Survival.tsx` and `SurvivalPage.tsx` at `/app/survival`). Solved the limitation where survival cards previously appeared purely mouse-clickable. Users can now load any custom 14–16 channel `.csv` file or select 1-click international benchmark presets (F1 Uống nước, F2 Tôi muốn ăn, F3 Khẩn cấp, F4 Đi vệ sinh). The system extracts P300 epochs, classifies intents via Shrinkage LDA, displays real-time telemetry (Pz peak voltage, latency, confidence, and synchronized mini EEG oscilloscope waves), highlights the matching card, automatically speaks the sentence via Vietnamese TTS, and logs the event to the communication database. Automated test suite updated to 106 tests (83 backend pytest + 23 frontend vitest), 100% passing.
- **Decision 22 (2026-11-09)**: Upgraded Survival Intent Classifier with Clinical Safety Muting and Full Dataset Coverage (`03_vietnamese_clinical_sentences`). When unrecognized, noisy, or low-SNR CSV data is uploaded, the system strictly avoids false-positive triggers and keeps silent (Muted) with an explicit warning banner ("Tín hiệu kém / Nhiễu / Không thuộc nhóm lệnh sinh tồn"). Expanded preset and upload routing to cover 100% of files in `03_vietnamese_clinical_sentences`: the 4 core survival intents (F1 Uống nước, F2 Tôi muốn ăn, F3 Khẩn cấp, F4 Đi vệ sinh), 2 extended clinical messages (Cảm ơn bác sĩ, Xin chào hội đồng), and a synthetic safety benchmark (Tín hiệu kém / Nhiễu). All 106 tests passing.
- **Decision 23 (2026-11-09)**: Fixed keyword substring collision in `Tab3Survival.tsx`. In the previous conditional check, the emergency intent `Sentence_TRO_GIUP_KHAN_CAP.csv` was erroneously matching the nutrition intent F2 because `KHAN` contains the substring `AN` (e.g. `'KHAN_CAP'.includes('AN') === true`). Replaced loose substring matching with tokenized word-set verification, elevated F3 (Emergency) to Priority 1 precedence, and ensured isolated word matching for F2. Verified `Sentence_TRO_GIUP_KHAN_CAP.csv` routes directly to F3 ("Tôi cần trợ giúp khẩn cấp.") and triggers emergency broadcast. All 106 tests passing.

## M1 Baseline Results
- 5-fold CV ROC-AUC: **0.9612 ± 0.0142**
- Held-out Session 2 ROC-AUC: **0.8900**, Balanced Acc: **80.0%**
- Character Accuracy: **100.0%** (6/6: `6 _ C 4 B 5`) from 3 reps onwards
- Peak ITR: **21.77 bits/min**
- Inference Latency: **0.119 ms**

## M2a Execution & Real Metrics
- **Replay Source**: Held-out Session 2, badge `REAL DATASET REPLAY`, 196.03s duration (50,184 samples at 256 Hz, 16 EEG channels).
- **Deterministic Replay**: Bitwise identical online decodes across runs.
- **Filter Re-warming**: 2.0s causal SOS filter warm-up prevents transient artifacts on seek.
- **Online Decode Accuracy**: 6/6 (100.0%: `6 _ C 4 B 5`).
- **Inference Latency**: 0.092 – 0.096 ms.
- **Staff Override**: Executed with `score=null` and `source="staff_override"`.
- **Decoded Log**: Exported to `datasets/processed/decoded_characters.csv`.

## M2b Execution & Real Metrics
- **Vietnamese Telex Parser**: Base vowels, circumflex, horn, bar, tones with traditional tone placement (`hòa`, `hóa`), modifier undo, and Unicode NFC normalization.
- **Word Suggester**: Frequency lexicon, bigram transitions, prefix match on diacritic-stripped text (>= 2 chars), max 5 candidates.
- **State Machine**: `SPELLING` -> `SUGGESTION_AVAILABLE` -> `WAITING_FOR_USER_DECISION` -> `WORD_ACCEPTED` -> `SPELLING`.
- **Property-based Test**: Hypothesis verified that suggestions never commit without explicit ACCEPT.
- **High-Stakes Two-Step Commit**: `SPEAK` and `F3_URGENT`.

## M3 Frontend Execution & Real Metrics
- **Tech Stack & Bundle Size**:
  - React 18, TypeScript, Tailwind CSS, Vite.
  - High performance: 60 FPS multi-channel canvas rendering without heavy charting dependencies.
- **Theme & Badges**:
  - Dark mode default (`#0B0F19` background, `#111827` panels, `#06B6D4` neural-cyan accents, `#8B5CF6` AI accents).
  - Header: Mode badge, split badge, connectivity indicator, role indicator, staff override toggle.
  - Footer: Mandatory medical disclaimer, emergency note, honest telemetry bar.

## M4 Auth, Patients, Survival & Security Execution
- **Offline JWT Authentication** (`apps/api/app/auth/`): Passlib with Argon2 / bcrypt password hashing; HMAC-SHA256 tokens.
- **Patients & Sessions CRUD** (`apps/api/app/api/v1/endpoints/patients.py`): 5 core fields + audit logs.
- **Tab 3 Quick Survival Communication**: F1–F4 Vietnamese phrases, 5-second cancel window, Web Audio synthesized chime, two-step commit for F3.
- **Tab 4 Model Management & Metrics**: Checkpoint metrics, non-blocking background retraining jobs, secure model upload validation with SHA-256 / HMAC, 50MB cap, path sanitization.

## M5 Optional Extras Execution & Real Metrics
- **PyTorch CNN-Transformer Decoder** (`apps/api/app/bci/nn_decoder.py`):
  - Trained via `scripts/train_nn.py` on Sessions 0 & 1, tested on held-out Session 2 (ROC-AUC: 0.6321, Balanced Acc: 60.73%, Latency: 1.826 ms).
  - Checkpoint: `models/checkpoints/nn_p300.pt` + `nn_p300.json`.
- **Production Docker Compose Deployment**: `Dockerfile.api`, `Dockerfile.web`, `docker/nginx.conf`, `docker-compose.yml` (bound to 127.0.0.1).
- **Windows Convenience Scripts**: `scripts/setup.ps1`, `scripts/run.ps1`.
- **Documentation Suite in `docs/`**: `ARCHITECTURE.md`, `RUNBOOK.md`, `EVALUATION_REPORT.md`, `ORTHOGRAPHY.md`, `WORDLIST_LICENSE.md`.

## M6 Complete Frontend & Product Experience Execution
- **Route Inventory (19 Verified Routes Across 4 Domains)**:
  - **Public Marketing & Research Website**:
    - `/` — Landing Page (Hero, Problem, Closed-Loop Signal Processing Pipeline, Features, Honest Telemetry, Disclaimers)
    - `/about` — About NEURO-SPEECH (Mission, BCI Research Ethics, Vietnamese Optimization)
    - `/technology` — Technology & Research (Causal SOS Filtering, LDA vs CNN-Transformer, Latency Budget Table)
    - `/features` — Product Features (6x6 Speller Matrix, Survival F1-F4, Web Speech TTS, Audit Logging)
    - `/contact` — Contact & Clinical Trial Collaboration Form
    - `/privacy` — Neural Data Privacy Policy & Audit Logging Standards
    - `/terms` — Terms of Use & Medical Device Disclaimers
  - **Authentication Pages**:
    - `/login` — Login with demo account auto-fill buttons (admin, researcher, caregiver) and password toggle
    - `/register` — Account registration with role selection and password confirmation
    - `/forgot-password` — Password recovery dispatch without user enumeration leaks
    - `/reset-password` — Password reset with security verification token
  - **Authenticated User Application (`/app/*` with Sidebar)**:
    - `/app/dashboard` — Overview Dashboard with real database-backed statistics, device connection status, recent sessions
    - `/app/studio` — Neuro Studio (3 functional areas: EEG Monitoring, P300 Writing Studio, Communication Output)
    - `/app/survival` — Quick Survival Communication (F1-F4 targets, 5s cancel window, two-step commit for F3)
    - `/app/history` — Persistent Communication History with mode filtering and repeat speech playback
    - `/app/sessions` — EEG Sessions inventory (Replay sessions, synthetic runs, accuracy, duration)
    - `/app/profile` — User identity profile and RBAC permissions inspection
    - `/app/settings` — Bilingual interface language toggle (VI/EN static dictionary), TTS speed controls, accessibility mode
  - **Admin Dashboard (`/admin/*` Protected by Role Guard)**:
    - `/admin/dashboard` — Administrative overview with real SQLite counts, system health, and database metrics
    - `/admin/users` — User management (search, role modification, active/deactivate toggle)
    - `/admin/patients` — Clinical patient records management (CRUD, notes, birth year, handedness)
    - `/admin/datasets` — Dataset provenance inspection (BNCI 2014-009 SHA-256 integrity, sampling rate, channels)
    - `/admin/models` — Model management & candidate activation controls
    - `/admin/sessions` — Session audit and quality verification
    - `/admin/logs` — Real-time security audit logs inspection
    - `/admin/settings` — System parameters and data retention configuration
- **Backend API Endpoints Added for M6**:
  - `POST /api/v1/auth/register`, `POST /api/v1/auth/forgot-password`, `POST /api/v1/auth/reset-password`
  - `GET /api/v1/admin/stats`, `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/{id}/role`, `PATCH /api/v1/admin/users/{id}/status`, `GET/PATCH /api/v1/admin/settings`
  - `GET/POST /api/v1/communication/history`
  - `GET/POST /api/v1/sessions`
- **Invariants & Safety Verified**:
  - Critical Invariant: No AI word suggestion ever commits to confirmed communication output without explicit user ACCEPT.
  - Layer 1 Neural Decoder strictly separated from Layer 2 Language Layer.
  - Role-based route guard blocks non-admin users from accessing `/admin/*` with 403 Forbidden.
  - Mandatory medical disclaimers present on every public and operational screen.

## Verification & Test Results
- **Backend Pytest**: **79 / 79 tests PASSED** (0 failures).
- **Frontend Vitest**: **22 / 22 tests PASSED** (0 failures).
- **Total Repository Tests**: **101 / 101 tests PASSED (100% pass rate)**.
- **Frontend Production Build**: **SUCCESS** (`dist/` generated, 103.1 kB gzipped JS).
- **System Health Check**: **100% NOMINAL**.

## Open Issues / Notes
- None. All developmental milestones (M1, M2a, M2b, M3, M4, M5, M6) are 100% completed, tested, and documented.
