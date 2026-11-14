import { useState, useEffect, useRef, useCallback } from 'react';
import { ModeBadge, DecodedRecord } from '../types';

export interface UseReplayWebSocketReturn {
  isConnected: boolean;
  modeBadge: ModeBadge;
  splitName: string;
  currentTime: number;
  totalDuration: number;
  activeFlashGroup: number | null;
  channelSamples: Record<string, number[]>;
  latestDecodes: DecodedRecord[];
  isPlaying: boolean;
  playbackSpeed: number;
  startReplay: () => Promise<void>;
  pauseReplay: () => Promise<void>;
  resumeReplay: () => Promise<void>;
  seekReplay: (timestamp: number) => Promise<void>;
  setSpeed: (speed: number) => Promise<void>;
}

export function useReplayWebSocket(sessionId: string = 'default'): UseReplayWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [modeBadge, setModeBadge] = useState<ModeBadge>('REAL DATASET REPLAY');
  const [splitName, setSplitName] = useState('Session 2 (Held-out Test)');
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(196.03);
  const [activeFlashGroup, setActiveFlashGroup] = useState<number | null>(null);
  const [channelSamples, setChannelSamples] = useState<Record<string, number[]>>({});
  const [latestDecodes, setLatestDecodes] = useState<DecodedRecord[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Connect WebSocket
  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use host (e.g. localhost:3000) so Vite proxy forwards /api/v1/ws to backend
    const host = typeof window !== 'undefined' ? window.location.host : '127.0.0.1:3000';
    const wsUrl = `${protocol}//${host}/api/v1/ws/replay/${sessionId}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.mode_badge) setModeBadge(data.mode_badge);
          if (data.split_name) setSplitName(data.split_name);
          if (typeof data.current_timestamp === 'number') setCurrentTime(data.current_timestamp);
          if (typeof data.total_duration === 'number') setTotalDuration(data.total_duration);
          if (data.active_stimulus_id !== undefined) {
            setActiveFlashGroup(data.active_stimulus_id > 0 ? data.active_stimulus_id : null);
          }
          if (data.channel_samples) {
            setChannelSamples((prev) => {
              // Maintain trailing window of 128 samples per channel for smooth visualization
              const next: Record<string, number[]> = { ...prev };
              for (const [ch, samples] of Object.entries(data.channel_samples as Record<string, number[]>)) {
                const combined = [...(prev[ch] || []), ...samples];
                next[ch] = combined.slice(-160);
              }
              return next;
            });
          }
          if (data.recent_decodes && Array.isArray(data.recent_decodes)) {
            setLatestDecodes(data.recent_decodes);
          }
        } catch {
          // Ignore malformed message
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };

      socketRef.current = ws;
    } catch {
      setIsConnected(false);
    }
  }, [sessionId]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  // REST API Controls
  const apiBase = '/api/v1/replay';

  const startReplay = async () => {
    try {
      await fetch(`${apiBase}/start?session_id=${sessionId}&mode=replay&speed=${playbackSpeed}`, {
        method: 'POST',
      });
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to start replay:', err);
    }
  };

  const pauseReplay = async () => {
    try {
      await fetch(`${apiBase}/pause?session_id=${sessionId}`, { method: 'POST' });
      setIsPlaying(false);
    } catch (err) {
      console.error('Failed to pause replay:', err);
    }
  };

  const resumeReplay = async () => {
    try {
      await fetch(`${apiBase}/resume?session_id=${sessionId}`, { method: 'POST' });
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to resume replay:', err);
    }
  };

  const seekReplay = async (timestamp: number) => {
    try {
      setCurrentTime(timestamp);
      await fetch(`${apiBase}/seek?session_id=${sessionId}&target_time_s=${timestamp}`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Failed to seek replay:', err);
    }
  };

  const setSpeed = async (speed: number) => {
    setPlaybackSpeed(speed);
    try {
      await fetch(`${apiBase}/speed?session_id=${sessionId}&speed=${speed}`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to set speed:', err);
    }
  };

  return {
    isConnected,
    modeBadge,
    splitName,
    currentTime,
    totalDuration,
    activeFlashGroup,
    channelSamples,
    latestDecodes,
    isPlaying,
    playbackSpeed,
    startReplay,
    pauseReplay,
    resumeReplay,
    seekReplay,
    setSpeed,
  };
}
