"""
apps/api/app/bci/nn_decoder.py
PyTorch CNN-Transformer P300 Neural Decoder for NEURO-SPEECH (M5).
Implements BaseP300Decoder interface.
Architecture:
  1. Spatial convolution across channels (learns spatial filter weights).
  2. Temporal convolution & pooling across time points.
  3. Light Transformer Encoder (d_model=64, 4 heads, 1-2 layers) for long-range temporal attention.
  4. Linear classification head producing stimulus-locked P300 oddball scores.
Optional dependency: If PyTorch is absent, gracefully warns and allows LDA default.
"""

import os
import json
import time
import hashlib
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np

from apps.api.app.bci.base import BaseP300Decoder

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import TensorDataset, DataLoader
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


if TORCH_AVAILABLE:
    class CNNTransformerP300Net(nn.Module):
        """
        Lightweight CNN-Transformer model for P300 event-related potential detection.
        Input: (batch_size, n_channels, n_times) e.g. (B, 16, 230)
        """
        def __init__(self, n_channels: int = 16, n_times: int = 230, d_model: int = 64, n_heads: int = 4, n_layers: int = 1):
            super().__init__()
            self.n_channels = n_channels
            self.n_times = n_times
            self.d_model = d_model

            # 1. Spatial Convolution: collapses across all channels
            self.spatial_conv = nn.Conv2d(
                in_channels=1,
                out_channels=16,
                kernel_size=(n_channels, 1),
                bias=False
            )
            self.bn_spatial = nn.BatchNorm2d(16)
            self.act1 = nn.ELU()

            # 2. Temporal Convolution & Decimation
            self.temporal_conv = nn.Conv2d(
                in_channels=16,
                out_channels=d_model,
                kernel_size=(1, 15),
                stride=(1, 4),
                padding=(0, 7),
                bias=False
            )
            self.bn_temporal = nn.BatchNorm2d(d_model)
            self.act2 = nn.ELU()
            self.pool = nn.AvgPool2d(kernel_size=(1, 2), stride=(1, 2))

            # 3. Transformer Encoder Layer (1-2 layers, 4 heads, d_model 64 per prompt spec)
            encoder_layer = nn.TransformerEncoderLayer(
                d_model=d_model,
                nhead=n_heads,
                dim_feedforward=128,
                dropout=0.1,
                activation="gelu",
                batch_first=True
            )
            self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)

            # 4. Classification Head
            self.fc = nn.Sequential(
                nn.Dropout(0.25),
                nn.Linear(d_model, 32),
                nn.ELU(),
                nn.Linear(32, 1)
            )

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            # x shape: (B, C, T) -> add channel dimension: (B, 1, C, T)
            if x.dim() == 3:
                x = x.unsqueeze(1)

            # Spatial feature filtering: (B, 16, 1, T)
            x = self.act1(self.bn_spatial(self.spatial_conv(x)))

            # Temporal feature extraction & downsampling: (B, d_model, 1, T_down)
            x = self.act2(self.bn_temporal(self.temporal_conv(x)))
            x = self.pool(x)

            # Squeeze channel dim: (B, d_model, T_seq) -> transpose to (B, T_seq, d_model)
            x = x.squeeze(2).transpose(1, 2)

            # Transformer attention
            x = self.transformer(x)

            # Global average pooling across time
            x = x.mean(dim=1)

            # Logits output: (B, 1) -> (B,)
            out = self.fc(x).squeeze(-1)
            return out


