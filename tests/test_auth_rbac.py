"""
tests/test_auth_rbac.py
Tests for Offline JWT Authentication & Role-Based Access Control (RBAC) (M4).
Verifies that:
- Pre-seeded demo accounts (admin, researcher, caregiver) authenticate correctly.
- Caregiver cannot trigger training (403 Forbidden).
- Caregiver cannot delete patients (403 Forbidden).
- Researcher cannot delete patients (403 Forbidden).
- Admin has full access to delete patients and view audit logs.
"""

import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.db.database import init_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def get_token(username: str, password: str) -> str:
    resp = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert resp.status_code == 200, f"Login failed for {username}: {resp.text}"
    return resp.json()["access_token"]


def test_auth_login_demo_accounts():
    """Verifies all 3 pre-seeded demo accounts authenticate and return proper roles."""
    # Admin
    admin_resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "Admin@12345"})
    assert admin_resp.status_code == 200
    assert admin_resp.json()["role"] == "admin"

    # Researcher
    res_resp = client.post("/api/v1/auth/login", json={"username": "researcher", "password": "Researcher@12345"})
    assert res_resp.status_code == 200
    assert res_resp.json()["role"] == "researcher"

    # Caregiver
    cg_resp = client.post("/api/v1/auth/login", json={"username": "caregiver", "password": "Caregiver@12345"})
    assert cg_resp.status_code == 200
    assert cg_resp.json()["role"] == "caregiver"


def test_invalid_credentials_returns_401():
    """Verifies wrong password returns 401 Unauthorized."""
    resp = client.post("/api/v1/auth/login", json={"username": "admin", "password": "WrongPassword"})
    assert resp.status_code == 401


def test_caregiver_rbac_restrictions():
    """
    Principle / Spec: Caregiver role cannot trigger model training and cannot delete patients.
    """
    token = get_token("caregiver", "Caregiver@12345")
    headers = {"Authorization": f"Bearer {token}"}

    # Caregiver CAN view patients
    resp = client.get("/api/v1/patients/", headers=headers)
    assert resp.status_code == 200

    # Caregiver CANNOT trigger training -> 403 Forbidden
    resp = client.post("/api/v1/models/retrain", headers=headers)
    assert resp.status_code == 403
    assert "lacks permissions" in resp.json()["detail"]

    # Caregiver CANNOT delete patient -> 403 Forbidden
    resp = client.delete("/api/v1/patients/1", headers=headers)
    assert resp.status_code == 403


def test_researcher_rbac_permissions():
    """
    Researcher can trigger training and create patients, but cannot delete patients.
    """
    token = get_token("researcher", "Researcher@12345")
    headers = {"Authorization": f"Bearer {token}"}

    # Researcher CAN trigger training
    resp = client.post("/api/v1/models/retrain", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "JOB_DISPATCHED"

    # Researcher CANNOT delete patient -> 403 Forbidden
    resp = client.delete("/api/v1/patients/1", headers=headers)
    assert resp.status_code == 403


def test_admin_full_crud_and_audit():
    """
    Admin can create, update, delete patients and view security audit logs.
    """
    token = get_token("admin", "Admin@12345")
    headers = {"Authorization": f"Bearer {token}"}

    # Create patient
    create_resp = client.post(
        "/api/v1/patients/",
        json={
            "code": "TEST_P999",
            "birth_year": 1990,
            "handedness": "RIGHT",
            "notes": "Temporary test patient for RBAC verification"
        },
        headers=headers
    )
    assert create_resp.status_code == 201
    p_id = create_resp.json()["id"]

    # Update patient
    update_resp = client.put(
        f"/api/v1/patients/{p_id}",
        json={"notes": "Updated notes by admin"},
        headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["notes"] == "Updated notes by admin"

    # Delete patient
    del_resp = client.delete(f"/api/v1/patients/{p_id}", headers=headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "deleted"

    # Audit logs contain PATIENT_DELETE
    audit_resp = client.get("/api/v1/audit/logs", headers=headers)
    assert audit_resp.status_code == 200
    actions = [log["action"] for log in audit_resp.json()]
    assert "PATIENT_DELETE" in actions
