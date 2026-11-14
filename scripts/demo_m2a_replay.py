#!/usr/bin/env python3
"""
scripts/demo_m2a_replay.py
CLI Demonstration for Milestone M2a:
Replays the held-out test session (Session 2 of BNCI 2014-009) in streaming sliding windows,
decodes characters online in real time, executes staff overrides, and prints the Four-Way table.
Writes decoded characters to datasets/processed/decoded_characters.csv.
"""

import sys
import time
from pathlib import Path
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from apps.api.app.eeg.source import ReplaySource
from apps.api.app.bci.lda_decoder import ShrinkageLDADecoder
from apps.api.app.bci.streaming_decoder import StreamingP300Decoder, MATRIX_6X6

RAW_MAT_PATH = PROJECT_ROOT / "datasets" / "raw" / "bnci2014_009" / "A01S.mat"
MODEL_PKL_PATH = PROJECT_ROOT / "models" / "checkpoints" / "p300_lda_baseline.pkl"
OUTPUT_CSV_PATH = PROJECT_ROOT / "datasets" / "processed" / "decoded_characters.csv"

# Ground truth sequence for Session 2 of Subject 1
# Trial 1: Row 6, Col 2 -> '6'
# Trial 2: Row 6, Col 6 -> '_'
# Trial 3: Row 1, Col 3 -> 'C'
# Trial 4: Row 5, Col 6 -> '4'
# Trial 5: Row 1, Col 2 -> 'B'
# Trial 6: Row 6, Col 1 -> '5'
GROUND_TRUTH_SESSION_2 = ['6', '_', 'C', '4', 'B', '5']


def run_demo():
    print("=" * 85)
    print(" NEURO-SPEECH: M2a Replay Engine & Streaming Decode Demo")
    print(" Operating on strictly Held-Out Test Split (Session 2, Principle 10)")
    print("=" * 85)

    if OUTPUT_CSV_PATH.exists():
        OUTPUT_CSV_PATH.unlink()

    # 1. Load model checkpoint
    if not MODEL_PKL_PATH.exists():
        print(f"Error: Model not found at {MODEL_PKL_PATH}. Run scripts/train_p300.py first.")
        sys.exit(1)

    decoder = ShrinkageLDADecoder().load(str(MODEL_PKL_PATH))
    print(f"Loaded decoder: Shrinkage LDA (Feature dim: {decoder.feature_dim}, 6x6 matrix)")

    # 2. Instantiate ReplaySource
    source = ReplaySource(raw_mat_path=RAW_MAT_PATH, session_idx=2)
    print(f"EEG Source:        {source.mode_badge}")
    print(f"Session Split:     {source.split_name}")
    print(f"Sampling Rate:     {source.sfreq} Hz")
    print(f"Total Duration:    {source.total_duration_s:.2f} seconds ({source.total_samples} samples)")
    print(f"Target Characters: {' '.join(GROUND_TRUTH_SESSION_2)} (n={len(GROUND_TRUTH_SESSION_2)})")

    # 3. Instantiate Streaming Decoder
    streaming_decoder = StreamingP300Decoder(
        decoder=decoder,
        sfreq=source.sfreq,
        n_rows=6,
        n_cols=6,
        repetitions_per_char=8,
        output_csv_path=OUTPUT_CSV_PATH
    )

    decoded_records = []
    streaming_decoder.register_callback(lambda rec: decoded_records.append(rec))

    # Set expected character for Trial 0
    current_char_target_idx = 0
    streaming_decoder.set_expected_character(GROUND_TRUTH_SESSION_2[current_char_target_idx])

    print("\nStarting sliding window replay streaming...")
    source.start()

    chunk_size = 32  # 32 samples = 125 ms per chunk
    t_start = time.perf_counter()
    last_reported_trial = 0

    while source.is_running and source.current_sample_idx < source.total_samples:
        chunk = source.get_chunk(chunk_size_samples=chunk_size)
        if not chunk.get("is_running", False):
            break

        streaming_decoder.push_samples(
            samples_chunk=chunk["channel_samples"],
            start_sample_idx=int(chunk["current_timestamp"] * source.sfreq),
            events_in_chunk=chunk["events_in_chunk"]
        )

        # Update expected character as trials progress
        if len(decoded_records) > last_reported_trial:
            last_reported_trial = len(decoded_records)
            if last_reported_trial < len(GROUND_TRUTH_SESSION_2):
                streaming_decoder.set_expected_character(GROUND_TRUTH_SESSION_2[last_reported_trial])

    t_elapsed = time.perf_counter() - t_start
    print(f"Replay completed in {t_elapsed:.2f}s.")

    # 4. Demonstrate Staff Override (Control Targets have no real EEG)
    print("\nDemonstrating Staff Override for control action (ACCEPT)...")
    streaming_decoder.staff_override(action_id="ACCEPT", label="Chấp nhận")

    # 5. Print Four-Way Table (Principle 3)
    print("\n" + "=" * 95)
    print(" PRINCIPLE 3: FOUR-WAY DISTINCTION LOG")
    print(" (a) Expected Ground-Truth | (b) Raw Predicted | (c) AI Suggested | (d) Confirmed Output")
    print("=" * 95)

    rows = []
    for r in decoded_records:
        src = r.get("source", "neural_decoder")
        exp = r.get("expected_ground_truth") or "—"
        pred = r.get("raw_predicted_char")
        sugg = r.get("ai_suggested_word") or "—"
        conf = r.get("final_confirmed_output") or "—"
        row_col = f"R{r['winning_row']}C{r['winning_col']}" if r.get("winning_row") else "—"
        lat = f"{r.get('inference_latency_ms', 0):.3f} ms"

        if src == "staff_override":
            status = "OVERRIDE"
        elif exp == pred:
            status = "MATCH (100%)"
        else:
            status = "MISMATCH"

        rows.append({
            "Trial": r.get("trial_index"),
            "Ground Truth (a)": exp,
            "Predicted (b)": pred,
            "AI Sugg (c)": sugg,
            "Confirmed (d)": conf,
            "Grid Pos": row_col,
            "Reps": r.get("repetitions"),
            "Status": status,
            "Source": src,
            "Latency": lat
        })

    df = pd.DataFrame(rows)
    print(df.to_string(index=False))

    # 6. Accuracy Summary
    neural_decodes = [r for r in decoded_records if r.get("source") == "neural_decoder"]
    correct = sum(1 for r in neural_decodes if r.get("expected_ground_truth") == r.get("raw_predicted_char"))
    total = len(neural_decodes)
    acc = (correct / total) * 100.0 if total > 0 else 0.0

    print("\n" + "-" * 50)
    print(f" Online Neural Speller Accuracy: {correct}/{total} ({acc:.1f}%)")
    print(f" Exported decoded characters to: {OUTPUT_CSV_PATH}")
    print(f" CSV file exists: {OUTPUT_CSV_PATH.exists()} ({OUTPUT_CSV_PATH.stat().st_size} bytes)")
    print("-" * 50)


if __name__ == "__main__":
    run_demo()
