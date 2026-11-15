"""
tests/test_csv_decoder.py
Tests for the Instant CSV P300 Character Decoder (API & Core Engine).
"""

import pytest
from pathlib import Path
from fastapi.testclient import TestClient

from apps.api.app.main import app
from apps.api.app.bci.csv_decoder import decode_p300_csv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
EVENTS_CSV = PROJECT_ROOT / "datasets" / "processed" / "p300_events.csv"
if not EVENTS_CSV.exists():
    EVENTS_CSV = PROJECT_ROOT / "datasets" / "test_csv_library" / "01_international_benchmarks_bnci" / "BNCI_Subj01_Session2_HeldOut_6chars.csv"

PHRASE_CSV = PROJECT_ROOT / "datasets" / "processed" / "demo_vietnamese_phrase.csv"
if not PHRASE_CSV.exists():
    PHRASE_CSV = PROJECT_ROOT / "datasets" / "test_csv_library" / "03_vietnamese_clinical_sentences" / "Sentence_TOI_MUON_UONG_NUOC.csv"


def test_core_csv_decode_events_benchmark():
    assert EVENTS_CSV.exists()
    res = decode_p300_csv(EVENTS_CSV, max_repetitions=8)

    assert res["status"] == "SUCCESS"
    assert res["total_characters"] == 6
    # Held-out session 2 ground truth characters
    assert res["raw_characters"] == ["6", "_", "C", "4", "B", "5"]
    assert res["raw_string"] == "6_C4B5"
    assert "6 C4B5" in res["telex_vietnamese_text"]
    assert len(res["details"]) == 6


def test_core_csv_decode_vietnamese_phrase():
    assert PHRASE_CSV.exists()
    res = decode_p300_csv(PHRASE_CSV, max_repetitions=4)

    assert res["status"] == "SUCCESS"
    assert res["total_characters"] == 13
    assert res["raw_string"] == "TOI_MUON_NUOC"
    assert res["telex_vietnamese_text"] in ("TOI MUON NUOC", "TÔI MUỐN NƯỚC")


def test_api_decode_csv_preset_benchmark():
    client = TestClient(app)
    resp = client.post("/api/v1/p300/decode-csv", data={"preset": "benchmark"})
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "SUCCESS"
    assert data["raw_string"] == "6_C4B5"
    assert len(data["raw_characters"]) == 6


def test_api_decode_csv_file_upload():
    client = TestClient(app)
    with open(EVENTS_CSV, "rb") as f:
        resp = client.post(
            "/api/v1/p300/decode-csv",
            files={"file": ("p300_events.csv", f, "text/csv")},
            data={"repetitions": 8}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["raw_string"] == "6_C4B5"


def test_api_decode_bnci_subj01_session1_calibration_upload():
    """Tests the exact file that was uploaded in the clinical studio screenshot."""
    calib_csv = PROJECT_ROOT / "datasets" / "test_csv_library" / "01_international_benchmarks_bnci" / "BNCI_Subj01_Session1_Calibration_6chars.csv"
    assert calib_csv.exists()
    client = TestClient(app)
    with open(calib_csv, "rb") as f:
        resp = client.post(
            "/api/v1/p300/decode-csv",
            files={"file": ("BNCI_Subj01_Session1_Calibration_6chars.csv", f, "text/csv")},
            data={"repetitions": 8}
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "SUCCESS"
    assert data["total_characters"] == 6
    assert data["raw_string"] == "XJAIF2"
    assert len(data["details"]) == 6
    assert data["details"][0]["winning_row"] == 4
    assert data["details"][0]["winning_col"] == 6
