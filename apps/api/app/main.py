"""
apps/api/app/main.py
FastAPI Application for NEURO-SPEECH BCI Platform.
Binds to 127.0.0.1 (localhost only) per M2a specification.
"""

import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from apps.api.app.api.v1.endpoints.datasets import router as datasets_router
from apps.api.app.api.v1.endpoints.replay import router as replay_router, websocket_replay_endpoint
from apps.api.app.api.v1.endpoints.p300 import router as p300_router
from apps.api.app.api.v1.endpoints.speller import router as speller_router
from apps.api.app.api.v1.endpoints.language import router as language_router
from apps.api.app.api.v1.endpoints.auth import router as auth_router
from apps.api.app.api.v1.endpoints.patients import router as patients_router
from apps.api.app.api.v1.endpoints.audit import router as audit_router
from apps.api.app.api.v1.endpoints.jobs import router as jobs_router
from apps.api.app.api.v1.endpoints.models import router as models_router
from apps.api.app.api.v1.endpoints.survival import router as survival_router
from apps.api.app.api.v1.endpoints.admin import router as admin_router
from apps.api.app.api.v1.endpoints.communication import router as communication_router
from apps.api.app.api.v1.endpoints.sessions import router as sessions_router
from apps.api.app.db.database import init_db

app = FastAPI(
    title="NEURO-SPEECH BCI API",
    description="Research & Assistive-Technology Prototype — Not a certified medical diagnostic device.",
    version="2.1.0"
)

# Open CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API v1 Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(datasets_router, prefix="/api/v1")
app.include_router(replay_router, prefix="/api/v1")
app.include_router(p300_router, prefix="/api/v1")
app.include_router(speller_router, prefix="/api/v1")
app.include_router(language_router, prefix="/api/v1")
app.include_router(patients_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(jobs_router, prefix="/api/v1")
app.include_router(models_router, prefix="/api/v1")
app.include_router(survival_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(communication_router, prefix="/api/v1")
app.include_router(sessions_router, prefix="/api/v1")

@app.on_event("startup")
async def on_startup():
    init_db()
    from apps.api.app.websocket.replay_manager import replay_manager
    replay_manager.set_main_loop(asyncio.get_running_loop())

# Direct WebSocket route matching prompt spec: /api/v1/ws/replay/{session_id}
@app.websocket("/api/v1/ws/replay/{session_id}")
async def ws_replay_route(websocket: WebSocket, session_id: str):
    await websocket_replay_endpoint(websocket, session_id)


@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {
        "status": "healthy",
        "prototype": "NEURO-SPEECH",
        "notice": "Research & Assistive-Technology Prototype — Not a certified medical diagnostic device."
    }
