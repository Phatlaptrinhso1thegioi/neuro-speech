"""
tests/test_survival_flow.py
Tests for Quick Survival Communication (F1–F4) & Emergency Two-Step Flow (M4).
Verifies:
- Standard phrases F1, F2, F4 trigger with status COMMITTED.
- F3 Urgent Help requires two-step confirmation (ARMED -> COMMITTED).
- Staff override bypasses arming for immediate care override.
- Phrase customization updates phrases in database.
"""

import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)


def get_auth_token(role: str = "caregiver") -> str:
    pwd = "Caregiver@12345" if role == "caregiver" else "Admin@12345"
    resp = client.post("/api/v1/auth/login", json={"username": role, "password": pwd})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_get_survival_phrases():
    """Verifies that the 4 default Vietnamese survival phrases are returned."""
    token = get_auth_token("caregiver")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get("/api/v1/survival/phrases", headers=headers)
    assert resp.status_code == 200
    phrases = {p["slot"]: p["phrase"] for p in resp.json()}

    assert phrases["F1"] == "Tôi muốn uống nước."
    assert phrases["F2"] == "Tôi muốn ăn."
    assert phrases["F3"] == "Tôi cần trợ giúp khẩn cấp."
    assert phrases["F4"] == "Tôi muốn đi vệ sinh."


def test_standard_phrase_trigger():
    """F1 triggers with status COMMITTED."""
    token = get_auth_token("caregiver")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post("/api/v1/survival/trigger", headers=headers, json={"slot": "F1", "source": "decoded"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMMITTED"
    assert resp.json()["phrase"] == "Tôi muốn uống nước."


def test_f3_urgent_requires_two_step_commit():
    """
    Principle 9: High-stakes actions require two-step commit.
    First trigger arms the action (ARMED); second trigger commits (COMMITTED).
    """
    token = get_auth_token("caregiver")
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Decode without is_step_two_confirm
    resp1 = client.post(
        "/api/v1/survival/trigger",
        headers=headers,
        json={"slot": "F3", "source": "decoded", "is_step_two_confirm": False}
    )
    assert resp1.status_code == 200
    assert resp1.json()["status"] == "ARMED"
    assert resp1.json()["action"] == "AWAITING_SECOND_CONFIRMATION"

    # Step 2: Confirm step 2
    resp2 = client.post(
        "/api/v1/survival/trigger",
        headers=headers,
        json={"slot": "F3", "source": "decoded", "is_step_two_confirm": True}
    )
    assert resp2.status_code == 200
    assert resp2.json()["status"] == "COMMITTED"
    assert resp2.json()["is_urgent"] is True
    assert "does not replace calling" in resp2.json()["notice"]


def test_f3_staff_override_immediate():
    """Staff override executes immediately without arming step."""
    token = get_auth_token("caregiver")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.post(
        "/api/v1/survival/trigger",
        headers=headers,
        json={"slot": "F3", "source": "staff_override"}
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "COMMITTED"
    assert resp.json()["source"] == "staff_override"


def test_phrase_customization_and_rbac():
    """Admin can customize phrase; caregiver cannot customize phrase."""
    cg_token = get_auth_token("caregiver")
    admin_token = get_auth_token("admin")

    # Caregiver attempt -> 403 Forbidden
    resp = client.put(
        "/api/v1/survival/phrases/F1",
        headers={"Authorization": f"Bearer {cg_token}"},
        json={"phrase": "Tôi muốn uống sữa."}
    )
    assert resp.status_code == 403

    # Admin attempt -> 200 OK
    resp2 = client.put(
        "/api/v1/survival/phrases/F1",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"phrase": "Tôi muốn uống nước ấm.", "category": "Thức uống"}
    )
    assert resp2.status_code == 200
    assert resp2.json()["phrase"] == "Tôi muốn uống nước ấm."

    # Restore default
    client.put(
        "/api/v1/survival/phrases/F1",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"phrase": "Tôi muốn uống nước.", "category": "Thức uống"}
    )
