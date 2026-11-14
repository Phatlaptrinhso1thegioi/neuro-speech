"""
apps/api/app/bci/base.py
Abstract Base Class for P300 Decoders.
Enforces Layer 1 boundary: takes epochs and stimulus IDs, outputs scores and decoded symbols.
Never touches or inspects language prediction or user buffer (Principle 2).
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Optional
import numpy as np


class BaseP300Decoder(ABC):
    """Abstract Base Class for P300 Decoders."""

    @abstractmethod
    def fit(self, epochs: np.ndarray, labels: np.ndarray) -> "BaseP300Decoder":
        """
        Fits the decoder on training epochs and binary target/non-target labels.
        epochs: (n_epochs, n_channels, n_times)
        labels: (n_epochs,) where 1 = Target, 0 = NonTarget
        """
        pass

    @abstractmethod
    def predict(self, epochs: np.ndarray) -> np.ndarray:
        """
        Predicts binary classes for given epochs.
        Returns: (n_epochs,) with 1 = Target, 0 = NonTarget
        """
        pass

    @abstractmethod
    def score_epochs(self, epochs: np.ndarray) -> np.ndarray:
        """
        Returns continuous classification decision scores or target probabilities.
        Returns: (n_epochs,) float array.
        """
        pass

    @abstractmethod
    def save(self, filepath: str) -> None:
        """Persists trained model checkpoint to disk."""
        pass

    @abstractmethod
    def load(self, filepath: str) -> "BaseP300Decoder":
        """Loads model checkpoint from disk."""
        pass
