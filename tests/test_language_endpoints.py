"""
tests/test_language_endpoints.py
Verifies REST endpoints for Vietnamese Telex, Word Suggestions, and Speller (M2b).
"""

from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)


def test_telex_endpoint():
    """POST /api/v1/language/telex should parse Telex and return NFC normalized text."""
    resp = client.post("/api/v1/language/telex", json={"text": "Tooi muoons uoongs nuwowcs", "english_mode": False})
    assert resp.status_code == 200
    data = resp.json()
    assert data["parsed_text"] == "Tôi muốn uống nước"
    assert data["is_nfc"] is True
    assert data["english_mode"] is False


def test_telex_english_mode():
    """POST /api/v1/language/telex with english_mode=True should bypass Telex parsing."""
    resp = client.post("/api/v1/language/telex", json={"text": "Tooi muoons uoongs nuwowcs", "english_mode": True})
    assert resp.status_code == 200
    data = resp.json()
    assert data["parsed_text"] == "Tooi muoons uoongs nuwowcs"


def test_suggest_endpoint():
    """POST /api/v1/language/suggest returns word completions and bigram boosts."""
    resp = client.post("/api/v1/language/suggest", json={
        "prefix": "uo",
        "previous_word": "muốn",
        "max_candidates": 5
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "uống" in data["candidates"]
    assert len(data["candidates"]) <= 5
    assert data["adapter"] == "OFFLINE_BY_DEFAULT"


def test_speller_endpoints_flow():
    """Tests the speller REST API: reset, input letter, get state, cycle, accept, backspace."""
    # Reset
    resp = client.post("/api/v1/speller/session")
    assert resp.status_code == 200
    assert resp.json()["status"] == "SESSION_INITIALIZED"

    # Input 'T'
    resp = client.post("/api/v1/speller/decode-character", json={"letter": "T", "source": "decoded"})
    assert resp.status_code == 200
    state = resp.json()["state"]
    assert state == "SPELLING"

    # Input 'o'
    resp = client.post("/api/v1/speller/decode-character", json={"letter": "o", "source": "decoded"})
    assert resp.status_code == 200
    data = resp.json()
    # Now we have 'To' -> candidates should be available
    assert data["state"] == "WAITING_FOR_USER_DECISION"
    assert "tôi" in data["candidates"]

    # Cycle next suggestion
    resp = client.post("/api/v1/speller/next-suggestion", json={"source": "staff_override"})
    assert resp.status_code == 200

    # Accept suggestion
    resp = client.post("/api/v1/speller/accept-suggestion", json={"source": "staff_override"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "WORD_COMMITTED"
    assert resp.json()["state"] == "SPELLING"
    assert len(resp.json()["sentence_buffer"]) == 1

    # Backspace (undo accept restores pre-accept buffer and candidates)
    resp = client.post("/api/v1/speller/backspace", json={"source": "staff_override"})
    assert resp.status_code == 200
    assert resp.json()["state"] == "WAITING_FOR_USER_DECISION"
    assert resp.json()["raw_word_buffer"] == "To"
    assert len(resp.json()["sentence_buffer"]) == 0
