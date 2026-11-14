"""
apps/api/app/db/database.py
SQLite Database Connection and Schema Management for NEURO-SPEECH (M4).
Database file located at storage/neuro_speech.db.
"""

import sqlite3
import json
from pathlib import Path
from typing import Optional, List, Dict, Any

PROJECT_ROOT = Path(__file__).resolve().parents[4]
DB_PATH = PROJECT_ROOT / "storage" / "neuro_speech.db"


def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection configured with Row factory, WAL mode, and 30s timeout."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=30.0)
    conn.row_factory = sqlite3.Row
    # Enable Write-Ahead Logging for high concurrency and Foreign Keys
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 30000;")
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initializes database schema if tables do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        hashed_password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'researcher', 'caregiver')),
        full_name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)

    # 2. Patients Table (at least five fields: id, code, birth_year, handedness, notes)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        birth_year INTEGER NOT NULL,
        handedness TEXT NOT NULL CHECK(handedness IN ('RIGHT', 'LEFT', 'AMBIDEXTROUS')),
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)

    # 3. Patient Sessions Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        session_type TEXT NOT NULL,
        mode_badge TEXT NOT NULL,
        split_name TEXT,
        accuracy REAL,
        duration_s REAL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)

    # 4. Audit Log Table (user, action, timestamp, patient_id / resource)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        user_id INTEGER,
        username TEXT NOT NULL,
        role TEXT NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT NOT NULL,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT
    );
    """)

    # 5. Models / Checkpoints Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS model_checkpoints (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        dataset_sha256 TEXT NOT NULL,
        cv_auc REAL,
        test_balanced_acc REAL,
        test_auc REAL,
        latency_ms REAL,
        status TEXT NOT NULL CHECK(status IN ('active', 'candidate', 'archived')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)

    # 6. Background Jobs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        job_type TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED')),
        progress INTEGER NOT NULL DEFAULT 0,
        result TEXT,
        error TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)

    # 7. Survival Phrases Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS survival_phrases (
        id TEXT PRIMARY KEY,
        slot TEXT UNIQUE NOT NULL,
        phrase TEXT NOT NULL,
        category TEXT NOT NULL,
        is_urgent INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)

    # 8. Communication History Table (M6)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS communication_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        patient_id INTEGER REFERENCES patients(id),
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        mode TEXT NOT NULL,
        confirmed_text TEXT NOT NULL,
        tts_status TEXT NOT NULL DEFAULT 'SPOKEN',
        duration_s REAL DEFAULT 0.0,
        data_source TEXT NOT NULL,
        model_version TEXT,
        reps INTEGER DEFAULT 3,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)

    # 9. System Settings Table (M6)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    """)

    conn.commit()
    conn.close()


def log_audit_event(
    username: str,
    role: str,
    action: str,
    resource_type: str,
    user_id: Optional[int] = None,
    resource_id: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = "127.0.0.1"
):
    """Appends an event to the security audit log table."""
    conn = get_db_connection()
    details_str = json.dumps(details, ensure_ascii=False) if details else None
    conn.execute(
        """
        INSERT INTO audit_logs (user_id, username, role, action, resource_type, resource_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, username, role, action, resource_type, resource_id, details_str, ip_address)
    )
    conn.commit()
    conn.close()
