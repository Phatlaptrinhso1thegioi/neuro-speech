"""
apps/api/app/eeg/preprocessor.py
EEG Preprocessing Pipeline for NEURO-SPEECH.
Implements Principle 8: One causal filter with carried state for continuous signals and streaming replay.
"""

from typing import List, Tuple, Optional, Dict, Any
import numpy as np
from scipy import signal


class EEGPreprocessor:
    """
    Standardizes, filters, and epochs continuous multi-channel EEG signals.
    Uses causal SOS filtering with carried state (sosfilt_zi) to avoid phase distortion
    and support real-time streaming without whole-file zero-phase artifacts.
    """

    def __init__(
        self,
        sfreq: float = 256.0,
        low_cut: float = 1.0,
        high_cut: float = 40.0,
        filter_order: int = 4,
        notch_freq: Optional[float] = 60.0,
        epoch_tmin: float = -0.1,
        epoch_tmax: float = 0.8,
        baseline_window: Optional[Tuple[float, float]] = (-0.1, 0.0),
        artifact_threshold_uv: float = 120.0,
    ):
        self.sfreq = sfreq
        self.low_cut = low_cut
        self.high_cut = high_cut
        self.filter_order = filter_order
        self.notch_freq = notch_freq
        self.epoch_tmin = epoch_tmin
        self.epoch_tmax = epoch_tmax
        self.baseline_window = baseline_window
        self.artifact_threshold_uv = artifact_threshold_uv

        # Design causal bandpass SOS filter
        self.bp_sos = signal.butter(
            self.filter_order,
            [self.low_cut, self.high_cut],
            btype="bandpass",
            fs=self.sfreq,
            output="sos"
        )
        self.bp_zi = None  # Will be initialized per channel count

        # Optional notch SOS filter
        self.notch_sos = None
        if self.notch_freq and self.notch_freq < (self.sfreq / 2.0):
            # Design narrow bandstop around notch_freq (Q=30)
            df = 1.0
            self.notch_sos = signal.iirnotch(self.notch_freq, 30.0, fs=self.sfreq)
            self.notch_sos = signal.tf2sos(*self.notch_sos)
        self.notch_zi = None

    @staticmethod
    def identify_eeg_channels(channel_names: List[str]) -> List[str]:
        """
        Dynamically detects EEG channels from a channel list.
        Never relies on fixed hardcoded indices; excludes non-EEG state channels.
        """
        excluded_prefixes = ("stim", "phase", "select", "current", "target", "display", "fake", "status", "trig")
        excluded_exact = {"stimulustype", "selectedtarget", "selectedrow", "selectedcolumn",
                          "phaseinsequence", "stimulusbegin", "stimuluscode", "currenttarget",
                          "fakefeedback", "displayresults", "target stim", "flash stim", "sti 014"}

        eeg_chans = []
        for ch in channel_names:
            ch_lower = ch.strip().lower()
            if ch_lower in excluded_exact:
                continue
            if any(ch_lower.startswith(p) for p in excluded_prefixes):
                continue
            # If channel starts with EEG_ or is standard 10-20 name
            if ch.startswith("EEG_") or ch_lower.startswith("eeg "):
                eeg_chans.append(ch)
            elif any(c in ch_lower for c in ["fp", "fz", "cz", "pz", "oz", "c3", "c4", "p3", "p4", "po", "fc", "cp", "f3", "f4", "f7", "f8", "t7", "t8", "o1", "o2", "p7", "p8"]):
                eeg_chans.append(ch)

        if not eeg_chans:
            # Fallback: take channels not containing stim/status
            eeg_chans = [ch for ch in channel_names if ch.lower() not in excluded_exact]
        return eeg_chans

    @staticmethod
    def standardize_to_uv(data: np.ndarray) -> np.ndarray:
        """
        Standardizes EEG signal units to microvolts (µV).
        If raw input values are in Volts (max amplitude < 1e-3), scales by 1e6.
        """
        data = np.asarray(data, dtype=np.float32)
        max_abs = np.nanmax(np.abs(data))
        if max_abs < 1e-3:
            return data * 1e6
        return data

    def reset_filter_state(self, n_channels: int):
        """Initializes causal filter states for carried streaming (sosfilt_zi)."""
        zi_single_bp = signal.sosfilt_zi(self.bp_sos)
        # Shape: (n_sections, 2, n_channels)
        self.bp_zi = np.repeat(zi_single_bp[:, :, np.newaxis], n_channels, axis=2)

        if self.notch_sos is not None:
            zi_single_notch = signal.sosfilt_zi(self.notch_sos)
            self.notch_zi = np.repeat(zi_single_notch[:, :, np.newaxis], n_channels, axis=2)
        else:
            self.notch_zi = None

    def filter_continuous(self, data_uv: np.ndarray, carried_state: bool = True) -> np.ndarray:
        """
        Causal bandpass and optional notch filtering.
        data_uv: shape (n_channels, n_samples)
        Carries filter state across consecutive calls (Principle 8).
        """
        n_channels, n_samples = data_uv.shape
        if self.bp_zi is None or self.bp_zi.shape[2] != n_channels:
            self.reset_filter_state(n_channels)

        # Scale zi by initial sample value for smooth startup
        if not carried_state:
            self.reset_filter_state(n_channels)
            for ch in range(n_channels):
                self.bp_zi[:, :, ch] *= data_uv[ch, 0]
                if self.notch_zi is not None:
                    self.notch_zi[:, :, ch] *= data_uv[ch, 0]

        filtered = np.zeros_like(data_uv, dtype=np.float32)

        # Apply causal bandpass
        for ch in range(n_channels):
            filt_ch, self.bp_zi[:, :, ch] = signal.sosfilt(
                self.bp_sos, data_uv[ch, :], zi=self.bp_zi[:, :, ch]
            )
            if self.notch_sos is not None:
                filt_ch, self.notch_zi[:, :, ch] = signal.sosfilt(
                    self.notch_sos, filt_ch, zi=self.notch_zi[:, :, ch]
                )
            filtered[ch, :] = filt_ch

        return filtered

    def filter_continuous_offline(self, data_uv: np.ndarray) -> np.ndarray:
        """
        Zero-phase forward-backward filter.
        Labeled OFFLINE per Principle 8. Not used in streaming/replay.
        """
        filtered = signal.sosfiltfilt(self.bp_sos, data_uv, axis=1)
        if self.notch_sos is not None:
            filtered = signal.sosfiltfilt(self.notch_sos, filtered, axis=1)
        return filtered.astype(np.float32)

    def extract_epochs(
        self,
        continuous_eeg_uv: np.ndarray,
        onset_indices: np.ndarray,
    ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Extracts stimulus-locked epochs from continuous signal.
        continuous_eeg_uv: shape (n_channels, n_samples)
        onset_indices: sample index of each flash onset
        
        Returns:
          epochs: shape (n_epochs, n_channels, n_times)
          time_axis: 1D array of epoch time offsets in seconds
          artifact_flags: boolean array (n_epochs,) indicating whether peak-to-peak > threshold
        """
        n_channels, total_samples = continuous_eeg_uv.shape
        epoch_len = int(round((self.epoch_tmax - self.epoch_tmin) * self.sfreq))
        pre_samples = int(round(abs(self.epoch_tmin) * self.sfreq))
        post_samples = epoch_len - pre_samples
        time_axis = np.linspace(self.epoch_tmin, self.epoch_tmax, epoch_len, endpoint=False)

        # Baseline indices relative to epoch start
        if self.baseline_window is not None:
            b_start = int((self.baseline_window[0] - self.epoch_tmin) * self.sfreq)
            b_end = int((self.baseline_window[1] - self.epoch_tmin) * self.sfreq)
            b_start = max(0, b_start)
            b_end = max(b_start, b_end)
        else:
            b_start, b_end = None, None

        epochs = []
        artifact_flags = []
        valid_onsets = []

        for onset in onset_indices:
            start_idx = onset - pre_samples
            end_idx = onset + post_samples

            # Boundary safety
            if start_idx < 0:
                pad_left = abs(start_idx)
                chunk = continuous_eeg_uv[:, 0:end_idx]
                chunk = np.pad(chunk, ((0, 0), (pad_left, 0)), mode="edge")
            elif end_idx > total_samples:
                pad_right = end_idx - total_samples
                chunk = continuous_eeg_uv[:, start_idx:total_samples]
                chunk = np.pad(chunk, ((0, 0), (0, pad_right)), mode="edge")
            else:
                chunk = continuous_eeg_uv[:, start_idx:end_idx].copy()

            # Baseline correction
            if b_start is not None and b_end is not None and b_end > b_start:
                baseline_mean = np.mean(chunk[:, b_start:b_end], axis=1, keepdims=True)
                chunk = chunk - baseline_mean

            # Peak-to-peak artifact flag
            ptp = np.ptp(chunk, axis=1)
            is_artifact = bool(np.any(ptp > self.artifact_threshold_uv))

            epochs.append(chunk)
            artifact_flags.append(is_artifact)

        epochs_arr = np.array(epochs, dtype=np.float32)
        artifact_arr = np.array(artifact_flags, dtype=bool)
        return epochs_arr, time_axis, artifact_arr
