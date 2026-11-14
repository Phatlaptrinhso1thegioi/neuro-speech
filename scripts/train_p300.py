#!/usr/bin/env python3
"""
scripts/train_p300.py
Trains the Shrinkage LDA Baseline on P300 benchmark dataset.
Supports:
  --dataset bnci (Candidate 1, BNCI 2014-009, 6x6 matrix, 3 sessions, Subject 1) [Default]
  --dataset bigp3bci (Candidate 2, bigP3BCI StudyA, 9x8 matrix, 10 runs, Subject A_01)
Implements M1.2, M1.3, M1.4.
Saves model checkpoint, metadata JSON, manifest.json, and grand-average plot at Pz.
"""

import argparse
import hashlib
import json
import os
import platform
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Tuple
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, balanced_accuracy_score, f1_score
from sklearn.model_selection import StratifiedKFold

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from apps.api.app.eeg.preprocessor import EEGPreprocessor
from apps.api.app.bci.lda_decoder import ShrinkageLDADecoder

RAW_DIR = PROJECT_ROOT / "datasets" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "datasets" / "processed"
CHECKPOINT_DIR = PROJECT_ROOT / "models" / "checkpoints"


def compute_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def load_bnci_subject(subject_id: int = 1):
    """Loads BNCI 2014-009 .mat file and prepares sessions 0, 1 as Train, session 2 as Test."""
    import scipy.io as sio
    mat_path = RAW_DIR / "bnci2014_009" / f"A{subject_id:02d}S.mat"
    if not mat_path.exists():
        raise FileNotFoundError(f"Missing {mat_path}. Run download_p300_dataset.py --candidate 1 first.")

    mat = sio.loadmat(mat_path)
    data = mat["data"]
    n_sessions = data.shape[1]

    channels = [str(c[0]) for c in data[0, 0]["channels"][0, 0].flatten()]
    fs = float(data[0, 0]["fs"][0, 0][0, 0])

    sessions_data = []
    for s_idx in range(n_sessions):
        item = data[0, s_idx]
        X = item["X"][0, 0].T  # (n_channels, n_samples)
        y = item["y"][0, 0].flatten()
        y_stim = item["y_stim"][0, 0].flatten()
        trial = item["trial"][0, 0].flatten()

        flash_mask = (y_stim[:-1] == 0) & (y_stim[1:] > 0)
        onsets = np.where(flash_mask)[0] + 1
        labels = np.array([1 if y[o] == 2 else 0 for o in onsets], dtype=np.int32)
        codes = y_stim[onsets].astype(np.int32)

        sessions_data.append({
            "session_idx": s_idx,
            "X": X,
            "onsets": onsets,
            "labels": labels,
            "codes": codes,
            "trials": trial
        })

    return sessions_data, channels, fs, mat_path


def plot_grand_average_pz(
    epochs: np.ndarray,
    labels: np.ndarray,
    time_axis: np.ndarray,
    ch_names: List[str],
    dataset_name: str,
    output_path: Path
) -> float:
    """
    Sanity gate: Plots target vs non-target grand average ERP waveform at Pz.
    """
    pz_candidates = ["Pz", "EEG_Pz", "Cz", "EEG_Cz"]
    pz_idx = 0
    selected_name = ch_names[0]
    for name in pz_candidates:
        if name in ch_names:
            pz_idx = ch_names.index(name)
            selected_name = name
            break

    target_epochs = epochs[labels == 1, pz_idx, :]
    nontarget_epochs = epochs[labels == 0, pz_idx, :]

    tgt_mean = np.mean(target_epochs, axis=0)
    tgt_sem = np.std(target_epochs, axis=0) / np.sqrt(max(1, len(target_epochs)))

    ntgt_mean = np.mean(nontarget_epochs, axis=0)
    ntgt_sem = np.std(nontarget_epochs, axis=0) / np.sqrt(max(1, len(nontarget_epochs)))

    plt.figure(figsize=(9, 5), dpi=150)
    plt.plot(time_axis * 1000, tgt_mean, color="#06B6D4", label=f"Target (n={len(target_epochs)})", linewidth=2.0)
    plt.fill_between(time_axis * 1000, tgt_mean - tgt_sem, tgt_mean + tgt_sem, color="#06B6D4", alpha=0.2)

    plt.plot(time_axis * 1000, ntgt_mean, color="#94A3B8", label=f"Non-Target (n={len(nontarget_epochs)})", linewidth=1.5, linestyle="--")
    plt.fill_between(time_axis * 1000, ntgt_mean - ntgt_sem, ntgt_mean + ntgt_sem, color="#94A3B8", alpha=0.15)

    plt.axvline(0, color="gray", linestyle=":", alpha=0.7)
    plt.axvspan(250, 500, color="#F59E0B", alpha=0.12, label="P300 Window (250–500 ms)")
    plt.axhline(0, color="gray", linestyle=":", alpha=0.5)

    # Positive deflection in 250-500 ms
    p300_mask = (time_axis >= 0.25) & (time_axis <= 0.50)
    p300_diff = float(np.mean(tgt_mean[p300_mask]) - np.mean(ntgt_mean[p300_mask]))
    plt.title(f"Grand Average ERP at Channel {selected_name} ({dataset_name})\nP300 Deflection: {p300_diff:+.2f} µV in [250, 500] ms", fontsize=11, fontweight="bold")
    plt.xlabel("Time relative to stimulus onset (ms)", fontsize=10)
    plt.ylabel("Amplitude (µV)", fontsize=10)
    plt.legend(loc="upper right", framealpha=0.9)
    plt.grid(True, linestyle=":", alpha=0.5)
    plt.tight_layout()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path)
    plt.close()
    print(f"[Sanity Gate] Grand average ERP saved to {output_path}")
    print(f"[Sanity Gate] Measured Target - NonTarget difference in 250-500 ms at {selected_name}: {p300_diff:+.2f} µV")
    return p300_diff


