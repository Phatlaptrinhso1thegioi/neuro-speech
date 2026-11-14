# NEURO-SPEECH Models

## Baseline Model
- **Model Name**: `p300_lda_baseline`
- **Algorithm**: Shrinkage Linear Discriminant Analysis (Ledoit-Wolf covariance estimation)
- **Feature Extraction**:
  - Continuous Causal Butterworth SOS Bandpass Filtering (0.1–20.0 Hz, Order 4) with carried filter state (`sosfilt_zi`)
  - Temporal decimation factor: 8 (subsampling within 100–600 ms post-stimulus window)
  - Spatiotemporal feature concatenation across 16 EEG channels (Feature dimension: 240)
  - `StandardScaler` fitted strictly on training data
- **Training Protocol (Principle 4)**:
  - Training sessions: Session 0 and Session 1 (1,152 epochs)
  - Held-out test session: Session 2 (576 epochs) — opened only once for final evaluation
  - 5-Fold Stratified Cross-Validation on training sessions: ROC-AUC = 0.9612 ± 0.0142
- **Checkpoints**:
  - `checkpoints/p300_lda_baseline.pkl`: Model serialized binary
  - `checkpoints/p300_lda_baseline.json`: Model metadata, hyperparameters, library versions, dataset SHA-256, and model SHA-256
  - `checkpoints/grand_average_pz.png`: Grand-average ERP plot at Pz confirming P300 deflection (+16.33 µV)
