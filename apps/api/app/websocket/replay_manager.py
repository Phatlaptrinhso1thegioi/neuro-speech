"""
apps/api/app/websocket/replay_manager.py
Replay Session Manager.
Coordinates BaseEEGSource (ReplaySource / SyntheticSource) with StreamingP300Decoder
and manages connected WebSocket clients.
"""

import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import WebSocket, WebSocketDisconnect

from apps.api.app.eeg.source import BaseEEGSource, ReplaySource, SyntheticSource
from apps.api.app.bci.lda_decoder import ShrinkageLDADecoder
from apps.api.app.bci.streaming_decoder import StreamingP300Decoder

PROJECT_ROOT = Path(__file__).resolve().parents[4]


class ReplaySessionManager:
    """Manages active replay streaming sessions, streaming loops, and WebSocket broadcasts."""

    def __init__(self):
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.active_websockets: Dict[str, List[WebSocket]] = {}
        self._main_loop: Optional[asyncio.AbstractEventLoop] = None
        self.model_checkpoint_path = PROJECT_ROOT / "models" / "checkpoints" / "p300_lda_baseline.pkl"
        self.raw_mat_path = PROJECT_ROOT / "datasets" / "raw" / "bnci2014_009" / "A01S.mat"
        self.output_csv = PROJECT_ROOT / "datasets" / "processed" / "decoded_characters.csv"

        self.decoder_instance: Optional[ShrinkageLDADecoder] = None
        if self.model_checkpoint_path.exists():
            self.decoder_instance = ShrinkageLDADecoder().load(str(self.model_checkpoint_path))

    def set_main_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self._main_loop = loop

    def get_or_create_session(self, session_id: str, mode: str = "replay", speed: float = 1.0) -> Dict[str, Any]:
        if session_id in self.active_sessions:
            sess = self.active_sessions[session_id]
            sess["speed"] = max(0.25, min(4.0, speed))
            return sess

        # Create source
        if mode == "synthetic":
            source = SyntheticSource()
        else:
            source = ReplaySource(raw_mat_path=self.raw_mat_path, session_idx=2)

        # Streaming decoder
        streaming_decoder = None
        if self.decoder_instance:
            streaming_decoder = StreamingP300Decoder(
                decoder=self.decoder_instance,
                sfreq=source.sfreq,
                n_rows=6,
                n_cols=6,
                repetitions_per_char=8,
                output_csv_path=self.output_csv
            )

        sess_obj = {
            "session_id": session_id,
            "mode": mode,
            "source": source,
            "decoder": streaming_decoder,
            "speed": max(0.25, min(4.0, speed)),
            "task": None,
            "event_log": []
        }

        if streaming_decoder:
            streaming_decoder.register_callback(
                lambda dec_event: sess_obj["event_log"].append(dec_event)
            )

        self.active_sessions[session_id] = sess_obj
        self.active_websockets[session_id] = []
        return sess_obj

    async def connect_ws(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_websockets:
            self.active_websockets[session_id] = []
        self.active_websockets[session_id].append(websocket)

    def disconnect_ws(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_websockets:
            if websocket in self.active_websockets[session_id]:
                self.active_websockets[session_id].remove(websocket)

    async def broadcast(self, session_id: str, message: Dict[str, Any]):
        sockets = self.active_websockets.get(session_id, [])
        dead_sockets = []
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception:
                dead_sockets.append(ws)
        for ws in dead_sockets:
            if ws in sockets:
                sockets.remove(ws)

    def start_session(self, session_id: str, mode: str = "replay", speed: float = 1.0) -> Dict[str, Any]:
        sess = self.get_or_create_session(session_id, mode=mode, speed=speed)
        source: BaseEEGSource = sess["source"]
        decoder: StreamingP300Decoder = sess["decoder"]

        source.start()
        if decoder:
            decoder.reset_speller()
        sess["event_log"].clear()

        # Start streaming background loop safely whether in async event loop or worker thread
        loop = None
        try:
            loop = asyncio.get_running_loop()
            self._main_loop = loop
        except RuntimeError:
            loop = getattr(self, "_main_loop", None)

        if loop and loop.is_running():
            is_done = sess["task"] is None or (hasattr(sess["task"], "done") and sess["task"].done())
            if is_done:
                try:
                    current_loop = asyncio.get_running_loop()
                    if current_loop is loop:
                        sess["task"] = loop.create_task(self._stream_loop(session_id))
                    else:
                        sess["task"] = asyncio.run_coroutine_threadsafe(self._stream_loop(session_id), loop)
                except RuntimeError:
                    sess["task"] = asyncio.run_coroutine_threadsafe(self._stream_loop(session_id), loop)
        else:
            sess["task"] = None

        return {
            "status": "started",
            "session_id": session_id,
            "mode_badge": source.mode_badge,
            "split_name": source.split_name,
            "current_time_s": source.current_time_s,
            "speed": sess["speed"]
        }

    def pause_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.active_sessions:
            self.get_or_create_session(session_id)
        sess = self.active_sessions[session_id]
        sess["source"].pause()
        return {"status": "paused", "session_id": session_id, "current_time_s": sess["source"].current_time_s}

    def resume_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.active_sessions:
            return self.start_session(session_id)
        sess = self.active_sessions[session_id]
        sess["source"].resume()

        # Ensure streaming background loop is active
        loop = None
        try:
            loop = asyncio.get_running_loop()
            self._main_loop = loop
        except RuntimeError:
            loop = getattr(self, "_main_loop", None)

        if loop and loop.is_running():
            is_done = sess["task"] is None or (hasattr(sess["task"], "done") and sess["task"].done())
            if is_done:
                try:
                    current_loop = asyncio.get_running_loop()
                    if current_loop is loop:
                        sess["task"] = loop.create_task(self._stream_loop(session_id))
                    else:
                        sess["task"] = asyncio.run_coroutine_threadsafe(self._stream_loop(session_id), loop)
                except RuntimeError:
                    sess["task"] = asyncio.run_coroutine_threadsafe(self._stream_loop(session_id), loop)

        return {"status": "resumed", "session_id": session_id, "current_time_s": sess["source"].current_time_s}

    def stop_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self.active_sessions:
            raise KeyError(f"Session {session_id} not found")
        sess = self.active_sessions[session_id]
        sess["source"].stop()
        if sess["task"] and not sess["task"].done():
            sess["task"].cancel()
        return {"status": "stopped", "session_id": session_id}

    def seek_session(self, session_id: str, target_time_s: float) -> Dict[str, Any]:
        if session_id not in self.active_sessions:
            self.get_or_create_session(session_id)
        sess = self.active_sessions[session_id]
        # Re-warm filter state on seek
        sess["source"].seek(target_time_s)
        return {"status": "seeked", "session_id": session_id, "current_time_s": sess["source"].current_time_s}

    def set_speed(self, session_id: str, speed: float) -> Dict[str, Any]:
        if session_id not in self.active_sessions:
            sess = self.get_or_create_session(session_id)
        else:
            sess = self.active_sessions[session_id]
        sess["speed"] = max(0.25, min(4.0, float(speed)))
        return {"status": "speed_updated", "session_id": session_id, "speed": sess["speed"]}

    def staff_override(self, session_id: str, action_id: str, label: str) -> Dict[str, Any]:
        sess = self.get_or_create_session(session_id)
        decoder = sess.get("decoder")
        if decoder:
            decoder.staff_override(action_id, label)
        return {"status": "override_logged", "action_id": action_id, "label": label, "source": "staff_override"}

    async def _stream_loop(self, session_id: str):
        """Asynchronous streaming loop with exact timing pacing and speed scaling."""
        sess = self.active_sessions.get(session_id)
        if not sess:
            return

        source: BaseEEGSource = sess["source"]
        decoder: StreamingP300Decoder = sess["decoder"]
        chunk_samples = 16  # 16 samples = 62.5 ms per chunk at 256 Hz
        chunk_nominal_dt = chunk_samples / source.sfreq

        while source.is_running:
            if source.is_paused:
                await asyncio.sleep(0.05)
                continue

            chunk_data = source.get_chunk(chunk_size_samples=chunk_samples)
            if not chunk_data.get("is_running", False):
                break

            # Push to streaming decoder
            if decoder and chunk_data.get("channel_samples"):
                decoder.push_samples(
                    samples_chunk=chunk_data["channel_samples"],
                    start_sample_idx=int(chunk_data["current_timestamp"] * source.sfreq),
                    events_in_chunk=chunk_data.get("events_in_chunk", [])
                )

            # Broadcast to WebSockets
            broadcast_msg = {
                "session_id": session_id,
                "mode_badge": chunk_data["mode_badge"],
                "split_name": chunk_data["split_name"],
                "current_timestamp": chunk_data["current_timestamp"],
                "total_duration": chunk_data["total_duration"],
                "current_trial": chunk_data.get("current_trial", 0),
                "active_stimulus_id": chunk_data.get("active_stimulus_id", 0),
                "channel_samples": chunk_data["channel_samples"],
                "events": chunk_data.get("events_in_chunk", []),
                "recent_decodes": sess["event_log"][-5:]
            }
            await self.broadcast(session_id, broadcast_msg)

            # Real-time pacing with speed factor (0.25x - 4x)
            sleep_dt = chunk_nominal_dt / sess.get("speed", 1.0)
            await asyncio.sleep(sleep_dt)


# Global singleton instance
replay_manager = ReplaySessionManager()
