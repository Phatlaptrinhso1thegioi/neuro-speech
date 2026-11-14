#!/usr/bin/env python3
"""
scripts/health_check.py
System Health Check for NEURO-SPEECH.
Verifies environment, dependencies, dataset integrity, model checkpoints, and core pipelines.
"""

import hashlib
import json
import os
import platform
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))


def compute_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def check_status(name: str, passed: bool, detail: str = ""):
    symbol = "✓ PASS" if passed else "✗ FAIL"
    print(f"[{symbol}] {name:38s} {detail}")
    return passed


def main():
    print("=" * 80)
    print(" NEURO-SPEECH: System Health Check")
    print("=" * 80)
    all_ok = True

    # 1. Environment & Dependencies
    print("\n--- 1. Environment & Dependencies ---")
    py_ver = platform.python_version()
    all_ok &= check_status("Python Runtime", sys.version_info >= (3, 9), f"v{py_ver}")

    modules = ["numpy", "scipy", "sklearn", "pandas", "mne", "fastapi", "uvicorn", "pydantic", "pytest"]
    for mod in modules:
        try:
            m = __import__(mod)
            ver = getattr(m, "__version__", "installed")
            all_ok &= check_status(f"Dependency: {mod}", True, f"v{ver}")
        except ImportError as e:
            all_ok &= check_status(f"Dependency: {mod}", False, str(e))

    # 2. Directory Structure
    print("\n--- 2. Directory Structure ---")
    required_dirs = [
        "datasets/raw",
        "datasets/processed",
        "datasets/metadata",
        "models/checkpoints",
        "models/configs",
        "scripts",
        "tests",
        "apps/api/app/eeg",
        "apps/api/app/bci"
    ]
    for d in required_dirs:
        dir_path = PROJECT_ROOT / d
        all_ok &= check_status(f"Directory: {d}", dir_path.is_dir())

    # 3. Dataset & Metadata
    print("\n--- 3. Dataset & Metadata Integrity ---")
    mat_file = PROJECT_ROOT / "datasets" / "raw" / "bnci2014_009" / "A01S.mat"
    meta_file = PROJECT_ROOT / "datasets" / "metadata" / "bnci2014_009.json"
    manifest_file = PROJECT_ROOT / "datasets" / "processed" / "manifest.json"
    events_file = PROJECT_ROOT / "datasets" / "processed" / "p300_events.csv"
    signals_file = PROJECT_ROOT / "datasets" / "processed" / "eeg_signals.csv"

    all_ok &= check_status("Raw MAT File (A01S.mat)", mat_file.exists(), f"{mat_file.stat().st_size / (1024*1024):.2f} MB" if mat_file.exists() else "")

    if meta_file.exists():
        with open(meta_file, "r") as f:
            meta = json.load(f)
        real_hash = compute_sha256(mat_file)
        matches = real_hash == meta.get("sha256")
        all_ok &= check_status("Raw MAT SHA-256 Match", matches, f"{real_hash[:16]}...")
    else:
        all_ok &= check_status("Dataset Metadata File", False, "Missing")

    all_ok &= check_status("Processed Manifest", manifest_file.exists())
    all_ok &= check_status("P300 Events CSV", events_file.exists(), f"{events_file.stat().st_size / 1024:.1f} KB" if events_file.exists() else "")
    all_ok &= check_status("EEG Signals CSV", signals_file.exists(), f"{signals_file.stat().st_size / (1024*1024):.1f} MB" if signals_file.exists() else "")

    # 4. Model Checkpoint & Baseline
    print("\n--- 4. Model Checkpoint & Pipeline ---")
    model_pkl = PROJECT_ROOT / "models" / "checkpoints" / "p300_lda_baseline.pkl"
    model_json = PROJECT_ROOT / "models" / "checkpoints" / "p300_lda_baseline.json"
    grand_avg_img = PROJECT_ROOT / "models" / "checkpoints" / "grand_average_pz.png"

    all_ok &= check_status("Model Checkpoint (.pkl)", model_pkl.exists(), f"{model_pkl.stat().st_size / 1024:.1f} KB" if model_pkl.exists() else "")
    all_ok &= check_status("Model Metadata (.json)", model_json.exists())
    all_ok &= check_status("Grand Average ERP Plot (Pz)", grand_avg_img.exists())

    if model_pkl.exists() and model_json.exists():
        with open(model_json, "r") as f:
            m_meta = json.load(f)
        model_hash = compute_sha256(model_pkl)
        hash_ok = model_hash == m_meta.get("model_sha256")
        all_ok &= check_status("Model Checkpoint SHA-256 Match", hash_ok, f"{model_hash[:16]}...")

    # 5. Pipeline End-to-End Sanity
    print("\n--- 5. Pipeline Execution Sanity ---")
    try:
        from apps.api.app.eeg.preprocessor import EEGPreprocessor
        from apps.api.app.bci.lda_decoder import ShrinkageLDADecoder
        import numpy as np

        prep = EEGPreprocessor(sfreq=256.0, low_cut=0.1, high_cut=20.0)
        dummy_signal = np.random.randn(16, 512).astype(np.float32) * 10.0
        filtered = prep.filter_continuous(dummy_signal, carried_state=False)
        epochs, _, _ = prep.extract_epochs(filtered, np.array([256]))

        decoder = ShrinkageLDADecoder()
        decoder.load(str(model_pkl))
        score = decoder.score_epochs(epochs)
        all_ok &= check_status("Preprocessing & Inference Sanity", score.shape == (1,), f"Dummy epoch score: {score[0]:.4f}")
    except Exception as e:
        all_ok &= check_status("Preprocessing & Inference Sanity", False, str(e))

    print("\n" + "=" * 80)
    if all_ok:
        print(" HEALTH CHECK: ALL SYSTEMS NOMINAL (M1 OPERATIONAL)")
        print("=" * 80)
        sys.exit(0)
    else:
        print(" HEALTH CHECK: ONE OR MORE CHECKS FAILED")
        print("=" * 80)
        sys.exit(1)


if __name__ == "__main__":
    main()
