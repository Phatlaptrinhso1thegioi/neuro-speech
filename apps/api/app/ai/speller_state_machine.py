"""
apps/api/app/ai/speller_state_machine.py
Speller State Machine for NEURO-SPEECH.
Enforces the exact state machine:
  SPELLING -> SUGGESTION_AVAILABLE -> WAITING_FOR_USER_DECISION -> WORD_ACCEPTED | SPELLING
Features:
  - Explicit user confirmation before committing suggestions (Principle 9)
  - One-level undo after ACCEPT via BACKSPACE (UNDO_ACCEPT)
  - Two-step commit for high-stakes actions (SPEAK and F3 Urgent Help)
  - Full audit logging of all transitions with timestamp and source
"""

import time
from enum import Enum
from typing import List, Dict, Any, Optional, Tuple

from apps.api.app.ai.telex import VietnameseTelexParser
from apps.api.app.ai.word_suggester import WordSuggester


class SpellerState(str, Enum):
    SPELLING = "SPELLING"
    SUGGESTION_AVAILABLE = "SUGGESTION_AVAILABLE"
    WAITING_FOR_USER_DECISION = "WAITING_FOR_USER_DECISION"
    WORD_ACCEPTED = "WORD_ACCEPTED"


class SpellerStateMachine:
    """
    Finite State Machine implementing BCI speller interaction logic.
    Ensures that suggestions never enter confirmed text without explicit user acceptance.
    """

    def __init__(
        self,
        suggester: Optional[WordSuggester] = None,
        accept_score_threshold: float = 0.0,
        two_step_window_s: float = 5.0,
        vietnamese_mode: bool = True
    ):
        self.suggester = suggester or WordSuggester()
        self.accept_score_threshold = accept_score_threshold
        self.two_step_window_s = two_step_window_s
        self.vietnamese_mode = vietnamese_mode

        # Core Text Buffers
        self.sentence_buffer: List[str] = []   # Confirmed words
        self.raw_word_buffer: str = ""         # Characters of current unconfirmed word
        self.telex_word_buffer: str = ""       # Telex-composed unconfirmed word

        # State
        self.state: SpellerState = SpellerState.SPELLING

        # Suggestions
        self.candidates: List[str] = []
        self.highlighted_idx: int = 0
        self.suggestions_displayed_timestamp: Optional[float] = None

        # Undo State (1 level after ACCEPT)
        self.pre_accept_state: Optional[Dict[str, Any]] = None
        self.just_accepted: bool = False

        # Two-Step Commit State for High-Stakes Actions (SPEAK, F3 Urgent)
        self.armed_action: Optional[str] = None
        self.armed_timestamp: Optional[float] = None

        # Audit transition log
        self.transition_log: List[Dict[str, Any]] = []

    @property
    def current_confirmed_text(self) -> str:
        """Full confirmed text in sentence buffer."""
        return " ".join(self.sentence_buffer)

    @property
    def current_display_text(self) -> str:
        """Full sentence buffer plus currently typing word."""
        confirmed = self.current_confirmed_text
        current = self.telex_word_buffer if self.vietnamese_mode else self.raw_word_buffer
        if confirmed and current:
            return f"{confirmed} {current}"
        return confirmed or current

    def _log_transition(self, event: str, from_state: SpellerState, to_state: SpellerState, source: str, detail: str = ""):
        self.transition_log.append({
            "timestamp": time.time(),
            "event": event,
            "from_state": from_state.value,
            "to_state": to_state.value,
            "source": source,
            "detail": detail,
            "raw_buffer": self.raw_word_buffer,
            "telex_buffer": self.telex_word_buffer,
            "confirmed_sentence": self.current_confirmed_text
        })

    def _update_suggestions(self):
        """Computes candidates from current prefix. Transitions to SUGGESTION_AVAILABLE if found."""
        prev_word = self.sentence_buffer[-1] if self.sentence_buffer else None
        prefix = self.telex_word_buffer if self.vietnamese_mode else self.raw_word_buffer

        self.candidates = self.suggester.suggest(prefix, previous_confirmed_word=prev_word, max_candidates=5)
        self.highlighted_idx = 0

        if self.candidates:
            self.state = SpellerState.SUGGESTION_AVAILABLE
            # Move immediately to WAITING_FOR_USER_DECISION and record timestamp
            self.suggestions_displayed_timestamp = time.time()
            self._log_transition(
                event="SUGGESTIONS_COMPUTED",
                from_state=SpellerState.SUGGESTION_AVAILABLE,
                to_state=SpellerState.WAITING_FOR_USER_DECISION,
                source="ai_engine",
                detail=f"Candidates: {self.candidates}"
            )
            self.state = SpellerState.WAITING_FOR_USER_DECISION
        else:
            self.state = SpellerState.SPELLING

    def input_letter(self, letter: str, source: str = "decoded") -> Dict[str, Any]:
        """
        Receives an alphabetic letter input or word delimiter (' ' / '_').
        If in WAITING_FOR_USER_DECISION, logged as CONTINUE followed by that letter (Never commits AI suggestions).
        """
        self.just_accepted = False
        prev_state = self.state

        if self.state == SpellerState.WAITING_FOR_USER_DECISION:
            # Rule: A letter in WAITING_FOR_USER_DECISION is logged as CONTINUE followed by that letter
            self._log_transition(
                event="CONTINUE_ON_LETTER",
                from_state=self.state,
                to_state=SpellerState.SPELLING,
                source=source,
                detail=f"User typed '{letter}' instead of accepting suggestions."
            )
            self.state = SpellerState.SPELLING
            self.candidates = []

        # Cancel any armed two-step commit
        self._cancel_armed_action(reason=f"Interrupted by letter '{letter}'")

        # Handle word delimiter (' ' or '_'): commit manually typed buffer word (not AI suggestions)
        if letter in (" ", "_"):
            typed_word = (self.telex_word_buffer if self.vietnamese_mode else self.raw_word_buffer).strip()
            if typed_word:
                self.sentence_buffer.append(typed_word)
                self.raw_word_buffer = ""
                self.telex_word_buffer = ""
                self.candidates = []
                self.highlighted_idx = 0
                self._log_transition(
                    event="SPACE_COMMIT_TYPED_WORD",
                    from_state=prev_state,
                    to_state=SpellerState.SPELLING,
                    source=source,
                    detail=f"Committed manually typed word '{typed_word}' on delimiter."
                )
            return self.get_state_dict()

        # Append letter to buffer
        self.raw_word_buffer += letter
        if self.vietnamese_mode:
            self.telex_word_buffer = VietnameseTelexParser.parse_text(self.raw_word_buffer)
        else:
            self.telex_word_buffer = self.raw_word_buffer

        self._log_transition(
            event=f"INPUT_LETTER_{letter}",
            from_state=prev_state,
            to_state=SpellerState.SPELLING,
            source=source
        )

        # Recompute suggestions
        self._update_suggestions()

        return self.get_state_dict()

    def handle_accept(
        self,
        score: Optional[float] = None,
        source: str = "staff_override",
        candidate_index: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Commits the highlighted (or explicitly selected) suggestion to sentence buffer.
        If decoded, requires score >= accept_score_threshold.
        If staff override, score is None and skips threshold.
        """
        if self.state != SpellerState.WAITING_FOR_USER_DECISION or not self.candidates:
            return {"status": "IGNORED", "reason": "No suggestion available to accept", **self.get_state_dict()}

        if candidate_index is not None and 0 <= candidate_index < len(self.candidates):
            self.highlighted_idx = candidate_index

        # Verify threshold for neural decoded events
        if source == "decoded" and score is not None and score < self.accept_score_threshold:
            self._log_transition(
                event="ACCEPT_BELOW_THRESHOLD",
                from_state=self.state,
                to_state=self.state,
                source=source,
                detail=f"Score {score:.3f} below threshold {self.accept_score_threshold:.3f}"
            )
            return {"status": "RESELECT_REQUIRED", "reason": "Score below threshold", **self.get_state_dict()}

        # Save pre-accept state for one-level undo
        self.pre_accept_state = {
            "sentence_buffer": list(self.sentence_buffer),
            "raw_word_buffer": self.raw_word_buffer,
            "telex_word_buffer": self.telex_word_buffer,
            "candidates": list(self.candidates),
            "highlighted_idx": self.highlighted_idx
        }
        self.just_accepted = True

        accepted_word = self.candidates[self.highlighted_idx]

        # Transient state: WORD_ACCEPTED
        self.state = SpellerState.WORD_ACCEPTED
        self._log_transition(
            event="ACCEPT_SUGGESTION",
            from_state=SpellerState.WAITING_FOR_USER_DECISION,
            to_state=SpellerState.WORD_ACCEPTED,
            source=source,
            detail=f"Accepted word: '{accepted_word}' (score: {score})"
        )

        # Commit to sentence buffer and clear current word buffer
        self.sentence_buffer.append(accepted_word)
        self.raw_word_buffer = ""
        self.telex_word_buffer = ""
        self.candidates = []
        self.highlighted_idx = 0

        # Always returns to SPELLING from WORD_ACCEPTED
        self.state = SpellerState.SPELLING
        self._log_transition(
            event="RETURN_TO_SPELLING",
            from_state=SpellerState.WORD_ACCEPTED,
            to_state=SpellerState.SPELLING,
            source="system"
        )

        return {"status": "WORD_COMMITTED", "word": accepted_word, **self.get_state_dict()}

    def handle_continue(self, source: str = "staff_override") -> Dict[str, Any]:
        """
        Rejects suggestions. Buffer stays unchanged (APPL stays APPL). Returns to SPELLING.
        """
        if self.state != SpellerState.WAITING_FOR_USER_DECISION:
            return {"status": "IGNORED", **self.get_state_dict()}

        self._log_transition(
            event="CONTINUE_REJECT_SUGGESTIONS",
            from_state=self.state,
            to_state=SpellerState.SPELLING,
            source=source,
            detail=f"Rejected candidates: {self.candidates}. Raw buffer kept: '{self.raw_word_buffer}'"
        )
        self.state = SpellerState.SPELLING
        self.candidates = []
        self.highlighted_idx = 0
        return {"status": "SUGGESTIONS_REJECTED", **self.get_state_dict()}

    def handle_next(self, source: str = "staff_override") -> Dict[str, Any]:
        """
        Cycles to next suggestion candidate. Wraps to the first and displays k/n.
        Stays in WAITING_FOR_USER_DECISION.
        """
        if self.state != SpellerState.WAITING_FOR_USER_DECISION or not self.candidates:
            return {"status": "IGNORED", **self.get_state_dict()}

        n = len(self.candidates)
        self.highlighted_idx = (self.highlighted_idx + 1) % n
        k_of_n = f"{self.highlighted_idx + 1}/{n}"

        self._log_transition(
            event="NEXT_SUGGESTION",
            from_state=self.state,
            to_state=self.state,
            source=source,
            detail=f"Highlighted: {self.candidates[self.highlighted_idx]} ({k_of_n})"
        )
        return {"status": "NEXT_CANDIDATE", "k_of_n": k_of_n, **self.get_state_dict()}

    def handle_backspace(self, source: str = "staff_override") -> Dict[str, Any]:
        """
        Deletes last character.
        If immediately after ACCEPT, restores pre-accept buffer (UNDO_ACCEPT).
        """
        if self.just_accepted and self.pre_accept_state:
            # One-level undo: restore pre-accept buffer
            self.sentence_buffer = list(self.pre_accept_state["sentence_buffer"])
            self.raw_word_buffer = self.pre_accept_state["raw_word_buffer"]
            self.telex_word_buffer = self.pre_accept_state["telex_word_buffer"]
            self.candidates = list(self.pre_accept_state["candidates"])
            self.highlighted_idx = self.pre_accept_state["highlighted_idx"]
            self.just_accepted = False

            self._log_transition(
                event="UNDO_ACCEPT",
                from_state=self.state,
                to_state=SpellerState.WAITING_FOR_USER_DECISION,
                source=source,
                detail="Restored pre-accept buffer."
            )
            self.state = SpellerState.WAITING_FOR_USER_DECISION
            return {"status": "UNDONE", **self.get_state_dict()}

        self.just_accepted = False

        if self.state == SpellerState.WAITING_FOR_USER_DECISION:
            self.state = SpellerState.SPELLING
            self.candidates = []

        if self.raw_word_buffer:
            self.raw_word_buffer = self.raw_word_buffer[:-1]
            if self.vietnamese_mode:
                self.telex_word_buffer = VietnameseTelexParser.parse_text(self.raw_word_buffer)
            else:
                self.telex_word_buffer = self.raw_word_buffer
        elif self.sentence_buffer:
            # If word buffer empty, pull back last confirmed word into word buffer
            last_word = self.sentence_buffer.pop()
            self.raw_word_buffer = last_word
            self.telex_word_buffer = last_word

        self._log_transition(
            event="BACKSPACE",
            from_state=self.state,
            to_state=SpellerState.SPELLING,
            source=source
        )

        if self.raw_word_buffer:
            self._update_suggestions()
        else:
            self.state = SpellerState.SPELLING

        return self.get_state_dict()

    def handle_clear(self, source: str = "staff_override") -> Dict[str, Any]:
        """Clears active word buffer or sentence buffer."""
        self.just_accepted = False
        prev_state = self.state

        if self.raw_word_buffer:
            self.raw_word_buffer = ""
            self.telex_word_buffer = ""
        else:
            self.sentence_buffer.clear()

        self.candidates = []
        self.state = SpellerState.SPELLING
        self._cancel_armed_action(reason="Cleared buffer")

        self._log_transition(
            event="CLEAR",
            from_state=prev_state,
            to_state=SpellerState.SPELLING,
            source=source
        )
        return self.get_state_dict()

    def handle_timeout(self) -> Dict[str, Any]:
        """
        Timeout or no response in WAITING_FOR_USER_DECISION.
        Rule: Stay in WAITING_FOR_USER_DECISION. NEVER an accept!
        """
        if self.state == SpellerState.WAITING_FOR_USER_DECISION:
            self._log_transition(
                event="TIMEOUT",
                from_state=self.state,
                to_state=self.state,
                source="system",
                detail="Timeout expired. Kept in WAITING_FOR_USER_DECISION without committing."
            )
        # Check two-step commit timeout
        if self.armed_action and (time.time() - self.armed_timestamp) > self.two_step_window_s:
            self._cancel_armed_action(reason="Two-step commit window timed out")

        return self.get_state_dict()

    def handle_high_stakes_action(self, action_id: str, source: str = "decoded") -> Dict[str, Any]:
        """
        Two-step commit for SPEAK and urgent help (F3):
        First decode arms the action.
        Second consistent decode within two_step_window_s commits.
        Any other event or timeout cancels.
        """
        now = time.time()

        if self.armed_action == action_id and (now - self.armed_timestamp) <= self.two_step_window_s:
            # Step 2: Confirmed!
            self._log_transition(
                event=f"COMMIT_{action_id}",
                from_state=self.state,
                to_state=self.state,
                source=source,
                detail=f"Second decode confirmed {action_id} within {now - self.armed_timestamp:.2f}s."
            )
            self.armed_action = None
            self.armed_timestamp = None
            return {
                "status": "COMMITTED",
                "action": action_id,
                "text": self.current_confirmed_text,
                **self.get_state_dict()
            }
        else:
            # Step 1: Arm action
            self.armed_action = action_id
            self.armed_timestamp = now
            self._log_transition(
                event=f"ARM_{action_id}",
                from_state=self.state,
                to_state=self.state,
                source=source,
                detail=f"First decode armed {action_id}. Awaiting second consistent decode within {self.two_step_window_s}s."
            )
            return {
                "status": "ARMED",
                "action": action_id,
                "window_s": self.two_step_window_s,
                **self.get_state_dict()
            }

    def _cancel_armed_action(self, reason: str):
        if self.armed_action:
            self._log_transition(
                event=f"CANCEL_{self.armed_action}",
                from_state=self.state,
                to_state=self.state,
                source="system",
                detail=reason
            )
            self.armed_action = None
            self.armed_timestamp = None

    def get_state_dict(self) -> Dict[str, Any]:
        """Returns complete serializable state of the Speller."""
        k_of_n = f"{self.highlighted_idx + 1}/{len(self.candidates)}" if self.candidates else "0/0"
        return {
            "state": self.state.value,
            "raw_word_buffer": self.raw_word_buffer,
            "telex_word_buffer": self.telex_word_buffer,
            "sentence_buffer": list(self.sentence_buffer),
            "confirmed_sentence": self.current_confirmed_text,
            "full_display_text": self.current_display_text,
            "candidates": self.candidates,
            "highlighted_index": self.highlighted_idx,
            "highlighted_word": self.candidates[self.highlighted_idx] if self.candidates else None,
            "k_of_n": k_of_n,
            "suggestions_displayed_timestamp": self.suggestions_displayed_timestamp,
            "armed_action": self.armed_action,
            "vietnamese_mode": self.vietnamese_mode,
            "just_accepted": self.just_accepted
        }
