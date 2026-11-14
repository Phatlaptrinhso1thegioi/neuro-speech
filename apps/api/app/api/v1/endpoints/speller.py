"""
apps/api/app/api/v1/endpoints/speller.py
REST endpoints for Speller State Machine (M2b).
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from apps.api.app.ai.speller_state_machine import SpellerStateMachine

router = APIRouter(prefix="/speller", tags=["speller"])

# Global session instance
speller_instance = SpellerStateMachine()


class SpellerInputRequest(BaseModel):
    letter: str = Field(min_length=1, max_length=1)
    source: str = Field(default="decoded")


class SequenceInputRequest(BaseModel):
    text: str
    clear_first: bool = Field(default=True)
    source: str = Field(default="decoded")


class AcceptSuggestionRequest(BaseModel):
    score: Optional[float] = None
    source: str = Field(default="staff_override")
    candidate_index: Optional[int] = None


class SpellerActionRequest(BaseModel):
    source: str = Field(default="staff_override")


class HighStakesRequest(BaseModel):
    action_id: str = Field(description="SPEAK or F3_URGENT")
    source: str = Field(default="decoded")


@router.get("/state")
def get_speller_state() -> Dict[str, Any]:
    """Returns the current state of the speller state machine."""
    return speller_instance.get_state_dict()


@router.post("/session")
def reset_or_init_session() -> Dict[str, Any]:
    """Resets the speller state machine for a new communication session."""
    global speller_instance
    speller_instance = SpellerStateMachine()
    return {"status": "SESSION_INITIALIZED", **speller_instance.get_state_dict()}


@router.post("/decode-character")
def input_character(req: SpellerInputRequest) -> Dict[str, Any]:
    """Inputs a decoded or staff-override character into the speller."""
    return speller_instance.input_letter(req.letter, source=req.source)


@router.post("/decode-sequence")
def input_sequence(req: SequenceInputRequest) -> Dict[str, Any]:
    """Atomically processes a full string sequence in strict sequential order without race conditions."""
    if req.clear_first:
        speller_instance.raw_word_buffer = ""
        speller_instance.telex_word_buffer = ""
        speller_instance.sentence_buffer.clear()
        speller_instance.candidates = []
        speller_instance.highlighted_idx = 0
        speller_instance.state = speller_instance.state.SPELLING
        speller_instance.just_accepted = False
        speller_instance.pre_accept_state = None
        speller_instance._cancel_armed_action(reason="Sequence reset")

    for ch in req.text:
        if ch in (" ", "_"):
            speller_instance.input_letter(" ", source=req.source)
        else:
            speller_instance.input_letter(ch, source=req.source)

    return speller_instance.get_state_dict()


@router.post("/accept-suggestion")
def accept_suggestion(req: AcceptSuggestionRequest) -> Dict[str, Any]:
    """Explicitly accepts and commits the highlighted suggestion to the sentence buffer."""
    return speller_instance.handle_accept(
        score=req.score,
        source=req.source,
        candidate_index=req.candidate_index,
    )


@router.post("/reject-suggestion")
def reject_suggestion(req: SpellerActionRequest) -> Dict[str, Any]:
    """Rejects suggestions; keeps raw buffer unchanged; returns to SPELLING."""
    return speller_instance.handle_continue(source=req.source)


@router.post("/next-suggestion")
def next_suggestion(req: SpellerActionRequest) -> Dict[str, Any]:
    """Cycles to next suggestion candidate."""
    return speller_instance.handle_next(source=req.source)


@router.post("/backspace")
def backspace(req: SpellerActionRequest) -> Dict[str, Any]:
    """Deletes last character, or restores pre-accept buffer if immediately after ACCEPT."""
    return speller_instance.handle_backspace(source=req.source)


@router.post("/clear")
def clear_speller(req: SpellerActionRequest) -> Dict[str, Any]:
    """Clears the current word buffer or sentence buffer."""
    return speller_instance.handle_clear(source=req.source)


@router.post("/high-stakes")
def high_stakes_action(req: HighStakesRequest) -> Dict[str, Any]:
    """Two-step commit for high stakes actions (SPEAK, F3 Urgent)."""
    return speller_instance.handle_high_stakes_action(req.action_id, source=req.source)
