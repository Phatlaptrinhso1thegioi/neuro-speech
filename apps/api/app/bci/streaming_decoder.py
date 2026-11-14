"""
apps/api/app/bci/streaming_decoder.py
Online Streaming P300 Character Decoder.
Extracts epochs once 800 ms have elapsed post-stimulus onset, scores epochs with Shrinkage LDA,
aggregates row and column scores across repetitions, and emits character decisions with
the required Four-Way values (Principle 3).
"""

from collections import deque
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, Callable
import csv
import time
import numpy as np

from apps.api.app.bci.lda_decoder import ShrinkageLDADecoder

# 6x6 Matrix for BNCI 2014-009
MATRIX_6X6 = [
    ['A', 'B', 'C', 'D', 'E', 'F'],
    ['G', 'H', 'I', 'J', 'K', 'L'],
    ['M', 'N', 'O', 'P', 'Q', 'R'],
    ['S', 'T', 'U', 'V', 'W', 'X'],
    ['Y', 'Z', '1', '2', '3', '4'],
    ['5', '6', '7', '8', '9', '_']
]


class StreamingP300Decoder:
    """
    Stateful streaming decoder.
    Receives incoming sample streams, extracts epochs 800 ms after onset, scores them,
    accumulates row/column votes, and decodes characters upon completion of repetitions.
    """

    def __init__(
        self,
        decoder: ShrinkageLDADecoder,
        sfreq: float = 256.0,
        n_rows: int = 6,
        n_cols: int = 6,
        repetitions_per_char: int = 8,
        epoch_post_delay_s: float = 0.8,
        output_csv_path: Optional[Path] = None
    ):
        self.decoder = decoder
        self.sfreq = sfreq
        self.n_rows = n_rows
        self.n_cols = n_cols
        self.repetitions_per_char = repetitions_per_char
        self.epoch_post_delay_s = epoch_post_delay_s
        self.output_csv_path = output_csv_path

        # Buffer parameters (exact match with EEGPreprocessor)
        self.epoch_len = int(round((epoch_post_delay_s - (-0.1)) * sfreq))
        self.pre_samples = int(round(0.1 * sfreq))
        self.post_samples = self.epoch_len - self.pre_samples

        # Continuous circular buffer for EEG samples (stores recent ~10s)
        self.max_buffer_samples = int(sfreq * 10)
        self.sample_buffer = deque(maxlen=self.max_buffer_samples)
        self.sample_index_buffer = deque(maxlen=self.max_buffer_samples)

        # Pending flash events waiting for 800 ms window to complete
        self.pending_flashes = []  # List of dicts

        # Current character decoding state
        self.current_trial_idx = 0
        self.current_rep = 0
        self.row_scores = np.zeros(n_rows, dtype=np.float32)
        self.col_scores = np.zeros(n_cols, dtype=np.float32)
        self.flashes_in_current_char = 0
        self.expected_char = None

        # Decoded results history
        self.decoded_events = []
        self.character_callbacks: List[Callable[[Dict[str, Any]], None]] = []

    def register_callback(self, cb: Callable[[Dict[str, Any]], None]):
        self.character_callbacks.append(cb)

    def reset_speller(self):
        """Resets speller state for a new session."""
        self.sample_buffer.clear()
        self.sample_index_buffer.clear()
        self.pending_flashes.clear()
        self.current_trial_idx = 0
        self.current_rep = 0
        self.row_scores.fill(0.0)
        self.col_scores.fill(0.0)
        self.flashes_in_current_char = 0
        self.expected_char = None
        self.decoded_events.clear()

    def set_expected_character(self, char: str):
        """Sets expected ground truth for evaluation (Principle 3). Never seen by predict()."""
        self.expected_char = char

    def push_samples(
        self,
        samples_chunk: Dict[str, List[float]],
        start_sample_idx: int,
        events_in_chunk: List[Dict[str, Any]]
    ):
        """
        Receives next continuous sliding window chunk of multi-channel samples and events.
        """
        if not samples_chunk:
            return

        ch_names = list(samples_chunk.keys())
        n_samples = len(samples_chunk[ch_names[0]])

        # Stack into (n_channels, n_samples)
        chunk_arr = np.array([samples_chunk[ch] for ch in ch_names], dtype=np.float32)

        for i in range(n_samples):
            idx = start_sample_idx + i
            self.sample_buffer.append(chunk_arr[:, i])
            self.sample_index_buffer.append(idx)

        # Enqueue new flash events
        for ev in events_in_chunk:
            self.pending_flashes.append({
                "onset_sample": ev["sample_idx"],
                "time_s": ev["time_s"],
                "stimulus_code": ev["stimulus_code"],
                "is_target": ev.get("is_target", 0),
                "source": ev.get("source", "replay")
            })

        # Process pending flashes whose 800 ms post-stimulus window has arrived
        current_max_sample = self.sample_index_buffer[-1] if self.sample_index_buffer else 0
        remaining_flashes = []

        for flash in self.pending_flashes:
            onset = flash["onset_sample"]
            needed_sample = onset + self.post_samples

            if current_max_sample >= needed_sample:
                # 800 ms elapsed! Extract epoch and score
                self._score_and_accumulate_flash(flash)
            else:
                remaining_flashes.append(flash)

        self.pending_flashes = remaining_flashes

    def _score_and_accumulate_flash(self, flash: Dict[str, Any]):
        """Extracts completed 800 ms epoch, scores with LDA, and accumulates row/col evidence."""
        onset = flash["onset_sample"]
        code = int(flash["stimulus_code"])

        # Find sample indices in ring buffer
        buf_indices = list(self.sample_index_buffer)
        try:
            onset_pos = buf_indices.index(onset)
        except ValueError:
            return  # Epoch onset fell out of circular buffer

        start_pos = onset_pos - self.pre_samples
        end_pos = onset_pos + self.post_samples

        if start_pos < 0 or end_pos > len(self.sample_buffer):
            return  # Boundary not completely in buffer

        # Extract (n_channels, epoch_len)
        epoch_samples = np.array([self.sample_buffer[p] for p in range(start_pos, end_pos)]).T

        # Baseline correction (-100 to 0 ms)
        baseline_mean = np.mean(epoch_samples[:, :self.pre_samples], axis=1, keepdims=True)
        epoch_clean = epoch_samples - baseline_mean

        # Score with LDA: input shape (1, n_channels, n_times)
        epoch_3d = epoch_clean[np.newaxis, :, :]
        t0 = time.perf_counter()
        score = float(self.decoder.score_epochs(epoch_3d)[0])
        inference_latency_ms = (time.perf_counter() - t0) * 1000.0

        # Accumulate score for row or column
        if 1 <= code <= self.n_rows:
            self.row_scores[code - 1] += score
        elif (self.n_rows + 1) <= code <= (self.n_rows + self.n_cols):
            self.col_scores[code - self.n_rows - 1] += score

        self.flashes_in_current_char += 1
        flashes_per_rep = self.n_rows + self.n_cols
        self.current_rep = (self.flashes_in_current_char // flashes_per_rep) + 1

        # Check if full repetitions completed for character
        total_flashes_needed = self.repetitions_per_char * flashes_per_rep
        if self.flashes_in_current_char >= total_flashes_needed:
            self._emit_decoded_character(inference_latency_ms)

    def _emit_decoded_character(self, latency_ms: float):
        """Emits decoded character with Principle 3 Four-Way values."""
        winning_row = int(np.argmax(self.row_scores)) + 1
        winning_col = int(np.argmax(self.col_scores)) + 1
        predicted_char = MATRIX_6X6[winning_row - 1][winning_col - 1]

        char_record = {
            "trial_index": self.current_trial_idx,
            "timestamp": time.time(),
            "expected_ground_truth": self.expected_char,
            "raw_predicted_char": predicted_char,
            "ai_suggested_word": None,
            "final_confirmed_output": None,
            "winning_row": winning_row,
            "winning_col": winning_col,
            "repetitions": self.repetitions_per_char,
            "row_scores": self.row_scores.tolist(),
            "col_scores": self.col_scores.tolist(),
            "source": "neural_decoder",
            "inference_latency_ms": round(latency_ms, 3)
        }

        self.decoded_events.append(char_record)
        for cb in self.character_callbacks:
            cb(char_record)

        self._append_to_csv(char_record)

        # Reset accumulator for next character trial
        self.current_trial_idx += 1
        self.flashes_in_current_char = 0
        self.row_scores.fill(0.0)
        self.col_scores.fill(0.0)
        self.expected_char = None

    def staff_override(self, action_id: str, label: str):
        """
        Triggers control target (ACCEPT, CONTINUE, NEXT, BACKSPACE, SPEAK, F1-F4)
        via staff override. Carries score=null and source=staff_override (Principle 3).
        """
        record = {
            "trial_index": self.current_trial_idx,
            "timestamp": time.time(),
            "expected_ground_truth": None,
            "raw_predicted_char": action_id,
            "ai_suggested_word": None,
            "final_confirmed_output": label,
            "winning_row": None,
            "winning_col": None,
            "repetitions": 0,
            "row_scores": None,
            "col_scores": None,
            "source": "staff_override",
            "score": None,
            "inference_latency_ms": 0.0
        }
        self.decoded_events.append(record)
        for cb in self.character_callbacks:
            cb(record)
        self._append_to_csv(record)

    def _append_to_csv(self, record: Dict[str, Any]):
        """Persists character decodes to datasets/processed/decoded_characters.csv."""
        if not self.output_csv_path:
            return

        self.output_csv_path.parent.mkdir(parents=True, exist_ok=True)
        file_exists = self.output_csv_path.exists()

        fieldnames = [
            "trial_index", "timestamp", "expected_ground_truth", "raw_predicted_char",
            "ai_suggested_word", "final_confirmed_output", "winning_row", "winning_col",
            "repetitions", "source", "inference_latency_ms"
        ]

        with open(self.output_csv_path, "a", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            if not file_exists:
                writer.writeheader()
            writer.writerow(record)
