"""
apps/api/app/api/v1/endpoints/admin.py
Admin Dashboard & Management Endpoints for NEURO-SPEECH (M6).
Protected by require_role(["admin"]) dependency.
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from apps.api.app.auth.dependencies import require_role
from apps.api.app.db.database import get_db_connection, log_audit_event

router = APIRouter(prefix="/admin", tags=["admin"])


class UpdateUserRoleRequest(BaseModel):
    role: str = Field(description="Must be admin, researcher, or caregiver")


class UpdateUserStatusRequest(BaseModel):
    is_active: bool


class UpdateSystemSettingRequest(BaseModel):
    key: str
    value: str


@router.get("/stats")
def get_admin_stats(current_user: dict = Depends(require_role(["admin"]))) -> Dict[str, Any]:
    """Returns database-backed administrative overview metrics."""
    conn = get_db_connection()
    total_users = conn.execute("SELECT COUNT(*) as cnt FROM users").fetchone()["cnt"]
    active_users = conn.execute("SELECT COUNT(*) as cnt FROM users WHERE is_active = 1").fetchone()["cnt"]
    total_patients = conn.execute("SELECT COUNT(*) as cnt FROM patients").fetchone()["cnt"]
    total_sessions = conn.execute("SELECT COUNT(*) as cnt FROM sessions").fetchone()["cnt"]
    total_models = conn.execute("SELECT COUNT(*) as cnt FROM model_checkpoints").fetchone()["cnt"]
    active_models = conn.execute("SELECT COUNT(*) as cnt FROM model_checkpoints WHERE status = 'active'").fetchone()["cnt"]
    total_jobs = conn.execute("SELECT COUNT(*) as cnt FROM jobs").fetchone()["cnt"]
    recent_audits = conn.execute("SELECT COUNT(*) as cnt FROM audit_logs").fetchone()["cnt"]
    conn.close()

    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "patients": {
            "total": total_patients
        },
        "sessions": {
            "total": total_sessions
        },
        "models": {
            "total": total_models,
            "active": active_models
        },
        "jobs": {
            "total": total_jobs
        },
        "audit_events": recent_audits,
        "system_health": {
            "status": "HEALTHY",
            "db_mode": "SQLite WAL",
            "pipeline": "Causal SOS + Shrinkage LDA",
            "version": "2.1.0"
        }
    }


@router.get("/users")
def list_users(
    q: Optional[str] = Query(None, description="Search term for username or email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_role(["admin"]))
) -> Dict[str, Any]:
    """Lists users with filtering, pagination, and search (password hashes excluded)."""
    conn = get_db_connection()
    conditions = []
    params = []

    if q:
        conditions.append("(username LIKE ? OR email LIKE ? OR full_name LIKE ?)")
        params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])

    if role:
        conditions.append("role = ?")
        params.append(role)

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    total = conn.execute(f"SELECT COUNT(*) as cnt FROM users {where_clause}", params).fetchone()["cnt"]

    query = f"""
    SELECT id, username, email, role, full_name, is_active, created_at
    FROM users
    {where_clause}
    ORDER BY id ASC
    LIMIT ? OFFSET ?
    """
    rows = conn.execute(query, params + [limit, offset]).fetchall()
    conn.close()

    users = [
        {
            "id": r["id"],
            "username": r["username"],
            "email": r["email"],
            "role": r["role"],
            "full_name": r["full_name"],
            "is_active": bool(r["is_active"]),
            "created_at": r["created_at"],
        }
        for r in rows
    ]

    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "items": users
    }


@router.patch("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    req: UpdateUserRoleRequest,
    current_user: dict = Depends(require_role(["admin"]))
) -> Dict[str, Any]:
    """Updates authorized role of a user."""
    allowed_roles = {"admin", "researcher", "caregiver"}
    if req.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{req.role}'. Must be one of {allowed_roles}"
        )

    conn = get_db_connection()
    target_user = conn.execute("SELECT id, username, role FROM users WHERE id = ?", (user_id,)).fetchone()
    if not target_user:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    old_role = target_user["role"]
    conn.execute("UPDATE users SET role = ? WHERE id = ?", (req.role, user_id))
    conn.commit()
    conn.close()

    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="USER_ROLE_UPDATED",
        resource_type="users",
        resource_id=str(user_id),
        details={"target_username": target_user["username"], "old_role": old_role, "new_role": req.role}
    )

    return {"message": "User role updated successfully.", "user_id": user_id, "new_role": req.role}


@router.patch("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    req: UpdateUserStatusRequest,
    current_user: dict = Depends(require_role(["admin"]))
) -> Dict[str, Any]:
    """Activates or deactivates a user account."""
    if user_id == current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate currently authenticated administrator account."
        )

    conn = get_db_connection()
    target_user = conn.execute("SELECT id, username FROM users WHERE id = ?", (user_id,)).fetchone()
    if not target_user:
        conn.close()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    active_val = 1 if req.is_active else 0
    conn.execute("UPDATE users SET is_active = ? WHERE id = ?", (active_val, user_id))
    conn.commit()
    conn.close()

    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="USER_STATUS_UPDATED",
        resource_type="users",
        resource_id=str(user_id),
        details={"target_username": target_user["username"], "is_active": req.is_active}
    )

    return {"message": "User status updated successfully.", "user_id": user_id, "is_active": req.is_active}


@router.get("/settings")
def get_system_settings(current_user: dict = Depends(require_role(["admin"]))) -> Dict[str, Any]:
    """Returns platform system configurations."""
    conn = get_db_connection()
    rows = conn.execute("SELECT key, value, updated_at FROM system_settings").fetchall()
    conn.close()
    settings = {r["key"]: r["value"] for r in rows}
    return {"settings": settings}


@router.patch("/settings")
def update_system_setting(
    req: UpdateSystemSettingRequest,
    current_user: dict = Depends(require_role(["admin"]))
) -> Dict[str, Any]:
    """Updates a system configuration setting."""
    conn = get_db_connection()
    conn.execute(
        """
        INSERT INTO system_settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
        """,
        (req.key, req.value)
    )
    conn.commit()
    conn.close()

    log_audit_event(
        user_id=current_user["id"],
        username=current_user["username"],
        role=current_user["role"],
        action="SYSTEM_SETTING_UPDATED",
        resource_type="system_settings",
        resource_id=req.key,
        details={"key": req.key, "value": req.value}
    )

    return {"message": "Setting updated successfully.", "key": req.key, "value": req.value}
