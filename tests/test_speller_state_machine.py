"""
tests/test_speller_state_machine.py
Unit tests and Hypothesis property-based tests for SpellerStateMachine (M2b).
Critical invariant:
For random event sequences, a suggestion is never committed without an explicit ACCEPT.
"""

import time
import pytest
from hypothesis import given, strategies as st

from apps.api.app.ai.speller_state_machine import SpellerStateMachine, SpellerState


def test_basic_spelling_and_suggestions():
    """Tests basic letter typing, candidate computation, and state transitions."""
    sm = SpellerStateMachine()
    assert sm.state == SpellerState.SPELLING

    # Type 'm' (1 char: no suggestions yet)
    sm.input_letter('m')
    assert sm.state == SpellerState.SPELLING
    assert sm.raw_word_buffer == 'm'
    assert sm.candidates == []

    # Type 'u' -> 'mu' (2 chars: suggestions become available -> WAITING_FOR_USER_DECISION)
    sm.input_letter('u')
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION
    assert len(sm.candidates) > 0
    assert sm.suggestions_displayed_timestamp is not None
    assert "1/" in sm.get_state_dict()["k_of_n"]


def test_accept_suggestion_staff_override():
    """Tests accepting suggestion via staff override (skips threshold)."""
    sm = SpellerStateMachine()
    sm.input_letter('m')
    sm.input_letter('u')
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION

    # Staff override ACCEPT
    res = sm.handle_accept(source="staff_override")
    assert res["status"] == "WORD_COMMITTED"
    assert sm.state == SpellerState.SPELLING
    assert sm.current_confirmed_text == "muốn"
    assert sm.raw_word_buffer == ""
    assert sm.candidates == []


def test_accept_suggestion_decoded_threshold():
    """Tests that decoded ACCEPT requires score >= threshold."""
    sm = SpellerStateMachine(accept_score_threshold=0.5)
    sm.input_letter('m')
    sm.input_letter('u')

    # Decoded accept with score 0.2 < 0.5 -> RESELECT_REQUIRED
    res_low = sm.handle_accept(score=0.2, source="decoded")
    assert res_low["status"] == "RESELECT_REQUIRED"
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION
    assert sm.current_confirmed_text == ""

    # Decoded accept with score 0.8 >= 0.5 -> COMMITTED
    res_ok = sm.handle_accept(score=0.8, source="decoded")
    assert res_ok["status"] == "WORD_COMMITTED"
    assert sm.state == SpellerState.SPELLING
    assert sm.current_confirmed_text == "muốn"


def test_continue_rejects_suggestion():
    """Tests CONTINUE: raw buffer unchanged (APPL stays APPL), returns to SPELLING."""
    sm = SpellerStateMachine()
    sm.input_letter('u')
    sm.input_letter('o')
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION
    assert sm.raw_word_buffer == "uo"

    # User triggers CONTINUE
    sm.handle_continue()
    assert sm.state == SpellerState.SPELLING
    assert sm.raw_word_buffer == "uo"  # Unchanged!
    assert sm.current_confirmed_text == ""
    assert sm.candidates == []


def test_next_cycles_candidates_with_wrap_around():
    """Tests NEXT candidate navigation and wrap-around with k/n format."""
    sm = SpellerStateMachine()
    sm.input_letter('v')
    sm.input_letter('i')
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION

    total_candidates = len(sm.candidates)
    assert total_candidates >= 2
    assert sm.highlighted_idx == 0

    sm.handle_next()
    assert sm.highlighted_idx == 1
    assert f"2/{total_candidates}" == sm.get_state_dict()["k_of_n"]

    # Cycle through all
    for _ in range(total_candidates - 1):
        sm.handle_next()

    # Wrap-around back to 0
    assert sm.highlighted_idx == 0
    assert f"1/{total_candidates}" == sm.get_state_dict()["k_of_n"]
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION


def test_letter_in_waiting_decision_is_continue():
    """A letter received in WAITING_FOR_USER_DECISION must act as CONTINUE + letter, never accept."""
    sm = SpellerStateMachine()
    sm.input_letter('m')
    sm.input_letter('u')
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION

    # Type letter 'o' instead of accepting
    sm.input_letter('o')
    assert sm.current_confirmed_text == ""  # Never accepted!
    assert "muo" in sm.raw_word_buffer


def test_timeout_in_waiting_decision():
    """Timeout in WAITING_FOR_USER_DECISION stays in state, never commits."""
    sm = SpellerStateMachine()
    sm.input_letter('m')
    sm.input_letter('u')
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION

    sm.handle_timeout()
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION
    assert sm.current_confirmed_text == ""


def test_undo_accept_via_backspace():
    """Tests that BACKSPACE immediately after ACCEPT restores pre-accept buffer (UNDO_ACCEPT)."""
    sm = SpellerStateMachine()
    sm.input_letter('m')
    sm.input_letter('u')
    sm.handle_accept(source="staff_override")
    assert sm.current_confirmed_text == "muốn"
    assert sm.raw_word_buffer == ""

    # Immediately hit BACKSPACE -> restores pre-accept state
    res = sm.handle_backspace()
    assert res["status"] == "UNDONE"
    assert sm.current_confirmed_text == ""
    assert sm.raw_word_buffer == "mu"
    assert sm.state == SpellerState.WAITING_FOR_USER_DECISION


def test_high_stakes_two_step_commit():
    """Tests two-step commit for SPEAK and urgent help (F3)."""
    sm = SpellerStateMachine(two_step_window_s=2.0)
    sm.sentence_buffer = ["Tôi", "cần", "trợ", "giúp"]

    # Step 1: Arm action
    arm_res = sm.handle_high_stakes_action("SPEAK", source="decoded")
    assert arm_res["status"] == "ARMED"
    assert sm.armed_action == "SPEAK"

    # Step 2: Confirm action within window
    commit_res = sm.handle_high_stakes_action("SPEAK", source="decoded")
    assert commit_res["status"] == "COMMITTED"
    assert sm.armed_action is None

    # Test interruption cancels armed action
    sm.handle_high_stakes_action("F3_URGENT", source="decoded")
    assert sm.armed_action == "F3_URGENT"
    # Interrupted by typing a letter
    sm.input_letter('a')
    assert sm.armed_action is None


# =========================================================================
# CRITICAL PROPERTY-BASED TEST (Hypothesis)
# =========================================================================
@given(
    st.lists(
        st.tuples(
            st.sampled_from(["letter", "backspace", "next", "continue", "timeout", "clear"]),
            st.text(alphabet="abcdefghijklmnopqrstuvwxyz", min_size=1, max_size=1)
        ),
        min_size=1,
        max_size=50
    )
)
def test_property_no_suggestion_committed_without_explicit_accept(events):
    """
    CRITICAL INVARIANT (Principle 9):
    For any random event sequence not containing an explicit ACCEPT,
    a suggestion candidate is NEVER committed to the confirmed sentence buffer.
    """
    sm = SpellerStateMachine()

    for event_type, char in events:
        if event_type == "letter":
            sm.input_letter(char)
        elif event_type == "backspace":
            sm.handle_backspace()
        elif event_type == "next":
            sm.handle_next()
        elif event_type == "continue":
            sm.handle_continue()
        elif event_type == "timeout":
            sm.handle_timeout()
        elif event_type == "clear":
            sm.handle_clear()

        # Invariant check:
        # Since handle_accept was never called, sentence buffer MUST remain completely empty!
        assert len(sm.sentence_buffer) == 0, (
            f"Violation! Candidate committed without explicit ACCEPT! Buffer: {sm.sentence_buffer}"
        )
        assert sm.current_confirmed_text == ""