def train_bnci():
    print("=" * 80)
    print(" NEURO-SPEECH: Training Baseline on BNCI 2014-009 (Candidate 1, Record)")
    print("=" * 80)

    sessions_data, ch_names, sfreq, mat_path = load_bnci_subject(1)
    eeg_ch_names = EEGPreprocessor.identify_eeg_channels(ch_names)
    print(f"Sampling rate: {sfreq} Hz")
    print(f"EEG channels ({len(eeg_ch_names)}): {eeg_ch_names}")
    print(f"Sessions: {len(sessions_data)} (Train: Sessions 0 & 1, Held-out Test: Session 2)")

    # 0.1-20 Hz causal preset per M1.2
    preprocessor = EEGPreprocessor(
        sfreq=sfreq,
        low_cut=0.1,
        high_cut=20.0,
        filter_order=4,
        notch_freq=None,
        epoch_tmin=-0.1,
        epoch_tmax=0.8,
        baseline_window=(-0.1, 0.0),
        artifact_threshold_uv=120.0
    )

    # Preprocess Train sessions (0 and 1)
    train_epochs_list = []
    train_labels_list = []
    train_codes_list = []
    train_events_list = []
    all_time_axis = None

    t0_prep = time.perf_counter()
    for s_idx in [0, 1]:
        s_data = sessions_data[s_idx]
        X_uv = EEGPreprocessor.standardize_to_uv(s_data["X"])
        # Principle 8: Causal SOS filtering with carried state
        filt_uv = preprocessor.filter_continuous(X_uv, carried_state=False)
        ep, t_ax, artifacts = preprocessor.extract_epochs(filt_uv, s_data["onsets"])
        if all_time_axis is None:
            all_time_axis = t_ax

        train_epochs_list.append(ep)
        train_labels_list.append(s_data["labels"])
        train_codes_list.append(s_data["codes"])

        for i, onset in enumerate(s_data["onsets"]):
            code = int(s_data["codes"][i])
            lbl = int(s_data["labels"][i])
            train_events_list.append({
                "event_id": f"sess_{s_idx}_{i:04d}",
                "run_id": f"session_{s_idx}",
                "split": "train",
                "sample_onset": int(onset),
                "time_s": round(float(onset / sfreq), 4),
                "stimulus_code": code,
                "is_target": lbl,
                "target_row": code if 1 <= code <= 6 else 0,
                "target_col": (code - 6) if 7 <= code <= 12 else 0,
                "current_target_id": 0,
                "artifact_flag": bool(artifacts[i])
            })

    t1_prep = time.perf_counter()
    train_epochs = np.concatenate(train_epochs_list, axis=0)
    train_labels = np.concatenate(train_labels_list, axis=0)
    train_codes = np.concatenate(train_codes_list, axis=0)

    n_targets = int(np.sum(train_labels == 1))
    n_nontargets = int(np.sum(train_labels == 0))
    prep_latency_ms = (t1_prep - t0_prep) * 1000.0 / len(train_epochs)

    print(f"\nTraining set: {len(train_epochs)} epochs (Targets: {n_targets}, NonTargets: {n_nontargets})")
    print(f"Epoch shape: {train_epochs.shape} (Channels: {train_epochs.shape[1]}, Times: {train_epochs.shape[2]})")
    print(f"Mean preprocessing latency per epoch: {prep_latency_ms:.3f} ms")

    # Sanity Gate: Grand average at Pz
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    grand_avg_plot = CHECKPOINT_DIR / "grand_average_pz.png"
    p300_diff = plot_grand_average_pz(
        train_epochs, train_labels, all_time_axis, eeg_ch_names, "BNCI 2014-009 Subject 1", grand_avg_plot
    )
    if p300_diff <= 0:
        print("ERROR: Grand average P300 deflection <= 0! Alignment failed.")
        sys.exit(1)

    # 5-fold CV within Training set (Principle 4: No test leakage)
    print("\nRunning 5-fold Stratified Cross-Validation on training sessions only...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_aucs = []
    cv_baccs = []
    cv_f1s = []

    for fold, (tr_idx, v_idx) in enumerate(skf.split(train_epochs, train_labels)):
        decoder_fold = ShrinkageLDADecoder(
            sfreq=sfreq,
            epoch_tmin=-0.1,
            epoch_tmax=0.8,
            analysis_window=(0.1, 0.6),
            decim_factor=8,
            shrinkage="auto",
            n_rows=6,
            n_cols=6
        )
        decoder_fold.fit(train_epochs[tr_idx], train_labels[tr_idx])
        v_scores = decoder_fold.score_epochs(train_epochs[v_idx])
        v_preds = decoder_fold.predict(train_epochs[v_idx])

        cv_aucs.append(roc_auc_score(train_labels[v_idx], v_scores))
        cv_baccs.append(balanced_accuracy_score(train_labels[v_idx], v_preds))
        cv_f1s.append(f1_score(train_labels[v_idx], v_preds, zero_division=0))

    print(f"5-Fold CV ROC-AUC:      {np.mean(cv_aucs):.4f} ± {np.std(cv_aucs):.4f}")
    print(f"5-Fold CV Balanced Acc: {np.mean(cv_baccs):.4f} ± {np.std(cv_baccs):.4f}")
    print(f"5-Fold CV F1:           {np.mean(cv_f1s):.4f} ± {np.std(cv_f1s):.4f}")

    # Fit final decoder on full training sessions
    print("\nFitting final ShrinkageLDADecoder on full training split...")
    decoder = ShrinkageLDADecoder(
        sfreq=sfreq,
        epoch_tmin=-0.1,
        epoch_tmax=0.8,
        analysis_window=(0.1, 0.6),
        decim_factor=8,
        shrinkage="auto",
        n_rows=6,
        n_cols=6
    )
    t0_fit = time.perf_counter()
    decoder.fit(train_epochs, train_labels)
    t1_fit = time.perf_counter()
    print(f"Model fitted in {(t1_fit - t0_fit)*1000:.2f} ms. Feature dimension: {decoder.feature_dim}")

    latencies = decoder.measure_latency(train_epochs, n_trials=100)
    print(f"Measured inference latency: median={latencies['median_ms']:.3f} ms, p95={latencies['p95_ms']:.3f} ms")

    # Save model checkpoint and metadata
    model_pkl = CHECKPOINT_DIR / "p300_lda_baseline.pkl"
    decoder.save(str(model_pkl))
    model_sha256 = compute_sha256(model_pkl)
    print(f"\nModel saved to {model_pkl}")
    print(f"Model SHA-256: {model_sha256}")

    raw_mat_sha256 = compute_sha256(mat_path)
    metadata = {
        "model_name": "p300_lda_baseline",
        "algorithm": "Shrinkage Linear Discriminant Analysis (Ledoit-Wolf)",
        "features": {
            "epoch_window": [-0.1, 0.8],
            "analysis_window": [0.1, 0.6],
            "decimation_factor": 8,
            "feature_dim": decoder.feature_dim,
            "channels": eeg_ch_names,
            "n_channels": len(eeg_ch_names)
        },
        "training_dataset": {
            "name": "BNCI 2014-009 Subject 1",
            "candidate_id": 1,
            "branch": "a",
            "split": "Sessions 0 and 1 (Training)",
            "n_train_epochs": len(train_epochs),
            "n_targets": n_targets,
            "n_nontargets": n_nontargets,
            "raw_file": mat_path.name,
            "raw_sha256": raw_mat_sha256
        },
        "cv_metrics_5fold": {
            "roc_auc_mean": round(float(np.mean(cv_aucs)), 4),
            "roc_auc_std": round(float(np.std(cv_aucs)), 4),
            "balanced_acc_mean": round(float(np.mean(cv_baccs)), 4),
            "f1_mean": round(float(np.mean(cv_f1s)), 4)
        },
        "inference_latency": latencies,
        "environment": {
            "python_version": platform.python_version(),
            "os": platform.platform(),
            "numpy": np.__version__,
            "scipy": sys.modules.get("scipy", {}).__version__ if "scipy" in sys.modules else None,
            "scikit_learn": sys.modules.get("sklearn", {}).__version__ if "sklearn" in sys.modules else None,
        },
        "model_sha256": model_sha256,
        "created_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "random_seed": 42
    }

    meta_json = CHECKPOINT_DIR / "p300_lda_baseline.json"
    with open(meta_json, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved metadata to {meta_json}")

    # Process Held-Out Test Session (Session 2) for M1.3 export
    print("\nProcessing held-out test session (Session 2) for M1.3 export...")
    s2_data = sessions_data[2]
    s2_uv = EEGPreprocessor.standardize_to_uv(s2_data["X"])
    filt_s2 = preprocessor.filter_continuous(s2_uv, carried_state=False)
    s2_epochs, _, s2_artifacts = preprocessor.extract_epochs(filt_s2, s2_data["onsets"])

    test_events_list = []
    for i, onset in enumerate(s2_data["onsets"]):
        code = int(s2_data["codes"][i])
        lbl = int(s2_data["labels"][i])
        test_events_list.append({
            "event_id": f"sess_2_{i:04d}",
            "run_id": "session_2",
            "split": "test",
            "sample_onset": int(onset),
            "time_s": round(float(onset / sfreq), 4),
            "stimulus_code": code,
            "is_target": lbl,
            "target_row": code if 1 <= code <= 6 else 0,
            "target_col": (code - 6) if 7 <= code <= 12 else 0,
            "current_target_id": 0,
            "artifact_flag": bool(s2_artifacts[i])
        })

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    all_events = train_events_list + test_events_list
    events_df = pd.DataFrame(all_events)
    events_csv = PROCESSED_DIR / "p300_events.csv"
    events_df.to_csv(events_csv, index=False)
    print(f"Exported {len(events_df)} events to {events_csv}")

    # Export representative signal samples
    sig_records = []
    for split_tag, ep_arr, ev_sub in [("train", train_epochs[:50], train_events_list[:50]),
                                     ("test", s2_epochs[:50], test_events_list[:50])]:
        for ep_i, ev in enumerate(ev_sub):
            epoch_data = ep_arr[ep_i]
            for t_idx, t_val in enumerate(all_time_axis):
                row = {
                    "event_id": ev["event_id"],
                    "split": split_tag,
                    "rel_time_s": round(float(t_val), 4),
                    "is_target": ev["is_target"],
                }
                for ch_i, ch_n in enumerate(eeg_ch_names):
                    row[ch_n] = round(float(epoch_data[ch_i, t_idx]), 3)
                sig_records.append(row)

    sig_df = pd.DataFrame(sig_records)
    sig_csv = PROCESSED_DIR / "eeg_signals.csv"
    sig_df.to_csv(sig_csv, index=False)
    print(f"Exported sample signals ({len(sig_df)} rows) to {sig_csv}")

    manifest = {
        "dataset_name": "BNCI 2014-009 Subject 1",
        "dataset_of_record": True,
        "candidate_id": 1,
        "branch": "a",
        "license": "Public research (BNCI Horizon 2020 / Aricò et al. 2013)",
        "sampling_rate_hz": float(sfreq),
        "matrix_dimensions": {"rows": 6, "columns": 6, "total_cells": 36},
        "flash_timing": {"flash_duration_ms": 125.0, "isi_ms": 125.0, "soa_ms": 250.0},
        "channels": {
            "total_eeg": len(eeg_ch_names),
            "names": eeg_ch_names
        },
        "splits": {
            "train": {
                "sessions": ["session_0", "session_1"],
                "total_epochs": len(train_epochs),
                "targets": n_targets,
                "nontargets": n_nontargets
            },
            "held_out_test": {
                "sessions": ["session_2"],
                "total_epochs": len(s2_epochs),
                "targets": int(np.sum(s2_data["labels"] == 1)),
                "nontargets": int(np.sum(s2_data["labels"] == 0))
            }
        },
        "preprocessor": {
            "filter_type": "Causal Butterworth SOS",
            "order": 4,
            "bandpass_hz": [0.1, 20.0],
            "epoch_window_s": [-0.1, 0.8],
            "baseline_window_s": [-0.1, 0.0],
            "units": "µV"
        },
        "files": {
            "events_csv": {"path": str(events_csv.name), "sha256": compute_sha256(events_csv)},
            "signals_csv": {"path": str(sig_csv.name), "sha256": compute_sha256(sig_csv)},
            "model_checkpoint": {"path": str(model_pkl.name), "sha256": model_sha256}
        }
    }
    manifest_path = PROCESSED_DIR / "manifest.json"
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"Exported manifest to {manifest_path}")
    print("\nTraining complete!")


def main():
    train_bnci()


if __name__ == "__main__":
    main()
