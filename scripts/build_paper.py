#!/usr/bin/env python3
"""
scripts/build_paper.py
Reads docs/paper_template.html, inserts base64 images, and compiles paper.pdf.
"""

import os
import sys
import base64
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
FIG_DIR = PROJECT_ROOT / "docs" / "figures"
TEMPLATE_HTML = PROJECT_ROOT / "docs" / "paper_template.html"
OUTPUT_HTML = PROJECT_ROOT / "docs" / "paper.html"
OUTPUT_PDF = PROJECT_ROOT / "paper.pdf"

def get_b64(name: str) -> str:
    path = FIG_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Missing figure: {path}")
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def main():
    if not TEMPLATE_HTML.exists():
        print(f"Error: Template not found at {TEMPLATE_HTML}")
        sys.exit(1)

    print("[*] Reading template HTML...")
    with open(TEMPLATE_HTML, "r", encoding="utf-8") as f:
        content = f.read()

    print("[*] Embedding figures (Base64)...")
    content = content.replace("{{FIG1_B64}}", get_b64("fig1_system_architecture.png"))
    content = content.replace("{{FIG2_B64}}", get_b64("fig2_preprocessing_pipeline.png"))
    content = content.replace("{{FIG3_B64}}", get_b64("fig3_model_comparison.png"))
    content = content.replace("{{FIG4_B64}}", get_b64("fig4_confusion_roc_curves.png"))
    content = content.replace("{{FIG5_B64}}", get_b64("fig5_itr_repetition_ablation.png"))

    print(f"[*] Writing generated HTML to {OUTPUT_HTML}...")
    with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[✓] Wrote {len(content):,} characters to {OUTPUT_HTML}")

    chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    cmd = [
        chrome_path,
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        "--run-all-compositor-stages-before-draw",
        "--virtual-time-budget=6000",
        f"--print-to-pdf={OUTPUT_PDF}",
        str(OUTPUT_HTML)
    ]

    print("[*] Compiling PDF via Chrome...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Chrome stderr:", res.stderr)

    if not OUTPUT_PDF.exists():
        print("Error: paper.pdf was not created!")
        sys.exit(1)

    size_kb = OUTPUT_PDF.stat().st_size / 1024
    print(f"[✓] Successfully compiled publication-grade PDF: {OUTPUT_PDF}")
    print(f"[*] PDF Size: {size_kb:.1f} KB")

if __name__ == "__main__":
    main()
