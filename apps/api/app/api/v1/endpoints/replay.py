"""
apps/api/app/api/v1/endpoints/replay.py
Replay and WebSocket endpoints for streaming EEG data and decoding.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Body, Query

from apps.api.app.schemas.models import (
    ReplayStartRequest,
    ReplaySeekRequest,
    ReplayActionRequest,
    StaffOverrideRequest
)
from apps.api.app.websocket.replay_manager import replay_manager

router = APIRouter(prefix="/replay", tags=["replay"])


@router.post("/start")
async def start_replay(
    req: Optional[ReplayStartRequest] = Body(None),
    session_id: Optional[str] = Query(None),
    mode: Optional[str] = Query(None),
    speed: Optional[float] = Query(None)
) -> Dict[str, Any]:
    """Starts continuous sliding window replay on the requested session."""
    s_id = req.session_id if req else (session_id or "default")
    m = req.mode if req else (mode or "replay")
    sp = req.speed if req else (speed or 1.0)
    return replay_manager.start_session(session_id=s_id, mode=m, speed=sp)


@router.post("/pause")
async def pause_replay(
    req: Optional[ReplayActionRequest] = Body(None),
    session_id: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Pauses playback."""
    s_id = req.session_id if req else (session_id or "default")
    return replay_manager.pause_session(s_id)


@router.post("/resume")
async def resume_replay(
    req: Optional[ReplayActionRequest] = Body(None),
    session_id: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Resumes playback."""
    s_id = req.session_id if req else (session_id or "default")
    return replay_manager.resume_session(s_id)


@router.post("/stop")
async def stop_replay(
    req: Optional[ReplayActionRequest] = Body(None),
    session_id: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Stops playback and resets pointer."""
    s_id = req.session_id if req else (session_id or "default")
    return replay_manager.stop_session(s_id)


@router.post("/seek")
async def seek_replay(
    req: Optional[ReplaySeekRequest] = Body(None),
    session_id: Optional[str] = Query(None),
    target_time_s: Optional[float] = Query(None)
) -> Dict[str, Any]:
    """
    Seeks to exact timestamp.
    Re-warms causal filter state from 2.0s prior to target time to avoid edge transients.
    """
    s_id = req.session_id if req else (session_id or "default")
    t_s = req.target_time_s if req else (target_time_s or 0.0)
    return replay_manager.seek_session(s_id, float(t_s))


@router.post("/speed")
async def change_speed(
    session_id: Optional[str] = Query(None),
    speed: float = Query(1.0)
) -> Dict[str, Any]:
    """Updates playback speed (0.25x - 4x)."""
    s_id = session_id or "default"
    return replay_manager.set_speed(s_id, speed)


@router.get("/get/{session_id}")
async def get_replay_status(session_id: str) -> Dict[str, Any]:
    """Returns real-time status of the replay session."""
    if session_id not in replay_manager.active_sessions:
        # Auto-create if not yet instantiated
        sess = replay_manager.get_or_create_session(session_id)
    else:
        sess = replay_manager.active_sessions[session_id]

    source = sess["source"]
    return {
        "session_id": session_id,
        "mode_badge": source.mode_badge,
        "split_name": source.split_name,
        "is_running": source.is_running,
        "is_paused": source.is_paused,
        "current_timestamp": source.current_time_s,
        "total_duration": source.total_duration_s,
        "speed": sess["speed"],
        "recent_decodes": sess["event_log"][-10:]
    }


@router.post("/override")
async def staff_override(req: StaffOverrideRequest) -> Dict[str, Any]:
    """
    Triggers control target (ACCEPT, CONTINUE, NEXT, BACKSPACE, SPEAK, F1-F4)
    via staff override. Carries score=null and source=staff_override (Principle 3).
    """
    return replay_manager.staff_override(req.session_id, req.action_id, req.label)


@router.websocket("/ws/{session_id}")
async def websocket_replay_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time EEG sliding window stream and event broadcasts.
    """
    await replay_manager.connect_ws(session_id, websocket)
    try:
        while True:
            # Keep connection open and receive optional client messages (seek, speed change)
            data = await websocket.receive_json()
            cmd = data.get("command")
            if cmd == "start":
                replay_manager.start_session(session_id, mode=data.get("mode", "replay"), speed=data.get("speed", 1.0))
            elif cmd == "pause":
                replay_manager.pause_session(session_id)
            elif cmd == "resume":
                replay_manager.resume_session(session_id)
            elif cmd == "seek":
                replay_manager.seek_session(session_id, float(data.get("target_time_s", 0.0)))
            elif cmd == "override":
                replay_manager.staff_override(session_id, data.get("action_id", "ACCEPT"), data.get("label", "Accept"))
    except WebSocketDisconnect:
        replay_manager.disconnect_ws(session_id, websocket)
    except Exception:
        replay_manager.disconnect_ws(session_id, websocket)
