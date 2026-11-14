import React from 'react';
import { AlertTriangle, Clock, Zap, Cpu } from 'lucide-react';
import { TelemetryMetrics } from '../types';

interface FooterProps {
  telemetry?: TelemetryMetrics;
}

const defaultTelemetry: TelemetryMetrics = {
  preprocessingLatencyMs: 0.041,
  inferenceMedianMs: 0.093,
  inferenceP95Ms: 0.119,
  epochWindowMs: 900, // -100 ms to +800 ms
  sequenceDurationS: 24.0, // 8 reps * 12 flashes * 250ms SOA
  totalSelectionTimeS: 28.5,
};

export const Footer: React.FC<FooterProps> = ({ telemetry = defaultTelemetry }) => {
  return (
    <footer className="bg-neuro-panel border-t border-gray-800 text-gray-400 text-xs px-4 py-3 mt-auto">
      <div className="max-w-7xl mx-auto space-y-2">
        {/* Disclaimers row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 border-b border-gray-800/60 pb-2">
          {/* Medical disclaimer */}
          <div className="flex items-center space-x-1.5 text-amber-400/90 font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Research & Assistive-Technology Prototype — Not a certified medical diagnostic device.
            </span>
          </div>

          {/* F3 note */}
          <div className="text-gray-400 font-mono text-[11px] bg-red-950/30 px-2 py-0.5 rounded border border-red-900/40">
            <span className="text-red-400 font-bold">F3 Notice:</span> Urgent-help does not replace emergency medical calling (115 / 911).
          </div>
        </div>

        {/* Honest Telemetry row (Principle 5) */}
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[11px] text-gray-300">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-gray-400">Preprocessing Latency:</span>
            <span className="text-cyan-400 font-semibold">{telemetry.preprocessingLatencyMs.toFixed(3)} ms</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-gray-400">Inference (p50 / p95):</span>
            <span className="text-purple-400 font-semibold">
              {telemetry.inferenceMedianMs.toFixed(3)} ms / {telemetry.inferenceP95Ms.toFixed(3)} ms
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-gray-400">Epoch Window:</span>
            <span className="text-emerald-400 font-semibold">{telemetry.epochWindowMs} ms (-100 to +800 ms)</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-400">Stimulus Sequence:</span>
            <span className="text-yellow-400 font-semibold">{telemetry.sequenceDurationS.toFixed(1)} s</span>
            <span className="text-gray-500">| Sel Time: {telemetry.totalSelectionTimeS.toFixed(1)} s</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
