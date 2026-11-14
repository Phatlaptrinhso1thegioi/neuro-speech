"""
apps/api/app/bci/lda_decoder.py
Shrinkage LDA P300 Baseline Decoder.
Implements temporal decimation, spatiotemporal feature extraction, and shrinkage LDA.
"""

import pickle
import time
from pathlib import Path
from typing import Dict, Any, Optional, Tuple, List
import numpy as np
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.preprocessing import StandardScaler
from scipy import signal

from apps.api.app.bci.base import BaseP300Decoder


class ShrinkageLDADecoder(BaseP300Decoder):
    """
    P300 Decoder using temporal decimation, StandardScaler, and Shrinkage LDA.
    Conforms to BaseP300Decoder.
    """

    def __init__(
        self,
        sfreq: float = 256.0,
        epoch_tmin: float = -0.1,
        epoch_tmax: float = 0.8,
        analysis_window: Tuple[float, float] = (0.1, 0.7),
        decim_factor: int = 8,
        shrinkage: str = "auto",
        n_rows: int = 9,
        n_cols: int = 8,
    ):
        self.sfreq = sfreq
        self.epoch_tmin = epoch_tmin
        self.epoch_tmax = epoch_tmax
        self.analysis_window = analysis_window
        self.decim_factor = decim_factor
        self.shrinkage = shrinkage
        self.n_rows = n_rows
        self.n_cols = n_cols

        self.scaler = StandardScaler()
        self.lda = LinearDiscriminantAnalysis(solver="lsqr", shrinkage=self.shrinkage)
        self.is_fitted = False
        self.feature_dim = None

    def _extract_spatiotemporal_features(self, epochs: np.ndarray) -> np.ndarray:
        """
        Extracts temporal decimated spatiotemporal features from analysis window.
        epochs: shape (n_epochs, n_channels, n_times)
        Returns: shape (n_epochs, n_channels * n_decimated_times)
        """
        n_epochs, n_channels, n_times = epochs.shape
        time_axis = np.linspace(self.epoch_tmin, self.epoch_tmax, n_times, endpoint=False)

        # Slice to analysis window (e.g. 100 ms to 700 ms where P300 is prominent)
        mask = (time_axis >= self.analysis_window[0]) & (time_axis <= self.analysis_window[1])
        windowed = epochs[:, :, mask]

        # Decimate temporally by averaging non-overlapping bins or downsampling
        if self.decim_factor > 1:
            n_win_times = windowed.shape[2]
            n_bins = n_win_times // self.decim_factor
            if n_bins > 0:
                # Truncate to exact multiple
                usable_len = n_bins * self.decim_factor
                truncated = windowed[:, :, :usable_len]
                # Average over each bin of size decim_factor
                binned = truncated.reshape(n_epochs, n_channels, n_bins, self.decim_factor).mean(axis=3)
            else:
                binned = windowed
        else:
            binned = windowed

        # Flatten into 2D feature matrix (n_epochs, n_features)
        features = binned.reshape(n_epochs, -1)
        return features.astype(np.float32)

    def fit(self, epochs: np.ndarray, labels: np.ndarray) -> "ShrinkageLDADecoder":
        """
        Fits StandardScaler and Shrinkage LDA on training epochs.
        No test leakage: scaler is fit solely on training data.
        """
        features = self._extract_spatiotemporal_features(epochs)
        self.feature_dim = features.shape[1]

        scaled_features = self.scaler.fit_transform(features)
        self.lda.fit(scaled_features, labels)
        self.is_fitted = True
        return self

    def score_epochs(self, epochs: np.ndarray) -> np.ndarray:
        """
        Computes continuous classification decision score for each epoch.
        Positive values indicate higher target (P300) likelihood.
        """
        if not self.is_fitted:
            raise RuntimeError("Decoder is not fitted! Call fit() before scoring.")
        features = self._extract_spatiotemporal_features(epochs)
        scaled_features = self.scaler.transform(features)
        # Decision function: w^T x + b
        scores = self.lda.decision_function(scaled_features)
        return scores.astype(np.float32)

    def predict(self, epochs: np.ndarray) -> np.ndarray:
        """Binary predictions (1 = Target, 0 = NonTarget)."""
        if not self.is_fitted:
            raise RuntimeError("Decoder is not fitted! Call fit() before predicting.")
        features = self._extract_spatiotemporal_features(epochs)
        scaled_features = self.scaler.transform(features)
        return self.lda.predict(scaled_features).astype(np.int32)

    def predict_character(
        self,
        trial_epochs: np.ndarray,
        trial_stim_codes: np.ndarray,
        max_repetitions: Optional[int] = None,
    ) -> Tuple[int, int, int]:
        """
        Decodes a character from stimulus epochs in a character trial.
        Aggregates decision scores per row and column up to max_repetitions.
        
        Returns:
          (decoded_row, decoded_col, decoded_target_id)
        """
        scores = self.score_epochs(trial_epochs)
        n_flashes_per_rep = self.n_rows + self.n_cols

        if max_repetitions is not None:
            max_flashes = max_repetitions * n_flashes_per_rep
            scores = scores[:max_flashes]
            trial_stim_codes = trial_stim_codes[:max_flashes]

        row_scores = np.zeros(self.n_rows, dtype=np.float32)
        col_scores = np.zeros(self.n_cols, dtype=np.float32)

        for score, code in zip(scores, trial_stim_codes):
            code = int(code)
            if 1 <= code <= self.n_rows:
                # Row code
                row_scores[code - 1] += score
            elif (self.n_rows + 1) <= code <= (self.n_rows + self.n_cols):
                # Column code
                col_scores[code - self.n_rows - 1] += score

        decoded_row = int(np.argmax(row_scores)) + 1
        decoded_col = int(np.argmax(col_scores)) + 1
        decoded_target_id = (decoded_row - 1) * self.n_cols + decoded_col

        return decoded_row, decoded_col, decoded_target_id

    def measure_latency(self, test_epochs: np.ndarray, n_trials: int = 50) -> Dict[str, float]:
        """
        Measures honest inference latency (median and p95) using monotonic timer.
        """
        sample_batch = test_epochs[:17]  # 1 repetition
        latencies_ms = []

        # Warm up
        for _ in range(5):
            self.score_epochs(sample_batch)

        for _ in range(n_trials):
            t0 = time.perf_counter()
            self.score_epochs(sample_batch)
            t1 = time.perf_counter()
            latencies_ms.append((t1 - t0) * 1000.0)

        latencies_ms = np.array(latencies_ms)
        return {
            "median_ms": float(np.median(latencies_ms)),
            "p95_ms": float(np.percentile(latencies_ms, 95)),
            "p99_ms": float(np.percentile(latencies_ms, 99)),
            "n_runs": n_trials
        }

    def save(self, filepath: str) -> None:
        """Saves model state dictionary to .pkl."""
        state = {
            "sfreq": self.sfreq,
            "epoch_tmin": self.epoch_tmin,
            "epoch_tmax": self.epoch_tmax,
            "analysis_window": self.analysis_window,
            "decim_factor": self.decim_factor,
            "shrinkage": self.shrinkage,
            "n_rows": self.n_rows,
            "n_cols": self.n_cols,
            "scaler": self.scaler,
            "lda": self.lda,
            "is_fitted": self.is_fitted,
            "feature_dim": self.feature_dim,
        }
        with open(filepath, "wb") as f:
            pickle.dump(state, f)

    def load(self, filepath: str) -> "ShrinkageLDADecoder":
        """Loads model state from .pkl."""
        with open(filepath, "rb") as f:
            state = pickle.load(f)
        self.sfreq = state["sfreq"]
        self.epoch_tmin = state["epoch_tmin"]
        self.epoch_tmax = state["epoch_tmax"]
        self.analysis_window = state["analysis_window"]
        self.decim_factor = state["decim_factor"]
        self.shrinkage = state["shrinkage"]
        self.n_rows = state["n_rows"]
        self.n_cols = state["n_cols"]
        self.scaler = state["scaler"]
        self.lda = state["lda"]
        self.is_fitted = state["is_fitted"]
        self.feature_dim = state["feature_dim"]
        return self
