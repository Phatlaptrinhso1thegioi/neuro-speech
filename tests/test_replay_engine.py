"""
tests/test_replay_engine.py
Tests for Replay Engine, Streaming Decode, and REST/WebSocket API (M2a).
Verifies seek re-warming and that replaying the same session twice gives identical decodes.
"""

from pathlib import Path
import numpy as np
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
from apps.api.app.main import app
from apps.api.app.eeg.source import ReplaySource, SyntheticSource
from apps.api.app.bci.lda_decoder import ShrinkageLDADecoder
from apps.api.app.bci.streaming_decoder import StreamingP300Decoder

client = TestClient(app)
RAW_MAT_PATH = PROJECT_ROOT / "datasets" / "raw" / "bnci2014_009" / "A01S.mat"
MODEL_PKL_PATH = PROJECT_ROOT / "models" / "checkpoints" / "p300_lda_baseline.pkl"


def test_replay_source_initialization():
    """Verifies ReplaySource loads held-out split (Session 2) and displays authentic badges."""
    source = ReplaySource(raw_mat_path=RAW_MAT_PATH, session_idx=2)
    assert source.mode_badge == "REAL DATASET REPLAY"
    assert "Session 2" in source.split_name
    assert "Held-out" in source.split_name
    assert source.sfreq == 256.0
    assert len(source.channel_names) == 16
    assert source.total_samples == 50184
    assert np.isclose(source.total_duration_s, 196.03, atol=0.1)


def test_sliding_window_chunks():
    """Verifies that sliding window chunks stream sequential non-empty samples and timestamps."""
    source = ReplaySource(raw_mat_path=RAW_MAT_PATH, session_idx=2)
    source.start()

    chunk1 = source.get_chunk(chunk_size_samples=16)
    assert chunk1["is_running"] is True
    assert chunk1["current_timestamp"] == 0.0
    assert len(chunk1["channel_samples"]["Pz"]) == 16

    chunk2 = source.get_chunk(chunk_size_samples=16)
    assert chunk2["current_timestamp"] == 16 / 256.0
    assert len(chunk2["channel_samples"]["Pz"]) == 16

    source.stop()
    assert source.is_running is False


def test_seek_and_filter_rewarming():
    """Verifies seeking to a new timestamp re-warms the filter state without producing NaNs."""
    source = ReplaySource(raw_mat_path=RAW_MAT_PATH, session_idx=2)
    source.start()

    # Seek forward to 30.0s
    source.seek(30.0)
    assert np.isclose(source.current_time_s, 30.0, atol=0.01)

    chunk = source.get_chunk(chunk_size_samples=32)
    samples = np.array(chunk["channel_samples"]["Pz"])
    assert len(samples) == 32
    assert not np.isnan(samples).any()
    assert not np.isinf(samples).any()

    # Seek backward to 5.0s
    source.seek(5.0)
    assert np.isclose(source.current_time_s, 5.0, atol=0.01)
    chunk_back = source.get_chunk(chunk_size_samples=32)
    samples_back = np.array(chunk_back["channel_samples"]["Pz"])
    assert not np.isnan(samples_back).any()


