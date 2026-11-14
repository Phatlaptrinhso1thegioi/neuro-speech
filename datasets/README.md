# NEURO-SPEECH Datasets

## Dataset of Record
- **Dataset**: BNCI 2014-009 (Subject 1)
- **Paradigm**: Visual P300 Speller (Row/Column Grid)
- **Matrix Dimensions**: 6 × 6 matrix (36 alphanumeric characters)
- **Sampling Rate**: 256.0 Hz
- **Flash Timing**: 125 ms flash duration, 125 ms inter-stimulus interval (250 ms Stimulus Onset Asynchrony / SOA)
- **Channels**: 16 electrodes (14 standard 10-20 EEG channels: Fz, Cz, Pz, Oz, P3, P4, PO7, PO8, FCz, C3, C4, CP3, CPz, CP4)
- **Sessions**: 3 recording sessions (576 flashes per session, 6 character trials per session, 8 repetitions of 12 flashes per character)
- **Data Branch**: **Branch (a)** — Continuous raw signal and per-flash row/column stimulus codes.
- **License**: Public research dataset (BNCI Horizon 2020 / Aricò et al., 2013)
- **Source**: `http://bnci-horizon-2020.eu/database/data-sets/009-2014`
- **SHA-256 (Raw A01S.mat)**: `beddf78f1834ddef15553e32c9d18c46bc9b3fd244ef3a8e2fe362066dfb027d`

## Candidate 2 (Also Verified & Available)
- **Dataset**: bigP3BCI StudyA Subject A_01
- **Matrix Dimensions**: 9 × 8 matrix (72 selectable items)
- **Channels**: 32 EEG channels (256 Hz)
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0, PhysioNet)

## Data Directory Structure
- `raw/`: Raw downloaded archives (`bnci2014_009/A01S.mat`, `bigp3bci/StudyA_A_01/*.edf`).
- `metadata/`: Provenance JSON files recording source URLs, license, and SHA-256 hashes.
- `processed/`:
  - `p300_events.csv`: Event table with sample onsets, timestamps, stimulus codes, targets, and artifact flags.
  - `eeg_signals.csv`: Preprocessed multichannel EEG signals in µV with time alignment.
  - `manifest.json`: Full dataset provenance and split manifest.
