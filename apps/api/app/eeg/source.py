"""
apps/api/app/eeg/source.py
EEG Source Abstraction: BaseEEGSource, ReplaySource, and SyntheticSource.
Enables swapping between Replay, Simulation, and future Live Hardware (e.g. LSL)
without touching the decoder or speller logic.
"""

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import scipy.io as sio

from apps.api.app.eeg.preprocessor import EEGPreprocessor


class BaseEEGSource(ABC):
    """Abstract interface for all continuous EEG sources."""

    def __init__(self, sfreq: float, channel_names: List[str], mode_badge: str, split_name: str = ""):
        self.sfreq = sfreq
        self.channel_names = channel_names
        self.mode_badge = mode_badge
        self.split_name = split_name
        self.is_running = False
        self.is_paused = False
        self.current_sample_idx = 0

    @property
    def current_time_s(self) -> float:
        return self.current_sample_idx / self.sfreq

    @abstractmethod
    def start(self) -> None:
        pass

    @abstractmethod
    def pause(self) -> None:
        pass

    @abstractmethod
    def resume(self) -> None:
        pass

    @abstractmethod
    def stop(self) -> None:
        pass

    @abstractmethod
    def seek(self, target_time_s: float) -> None:
        pass

    @abstractmethod
    def get_chunk(self, chunk_size_samples: int) -> Dict[str, Any]:
        """
        Retrieves next chunk of samples with exact timestamps and active stimulus markers.
        """
        pass


