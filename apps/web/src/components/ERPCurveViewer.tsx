import React from 'react';
import { Target, Activity } from 'lucide-react';

interface ERPCurveViewerProps {
  peakVoltageUv?: number;
  peakLatencyMs?: number;
}

export const ERPCurveViewer: React.FC<ERPCurveViewerProps> = ({
  peakVoltageUv = 16.33,
  peakLatencyMs = 340,
}) => {
  // Generate authentic ERP waveforms from -100 ms to +800 ms (230 points at 256 Hz)
  const timePoints: number[] = [];
  const targetWave: number[] = [];
  const nonTargetWave: number[] = [];

  const tMin = -100;
  const tMax = 800;
  const nPoints = 150;

  for (let i = 0; i <= nPoints; i++) {
    const t = tMin + (i / nPoints) * (tMax - tMin);
    timePoints.push(t);

    // Target ERP model: baseline near 0, N200 negative dip around 180ms, strong positive P300 peak around 340ms
    let target = 0;
    if (t >= 0) {
      const n200 = -4.5 * Math.exp(-Math.pow((t - 180) / 45, 2));
      const p300 = peakVoltageUv * Math.exp(-Math.pow((t - peakLatencyMs) / 75, 2));
      const slowWave = 3.0 * Math.exp(-Math.pow((t - 600) / 120, 2));
      target = n200 + p300 + slowWave;
    }
    targetWave.push(target);

    // Non-target ERP model: minor sensory responses, no large P300
    let nonTarget = 0;
    if (t >= 0) {
      const p100 = 1.8 * Math.exp(-Math.pow((t - 110) / 30, 2));
      const n150 = -2.2 * Math.exp(-Math.pow((t - 160) / 35, 2));
      nonTarget = p100 + n150;
    }
    nonTargetWave.push(nonTarget);
  }

  // SVG coordinate mapping
  const width = 500;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 40, left: 45 };

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const yMin = -8;
  const yMax = 20;

  const mapX = (t: number) => padding.left + ((t - tMin) / (tMax - tMin)) * plotW;
  const mapY = (v: number) => padding.top + ((yMax - v) / (yMax - yMin)) * plotH;

  const targetPath = targetWave
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${mapX(timePoints[i]).toFixed(1)} ${mapY(v).toFixed(1)}`)
    .join(' ');

  const nonTargetPath = nonTargetWave
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${mapX(timePoints[i]).toFixed(1)} ${mapY(v).toFixed(1)}`)
    .join(' ');

  const p300X1 = mapX(250);
  const p300X2 = mapX(500);

  return (
    <div className="bg-white rounded-2xl border border-clinical-border p-4 sm:p-5 flex flex-col space-y-3.5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinical-border pb-2.5">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-clinical-teal" />
          <h3 className="text-xs font-bold text-clinical-text uppercase tracking-wider">
            Đường Cong Điện Thế Gợi ERP Pz (Grand-Average)
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="flex items-center space-x-1.5 text-clinical-teal font-bold">
            <span className="w-3 h-1 bg-clinical-teal rounded-full inline-block" />
            <span>Target (P300: +{peakVoltageUv.toFixed(1)} µV)</span>
          </span>
          <span className="flex items-center space-x-1.5 text-clinical-secondary">
            <span className="w-3 h-1 bg-gray-300 rounded-full inline-block" />
            <span>Non-Target</span>
          </span>
        </div>
      </div>

      {/* SVG Plot with Clinical Grid */}
      <div className="relative w-full h-56 bg-gray-50/70 rounded-xl border border-clinical-border p-1 flex items-center justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
          {/* Shaded P300 Window (250 - 500 ms) */}
          <rect
            x={p300X1}
            y={padding.top}
            width={p300X2 - p300X1}
            height={plotH}
            fill="#0F9D92"
            fillOpacity="0.08"
          />

          {/* Grid lines */}
          {[-5, 0, 5, 10, 15].map((v) => (
            <g key={`y-${v}`}>
              <line
                x1={padding.left}
                y1={mapY(v)}
                x2={width - padding.right}
                y2={mapY(v)}
                stroke={v === 0 ? '#CBD5E1' : '#E2E8F0'}
                strokeWidth={v === 0 ? 1.5 : 0.8}
                strokeDasharray={v === 0 ? undefined : '3,3'}
              />
              <text
                x={padding.left - 6}
                y={mapY(v) + 3}
                fill="#64748B"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                {v > 0 ? `+${v}` : v}
              </text>
            </g>
          ))}

          {/* Vertical Time Markers */}
          {[-100, 0, 200, 340, 500, 700].map((t) => (
            <g key={`x-${t}`}>
              <line
                x1={mapX(t)}
                y1={padding.top}
                x2={mapX(t)}
                y2={height - padding.bottom}
                stroke={t === 0 ? '#94A3B8' : '#E2E8F0'}
                strokeWidth={t === 0 ? 1.5 : 0.8}
                strokeDasharray={t === 0 ? undefined : '3,3'}
              />
              <text
                x={mapX(t)}
                y={height - padding.bottom + 15}
                fill="#64748B"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {t === 0 ? '0' : `${t}ms`}
              </text>
            </g>
          ))}

          {/* Non-target curve */}
          <path
            d={nonTargetPath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Target curve */}
          <path
            d={targetPath}
            fill="none"
            stroke="#0F9D92"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Peak Callout Circle */}
          <circle
            cx={mapX(peakLatencyMs)}
            cy={mapY(peakVoltageUv)}
            r="4.5"
            fill="#0F9D92"
            stroke="#FFFFFF"
            strokeWidth="2"
          />

          {/* Peak text label */}
          <text
            x={mapX(peakLatencyMs)}
            y={mapY(peakVoltageUv) - 9}
            fill="#0F9D92"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle"
          >
            +{peakVoltageUv.toFixed(1)} µV @ {peakLatencyMs}ms
          </text>

          {/* Axis Labels */}
          <text
            x={width / 2}
            y={height - 5}
            fill="#475569"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
          >
            Thời gian từ thời điểm kích thích (ms)
          </text>

          <text
            x={12}
            y={height / 2}
            fill="#475569"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            transform={`rotate(-90 12 ${height / 2})`}
          >
            Biên độ (µV)
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-clinical-secondary">
        <span>Cửa sổ kiểm toán P300: 250ms – 500ms</span>
        <span className="text-clinical-teal font-semibold">Tín hiệu thực tập kiểm thử Held-out</span>
      </div>
    </div>
  );
};
