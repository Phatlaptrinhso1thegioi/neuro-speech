"""
tests/test_dataset_ingestion.py
Tests dataset ingestion, file integrity, and metadata validation for M1.
"""

import json
from pathlib import Path
import pytest
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "datasets" / "raw"
METADATA_DIR = PROJECT_ROOT / "datasets" / "metadata"
PROCESSED_DIR = PROJECT_ROOT / "datasets" / "processed"


def test_raw_dataset_exists():
    """Verifies that candidate dataset raw files exist."""
    mat_file = RAW_DIR / "bnci2014_009" / "A01S.mat"
    assert mat_file.exists(), f"Raw file {mat_file} missing!"
    assert mat_file.stat().st_size > 10 * 1024 * 1024, "File size suspiciously small!"


def test_metadata_file_valid():
    """Verifies metadata JSON provenance and SHA-256."""
    meta_path = METADATA_DIR / "bnci2014_009.json"
    assert meta_path.exists(), "Metadata file missing!"

    with open(meta_path, "r") as f:
        meta = json.load(f)

    assert meta["candidate_id"] == 1
    assert "sha256" in meta
    assert len(meta["sha256"]) == 64
    assert meta["download_status"] == "SUCCESS"
    assert "license" in meta


def test_processed_exports_exist():
    """Verifies that M1.3 exported files exist and are non-empty."""
    manifest_path = PROCESSED_DIR / "manifest.json"
    events_path = PROCESSED_DIR / "p300_events.csv"
    signals_path = PROCESSED_DIR / "eeg_signals.csv"

    assert manifest_path.exists(), "manifest.json missing!"
    assert events_path.exists(), "p300_events.csv missing!"
    assert signals_path.exists(), "eeg_signals.csv missing!"

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    assert manifest["dataset_of_record"] is True
    assert manifest["branch"] == "a"
    assert manifest["sampling_rate_hz"] == 256.0
    assert manifest["matrix_dimensions"]["rows"] == 6
    assert manifest["matrix_dimensions"]["columns"] == 6


def test_events_table_structure():
    """Verifies event table schema and label balance."""
    import pandas as pd
    events_path = PROCESSED_DIR / "p300_events.csv"
    df = pd.read_csv(events_path)

    expected_cols = {"event_id", "run_id", "split", "sample_onset", "time_s", "stimulus_code", "is_target"}
    assert expected_cols.issubset(set(df.columns)), f"Missing expected columns in {df.columns}"

    # Target ratio in 6x6 matrix with 1 row + 1 col per 12 flashes is exactly 2/12 = 1/6 (~0.1667)
    target_ratio = df["is_target"].mean()
    assert 0.15 < target_ratio < 0.18, f"Unexpected target ratio: {target_ratio}"

    # Verify both train and test splits exist
    splits = set(df["split"].unique())
    assert "train" in splits
    assert "test" in splits