def test_deterministic_replay_identical_decodes():
    """
    CRITICAL REQUIREMENT (M2a):
    Replaying the same held-out session twice must yield 100% bitwise identical decodes.
    """
    decoder = ShrinkageLDADecoder().load(str(MODEL_PKL_PATH))

    def run_full_replay_pass() -> list:
        source = ReplaySource(raw_mat_path=RAW_MAT_PATH, session_idx=2)
        streaming_decoder = StreamingP300Decoder(
            decoder=decoder,
            sfreq=256.0,
            n_rows=6,
            n_cols=6,
            repetitions_per_char=8
        )
        decodes = []
        streaming_decoder.register_callback(lambda d: decodes.append(d))

        source.start()
        # Stream first 2 character trials (2 * 96 flashes = 192 flashes, ~48 seconds)
        max_samples = int(48.0 * 256.0)
        chunk_sz = 32

        while source.current_sample_idx < max_samples and source.is_running:
            chunk = source.get_chunk(chunk_size_samples=chunk_sz)
            streaming_decoder.push_samples(
                samples_chunk=chunk["channel_samples"],
                start_sample_idx=int(chunk["current_timestamp"] * source.sfreq),
                events_in_chunk=chunk["events_in_chunk"]
            )
        return decodes

    pass_1 = run_full_replay_pass()
    pass_2 = run_full_replay_pass()

    assert len(pass_1) > 0, "No characters decoded in pass 1!"
    assert len(pass_1) == len(pass_2), f"Different number of decodes: {len(pass_1)} vs {len(pass_2)}"

    for i in range(len(pass_1)):
        char_1 = pass_1[i]["raw_predicted_char"]
        char_2 = pass_2[i]["raw_predicted_char"]
        assert char_1 == char_2, f"Decode mismatch at index {i}: '{char_1}' != '{char_2}'"
        assert pass_1[i]["winning_row"] == pass_2[i]["winning_row"]
        assert pass_1[i]["winning_col"] == pass_2[i]["winning_col"]
        assert np.allclose(pass_1[i]["row_scores"], pass_2[i]["row_scores"], atol=1e-5)
        assert np.allclose(pass_1[i]["col_scores"], pass_2[i]["col_scores"], atol=1e-5)


def test_staff_override_null_score():
    """Verifies that staff override logs carry score=null and source=staff_override."""
    decoder = ShrinkageLDADecoder().load(str(MODEL_PKL_PATH))
    streaming_decoder = StreamingP300Decoder(decoder=decoder)
    emitted = []
    streaming_decoder.register_callback(lambda d: emitted.append(d))

    streaming_decoder.staff_override(action_id="ACCEPT", label="Chấp nhận")
    assert len(emitted) == 1
    record = emitted[0]
    assert record["source"] == "staff_override"
    assert record["score"] is None
    assert record["raw_predicted_char"] == "ACCEPT"
    assert record["final_confirmed_output"] == "Chấp nhận"


def test_rest_api_endpoints():
    """Verifies M2a REST endpoints for dataset and replay controls."""
    # Datasets list
    resp = client.get("/api/v1/datasets")
    assert resp.status_code == 200
    datasets = resp.json()
    assert len(datasets) >= 1
    assert any(d["id"] == "bnci2014_009" for d in datasets)

    # Replay controls
    start_resp = client.post("/api/v1/replay/start", json={"session_id": "test_sess", "mode": "replay", "speed": 2.0})
    assert start_resp.status_code == 200
    assert start_resp.json()["status"] == "started"

    status_resp = client.get("/api/v1/replay/get/test_sess")
    assert status_resp.status_code == 200
    assert status_resp.json()["mode_badge"] == "REAL DATASET REPLAY"

    pause_resp = client.post("/api/v1/replay/pause", json={"session_id": "test_sess"})
    assert pause_resp.status_code == 200
    assert pause_resp.json()["status"] == "paused"

    resume_resp = client.post("/api/v1/replay/resume", json={"session_id": "test_sess"})
    assert resume_resp.status_code == 200
    assert resume_resp.json()["status"] == "resumed"

    seek_resp = client.post("/api/v1/replay/seek", json={"session_id": "test_sess", "target_time_s": 10.0})
    assert seek_resp.status_code == 200
    assert seek_resp.json()["status"] == "seeked"

    override_resp = client.post("/api/v1/replay/override", json={"session_id": "test_sess", "action_id": "SPEAK", "label": "Phát âm"})
    assert override_resp.status_code == 200
    assert override_resp.json()["source"] == "staff_override"

    stop_resp = client.post("/api/v1/replay/stop", json={"session_id": "test_sess"})
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == "stopped"

    # Models list
    models_resp = client.get("/api/v1/p300/models")
    assert models_resp.status_code == 200
    assert len(models_resp.json()) >= 1
