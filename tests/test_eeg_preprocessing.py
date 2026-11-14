"""
tests/test_eeg_preprocessing.py
Tests for EEG preprocessing pipeline (M1.2 & Principle 8).
"""

import numpy as np
import pytest
from apps.api.app.eeg.preprocessor import EEGPreprocessor


def test_dynamic_channel_inspection():
    """Ensures channels are identified dynamically without hardcoding."""
    mock_channels = [
        "Fz", "Cz", "Pz", "Oz", "StimulusCode", "PhaseInSequence",
        "EEG_F3", "EEG_C4", "Status", "Trigger"
    ]
    detected = EEGPreprocessor.identify_eeg_channels(mock_channels)
    assert "Fz" in detected
    assert "Cz" in detected
    assert "Pz" in detected
    assert "EEG_F3" in detected
    assert "EEG_C4" in detected
    # Excluded state channels
    assert "StimulusCode" not in detected
    assert "PhaseInSequence" not in detected
    assert "Status" not in detected
    assert "Trigger" not in detected


def test_standardize_to_uv():
    """Ensures signals in Volts are correctly scaled to µV, while µV remains unchanged."""
    # Data in Volts (e.g. 5e-5 V = 50 µV)
    data_v = np.array([[5e-5, -3e-5, 2e-5]], dtype=np.float32)
    standardized_v = EEGPreprocessor.standardize_to_uv(data_v)
    assert np.allclose(standardized_v, np.array([[50.0, -30.0, 20.0]], dtype=np.float32))

    # Data already in µV
    data_uv = np.array([[50.0, -30.0, 20.0]], dtype=np.float32)
    standardized_uv = EEGPreprocessor.standardize_to_uv(data_uv)
    assert np.allclose(standardized_uv, data_uv)


def test_causal_sos_carried_state():
    """
    Principle 8: Verifies that carried filter state across chunk boundaries
    produces identical continuous output as filtering a continuous stream.
    """
    fs = 256.0
    t = np.linspace(0, 4.0, int(fs * 4.0), endpoint=False)
    # Synthetic multi-frequency signal (10 Hz signal + 50 Hz noise + DC offset)
    signal_continuous = (10.0 * np.sin(2 * np.pi * 10 * t) +
                         5.0 * np.sin(2 * np.pi * 50 * t) +
                         15.0)[np.newaxis, :]

    prep_streaming = EEGPreprocessor(sfreq=fs, low_cut=1.0, high_cut=40.0, filter_order=4)

    # Process in two consecutive chunks with carried state
    chunk_size = len(t) // 2
    chunk1 = signal_continuous[:, :chunk_size]
    chunk2 = signal_continuous[:, chunk_size:]

    filt1 = prep_streaming.filter_continuous(chunk1, carried_state=False)
    filt2 = prep_streaming.filter_continuous(chunk2, carried_state=True)
    filt_streamed = np.concatenate([filt1, filt2], axis=1)

    # Compare with monolithic single-pass causal filter
    prep_mono = EEGPreprocessor(sfreq=fs, low_cut=1.0, high_cut=40.0, filter_order=4)
    filt_mono = prep_mono.filter_continuous(signal_continuous, carried_state=False)

    # Streaming with carried state must match monolithic causal filter identically
    assert np.allclose(filt_streamed, filt_mono, atol=1e-5), "Carried filter state produced mismatch!"


def test_epoch_extraction_and_baseline():
    """Verifies epoch window shape, baseline subtraction, and artifact flagging."""
    fs = 256.0
    n_channels = 4
    n_samples = 2560  # 10 seconds
    data = np.ones((n_channels, n_samples), dtype=np.float32) * 20.0

    # Add an artificial peak at sample 550
    data[0, 550] = 200.0  # Peak to peak > 120 µV

    prep = EEGPreprocessor(
        sfreq=fs,
        epoch_tmin=-0.1,
        epoch_tmax=0.8,
        baseline_window=(-0.1, 0.0),
        artifact_threshold_uv=120.0
    )

    onsets = np.array([256, 512, 1024])
    epochs, time_axis, artifacts = prep.extract_epochs(data, onsets)

    # Expected time samples: (-0.1 to 0.8) * 256 = 25.6 + 204.8 = 230 samples approx
    expected_times = int(0.9 * fs)
    assert epochs.shape == (3, n_channels, expected_times)
    assert len(time_axis) == expected_times
    assert np.isclose(time_axis[0], -0.1)
    assert time_axis[-1] < 0.8

    # Baseline correction: pre-stimulus mean subtracted -> pre-stimulus window should be 0.0
    pre_samples = int(0.1 * fs)
    # The normal epochs should have baseline mean 0.0
    assert np.allclose(epochs[0, :, :pre_samples], 0.0)

    # Second epoch contains sample 550 (onset 512 + 38 = 550), which exceeds threshold
    assert artifacts[1] is True or artifacts[1] == 1
    # First epoch does not exceed threshold
    assert artifacts[0] is False or artifacts[0] == 0
    # Alignment intact: all 3 epochs returned
    assert len(epochs) == len(onsets)
