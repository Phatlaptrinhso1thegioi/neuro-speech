#!/usr/bin/env python3
"""
scripts/seed_db.py
Database Initialization & Seeding Script for NEURO-SPEECH (M4).
Initializes storage/neuro_speech.db, seeds roles (admin, researcher, caregiver),
patients, active model checkpoint, and survival communication phrases.
Prints credentials to stdout per Milestone 4 specification.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from apps.api.app.db.database import init_db, get_db_connection
from apps.api.app.auth.security import get_password_hash

DEMO_ACCOUNTS = [
    {
        "username": "admin",
        "email": "admin@neuro-speech.local",
        "password": "Admin@12345",
        "role": "admin",
        "full_name": "System Administrator",
    },
    {
        "username": "researcher",
        "email": "researcher@neuro-speech.local",
        "password": "Researcher@12345",
        "role": "researcher",
        "full_name": "BCI Lead Researcher",
    },
    {
        "username": "caregiver",
        "email": "caregiver@neuro-speech.local",
        "password": "Caregiver@12345",
        "role": "caregiver",
        "full_name": "Clinical Caregiver",
    },
]

DEFAULT_PATIENTS = [
    {
        "code": "P001",
        "birth_year": 1978,
        "handedness": "RIGHT",
        "notes": "ALS patient, clear visual fixation, responsive to row/column P300 oddball speller.",
    },
    {
        "code": "P002",
        "birth_year": 1985,
        "handedness": "RIGHT",
        "notes": "Locked-in state survivor. High urgency assistance requirements.",
    },
]

DEFAULT_SURVIVAL_PHRASES = [
    {
        "id": "phrase_f1",
        "slot": "F1",
        "phrase": "Tôi muốn uống nước.",
        "category": "Thức uống",
        "is_urgent": 0,
    },
    {
        "id": "phrase_f2",
        "slot": "F2",
        "phrase": "Tôi muốn ăn.",
        "category": "Thức ăn",
        "is_urgent": 0,
    },
    {
        "id": "phrase_f3",
        "slot": "F3",
        "phrase": "Tôi cần trợ giúp khẩn cấp.",
        "category": "Khẩn cấp",
        "is_urgent": 1,
    },
    {
        "id": "phrase_f4",
        "slot": "F4",
        "phrase": "Tôi muốn đi vệ sinh.",
        "category": "Vệ sinh",
        "is_urgent": 0,
    },
]


def seed():
    print("=" * 80)
    print(" NEURO-SPEECH: Seeding Database (storage/neuro_speech.db)")
    print("=" * 80)

    # 1. Initialize schema
    init_db()
    conn = get_db_connection()

    # 2. Seed Users
    print("\n--- Pre-seeded Demo Accounts ---")
    for acc in DEMO_ACCOUNTS:
        existing = conn.execute("SELECT id FROM users WHERE username = ?", (acc["username"],)).fetchone()
        hashed = get_password_hash(acc["password"])
        if not existing:
            conn.execute(
                """
                INSERT INTO users (username, email, hashed_password, role, full_name, is_active)
                VALUES (?, ?, ?, ?, ?, 1)
                """,
                (acc["username"], acc["email"], hashed, acc["role"], acc["full_name"])
            )
        else:
            conn.execute(
                "UPDATE users SET hashed_password = ?, email = ?, role = ? WHERE username = ?",
                (hashed, acc["email"], acc["role"], acc["username"])
            )

        print(f"Role: [{acc['role'].upper():<10}] Username: {acc['username']:<12} Email: {acc['email']:<30} Password: {acc['password']}")

    # 3. Seed Patients
    print("\n--- Seeding Default Patients ---")
    for pat in DEFAULT_PATIENTS:
        existing = conn.execute("SELECT id FROM patients WHERE code = ?", (pat["code"],)).fetchone()
        if not existing:
            conn.execute(
                """
                INSERT INTO patients (code, birth_year, handedness, notes)
                VALUES (?, ?, ?, ?)
                """,
                (pat["code"], pat["birth_year"], pat["handedness"], pat["notes"])
            )
            print(f"Created patient: {pat['code']} (Born: {pat['birth_year']}, Handedness: {pat['handedness']})")
        else:
            print(f"Patient {pat['code']} already exists.")

    # 4. Seed Survival Phrases
    print("\n--- Seeding Survival Phrases (F1–F4) ---")
    for sp in DEFAULT_SURVIVAL_PHRASES:
        conn.execute(
            """
            INSERT INTO survival_phrases (id, slot, phrase, category, is_urgent, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(slot) DO UPDATE SET phrase = excluded.phrase, category = excluded.category, is_urgent = excluded.is_urgent
            """,
            (sp["id"], sp["slot"], sp["phrase"], sp["category"], sp["is_urgent"])
        )
        print(f"[{sp['slot']}] {sp['phrase']} ({sp['category']}) {'[URGENT: 2-STEP COMMIT]' if sp['is_urgent'] else ''}")

    # 5. Register Active Model Checkpoint
    model_pkl = PROJECT_ROOT / "models" / "checkpoints" / "p300_lda_baseline.pkl"
    if model_pkl.exists():
        import hashlib
        h = hashlib.sha256()
        with open(model_pkl, "rb") as f:
            h.update(f.read())
        sha256_val = h.hexdigest()

        conn.execute(
            """
            INSERT INTO model_checkpoints (id, name, file_path, sha256, dataset_sha256, cv_auc, test_balanced_acc, test_auc, latency_ms, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(id) DO UPDATE SET status = 'active', sha256 = excluded.sha256
            """,
            (
                "p300_lda_baseline",
                "Shrinkage LDA Baseline (6x6 Matrix)",
                str(model_pkl),
                sha256_val,
                "beddf78f1834ddef1361b782970725a388f615fbf05f4e15647c0b050d249f3e",
                0.9612,
                0.8000,
                0.8900,
                0.119,
                "active"
            )
        )
        print(f"\nRegistered Active Model: p300_lda_baseline (SHA-256: {sha256_val[:16]}...)")

    # 6. Seed Initial EEG Sessions (M6)
    print("\n--- Seeding Initial EEG Sessions ---")
    p1 = conn.execute("SELECT id FROM patients WHERE code = 'P001'").fetchone()
    if p1:
        p1_id = p1["id"]
        sess_count = conn.execute("SELECT COUNT(*) as cnt FROM sessions").fetchone()["cnt"]
        if sess_count == 0:
            conn.execute(
                """
                INSERT INTO sessions (patient_id, session_type, mode_badge, split_name, accuracy, duration_s, notes)
                VALUES 
                (?, 'REPLAY_BNCI2014_009', 'REAL DATASET REPLAY', 'Session 2 (Held-Out)', 1.0, 196.03, 'Baseline evaluation: 6/6 letters decoded correctly (6 _ C 4 B 5).'),
                (?, 'SYNTHETIC_SIMULATION', 'SYNTHETIC SIMULATION', 'Synthetic Run 1', 0.92, 120.0, 'Synthetic oddball calibration run.')
                """,
                (p1_id, p1_id)
            )
            print("Seeded default EEG sessions for P001.")

    # 7. Seed Initial Communication History (M6)
    print("\n--- Seeding Initial Communication History ---")
    comm_count = conn.execute("SELECT COUNT(*) as cnt FROM communication_history").fetchone()["cnt"]
    if comm_count == 0:
        conn.execute(
            """
            INSERT INTO communication_history (user_id, patient_id, mode, confirmed_text, tts_status, duration_s, data_source, model_version, reps)
            VALUES 
            (3, 1, 'REAL DATASET REPLAY', '6 _ C 4 B 5', 'SPOKEN', 196.03, 'BNCI 2014-009 Session 2', 'p300_lda_baseline', 3),
            (3, 1, 'QUICK SURVIVAL', 'Tôi muốn uống nước.', 'SPOKEN', 5.2, 'F1 Survival Target', 'p300_lda_baseline', 1),
            (3, 2, 'NEURAL WRITING STUDIO', 'Xin chào', 'SPOKEN', 32.4, 'Synthesized Stream', 'p300_lda_baseline', 3)
            """
        )
        print("Seeded default communication history records.")

    # 8. Seed System Settings (M6)
    print("\n--- Seeding System Settings ---")
    settings_data = [
        ("system_name", "NEURO-SPEECH BCI Platform"),
        ("environment", "production-prototype"),
        ("default_language", "vi"),
        ("supported_languages", "vi,en"),
        ("data_retention_days", "365"),
        ("audit_logging_enabled", "true"),
        ("eeg_sampling_rate_default", "256"),
        ("max_model_upload_size_mb", "50")
    ]
    for k, v in settings_data:
        conn.execute(
            """
            INSERT INTO system_settings (key, value, updated_at)
            VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
            """,
            (k, v)
        )
    print("Seeded system settings.")

    conn.commit()
    conn.close()

    print("\n" + "=" * 80)
    print(" Database seeded successfully at storage/neuro_speech.db")
    print("=" * 80)


if __name__ == "__main__":
    seed()
