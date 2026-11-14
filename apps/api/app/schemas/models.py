"""
apps/api/app/schemas/models.py
Pydantic Schemas for M2a REST & WebSocket API.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ReplayStartRequest(BaseModel):
    session_id: str = Field(default="sess_2", description="Session identifier")
    mode: str = Field(default="replay", description="Mode: 'replay' or 'synthetic'")
    speed: float = Field(default=1.0, ge=0.25, le=4.0, description="Playback speed: 0.25x to 4x")


class ReplaySeekRequest(BaseModel):
    session_id: str
    target_time_s: float = Field(ge=0.0, description="Target timestamp in seconds")


class ReplayActionRequest(BaseModel):
    session_id: str


class StaffOverrideRequest(BaseModel):
    session_id: str
    action_id: str = Field(description="Action ID: ACCEPT, CONTINUE, NEXT, BACKSPACE, SPEAK, F1-F4")
    label: str = Field(description="Display label of action")


class PreprocessRequest(BaseModel):
    signals: List[List[float]] = Field(description="2D array of signals (n_channels, n_samples)")
    sfreq: float = Field(default=256.0)
    low_cut: float = Field(default=0.1)
    high_cut: float = Field(default=20.0)
    notch_freq: Optional[float] = None


class DecodeBatchRequest(BaseModel):
    epochs: List[List[List[float]]] = Field(description="3D array (n_epochs, n_channels, n_times)")
    stimulus_codes: Optional[List[int]] = None