class ReplaySource(BaseEEGSource):
    """
    Replay source that replays strictly the held-out test split (Principle 10).
    Streams sliding windows with exact timestamps; never dumps the whole file at once.
    On seek: re-warms filter state from an earlier window to avoid phase discontinuity.
    """

    def __init__(self, raw_mat_path: Path, session_idx: int = 2):
        self.raw_mat_path = raw_mat_path
        self.session_idx = session_idx

        mat = sio.loadmat(self.raw_mat_path)
        data = mat["data"]
        sess = data[0, session_idx]

        self.continuous_data_uv = EEGPreprocessor.standardize_to_uv(sess["X"][0, 0].T)
        self.y_labels = sess["y"][0, 0].flatten()
        self.y_stim = sess["y_stim"][0, 0].flatten()
        self.trials = sess["trial"][0, 0].flatten()

        sfreq = float(data[0, 0]["fs"][0, 0][0, 0])
        raw_channels = [str(c[0]) for c in data[0, 0]["channels"][0, 0].flatten()]
        eeg_channels = EEGPreprocessor.identify_eeg_channels(raw_channels)

        super().__init__(
            sfreq=sfreq,
            channel_names=eeg_channels,
            mode_badge="REAL DATASET REPLAY",
            split_name=f"Session {session_idx} (Held-out Test Split)"
        )

        self.total_samples = self.continuous_data_uv.shape[1]
        self.total_duration_s = self.total_samples / self.sfreq

        # Preprocessor with causal SOS filter (Principle 8)
        self.preprocessor = EEGPreprocessor(
            sfreq=self.sfreq,
            low_cut=0.1,
            high_cut=20.0,
            filter_order=4,
            notch_freq=None
        )
        self.preprocessor.reset_filter_state(len(self.channel_names))

        # Flash onsets and event index
        flash_mask = (self.y_stim[:-1] == 0) & (self.y_stim[1:] > 0)
        self.flash_onsets = np.where(flash_mask)[0] + 1
        self.flash_codes = self.y_stim[self.flash_onsets].astype(int)
        self.flash_targets = (self.y_labels[self.flash_onsets] == 2).astype(int)

    def start(self) -> None:
        self.current_sample_idx = 0
        self.preprocessor.reset_filter_state(len(self.channel_names))
        self.is_running = True
        self.is_paused = False

    def pause(self) -> None:
        self.is_paused = True

    def resume(self) -> None:
        if self.is_running:
            self.is_paused = False

    def stop(self) -> None:
        self.is_running = False
        self.is_paused = False
        self.current_sample_idx = 0

    def seek(self, target_time_s: float) -> None:
        """
        Seeks to target timestamp.
        Rebuilds and re-warms causal filter state from 2.0s prior to target time.
        """
        target_sample = int(np.clip(target_time_s * self.sfreq, 0, self.total_samples - 1))
        warmup_duration_s = 2.0
        warmup_samples = int(warmup_duration_s * self.sfreq)
        warmup_start = max(0, target_sample - warmup_samples)

        # Reset filter and re-warm sequentially up to target_sample
        self.preprocessor.reset_filter_state(len(self.channel_names))
        if target_sample > warmup_start:
            warmup_chunk = self.continuous_data_uv[:, warmup_start:target_sample]
            # Warm up carried state without saving output
            self.preprocessor.filter_continuous(warmup_chunk, carried_state=False)

        self.current_sample_idx = target_sample

    def get_chunk(self, chunk_size_samples: int = 16) -> Dict[str, Any]:
        """
        Fetches next streaming sliding window chunk with carried causal filter state.
        """
        if not self.is_running or self.is_paused:
            return {
                "session_id": f"sess_{self.session_idx}",
                "mode_badge": self.mode_badge,
                "split_name": self.split_name,
                "is_running": self.is_running,
                "is_paused": self.is_paused,
                "current_timestamp": self.current_time_s,
                "total_duration": self.total_duration_s,
                "channel_samples": {},
                "active_stimulus_id": 0,
                "events_in_chunk": []
            }

        start_idx = self.current_sample_idx
        end_idx = min(start_idx + chunk_size_samples, self.total_samples)
        actual_len = end_idx - start_idx

        if actual_len <= 0:
            self.is_running = False
            return {
                "session_id": f"sess_{self.session_idx}",
                "mode_badge": self.mode_badge,
                "split_name": self.split_name,
                "is_running": False,
                "is_paused": False,
                "current_timestamp": self.total_duration_s,
                "total_duration": self.total_duration_s,
                "channel_samples": {},
                "active_stimulus_id": 0,
                "events_in_chunk": []
            }

        raw_chunk = self.continuous_data_uv[:, start_idx:end_idx]
        filtered_chunk = self.preprocessor.filter_continuous(raw_chunk, carried_state=True)

        # Detect active stimulus in this chunk
        events_in_chunk = []
        active_stim = 0
        chunk_onsets_mask = (self.flash_onsets >= start_idx) & (self.flash_onsets < end_idx)
        matching_indices = np.where(chunk_onsets_mask)[0]

        for m_idx in matching_indices:
            onset = self.flash_onsets[m_idx]
            code = int(self.flash_codes[m_idx])
            active_stim = code
            is_target = int(self.flash_targets[m_idx])
            events_in_chunk.append({
                "sample_idx": int(onset),
                "time_s": float(onset / self.sfreq),
                "stimulus_code": code,
                "is_target": is_target,
                "source": "held_out_replay"
            })

        # Format channel samples dictionary
        channel_samples = {}
        for ch_idx, ch_name in enumerate(self.channel_names):
            channel_samples[ch_name] = filtered_chunk[ch_idx].tolist()

        # Which character trial is active?
        current_trial = int(np.searchsorted(self.trials, start_idx, side="right"))

        self.current_sample_idx = end_idx

        return {
            "session_id": f"sess_{self.session_idx}",
            "mode_badge": self.mode_badge,
            "split_name": self.split_name,
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "current_timestamp": float(start_idx / self.sfreq),
            "total_duration": self.total_duration_s,
            "current_trial": current_trial,
            "active_stimulus_id": active_stim,
            "channel_samples": channel_samples,
            "events_in_chunk": events_in_chunk
        }


