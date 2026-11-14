"""
apps/api/app/jobs/job_manager.py
Background Job Execution & Status Tracking for NEURO-SPEECH (M4).
Provides asynchronous execution and database-backed job status tracking.
"""

import asyncio
import json
import uuid
from typing import Dict, Any, Optional, Callable, Awaitable
from datetime import datetime

from apps.api.app.db.database import get_db_connection


class BackgroundJobManager:
    """Manages background task dispatch and job status."""

    def __init__(self):
        self._running_tasks: Dict[str, asyncio.Task] = {}

    def create_job(self, job_type: str) -> str:
        """Creates a pending job record in database and returns unique job ID."""
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        conn = get_db_connection()
        conn.execute(
            """
            INSERT INTO jobs (id, job_type, status, progress, created_at, updated_at)
            VALUES (?, ?, 'PENDING', 0, datetime('now'), datetime('now'))
            """,
            (job_id, job_type)
        )
        conn.commit()
        conn.close()
        return job_id

    def update_progress(self, job_id: str, progress: int, status: str = "RUNNING", result: Optional[Any] = None, error: Optional[str] = None):
        """Updates progress (0..100) and status of a job."""
        conn = get_db_connection()
        result_str = json.dumps(result, ensure_ascii=False) if result else None
        conn.execute(
            """
            UPDATE jobs
            SET status = ?, progress = ?, result = COALESCE(?, result), error = ?, updated_at = datetime('now')
            WHERE id = ?
            """,
            (status, max(0, min(100, progress)), result_str, error, job_id)
        )
        conn.commit()
        conn.close()

    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Fetches job record from database."""
        conn = get_db_connection()
        row = conn.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
        conn.close()
        if not row:
            return None
        data = dict(row)
        if data.get("result"):
            try:
                data["result"] = json.loads(data["result"])
            except Exception:
                pass
        return data

    def list_jobs(self, limit: int = 20) -> list:
        conn = get_db_connection()
        rows = conn.execute("SELECT * FROM jobs ORDER BY created_at DESC LIMIT ?", (limit,)).fetchall()
        conn.close()
        results = []
        for r in rows:
            d = dict(r)
            if d.get("result"):
                try:
                    d["result"] = json.loads(d["result"])
                except Exception:
                    pass
            results.append(d)
        return results

    def dispatch_job(self, job_id: str, coro_fn: Callable[[str], Awaitable[Any]]):
        """Spawns an asynchronous task in the current event loop."""
        try:
            loop = asyncio.get_running_loop()
            task = loop.create_task(self._job_wrapper(job_id, coro_fn))
            self._running_tasks[job_id] = task
        except RuntimeError:
            # If no running event loop, execute synchronously or schedule
            pass

    async def _job_wrapper(self, job_id: str, coro_fn: Callable[[str], Awaitable[Any]]):
        self.update_progress(job_id, progress=5, status="RUNNING")
        try:
            result = await coro_fn(job_id)
            self.update_progress(job_id, progress=100, status="COMPLETED", result=result)
        except Exception as e:
            self.update_progress(job_id, progress=100, status="FAILED", error=str(e))
        finally:
            if job_id in self._running_tasks:
                del self._running_tasks[job_id]


# Singleton instance
job_manager = BackgroundJobManager()
