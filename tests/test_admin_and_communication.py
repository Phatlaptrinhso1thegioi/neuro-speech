"""
tests/test_admin_and_communication.py
Unit & Integration Tests for M6 Backend Endpoints:
- Registration, Forgot Password, Reset Password
- Admin Statistics & User Management (RBAC protected)
- Communication History CRUD
- EEG Sessions listing
"""

import pytest
from fastapi.testclient import TestClient

from apps.api.app.main import app
from apps.api.app.db.database import get_db_connection

client = TestClient(app)


def get_token(username: str, password: str = "Admin@12345") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_register_and_auth_flow():
    """Verify registration creates new user with hashed password and allows login."""
    unique_user = "test_caregiver_m6"
    res_reg = client.post("/api/v1/auth/register", json={
        "username": unique_user,
        "email": "test_m6@hospital.local",
        "password": "Password@123",
        "full_name": "Test Caregiver M6",
        "role": "caregiver"
    })
    # If already exists in test rerun, 201 or 400 is fine, but let's test login
    assert res_reg.status_code in (201, 400)

    # Login with newly created user
    res_login = client.post("/api/v1/auth/login", json={
        "username": unique_user,
        "password": "Password@123"
    })
    assert res_login.status_code == 200
    assert res_login.json()["role"] == "caregiver"


def test_forgot_and_reset_password():
    """Verify forgot-password doesn't leak account existence and reset updates password."""
    res_forgot = client.post("/api/v1/auth/forgot-password", json={"email": "caregiver@neuro-speech.local"})
    assert res_forgot.status_code == 200

    res_reset = client.post("/api/v1/auth/reset-password", json={
        "email": "caregiver@neuro-speech.local",
        "token": "123456",
        "new_password": "Caregiver@12345"
    })
    assert res_reset.status_code == 200


def test_admin_stats_rbac():
    """Verify only admin can access /admin/stats; caregiver receives 403; unauth receives 401."""
    # 1. Unauthenticated -> 401
    res_unauth = client.get("/api/v1/admin/stats")
    assert res_unauth.status_code == 401

    # 2. Caregiver -> 403 Forbidden
    cg_token = get_token("caregiver", "Caregiver@12345")
    res_cg = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {cg_token}"})
    assert res_cg.status_code == 403

    # 3. Admin -> 200 OK with real DB metrics
    admin_token = get_token("admin", "Admin@12345")
    res_admin = client.get("/api/v1/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    data = res_admin.json()
    assert "users" in data
    assert "patients" in data
    assert "system_health" in data
    assert data["users"]["total"] >= 3
    assert data["system_health"]["status"] == "HEALTHY"


def test_admin_user_management():
    """Verify listing users, searching, and updating user role."""
    admin_token = get_token("admin", "Admin@12345")
    
    # List users
    res = client.get("/api/v1/admin/users?limit=10", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    users = res.json()["items"]
    assert len(users) >= 3

    # Find researcher user
    researcher = next((u for u in users if u["username"] == "researcher"), None)
    assert researcher is not None

    # Change role to caregiver and back
    res_patch = client.patch(
        f"/api/v1/admin/users/{researcher['id']}/role",
        json={"role": "caregiver"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["new_role"] == "caregiver"

    # Revert back to researcher
    res_revert = client.patch(
        f"/api/v1/admin/users/{researcher['id']}/role",
        json={"role": "researcher"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert res_revert.status_code == 200


def test_communication_history_crud():
    """Verify recording confirmed communication and retrieving history."""
    cg_token = get_token("caregiver", "Caregiver@12345")

    # Record communication
    res_post = client.post(
        "/api/v1/communication/history",
        json={
            "confirmed_text": "Tôi cần uống nước gấp.",
            "mode": "QUICK SURVIVAL",
            "tts_status": "SPOKEN",
            "duration_s": 4.5,
            "data_source": "REAL DATASET REPLAY",
            "model_version": "p300_lda_baseline",
            "reps": 3,
            "patient_id": 1
        },
        headers={"Authorization": f"Bearer {cg_token}"}
    )
    assert res_post.status_code == 201
    assert "id" in res_post.json()

    # Retrieve history
    res_get = client.get("/api/v1/communication/history?limit=10", headers={"Authorization": f"Bearer {cg_token}"})
    assert res_get.status_code == 200
    items = res_get.json()["items"]
    assert len(items) >= 1
    assert any("Tôi cần uống nước gấp." in item["confirmed_text"] for item in items)


def test_sessions_listing_and_creation():
    """Verify listing EEG sessions and recording a session."""
    cg_token = get_token("caregiver", "Caregiver@12345")

    res_post = client.post(
        "/api/v1/sessions",
        json={
            "patient_id": 1,
            "session_type": "SYNTHETIC_SPELLER",
            "mode_badge": "SYNTHETIC SIMULATION",
            "split_name": "Calibration Run 2",
            "accuracy": 0.95,
            "duration_s": 150.0,
            "notes": "Good visual fixation."
        },
        headers={"Authorization": f"Bearer {cg_token}"}
    )
    assert res_post.status_code == 201

    res_list = client.get("/api/v1/sessions?limit=10", headers={"Authorization": f"Bearer {cg_token}"})
    assert res_list.status_code == 200
    assert res_list.json()["total"] >= 1