class CNNTransformerDecoder(BaseP300Decoder):
    """
    P300 Decoder using PyTorch CNN-Transformer.
    Complies with BaseP300Decoder interface and Layer 1 boundaries.
    """

    def __init__(
        self,
        n_channels: int = 16,
        n_times: int = 230,
        d_model: int = 64,
        n_heads: int = 4,
        n_layers: int = 1,
        learning_rate: float = 1e-3,
        epochs: int = 15,
        batch_size: int = 64,
        device: Optional[str] = None
    ):
        if not TORCH_AVAILABLE:
            raise ImportError("PyTorch is not installed in the current environment. Please install torch to use CNNTransformerDecoder.")

        self.n_channels = n_channels
        self.n_times = n_times
        self.d_model = d_model
        self.n_heads = n_heads
        self.n_layers = n_layers
        self.learning_rate = learning_rate
        self.epochs = epochs
        self.batch_size = batch_size

        if device:
            self.device = torch.device(device)
        else:
            self.device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

        self.model = CNNTransformerP300Net(
            n_channels=n_channels,
            n_times=n_times,
            d_model=d_model,
            n_heads=n_heads,
            n_layers=n_layers
        ).to(self.device)

        self.is_fitted = False

    def fit(self, epochs: np.ndarray, labels: np.ndarray) -> "CNNTransformerDecoder":
        """
        Fits CNN-Transformer model on training epochs and binary labels.
        epochs: (n_epochs, n_channels, n_times)
        labels: (n_epochs,) where 1 = Target, 0 = NonTarget
        """
        self.model.train()
        n_epochs, c, t = epochs.shape
        self.n_channels = c
        self.n_times = t

        # Positive class weight (P300 oddball is ~1:5 ratio)
        n_pos = np.sum(labels == 1)
        n_neg = np.sum(labels == 0)
        pos_weight = float(n_neg / max(1, n_pos))

        x_tensor = torch.tensor(epochs, dtype=torch.float32)
        y_tensor = torch.tensor(labels, dtype=torch.float32)

        dataset = TensorDataset(x_tensor, y_tensor)
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

        criterion = nn.BCEWithLogitsLoss(pos_weight=torch.tensor([pos_weight], device=self.device))
        optimizer = optim.AdamW(self.model.parameters(), lr=self.learning_rate, weight_decay=1e-4)

        for epoch in range(self.epochs):
            for batch_x, batch_y in loader:
                batch_x = batch_x.to(self.device)
                batch_y = batch_y.to(self.device)

                optimizer.zero_grad()
                logits = self.model(batch_x)
                loss = criterion(logits, batch_y)
                loss.backward()
                optimizer.step()

        self.is_fitted = True
        return self

    def score_epochs(self, epochs: np.ndarray) -> np.ndarray:
        """Returns continuous P300 decision scores (logits)."""
        self.model.eval()
        with torch.no_grad():
            x_tensor = torch.tensor(epochs, dtype=torch.float32).to(self.device)
            logits = self.model(x_tensor)
            scores = logits.cpu().numpy()
        return scores

    def predict(self, epochs: np.ndarray) -> np.ndarray:
        """Predicts binary classes: 1 for Target (logit > 0), 0 for NonTarget."""
        scores = self.score_epochs(epochs)
        return (scores > 0.0).astype(int)

    def save(self, filepath: str) -> None:
        """Persists trained model checkpoint safely as .pt plus metadata JSON and SHA-256."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)

        # Save weights safely
        torch.save(self.model.state_dict(), str(path))

        # Calculate SHA-256
        h = hashlib.sha256()
        with open(path, "rb") as f:
            h.update(f.read())
        sha256_val = h.hexdigest()

        # Save metadata JSON
        meta_path = path.with_suffix(".json")
        meta = {
            "model_type": "CNNTransformerP300Net",
            "sha256": sha256_val,
            "architecture": {
                "n_channels": self.n_channels,
                "n_times": self.n_times,
                "d_model": self.d_model,
                "n_heads": self.n_heads,
                "n_layers": self.n_layers,
            },
            "training_config": {
                "epochs": self.epochs,
                "batch_size": self.batch_size,
                "learning_rate": self.learning_rate,
            },
            "saved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2)

    def load(self, filepath: str) -> "CNNTransformerDecoder":
        """Loads trained weights safely using weights_only=True."""
        path = Path(filepath)
        state_dict = torch.load(str(path), map_location=self.device, weights_only=True)
        self.model.load_state_dict(state_dict)
        self.model.eval()
        self.is_fitted = True
        return self
