#!/usr/bin/env python3
"""
scripts/download_p300_dataset.py
Downloads P300 benchmark datasets according to milestone M1.1 specifications.
Candidates:
  1. BNCI 2014-009 via MOABB
  2. bigP3BCI (1 subject from PhysioNet release, CC-BY 4.0)
  3. BCI Competition III Dataset II
  4. Local file provided by user
"""

import argparse
import hashlib
import json
import os
import shutil
import sys
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = PROJECT_ROOT / "datasets" / "raw"
METADATA_DIR = PROJECT_ROOT / "datasets" / "metadata"


def compute_sha256(filepath: Path) -> str:
    hasher = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def download_bnci2014_009(subject: int = 1, max_size_mb: float = 250.0, force: bool = False):
    print(f"\n[Candidate 1] Downloading BNCI 2014-009 for Subject {subject}...")
    import moabb.datasets as md

    dest_dir = RAW_DIR / "bnci2014_009"
    dest_dir.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)

    dataset = md.BNCI2014_009()
    data = dataset.get_data(subjects=[subject])
    
    # Locate cached .mat file from MNE data directory
    mne_data_path = Path.home() / "mne_data" / "MNE-bnci-data" / "database" / "data-sets" / "009-2014"
    mat_filename = f"A{subject:02d}S.mat"
    mat_filepath = mne_data_path / mat_filename

    if not mat_filepath.exists():
        # Fallback direct download if MOABB path differed
        url = f"http://bnci-horizon-2020.eu/database/data-sets/009-2014/{mat_filename}"
        print(f"Downloading directly from {url}...")
        urllib.request.urlretrieve(url, mat_filepath)

    size_mb = mat_filepath.stat().st_size / (1024 * 1024)
    print(f"Downloaded {mat_filename}: {size_mb:.2f} MB")

    if size_mb > max_size_mb and not force:
        print(f"ERROR: Size {size_mb:.2f} MB exceeds max size {max_size_mb} MB! Aborting.")
        if mat_filepath.exists():
            mat_filepath.unlink()
        sys.exit(1)

    dest_file = dest_dir / mat_filename
    shutil.copy2(mat_filepath, dest_file)
    file_hash = compute_sha256(dest_file)

    meta = {
        "dataset_name": "BNCI 2014-009",
        "candidate_id": 1,
        "subject": subject,
        "filename": mat_filename,
        "file_size_mb": round(size_mb, 3),
        "sha256": file_hash,
        "source": "http://bnci-horizon-2020.eu/database/data-sets/009-2014",
        "license": "Public research dataset (BNCI Horizon 2020 / Aricò et al. 2013)",
        "citation": "P. Aricò et al., 'Influence of P300 latency jitter on event-related potential-based brain-computer interface performance', J. Neural Eng., 2013.",
        "download_status": "SUCCESS"
    }

    meta_file = METADATA_DIR / "bnci2014_009.json"
    with open(meta_file, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"Copied to {dest_file}")
    print(f"Saved metadata to {meta_file}")
    print(f"SHA-256: {file_hash}")
    return dest_file, meta


def download_bigp3bci(subject_id: str = "A_01", max_size_mb: float = 250.0, force: bool = False):
    print(f"\n[Candidate 2] Inspecting PhysioNet bigP3BCI for Subject {subject_id} (StudyA RC speller)...")
    base_url = "https://physionet.org/files/bigp3bci/1.0.0"
    sums_url = f"{base_url}/SHA256SUMS.txt"

    import requests
    r = requests.get(sums_url)
    if r.status_code != 200:
        raise RuntimeError(f"Failed to fetch SHA256SUMS.txt from {sums_url}: status {r.status_code}")

    lines = [line.strip().split() for line in r.text.strip().split("\n") if len(line.strip().split()) == 2]
    # Filter for StudyA, subject_id, RC task (Row/Column speller)
    target_files = [
        (sha, rel_path) for sha, rel_path in lines
        if f"StudyA/{subject_id}/" in rel_path and "/RC/" in rel_path
    ]

    print(f"Found {len(target_files)} RC files for StudyA {subject_id}:")
    total_estimated_mb = len(target_files) * 7.65
    print(f"Estimated total size: ~{total_estimated_mb:.2f} MB")

    if total_estimated_mb > max_size_mb and not force:
        print(f"ERROR: Estimated size {total_estimated_mb:.2f} MB exceeds {max_size_mb} MB limit! Pass --force to override.")
        sys.exit(1)

    dest_dir = RAW_DIR / "bigp3bci" / f"StudyA_{subject_id}"
    dest_dir.mkdir(parents=True, exist_ok=True)
    METADATA_DIR.mkdir(parents=True, exist_ok=True)

    downloaded = []
    total_bytes = 0
    for sha, rel_path in target_files:
        filename = Path(rel_path).name
        target_path = dest_dir / filename
        file_url = f"{base_url}/{rel_path}"

        if target_path.exists() and compute_sha256(target_path) == sha:
            print(f"  [Cache hit] {filename} (SHA256 valid)")
        else:
            print(f"  Downloading {filename}...")
            resp = requests.get(file_url, stream=True)
            if resp.status_code != 200:
                print(f"Failed to download {file_url}: {resp.status_code}")
                continue
            with open(target_path, "wb") as f:
                for chunk in resp.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        f.write(chunk)
            # Verify SHA256
            local_hash = compute_sha256(target_path)
            if local_hash != sha:
                print(f"WARNING: SHA256 mismatch for {filename} (got {local_hash}, expected {sha})")

        f_size = target_path.stat().st_size
        total_bytes += f_size
        downloaded.append({
            "filename": filename,
            "relative_path": rel_path,
            "size_bytes": f_size,
            "sha256": compute_sha256(target_path)
        })

    total_mb = total_bytes / (1024 * 1024)
    print(f"Downloaded {len(downloaded)} files, total {total_mb:.2f} MB.")

    meta = {
        "dataset_name": "bigP3BCI",
        "candidate_id": 2,
        "subject": subject_id,
        "study": "StudyA",
        "paradigm": "Row/Column Speller (RC)",
        "file_count": len(downloaded),
        "total_size_mb": round(total_mb, 3),
        "source": "https://physionet.org/content/bigp3bci/1.0.0/",
        "license": "Creative Commons Attribution 4.0 International (CC-BY 4.0)",
        "files": downloaded,
        "download_status": "SUCCESS"
    }

    meta_file = METADATA_DIR / "bigp3bci.json"
    with open(meta_file, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"Saved metadata to {meta_file}")
    return dest_dir, meta


def main():
    parser = argparse.ArgumentParser(description="Download P300 Benchmark Datasets")
    parser.add_argument("--candidate", type=int, choices=[1, 2, 3, 4], default=1,
                        help="Candidate dataset: 1=BNCI 2014-009, 2=bigP3BCI, 3=BCI Comp III, 4=Local")
    parser.add_argument("--subject", type=int, default=1, help="Subject ID (default: 1)")
    parser.add_argument("--max-size-mb", type=float, default=250.0, help="Max download size in MB (default: 250)")
    parser.add_argument("--force", action="store_true", help="Force download even if size cap exceeded")
    args = parser.parse_args()

    if args.candidate == 1:
        download_bnci2014_009(subject=args.subject, max_size_mb=args.max_size_mb, force=args.force)
    elif args.candidate == 2:
        download_bigp3bci(subject_id=f"A_{args.subject:02d}", max_size_mb=args.max_size_mb, force=args.force)
    else:
        print(f"Candidate {args.candidate} not automated. Candidate 1 and 2 are primary.")


if __name__ == "__main__":
    main()
