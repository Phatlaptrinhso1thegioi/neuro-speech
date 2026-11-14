"""
apps/api/app/api/v1/endpoints/audit.py
Audit Log Endpoints for NEURO-SPEECH (M4).
Provides transparency for role actions, patient modifications, and staff overrides.
"""

import json
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query

from apps.api.app.auth.dependencies import require_role
from apps.api.app.db.database import get_db_connection

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs")
def get_audit_logs(
    limit: int = Query(default=50, ge=1, le=200),
    current_user: dict = Depends(require_role(["admin", "researcher"]))
) -> List[Dict[str, Any]]:
    """Fetches recent security audit logs. Accessible by admin and researcher."""
    conn = get_db_connection()
    rows = conn.execute(
        """
        SELECT * FROM audit_logs
        ORDER BY id DESC
        LIMIT ?
        """,
        (limit,)
    ).fetchall()
    conn.close()

    logs = []
    for r in rows:
        d = dict(r)
        if d.get("details"):
            try:
                d["details"] = json.loads(d["details"])
            except Exception:
                pass
        logs.append(d)
    return logs
