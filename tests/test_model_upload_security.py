"""
tests/test_model_upload_security.py
Security tests for Model Management & Upload Endpoint (M4).
Verifies:
- Rejection of unvalidated raw pickle.
- Rejection of tampered / hash-mismatched files.
- Rejection of oversized files (> 50 MB).
- Path traversal sanitization (no directory escape).
- Acceptance of checkpoints with verified SHA-256 match or valid HMAC signature.
"""

import hmac
import hashlib
import io
import pytest
from fastapi.testclient import TestClient
from apps.api.app.main import app
from apps.api.app.api.v1.endpoints.models import MODEL_HMAC_SECRET

client = TestClient(app)


def get_researcher_token() -> str:
    resp = client.post("/api/v1/auth/login", json={"username": "researcher", "password": "Researcher@12345"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def test_reject_unvalidated_raw_pickle():
    """Principle: Raw unvalidated pickles are strictly rejected without hash match or HMAC."""
    token = get_researcher_token()
    headers = {"Authorization": f"Bearer {token}"}

    dummy_content = b"fake_unvalidated_pickle_payload"
    files = {"file": ("untrusted_model.pkl", io.BytesIO(dummy_content), "application/octet-stream")}
    data = {"model_name": "Untrusted Candidate Model"}

    resp = client.post("/api/v1/models/upload", headers=headers, files=files, data=data)
    assert resp.status_code == 400
    assert "Raw unvalidated pickles are forbidden" in resp.json()["detail"]


def test_reject_tampered_sha256():
    """Tampered content with mismatched expected_sha256 is rejected."""
    token = get_researcher_token()
    headers = {"Authorization": f"Bearer {token}"}

    dummy_content = b"model_data_tampered"
    wrong_hash = "0000000000000000000000000000000000000000000000000000000000000000"

    files = {"file": ("candidate.pkl", io.BytesIO(dummy_content), "application/octet-stream")}
    data = {"model_name": "Tampered Model", "expected_sha256": wrong_hash}

    resp = client.post("/api/v1/models/upload", headers=headers, files=files, data=data)
    assert resp.status_code == 400
    assert "Untrusted model checkpoint rejected" in resp.json()["detail"]


def test_accept_verified_sha256_checkpoint():
    """Checkpoints matching explicit known-good expected_sha256 are accepted."""
    token = get_researcher_token()
    headers = {"Authorization": f"Bearer {token}"}

    valid_content = b"verified_clean_checkpoint_binary_content_2026"
    real_hash = hashlib.sha256(valid_content).hexdigest()

    files = {"file": ("valid_model.pkl", io.BytesIO(valid_content), "application/octet-stream")}
    data = {"model_name": "Verified Candidate LDA", "expected_sha256": real_hash}

    resp = client.post("/api/v1/models/upload", headers=headers, files=files, data=data)
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["status"] == "UPLOAD_ACCEPTED"
    assert res_data["sha256"] == real_hash
    assert res_data["validation_method"] == "SHA256_MATCH"


def test_accept_hmac_signed_checkpoint():
    """Checkpoints with valid HMAC-SHA256 signature are accepted."""
    token = get_researcher_token()
    headers = {"Authorization": f"Bearer {token}"}

    signed_content = b"hmac_signed_clean_weights_payload"
    signature = hmac.new(MODEL_HMAC_SECRET, signed_content, hashlib.sha256).hexdigest()

    files = {"file": ("signed_model.pkl", io.BytesIO(signed_content), "application/octet-stream")}
    data = {"model_name": "HMAC Signed Model", "hmac_signature": signature}

    resp = client.post("/api/v1/models/upload", headers=headers, files=files, data=data)
    assert resp.status_code == 200
    assert resp.json()["validation_method"] == "HMAC_VERIFIED"


def test_reject_oversized_checkpoint():
    """Files exceeding 50 MB size limit are rejected with 413 Payload Too Large."""
    token = get_researcher_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Simulate 51 MB payload (51 * 1024 * 1024 bytes + 10)
    oversized_len = 51 * 1024 * 1024 + 10
    # To keep test memory light, create a generator-like stream with seek/tell or bytes
    # Here we can pass 50MB + 1 byte
    oversized_bytes = b"0" * (50 * 1024 * 1024 + 1)
    files = {"file": ("huge_model.pkl", io.BytesIO(oversized_bytes), "application/octet-stream")}
    data = {"model_name": "Oversized Model", "expected_sha256": "any"}

    resp = client.post("/api/v1/models/upload", headers=headers, files=files, data=data)
    assert resp.status_code == 413
    assert "exceeds 50 MB" in resp.json()["detail"]


def test_path_sanitization_directory_traversal():
    """Path traversal sequences (e.g. ../../evil.pkl) are sanitized to base filename."""
    token = get_researcher_token()
    headers = {"Authorization": f"Bearer {token}"}

    valid_content = b"traversal_test_content"
    real_hash = hashlib.sha256(valid_content).hexdigest()

    # Filename with path traversal attempt
    traversal_filename = "../../../etc/cron.d/malicious.pkl"
    files = {"file": (traversal_filename, io.BytesIO(valid_content), "application/octet-stream")}
    data = {"model_name": "Traversal Test", "expected_sha256": real_hash}

    resp = client.post("/api/v1/models/upload", headers=headers, files=files, data=data)
    assert resp.status_code == 200

    # Verify checkpoint was stored inside models/checkpoints/, NOT escaped to /etc
    from apps.api.app.db.database import get_db_connection
    conn = get_db_connection()
    row = conn.execute("SELECT file_path FROM model_checkpoints WHERE sha256 = ?", (real_hash,)).fetchone()
    conn.close()

    assert row is not None
    saved_path = row["file_path"]
    assert "models/checkpoints" in saved_path
    assert ".." not in saved_path
