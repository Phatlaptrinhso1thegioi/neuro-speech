"""
apps/api/app/api/v1/endpoints/jobs.py
Long Background Job Status Endpoints for NEURO-SPEECH (M4).
Provides GET /api/v1/jobs/{id} for non-blocking frontend progress monitoring.
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException

from apps.api.app.auth.dependencies import get_current_user
from apps.api.app.jobs.job_manager import job_manager

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("/{job_id}")
def get_job_status(
    job_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """Retrieves current execution status and progress of a background job."""
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job ID '{job_id}' not found.")
    return job


@router.get("/")
def list_jobs(
    current_user: dict = Depends(get_current_user)
) -> List[Dict[str, Any]]:
    """Lists recent background jobs."""
    return job_manager.list_jobs(limit=20)
