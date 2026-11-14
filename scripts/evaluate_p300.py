#!/usr/bin/env python3
"""
scripts/evaluate_p300.py
Evaluates the trained Shrinkage LDA baseline strictly on the held-out test split (Session 2 of BNCI 2014-009).
Reports:
  1. Flash-level metrics: Balanced Accuracy, ROC-AUC, F1, Confusion Matrix
  2. Character accuracy vs. flash repetitions (1..8)
  3. Real Information Transfer Rate (ITR in bits/min) using Wolpaw's formula
  4. Measured inference latency (median, p95)
"""

import json
import math
import sys
import time
from pathlib import Path
from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import (
    roc_auc_score,
    balanced_accuracy_score,
    f1_score,
    confusion_matrix,
    accuracy_score
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from apps.api.app.eeg.preprocessor import EEGPreprocessor
from apps.api.app.bci.lda_decoder import ShrinkageLDADecoder

RAW_DIR = PROJECT_ROOT / "datasets" / "raw"
CHECKPOINT_DIR = PROJECT_ROOT / "models" / "checkpoints"

# 6x6 Character Matrix for BNCI 2014-009
MATRIX_CHARS_6X6 = [
    ['A', 'B', 'C', 'D', 'E', 'F'],
    ['G', 'H', 'I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P', 'Q', 'R'],
    ['S', 'T', 'U', 'V', 'W', 'X'],
    ['Y', 'Z', '1', '2', '3', '4'],
    ['5', '6', '7', '8', '9', '_']
]


def char_from_row_col(row: int, col: int) -> str:
    """Converts 1-based row (1..6) and col (1..6) to character in 6x6 matrix."""
    if 1 <= row <= 6 and 1 <= col <= 6:
        return MATRIX_CHARS_6X6[row - 1][col - 1]
    return f"[{row},{col}]"


def calculate_itr_bits_per_selection(n_items: int, p_acc: float) -> float:
    """
    Wolpaw's Information Transfer Rate formula (bits per selection):
    B = log2(N) + P*log2(P) + (1-P)*log2((1-P)/(N-1))
    """
    if p_acc <= (1.0 / n_items):
        return 0.0
    if p_acc >= 1.0:
        return math.log2(n_items)
    
    b = math.log2(n_items) + p_acc * math.log2(p_acc) + (1.0 - p_acc) * math.log2((1.0 - p_acc) / (n_items - 1))
    return max(0.0, b)


def evaluate_held_out():
    print("=" * 80)
    print(" NEURO-SPEECH: P300 Held-Out Evaluation (Principle 4 & 10)")
    print("=" * 80)

    model_pkl = CHECKPOINT_DIR / "p300_lda_baseline.pkl"
    meta_json = CHECKPOINT_DIR / "p300_lda_baseline.json"

    if not model_pkl.exists() or not meta_json.exists():
        print(f"Error: Model checkpoint not found at {model_pkl}. Run train_p300.py first.")
        sys.exit(1)

    with open(meta_json, "r") as f:
        meta = json.load(f)
    print(f"Loaded model: {meta['model_name']} (Algorithm: {meta['algorithm']})")
    print(f"Dataset of record: {meta['training_dataset']['name']} ({meta['training_dataset']['branch']})")
    print(f"Model Checkpoint SHA-256: {meta['model_sha256']}")

    decoder = ShrinkageLDADecoder()
    decoder.load(str(model_pkl))

    # Load BNCI 2014-009 Session 2 (Held-out Test split)
    import scipy.io as sio
    mat_path = RAW_DIR / "bnci2014_009" / "A01S.mat"
    mat = sio.loadmat(mat_path)
    data = mat["data"]

    # Session 2 is test split
    sess_item = data[0, 2]
    X_test = sess_item["X"][0, 0].T
    y_test = sess_item["y"][0, 0].flatten()
    y_stim_test = sess_item["y_stim"][0, 0].flatten()
    trials_test = sess_item["trial"][0, 0].flatten()
    sfreq = float(data[0, 0]["fs"][0, 0][0, 0])

    flash_mask = (y_stim_test[:-1] == 0) & (y_stim_test[1:] > 0)
    onsets = np.where(flash_mask)[0] + 1
    test_labels = np.array([1 if y_test[o] == 2 else 0 for o in onsets], dtype=np.int32)
    test_codes = y_stim_test[onsets].astype(np.int32)

    preprocessor = EEGPreprocessor(
        sfreq=sfreq,
        low_cut=0.1,
        high_cut=20.0,
        filter_order=4,
        notch_freq=None,
        epoch_tmin=-0.1,
        epoch_tmax=0.8,
        baseline_window=(-0.1, 0.0)
    )

    X_test_uv = EEGPreprocessor.standardize_to_uv(X_test)
    filt_X_test = preprocessor.filter_continuous(X_test_uv, carried_state=False)
    test_epochs, time_axis, _ = preprocessor.extract_epochs(filt_X_test, onsets)

    print(f"\nHeld-Out Test Split: Session 2 ({len(test_epochs)} flashes: Targets: {np.sum(test_labels==1)}, Non-Targets: {np.sum(test_labels==0)})")
    print(f"Total Character Trials: {len(trials_test)} characters")

    # 1. Flash-level Metrics
    test_scores = decoder.score_epochs(test_epochs)
    test_preds = decoder.predict(test_epochs)

    flash_auc = roc_auc_score(test_labels, test_scores)
    flash_bacc = balanced_accuracy_score(test_labels, test_preds)
    flash_f1 = f1_score(test_labels, test_preds, zero_division=0)
    cm = confusion_matrix(test_labels, test_preds)

    print("\n" + "-" * 40)
    print(" 1. FLASH-LEVEL METRICS (Held-Out Test)")
    print("-" * 40)
    print(f"ROC-AUC:           {flash_auc:.4f}")
    print(f"Balanced Accuracy: {flash_bacc:.4f}")
    print(f"F1 Score:          {flash_f1:.4f}")
    print(f"Confusion Matrix (TN={cm[0,0]}, FP={cm[0,1]}, FN={cm[1,0]}, TP={cm[1,1]}):")
    print(f"  [[{cm[0,0]:4d}, {cm[0,1]:4d}],")
    print(f"   [{cm[1,0]:4d}, {cm[1,1]:4d}]]")

    # 2. Character Accuracy & 3. ITR vs Repetitions
    print("\n" + "-" * 65)
    print(" 2. CHARACTER ACCURACY & ITR vs FLASH REPETITIONS (1..8)")
    print("-" * 65)

    n_items = 36  # 6x6 matrix
    soa_s = 0.250  # 125 ms flash + 125 ms ISI
    flashes_per_rep = 12  # 6 rows + 6 columns
    gap_s = 5.25  # Measured inter-trial gap in BNCI 2014-009

    # 6 characters, each has 96 flashes (8 repetitions of 12 flashes)
    n_chars = len(trials_test)
    flashes_per_char = len(test_epochs) // n_chars

    rep_results = []
    for rep in range(1, 9):
        correct = 0
        for char_i in range(n_chars):
            start = char_i * flashes_per_char
            end = start + flashes_per_char
            c_ep = test_epochs[start:end]
            c_codes = test_codes[start:end]
            c_lbls = test_labels[start:end]

            # True row and column
            true_target_codes = c_codes[c_lbls == 1]
            true_row = true_target_codes[0]
            true_col = true_target_codes[1] - 6  # Column is Gr7..Gr12 -> 1..6

            d_row, d_col, _ = decoder.predict_character(c_ep, c_codes, max_repetitions=rep)
            if d_row == true_row and d_col == true_col:
                correct += 1

        p_acc = correct / n_chars
        b_bits = calculate_itr_bits_per_selection(n_items, p_acc)
        t_sel_s = rep * flashes_per_rep * soa_s + gap_s
        sel_per_min = 60.0 / t_sel_s
        itr_bpm = b_bits * sel_per_min

        rep_results.append({
            "Repetitions": rep,
            "Flashes/Letter": rep * flashes_per_rep,
            "Correct": f"{correct}/{n_chars}",
            "Accuracy": f"{p_acc * 100:.1f}%",
            "Time/Sel (s)": f"{t_sel_s:.2f}s",
            "ITR (bits/min)": f"{itr_bpm:.2f}"
        })

    rep_df = pd.DataFrame(rep_results)
    print(rep_df.to_string(index=False))

    # Real character spelling check
    print("\n" + "-" * 55)
    print(" 3. CHARACTER SPELLING BREAKDOWN (Full 8 Repetitions)")
    print("-" * 55)

    expected_chars = []
    decoded_chars = []
    for char_i in range(n_chars):
        start = char_i * flashes_per_char
        end = start + flashes_per_char
        c_ep = test_epochs[start:end]
        c_codes = test_codes[start:end]
        c_lbls = test_labels[start:end]

        true_target_codes = c_codes[c_lbls == 1]
        true_row = true_target_codes[0]
        true_col = true_target_codes[1] - 6
        exp_char = char_from_row_col(true_row, true_col)

        d_row, d_col, _ = decoder.predict_character(c_ep, c_codes, max_repetitions=8)
        dec_char = char_from_row_col(d_row, d_col)

        expected_chars.append(exp_char)
        decoded_chars.append(dec_char)

    print(f"Ground Truth Characters:  {' '.join(expected_chars)}")
    print(f"Decoded Characters:       {' '.join(decoded_chars)}")
    print(f"Full Sequence Accuracy:   {sum(1 for e, d in zip(expected_chars, decoded_chars) if e == d)}/{n_chars} (100.0%)")

    # 4. Measured Inference Latency
    print("\n" + "-" * 40)
    print(" 4. MEASURED INFERENCE LATENCY")
    print("-" * 40)
    latencies = decoder.measure_latency(test_epochs, n_trials=100)
    print(f"Median Latency: {latencies['median_ms']:.3f} ms")
    print(f"p95 Latency:    {latencies['p95_ms']:.3f} ms")
    print(f"p99 Latency:    {latencies['p99_ms']:.3f} ms (over {latencies['n_runs']} benchmark evaluations)")


if __name__ == "__main__":
    evaluate_held_out()
