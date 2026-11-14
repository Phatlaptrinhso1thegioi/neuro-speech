import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Sliders, Activity, Clock } from 'lucide-react';

interface ReplayControlsProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (timestamp: number) => void;
  onSpeedChange: (speed: number) => void;
  disabled?: boolean;
}

export const ReplayControls: React.FC<ReplayControlsProps> = ({
  isPlaying,
  currentTime,
  totalDuration = 196.03,
  playbackSpeed = 1.0,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onSpeedChange,
  disabled = false,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-clinical-border p-4 sm:p-5 flex flex-col space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-clinical-border pb-2.5">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-clinical-blue" />
          <h3 className="text-xs font-bold text-clinical-text uppercase tracking-wider">
            Điều Khiển Tiến Trình Replay & Bộ Lọc Causal SOS
          </h3>
        </div>
        <div className="text-xs font-mono font-bold text-clinical-blue bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
          {formatTime(currentTime)} / {formatTime(totalDuration)}
        </div>
      </div>

      {/* Scrubber slider */}
      <div className="space-y-1.5">
        <input
          type="range"
          min="0"
          max={totalDuration || 100}
          step="0.5"
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-clinical-blue focus:outline-none"
        />
        <div className="flex justify-between text-[11px] font-mono text-clinical-secondary">
          <span>00:00.0 (Session 2 Start)</span>
          <span className="hidden sm:inline">Khởi động bộ lọc Causal SOS: 2.0s trước điểm seek</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Button controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2.5">
          {isPlaying ? (
            <button
              type="button"
              onClick={onPause}
              disabled={disabled}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm shadow-amber-500/20 transition-all"
            >
              <Pause className="w-4 h-4" />
              <span>TẠM DỪNG (PAUSE)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onPlay}
              disabled={disabled}
              className="px-4 py-2 rounded-xl bg-clinical-blue hover:bg-clinical-blueHover text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm shadow-blue-600/20 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>CHẠY REPLAY (PLAY)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            disabled={disabled}
            className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-clinical-text text-xs font-semibold flex items-center space-x-1 border border-clinical-border transition-colors"
            title="Quay lại đầu phiên thu BNCI S2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed Multiplier Controls */}
        <div className="flex items-center space-x-1.5 text-xs font-mono">
          <span className="text-clinical-secondary mr-1">Tốc độ:</span>
          {[0.5, 1.0, 2.0].map((speed) => (
            <button
              key={speed}
              type="button"
              onClick={() => onSpeedChange(speed)}
              disabled={disabled}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all border ${
                playbackSpeed === speed
                  ? 'bg-clinical-blue text-white border-clinical-blue shadow-2xs'
                  : 'bg-gray-50 text-clinical-secondary border-clinical-border hover:bg-gray-100'
              }`}
            >
              {speed.toFixed(1)}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