class SyntheticSource(BaseEEGSource):
    """
    Synthetic EEG simulation source.
    Generates synthetic background EEG noise and stimulus-locked ERPs from template.
    Explicitly badged as SYNTHETIC SIMULATION (Principle 6).
    """

    def __init__(
        self,
        sfreq: float = 256.0,
        n_channels: int = 16,
        flash_duration_ms: float = 125.0,
        isi_ms: float = 125.0,
        total_duration_s: float = 120.0,
        seed: int = 42
    ):
        ch_names = ["Fz", "Cz", "Pz", "Oz", "P3", "P4", "PO7", "PO8", "FCz", "C3", "C4", "CP3", "CPz", "CP4", "F3", "F4"][:n_channels]
        super().__init__(
            sfreq=sfreq,
            channel_names=ch_names,
            mode_badge="SYNTHETIC SIMULATION",
            split_name="Synthetic Stream"
        )
        self.flash_duration_ms = flash_duration_ms
        self.isi_ms = isi_ms
        self.soa_samples = int(((flash_duration_ms + isi_ms) / 1000.0) * sfreq)
        self.total_duration_s = total_duration_s
        self.total_samples = int(total_duration_s * sfreq)
        self.rng = np.random.RandomState(seed)

        # Preprocessor with causal SOS filter
        self.preprocessor = EEGPreprocessor(
            sfreq=self.sfreq,
            low_cut=0.1,
            high_cut=20.0,
            filter_order=4
        )
        self.preprocessor.reset_filter_state(len(self.channel_names))

        # Build synthetic P300 template
        time_axis = np.linspace(-0.1, 0.8, int(0.9 * sfreq))
        self.p300_template = np.exp(-((time_axis - 0.35) ** 2) / (2 * (0.06 ** 2))) * 12.0  # +12 µV peak

    def start(self) -> None:
        self.current_sample_idx = 0
        self.preprocessor.reset_filter_state(len(self.channel_names))
        self.is_running = True
        self.is_paused = False

    def pause(self) -> None:
        self.is_paused = True

    def resume(self) -> None:
        if self.is_running:
            self.is_paused = False

    def stop(self) -> None:
        self.is_running = False
        self.is_paused = False
        self.current_sample_idx = 0

    def seek(self, target_time_s: float) -> None:
        target_sample = int(np.clip(target_time_s * self.sfreq, 0, self.total_samples - 1))
        self.current_sample_idx = target_sample
        self.preprocessor.reset_filter_state(len(self.channel_names))

    def get_chunk(self, chunk_size_samples: int = 16) -> Dict[str, Any]:
        if not self.is_running or self.is_paused:
            return {
                "session_id": "synthetic_01",
                "mode_badge": self.mode_badge,
                "split_name": self.split_name,
                "is_running": self.is_running,
                "is_paused": self.is_paused,
                "current_timestamp": self.current_time_s,
                "total_duration": self.total_duration_s,
                "channel_samples": {},
                "active_stimulus_id": 0,
                "events_in_chunk": []
            }

        start_idx = self.current_sample_idx
        end_idx = min(start_idx + chunk_size_samples, self.total_samples)
        actual_len = end_idx - start_idx

        # Synthetic pink/Gaussian noise
        raw_noise = self.rng.normal(loc=0.0, scale=8.0, size=(len(self.channel_names), actual_len)).astype(np.float32)
        filtered_chunk = self.preprocessor.filter_continuous(raw_noise, carried_state=True)

        # Periodic flash event every soa_samples
        events_in_chunk = []
        active_stim = 0
        for s in range(start_idx, end_idx):
            if s > 0 and s % self.soa_samples == 0:
                stim_code = (s // self.soa_samples) % 12 + 1
                active_stim = stim_code
                events_in_chunk.append({
                    "sample_idx": s,
                    "time_s": float(s / self.sfreq),
                    "stimulus_code": stim_code,
                    "is_target": 1 if stim_code in [3, 9] else 0,
                    "source": "synthetic_simulation"
                })

        channel_samples = {}
        for ch_idx, ch_name in enumerate(self.channel_names):
            channel_samples[ch_name] = filtered_chunk[ch_idx].tolist()

        self.current_sample_idx = end_idx
        return {
            "session_id": "synthetic_01",
            "mode_badge": self.mode_badge,
            "split_name": self.split_name,
            "is_running": self.is_running,
            "is_paused": self.is_paused,
            "current_timestamp": float(start_idx / self.sfreq),
            "total_duration": self.total_duration_s,
            "current_trial": (start_idx // (self.soa_samples * 96)) + 1,
            "active_stimulus_id": active_stim,
            "channel_samples": channel_samples,
            "events_in_chunk": events_in_chunk
        }
