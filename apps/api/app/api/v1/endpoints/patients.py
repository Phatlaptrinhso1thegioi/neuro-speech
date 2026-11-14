"""
apps/api/app/api/v1/endpoints/patients.py
Patients CRUD Endpoints with Audit Logging for NEURO-SPEECH (M4).
Five core fields: id, code, birth_year, handedness, notes.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from apps.api.app.auth.dependencies import get_current_user, require_role
from apps.api.app.db.database import get_db_connection, log_audit_event

router = APIRouter(prefix="/patients", tags=["patients"])


class PatientCreate(BaseModel):
    code: str = Field(min_length=1, max_length=20, description="Patient alphanumeric code, e.g. P001")
    birth_year: int = Field(ge=1900, le=2026, description="Year of birth")
    handedness: str = Field(pattern="^(RIGHT|LEFT|AMBIDEXTROUS)$", description="RIGHT, LEFT, or AMBIDEXTROUS")
    notes: Optional[str] = Field(default="", description="Clinical and BCI setup notes")


class PatientUpdate(BaseModel):
    birth_year: Optional[int] = Field(default=None, ge=1900, le=2026)
    handedness: Optional[str] = Field(default=None, pattern="^(RIGHT|LEFT|AMBIDEXTROUS)$")
    notes: Optional[str] = None


class PatientResponse(BaseModel):
    id: int
    code: str
    birth_year: int
    handedness: str
    notes: Optional[str]
    created_at: str
    updated_at: str


@router.get("/", response_model=List[PatientResponse])
def list_patients(
    current_user: dict = Depends(get_current_user)
) -> List[PatientResponse]:
    """Lists all registered patients. Accessible by admin, researcher, caregiver."""
    conn = get_db_connection()
    rows = conn.execute("SELECT * FROM patients ORDER BY id ASC").fetchall()
    conn.close()
    return [PatientResponse(**dict(r)) for r in rows]


@router.post("/", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_patient(
    req: PatientCreate,
    current_user: dict = Depends(require_role(["admin", "researcher"]))
) -> PatientResponse:
    """Creates a new patient profile. Requires admin or researcher role."""
    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM patients WHERE code = ?", (req.code,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Patient code '{req.code}' already exists."
        )

    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO patients (code, birth_year, handedness, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        """,
        (req.code, req.birth_year, req.handedness, req.notes)
    )
    new_id = cursor.lastrowid
    conn.commit()

    created_row = conn.execute("SELECT * FROM patients WHERE id = ?", (new_id,)).fetchone()
    conn.close()

    # Log audit event
    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="PATIENT_CREATE",
        resource_type="patient",
        resource_id=str(new_id),
        details={"code": req.code, "birth_year": req.birth_year, "handedness": req.handedness}
    )

    return PatientResponse(**dict(created_row))


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: int,
    current_user: dict = Depends(get_current_user)
) -> PatientResponse:
    """Fetches single patient by ID."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Patient ID {patient_id} not found.")

    return PatientResponse(**dict(row))


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: int,
    req: PatientUpdate,
    current_user: dict = Depends(require_role(["admin", "researcher", "caregiver"]))
) -> PatientResponse:
    """Updates patient profile. Accessible by admin, researcher, caregiver."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Patient ID {patient_id} not found.")

    current_data = dict(row)
    new_birth_year = req.birth_year if req.birth_year is not None else current_data["birth_year"]
    new_handedness = req.handedness if req.handedness is not None else current_data["handedness"]
    new_notes = req.notes if req.notes is not None else current_data["notes"]

    conn.execute(
        """
        UPDATE patients
        SET birth_year = ?, handedness = ?, notes = ?, updated_at = datetime('now')
        WHERE id = ?
        """,
        (new_birth_year, new_handedness, new_notes, patient_id)
    )
    conn.commit()

    updated_row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()

    # Log audit event
    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="PATIENT_UPDATE",
        resource_type="patient",
        resource_id=str(patient_id),
        details={"birth_year": new_birth_year, "handedness": new_handedness}
    )

    return PatientResponse(**dict(updated_row))


@router.delete("/{patient_id}")
def delete_patient(
    patient_id: int,
    current_user: dict = Depends(require_role(["admin"]))
) -> Dict[str, Any]:
    """Deletes a patient record. Strictly restricted to admin role."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail=f"Patient ID {patient_id} not found.")

    patient_code = row["code"]
    conn.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    conn.commit()
    conn.close()

    # Log audit event
    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="PATIENT_DELETE",
        resource_type="patient",
        resource_id=str(patient_id),
        details={"code": patient_code}
    )

    return {"status": "deleted", "patient_id": patient_id, "code": patient_code}
