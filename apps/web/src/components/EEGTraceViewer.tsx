import React, { useRef, useEffect, useState } from 'react';
import { Layers, ZoomIn, ZoomOut, Maximize2, Activity, Sun, Moon } from 'lucide-react';

interface EEGTraceViewerProps {
  channelData: Record<string, number[]>;
  samplingRate?: number;
  timeWindowSeconds?: number;
  currentTime?: number;
}

const DEFAULT_CHANNELS = [
  'F3', 'Fz', 'F4', 'T7', 'C3', 'Cz', 'C4', 'T8',
  'Cp3', 'Cp4', 'P3', 'Pz', 'P4', 'Po7', 'Po8', 'Oz'
];

export const EEGTraceViewer: React.FC<EEGTraceViewerProps> = ({
  channelData,
  samplingRate = 256,
  timeWindowSeconds = 3.0,
  currentTime = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stacked, setStacked] = useState(true);
  const [scaleUv, setScaleUv] = useState<number>(50); // +/- 50 uV default
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');

  const availableChannels = Object.keys(channelData).length > 0
    ? Object.keys(channelData)
    : DEFAULT_CHANNELS;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    let animId: number;

    const render = () => {
      // Clear canvas with theme background
      ctx.fillStyle = themeMode === 'light' ? '#FFFFFF' : '#0B1220';
      ctx.fillRect(0, 0, width, height);

      // Background grid
      ctx.strokeStyle = themeMode === 'light' ? '#E4E7EC' : '#1E293B';
      ctx.lineWidth = 1;
      const gridCols = 10;
      const gridRows = 8;
      for (let c = 0; c <= gridCols; c++) {
        const x = (c / gridCols) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let r = 0; r <= gridRows; r++) {
        const y = (r / gridRows) * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const nChannels = availableChannels.length;
      const channelSpacing = height / (nChannels + 1);
      const tNow = Date.now() / 1000;

      // Draw traces
      availableChannels.forEach((chName, idx) => {
        let samples = channelData[chName] || [];
        const centerY = stacked ? (idx + 1) * channelSpacing : height / 2;

        // Draw baseline horizontal reference
        ctx.strokeStyle = themeMode === 'light' ? '#F2F4F7' : '#1E293B';
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(60, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw channel label
        ctx.fillStyle = chName === 'Pz'
          ? (themeMode === 'light' ? '#0F9D92' : '#06B6D4')
          : (themeMode === 'light' ? '#475569' : '#94A3B8');
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(chName, 50, centerY + 3);

        // If no active replay samples yet, generate realistic resting EEG wave (alpha ~10Hz, theta ~5Hz)
        if (samples.length < 2) {
          samples = [];
          for (let s = 0; s < 120; s++) {
            const t = tNow * 1.5 + (s / 120) * 1.2;
            const alpha = Math.sin(t * 10.2 + idx * 0.75) * 5.5;
            const theta = Math.sin(t * 4.8 + idx * 1.3) * 3.2;
            const beta = Math.cos(t * 22.0 + s) * 1.5;
            samples.push(alpha + theta + beta);
          }
        }

        // Trace line plot
        ctx.strokeStyle = chName === 'Pz'
          ? (themeMode === 'light' ? '#0F9D92' : '#06B6D4')
          : (themeMode === 'light' ? '#2563EB' : '#38BDF8');
        ctx.lineWidth = chName === 'Pz' ? 1.8 : 1.2;
        ctx.beginPath();

        const xStart = 60;
        const xSpan = width - xStart;
        const nSamples = samples.length;

        for (let i = 0; i < nSamples; i++) {
          const x = xStart + (i / (nSamples - 1)) * xSpan;
          const uV = samples[i];
          const y = centerY - (uV / scaleUv) * (channelSpacing * 0.45);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // Time sweep cursor indicator
      const sweepX = 60 + ((currentTime % timeWindowSeconds) / timeWindowSeconds) * (width - 60);
      ctx.strokeStyle = themeMode === 'light' ? '#EF4444' : '#F43F5E';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [availableChannels, channelData, scaleUv, stacked, currentTime, timeWindowSeconds, themeMode]);

  return (
    <div className="bg-white rounded-2xl border border-clinical-border p-4 sm:p-5 flex flex-col space-y-3.5 shadow-xs">
      {/* Viewer Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-clinical-border pb-2.5">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-clinical-blue" />
          <h3 className="text-xs font-bold text-clinical-text uppercase tracking-wider">
            16 Kênh EEG Trực Quan Thời Gian Thực (10-20 Montage)
          </h3>
        </div>

        {/* Trace Controls */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          {/* Theme switcher */}
          <button
            type="button"
            onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
            className="p-1.5 rounded-lg border border-clinical-border bg-gray-50 hover:bg-gray-100 text-clinical-secondary transition-colors"
            title="Đổi giao diện hiển thị sóng (Sáng/Tối)"
          >
            {themeMode === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
          </button>

          {/* Scale Zoom Controls */}
          <div className="flex items-center space-x-1 bg-gray-50 border border-clinical-border rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setScaleUv((s) => Math.max(10, s - 10))}
              className="p-1 rounded text-clinical-secondary hover:text-clinical-text hover:bg-white"
              title="Phóng to biên độ"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] text-clinical-text font-bold">±{scaleUv}µV</span>
            <button
              type="button"
              onClick={() => setScaleUv((s) => Math.min(200, s + 10))}
              className="p-1 rounded text-clinical-secondary hover:text-clinical-text hover:bg-white"
              title="Thu nhỏ biên độ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stacked vs Overlay toggle */}
          <button
            type="button"
            onClick={() => setStacked(!stacked)}
            className={`px-2.5 py-1 rounded-lg border transition-colors flex items-center space-x-1 ${
              stacked
                ? 'bg-blue-50 border-blue-200 text-clinical-blue font-bold'
                : 'bg-gray-50 border-clinical-border text-clinical-secondary'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>{stacked ? '16 Kênh Tách Biệt' : 'Chập Kênh'}</span>
          </button>
        </div>
      </div>

      {/* Canvas Display */}
      <div className="w-full h-80 rounded-xl overflow-hidden border border-clinical-border relative">
        <canvas
          ref={canvasRef}
          width={900}
          height={400}
          className="w-full h-full block"
        />
      </div>

      {/* Footer Info Strip */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-clinical-secondary">
        <div className="flex items-center space-x-3">
          <span>Tốc độ quét: 256 mẫu/giây (Causal SOS)</span>
          <span className="hidden sm:inline">Khung thời gian: {timeWindowSeconds.toFixed(1)}s</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1 text-clinical-teal font-bold">
            <span className="w-2 h-2 rounded-full bg-clinical-teal inline-block" />
            <span>Kênh quan trọng: Pz (Oddball ERP)</span>
          </span>
        </div>
      </div>
    </div>
  );
};
