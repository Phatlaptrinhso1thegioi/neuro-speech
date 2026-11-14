#!/usr/bin/env python3
"""
scripts/decode_csv.py
Instant CSV P300 Character & Vietnamese Text Decoder for NEURO-SPEECH.

Usage:
    python3 scripts/decode_csv.py <path_to_csv_file>
    python3 scripts/decode_csv.py datasets/processed/p300_events.csv
"""

import sys
import argparse
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from apps.api.app.bci.csv_decoder import decode_p300_csv


def main():
    parser = argparse.ArgumentParser(description="NEURO-SPEECH: Instant CSV P300 Character Decoder")
    parser.add_argument("csv_file", type=str, nargs="?", default="datasets/processed/p300_events.csv",
                        help="Path to the P300 event or epoch CSV file")
    parser.add_argument("--reps", type=int, default=8, help="Number of repetitions to evaluate (1..8)")
    args = parser.parse_args()

    csv_path = Path(args.csv_file)
    if not csv_path.is_absolute():
        csv_path = PROJECT_ROOT / csv_path

    if not csv_path.exists():
        print(f"[✗] Error: File not found at {csv_path}")
        sys.exit(1)

    print("=" * 70)
    print("      NEURO-SPEECH — INSTANT CSV P300 CHARACTER DECODER")
    print("=" * 70)
    print(f"[*] Input CSV File:  {csv_path.name}")
    print(f"[*] Full Path:       {csv_path}")
    print(f"[*] Repetitions Cap: {args.reps}")
    print("[*] Processing epochs with Shrinkage LDA baseline...")

    try:
        res = decode_p300_csv(csv_path, max_repetitions=args.reps)
    except Exception as e:
        print(f"[✗] Failed to decode CSV: {e}")
        sys.exit(1)

    print("\n" + "-" * 70)
    print("               KẾT QUẢ GIẢI MÃ SÓNG NÃO P300")
    print("-" * 70)
    print(f"  🎯 Chuỗi ký tự thô (Raw Characters):  {' '.join(res['raw_characters'])}")
    print(f"  🔤 Ký tự gộp (Raw String):           {res['raw_string']}")
    print(f"  🇻🇳 Văn bản Tiếng Việt Telex:        {res['telex_vietnamese_text']}")
    print(f"  ⚡ Tổng thời gian suy luận:          {res['total_inference_time_ms']} ms")
    print(f"  ⏱️ Độ trễ trung bình / ký tự:        {res['avg_latency_per_char_ms']} ms/char")
    print(f"  🧠 Mô hình BCI:                      {res['model_used']}")
    print("-" * 70)

    print("\nChi tiết từng ký tự giải mã:")
    print(f"{'Idx':<5} {'Ký tự':<8} {'Hàng':<6} {'Cột':<6} {'Ground Truth':<14} {'Tin cậy':<10} {'Flashes'}")
    print("-" * 65)
    for d in res["details"]:
        exp = str(d.get("expected_ground_truth", "N/A"))
        conf = f"{d.get('confidence', 0.95)*100:.1f}%"
        flashes = d.get("flashes_evaluated", 96)
        print(f"{d['char_index']+1:<5} {d['predicted_char']:<8} {d['winning_row']:<6} {d['winning_col']:<6} {exp:<14} {conf:<10} {flashes}")

    print("=" * 70)
    print(" [✓] GIẢI MÃ HOÀN TẤT THÀNH CÔNG!")
    print("=" * 70)


if __name__ == "__main__":
    main()
