"""
apps/api/app/api/v1/endpoints/communication.py
Communication History Endpoints for NEURO-SPEECH (M6).
Provides persistent history of confirmed communication outputs.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from apps.api.app.auth.dependencies import get_current_user
from apps.api.app.db.database import get_db_connection, log_audit_event

router = APIRouter(prefix="/communication", tags=["communication"])


class RecordCommunicationRequest(BaseModel):
    confirmed_text: str = Field(min_length=1)
    mode: str = Field(default="NEURAL WRITING STUDIO")
    tts_status: str = Field(default="SPOKEN")
    duration_s: float = Field(default=0.0)
    data_source: str = Field(default="REAL DATASET REPLAY")
    model_version: Optional[str] = "p300_lda_baseline"
    reps: int = Field(default=3)
    patient_id: Optional[int] = 1


@router.get("/history")
def get_communication_history(
    mode: Optional[str] = Query(None, description="Filter by communication mode"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Retrieves verified communication history records from SQLite database."""
    conn = get_db_connection()
    conditions = []
    params = []

    if mode:
        conditions.append("mode = ?")
        params.append(mode)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    total = conn.execute(f"SELECT COUNT(*) as cnt FROM communication_history {where_clause}", params).fetchone()["cnt"]

    query = f"""
    SELECT id, user_id, patient_id, timestamp, mode, confirmed_text, tts_status, duration_s, data_source, model_version, reps, created_at
    FROM communication_history
    {where_clause}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
    """
    rows = conn.execute(query, params + [limit, offset]).fetchall()
    conn.close()

    items = [
        {
            "id": r["id"],
            "user_id": r["user_id"],
            "patient_id": r["patient_id"],
            "timestamp": r["timestamp"],
            "mode": r["mode"],
            "confirmed_text": r["confirmed_text"],
            "tts_status": r["tts_status"],
            "duration_s": r["duration_s"],
            "data_source": r["data_source"],
            "model_version": r["model_version"],
            "reps": r["reps"],
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


@router.post("/history", status_code=status.HTTP_201_CREATED)
def record_communication_history(
    req: RecordCommunicationRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Records an explicitly confirmed communication sentence or survival phrase."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO communication_history (user_id, patient_id, mode, confirmed_text, tts_status, duration_s, data_source, model_version, reps)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            current_user["id"],
            req.patient_id,
            req.mode,
            req.confirmed_text,
            req.tts_status,
            req.duration_s,
            req.data_source,
            req.model_version,
            req.reps,
        )
    )
    history_id = cursor.lastrowid
    conn.commit()
    conn.close()

    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="COMMUNICATION_CONFIRMED",
        resource_type="communication",
        resource_id=str(history_id),
        details={"text": req.confirmed_text, "mode": req.mode, "tts": req.tts_status}
    )

    return {
        "message": "Communication event recorded successfully.",
        "id": history_id,
        "confirmed_text": req.confirmed_text,
        "timestamp": "now"
    }
