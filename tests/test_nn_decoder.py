"""
tests/test_nn_decoder.py
Unit tests for PyTorch CNN-Transformer P300 Neural Decoder (M5).
Tests:
- BaseP300Decoder interface compliance
- Training / fitting on dummy epochs
- Continuous score and binary classification output shapes and types
- Checkpoint persistence and safe loading (weights_only=True)
- Deterministic score matching after save and load
"""

import os
import json
import tempfile
import pytest
import numpy as np

from apps.api.app.bci.base import BaseP300Decoder
from apps.api.app.bci.nn_decoder import CNNTransformerDecoder, TORCH_AVAILABLE

try:
    import torch
except ImportError:
    torch = None


@pytest.mark.skipif(not TORCH_AVAILABLE, reason="PyTorch is not installed in the environment")
def test_nn_decoder_interface_compliance():
    """Verify CNNTransformerDecoder inherits from BaseP300Decoder."""
    decoder = CNNTransformerDecoder(n_channels=16, n_times=230, epochs=1, batch_size=16)
    assert isinstance(decoder, BaseP300Decoder)
    assert hasattr(decoder, "fit")
    assert hasattr(decoder, "score_epochs")
    assert hasattr(decoder, "predict")
    assert hasattr(decoder, "save")
    assert hasattr(decoder, "load")


@pytest.mark.skipif(not TORCH_AVAILABLE, reason="PyTorch is not installed in the environment")
def test_nn_decoder_fit_and_predict():
    """Test fitting on dummy epochs and checking output shapes and types."""
    np.random.seed(42)
    n_epochs = 32
    n_channels = 16
    n_times = 230

    # 32 epochs: 6 targets, 26 non-targets
    X = np.random.randn(n_epochs, n_channels, n_times).astype(np.float32)
    y = np.zeros(n_epochs, dtype=np.int32)
    y[:6] = 1

    decoder = CNNTransformerDecoder(
        n_channels=n_channels,
        n_times=n_times,
        d_model=32,
        n_heads=2,
        n_layers=1,
        learning_rate=1e-3,
        epochs=2,
        batch_size=16,
        device="cpu"
    )

    assert not decoder.is_fitted
    decoder.fit(X, y)
    assert decoder.is_fitted

    # Score epochs
    scores = decoder.score_epochs(X)
    assert isinstance(scores, np.ndarray)
    assert scores.shape == (n_epochs,)
    assert scores.dtype == np.float32 or scores.dtype == np.float64

    # Binary predictions
    preds = decoder.predict(X)
    assert isinstance(preds, np.ndarray)
    assert preds.shape == (n_epochs,)
    assert set(np.unique(preds)).issubset({0, 1})


@pytest.mark.skipif(not TORCH_AVAILABLE, reason="PyTorch is not installed in the environment")
def test_nn_decoder_save_and_load(tmp_path):
    """Test saving checkpoint (.pt + .json) and reloading state safely."""
    np.random.seed(42)
    X = np.random.randn(16, 16, 230).astype(np.float32)
    y = np.array([1, 0] * 8, dtype=np.int32)

    decoder = CNNTransformerDecoder(
        n_channels=16,
        n_times=230,
        d_model=32,
        n_heads=2,
        epochs=1,
        batch_size=8,
        device="cpu"
    )
    decoder.fit(X, y)
    scores_before = decoder.score_epochs(X)

    checkpoint_file = tmp_path / "test_model.pt"
    decoder.save(str(checkpoint_file))

    assert checkpoint_file.exists()
    json_file = tmp_path / "test_model.json"
    assert json_file.exists()

    with open(json_file, "r", encoding="utf-8") as f:
        meta = json.load(f)
    assert meta["model_type"] == "CNNTransformerP300Net"
    assert "sha256" in meta
    assert len(meta["sha256"]) == 64

    # Create fresh decoder and load weights
    decoder_loaded = CNNTransformerDecoder(
        n_channels=16,
        n_times=230,
        d_model=32,
        n_heads=2,
        device="cpu"
    )
    decoder_loaded.load(str(checkpoint_file))
    assert decoder_loaded.is_fitted

    scores_after = decoder_loaded.score_epochs(X)
    np.testing.assert_allclose(scores_before, scores_after, rtol=1e-5, atol=1e-5)
