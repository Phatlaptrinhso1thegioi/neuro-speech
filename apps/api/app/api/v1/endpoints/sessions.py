"""
apps/api/app/api/v1/endpoints/sessions.py
EEG Sessions Management Endpoints for NEURO-SPEECH (M6).
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from apps.api.app.auth.dependencies import get_current_user
from apps.api.app.db.database import get_db_connection, log_audit_event

router = APIRouter(prefix="/sessions", tags=["sessions"])


class CreateSessionRecordRequest(BaseModel):
    patient_id: int = Field(default=1)
    session_type: str = Field(min_length=2)
    mode_badge: str = Field(min_length=2)
    split_name: Optional[str] = "Session 2 (Held-Out)"
    accuracy: Optional[float] = 1.0
    duration_s: Optional[float] = 196.03
    notes: Optional[str] = None


@router.get("")
def list_eeg_sessions(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Lists recorded, replay, and synthetic EEG sessions."""
    conn = get_db_connection()
    total = conn.execute("SELECT COUNT(*) as cnt FROM sessions").fetchone()["cnt"]

    query = """
    SELECT s.id, s.patient_id, p.code as patient_code, s.session_type, s.mode_badge, s.split_name, s.accuracy, s.duration_s, s.notes, s.created_at
    FROM sessions s
    LEFT JOIN patients p ON s.patient_id = p.id
    ORDER BY s.id DESC
    LIMIT ? OFFSET ?
    """
    rows = conn.execute(query, (limit, offset)).fetchall()
    conn.close()

    items = [
        {
            "id": r["id"],
            "patient_id": r["patient_id"],
            "patient_code": r["patient_code"] or f"P{r['patient_id']:03d}",
            "session_type": r["session_type"],
            "mode_badge": r["mode_badge"],
            "split_name": r["split_name"],
            "accuracy": r["accuracy"],
            "duration_s": r["duration_s"],
            "notes": r["notes"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": items
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def record_eeg_session(
    req: CreateSessionRecordRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Records an executed EEG session to SQLite database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO sessions (patient_id, session_type, mode_badge, split_name, accuracy, duration_s, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            req.patient_id,
            req.session_type,
            req.mode_badge,
            req.split_name,
            req.accuracy,
            req.duration_s,
            req.notes,
        )
    )
    sess_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="EEG_SESSION_RECORDED",
        resource_type="sessions",
        resource_id=str(sess_id),
        details={"type": req.session_type, "accuracy": req.accuracy}
    )

    return {
        "message": "EEG session recorded successfully.",
        "session_id": sess_id,
        "created_at": "now"
    }
