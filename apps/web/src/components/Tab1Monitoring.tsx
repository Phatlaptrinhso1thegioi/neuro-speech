import React, { useState } from 'react';
import { EEGTraceViewer } from './EEGTraceViewer';
import { ERPCurveViewer } from './ERPCurveViewer';
import { SpellerMatrix } from './SpellerMatrix';
import { ReplayControls } from './ReplayControls';
import { Brain3DViewer } from './Brain3DViewer';
import { Eye, Activity, Box, Sparkles } from 'lucide-react';

interface Tab1MonitoringProps {
  channelData: Record<string, number[]>;
  activeFlashGroup: number | null;
  currentTime: number;
  totalDuration: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (timestamp: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const Tab1Monitoring: React.FC<Tab1MonitoringProps> = ({
  channelData,
  activeFlashGroup,
  currentTime,
  totalDuration,
  isPlaying,
  playbackSpeed,
  onPlay,
  onPause,
  onReset,
  onSeek,
  onSpeedChange,
}) => {
  const [viewMode, setViewMode] = useState<'split' | '3d' | '2d'>('split');

  return (
    <div className="space-y-4">
      {/* Replay Controls Toolbar */}
      <ReplayControls
        isPlaying={isPlaying}
        currentTime={currentTime}
        totalDuration={totalDuration}
        playbackSpeed={playbackSpeed}
        onPlay={onPlay}
        onPause={onPause}
        onReset={onReset}
        onSeek={onSeek}
        onSpeedChange={onSpeedChange}
      />

      {/* View Mode Switcher Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 px-4 rounded-2xl border border-clinical-border shadow-xs text-xs">
        <div className="flex items-center space-x-2 text-clinical-text">
          <Activity className="w-4 h-4 text-clinical-teal" />
          <span className="font-bold">CHẾ ĐỘ GIÁM SÁT SÓNG NÃO:</span>
          <span className="text-clinical-secondary hidden sm:inline text-[11px] font-mono">
            (Đồng bộ 256 Hz 16 kênh 10-20)
          </span>
        </div>

        <div className="flex bg-gray-100 border border-clinical-border rounded-xl p-0.5 font-medium">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              viewMode === 'split'
                ? 'bg-white text-clinical-blue font-bold shadow-xs'
                : 'text-clinical-secondary hover:text-clinical-text'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Song Song (3D + 2D)</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              viewMode === '3d'
                ? 'bg-white text-clinical-blue font-bold shadow-xs'
                : 'text-clinical-secondary hover:text-clinical-text'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Mô Hình Não 3D</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('2d')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
              viewMode === '2d'
                ? 'bg-white text-clinical-blue font-bold shadow-xs'
                : 'text-clinical-secondary hover:text-clinical-text'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Dải Sóng 2D Chuẩn</span>
          </button>
        </div>
      </div>

      {/* Dynamic View Layout based on selected ViewMode */}
      {viewMode === 'split' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* 3D Brain Viewer */}
            <div className="lg:col-span-7 flex flex-col">
              <Brain3DViewer
                channelData={channelData}
                activeFlashGroup={activeFlashGroup}
                currentTime={currentTime}
                isPlaying={isPlaying}
              />
            </div>

            {/* Flash Matrix & Grand-Average ERP Curve */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              <SpellerMatrix
                activeFlashGroup={activeFlashGroup}
                compact={true}
              />
              <ERPCurveViewer
                peakVoltageUv={16.33}
                peakLatencyMs={340}
              />
            </div>
          </div>

          {/* Synchronized 2D Oscilloscope EEG Traces */}
          <div className="w-full">
            <EEGTraceViewer
              channelData={channelData}
              currentTime={currentTime}
            />
          </div>
        </div>
      )}

      {viewMode === '3d' && (
        <div className="space-y-4">
          {/* Full-width 3D Brain Simulation */}
          <Brain3DViewer
            channelData={channelData}
            activeFlashGroup={activeFlashGroup}
            currentTime={currentTime}
            isPlaying={isPlaying}
          />

          {/* Bottom Matrix & ERP summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <SpellerMatrix
                activeFlashGroup={activeFlashGroup}
                compact={true}
              />
            </div>
            <div className="lg:col-span-5">
              <ERPCurveViewer
                peakVoltageUv={16.33}
                peakLatencyMs={340}
              />
            </div>
          </div>
        </div>
      )}

      {viewMode === '2d' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Continuous 16-Channel EEG Trace */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <EEGTraceViewer
              channelData={channelData}
              currentTime={currentTime}
            />
          </div>

          {/* Synchronized Flash Matrix & Grand-Average ERP Curve */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <SpellerMatrix
              activeFlashGroup={activeFlashGroup}
              compact={true}
            />
            <ERPCurveViewer
              peakVoltageUv={16.33}
              peakLatencyMs={340}
            />
          </div>
        </div>
      )}
    </div>
  );
};
