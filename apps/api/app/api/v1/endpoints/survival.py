"""
apps/api/app/api/v1/endpoints/survival.py
Quick Survival Communication Endpoints for NEURO-SPEECH (M4).
Manages customizable F1–F4 phrases, two-step commit for F3 Urgent Help,
and audio chime / speech synthesis trigger logging.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from apps.api.app.auth.dependencies import get_current_user, require_role
from apps.api.app.db.database import get_db_connection, log_audit_event

router = APIRouter(prefix="/survival", tags=["survival"])

# In-memory tracking of two-step commit for F3 Urgent
_armed_f3_timestamp: Optional[float] = None


class SurvivalPhrase(BaseModel):
    id: str
    slot: str = Field(pattern="^F[1-4]$")
    phrase: str = Field(min_length=1)
    category: str
    is_urgent: bool


class PhraseUpdateRequest(BaseModel):
    phrase: str = Field(min_length=1)
    category: Optional[str] = None


class TriggerRequest(BaseModel):
    slot: str = Field(pattern="^F[1-4]$")
    source: str = Field(default="decoded", description="decoded or staff_override")
    is_step_two_confirm: bool = Field(default=False)


@router.get("/phrases", response_model=List[SurvivalPhrase])
def get_phrases(
    current_user: dict = Depends(get_current_user)
) -> List[SurvivalPhrase]:
    """Returns the four survival communication phrases (F1–F4)."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM survival_phrases ORDER BY slot ASC").fetchall()
    conn.close()
    return [
        SurvivalPhrase(
            id=r["id"],
            slot=r["slot"],
            phrase=r["phrase"],
            category=r["category"],
            is_urgent=bool(r["is_urgent"])
        )
        for r in rows
    ]


@router.put("/phrases/{slot}", response_model=SurvivalPhrase)
def update_phrase(
    slot: str,
    req: PhraseUpdateRequest,
    current_user: dict = Depends(require_role(["admin", "researcher"]))
) -> SurvivalPhrase:
    """Customizes a survival phrase text. Restricted to admin or researcher."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM survival_phrases WHERE slot = ?", (slot,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Slot '{slot}' not found.")

    new_cat = req.category if req.category else row["category"]
    conn.execute(
        """
        UPDATE survival_phrases
        SET phrase = ?, category = ?, updated_at = datetime('now')
        WHERE slot = ?
        """,
        (req.phrase, new_cat, slot)
    )
    conn.commit()

    updated = conn.execute("SELECT * FROM survival_phrases WHERE slot = ?", (slot,)).fetchone()
    conn.close()

    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="SURVIVAL_PHRASE_UPDATE",
        resource_type="survival",
        resource_id=slot,
        details={"phrase": req.phrase, "category": new_cat}
    )

    return SurvivalPhrase(
        id=updated["id"],
        slot=updated["slot"],
        phrase=updated["phrase"],
        category=updated["category"],
        is_urgent=bool(updated["is_urgent"])
    )


@router.post("/trigger")
def trigger_survival_phrase(
    req: TriggerRequest,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Triggers execution flow for a survival phrase.
    F3 (Urgent Help) requires a two-step confirmation (Principle 9: High-stakes actions need two-step commit).
    F1, F2, F4 execute with a 5-second cancel countdown window on client.
    """
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM survival_phrases WHERE slot = ?", (req.slot,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Slot '{req.slot}' not found.")

    phrase_text = row["phrase"]
    is_urgent = bool(row["is_urgent"])

    # High-stakes Two-Step Commit Check for F3
    if is_urgent and req.source != "staff_override":
        if not req.is_step_two_confirm:
            # Step 1: Arm action
            return {
                "status": "ARMED",
                "slot": req.slot,
                "phrase": phrase_text,
                "window_seconds": 5.0,
                "action": "AWAITING_SECOND_CONFIRMATION",
                "notice": "F3 Urgent Help armed. Requires second confirmation before emergency broadcast."
            }

    # Action Committed
    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="SURVIVAL_TRIGGER_COMMITTED",
        resource_type="survival",
        resource_id=req.slot,
        details={"phrase": phrase_text, "source": req.source, "is_urgent": is_urgent}
    )

    return {
        "status": "COMMITTED",
        "slot": req.slot,
        "phrase": phrase_text,
        "is_urgent": is_urgent,
        "source": req.source,
        "notice": "F3 Urgent Help does not replace calling 115 / 911 emergency services." if is_urgent else None
    }
