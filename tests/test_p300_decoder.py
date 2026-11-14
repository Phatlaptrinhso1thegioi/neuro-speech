"""
tests/test_p300_decoder.py
Tests for BaseP300Decoder and ShrinkageLDADecoder (M1.4 & Principle 4).
Includes the critical shuffled-label leakage test.
"""

import tempfile
from pathlib import Path
import numpy as np
import pytest
from sklearn.metrics import roc_auc_score

from apps.api.app.bci.base import BaseP300Decoder
from apps.api.app.bci.lda_decoder import ShrinkageLDADecoder


def create_synthetic_erp_dataset(n_epochs: int = 200, n_channels: int = 8, n_times: int = 230, seed: int = 42):
    """
    Generates synthetic epochs with known P300 ERP component for target epochs.
    Target ratio ~ 1/6 (oddball).
    """
    rng = np.random.RandomState(seed)
    labels = np.zeros(n_epochs, dtype=np.int32)
    # Every 6th epoch is a target
    labels[::6] = 1

    # Time axis: -100 ms to 800 ms
    times = np.linspace(-0.1, 0.8, n_times)
    # P300 template: positive Gaussian centered at 350 ms with std 60 ms
    p300_template = np.exp(-((times - 0.35) ** 2) / (2 * (0.06 ** 2)))

    # Pink/Gaussian noise background
    epochs = rng.normal(loc=0.0, scale=1.0, size=(n_epochs, n_channels, n_times)).astype(np.float32)

    # Add P300 to targets on parietal channels (e.g. channel 2)
    for i in range(n_epochs):
        if labels[i] == 1:
            epochs[i, 2, :] += 2.5 * p300_template

    return epochs, labels


def test_decoder_interface_compliance():
    """Ensures ShrinkageLDADecoder is an instance of BaseP300Decoder."""
    decoder = ShrinkageLDADecoder()
    assert isinstance(decoder, BaseP300Decoder)


def test_fit_and_predict():
    """Ensures decoder fits and predicts binary classes on synthetic ERPs."""
    epochs, labels = create_synthetic_erp_dataset(n_epochs=120)
    decoder = ShrinkageLDADecoder(sfreq=256.0, decim_factor=8)
    decoder.fit(epochs, labels)

    assert decoder.is_fitted is True
    scores = decoder.score_epochs(epochs)
    preds = decoder.predict(epochs)

    assert scores.shape == (120,)
    assert preds.shape == (120,)
    assert set(preds).issubset({0, 1})

    # Decent training AUC on synthetic clear P300
    auc = roc_auc_score(labels, scores)
    assert auc > 0.70, f"Expected AUC > 0.70 on synthetic ERP, got {auc}"


def test_shuffled_label_leakage():
    """
    Principle 4 Non-Negotiable Leakage Test:
    When labels are randomly shuffled, the decoder must NOT find signal.
    ROC-AUC on test data must fall near 0.5 (within [0.35, 0.65]).
    """
    epochs, labels = create_synthetic_erp_dataset(n_epochs=240, seed=123)

    # Train / Test split
    train_epochs, test_epochs = epochs[:160], epochs[160:]
    train_labels, test_labels = labels[:160], labels[160:]

    # Shuffle training labels breaking all real signal-label association
    rng = np.random.RandomState(999)
    shuffled_train_labels = train_labels.copy()
    rng.shuffle(shuffled_train_labels)

    decoder = ShrinkageLDADecoder(sfreq=256.0, decim_factor=8)
    decoder.fit(train_epochs, shuffled_train_labels)

    # Evaluate on held-out test set
    test_scores = decoder.score_epochs(test_epochs)
    shuffled_auc = roc_auc_score(test_labels, test_scores)

    print(f"\n[Leakage Test] Shuffled Labels Held-Out AUC: {shuffled_auc:.4f}")
    # Shuffled AUC must be near 0.5; if > 0.65 there is leakage in scaling/feature extraction
    assert 0.35 <= shuffled_auc <= 0.65, (
        f"Leakage detected! Shuffled-label AUC {shuffled_auc:.4f} is too far from 0.5"
    )


def test_character_decoding_logic():
    """Ensures row/col score accumulation decodes the winning character."""
    decoder = ShrinkageLDADecoder(n_rows=6, n_cols=6)
    decoder.is_fitted = True
    decoder.scaler.mean_ = np.zeros(64)
    decoder.scaler.scale_ = np.ones(64)
    decoder.feature_dim = 64

    # Mock score_epochs to return higher scores for row 3 (code 3) and col 4 (code 10)
    def mock_score(trial_epochs):
        return trial_epochs[:, 0, 0]  # Just use first sample as score

    decoder.score_epochs = mock_score

    # 1 repetition of 12 flashes
    codes = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    trial_epochs = np.zeros((12, 1, 1), dtype=np.float32)
    trial_epochs[2, 0, 0] = 5.0   # Code 3 (Row 3)
    trial_epochs[9, 0, 0] = 4.0   # Code 10 (Col 4)

    row, col, target_id = decoder.predict_character(trial_epochs, codes)
    assert row == 3, f"Expected row 3, got {row}"
    assert col == 4, f"Expected col 4, got {col}"
    # Target ID for (row 3, col 4) in 6x6 matrix: (3-1)*6 + 4 = 16
    assert target_id == 16


def test_model_save_and_load():
    """Verifies that model state can be persisted to disk and restored identically."""
    epochs, labels = create_synthetic_erp_dataset(n_epochs=60)
    decoder = ShrinkageLDADecoder(sfreq=256.0, decim_factor=8)
    decoder.fit(epochs, labels)
    orig_scores = decoder.score_epochs(epochs)

    with tempfile.NamedTemporaryFile(suffix=".pkl", delete=False) as tmp:
        tmp_path = tmp.name

    try:
        decoder.save(tmp_path)
        loaded_decoder = ShrinkageLDADecoder().load(tmp_path)
        assert loaded_decoder.is_fitted is True
        loaded_scores = loaded_decoder.score_epochs(epochs)
        assert np.allclose(orig_scores, loaded_scores, atol=1e-6)
    finally:
        Path(tmp_path).unlink(missing_ok=True)
