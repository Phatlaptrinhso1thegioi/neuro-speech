import React from 'react';
import { Sparkles, ArrowRight, CornerDownLeft, RefreshCw, XCircle } from 'lucide-react';

interface SuggestionStripProps {
  candidates: string[];
  highlightedIndex: number;
  kOfN: string;
  onSelectCandidate?: (candidate: string, index: number) => void;
  onCycleNext?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  disabled?: boolean;
}

export const SuggestionStrip: React.FC<SuggestionStripProps> = ({
  candidates = [],
  highlightedIndex = 0,
  kOfN = '0/0',
  onSelectCandidate,
  onCycleNext,
  onAccept,
  onReject,
  disabled = false,
}) => {
  if (!candidates || candidates.length === 0) {
    return (
      <div
        className="w-full bg-white/70 border border-dashed border-clinical-border rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-clinical-secondary text-xs font-mono"
        data-testid="suggestion-strip-empty"
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-clinical-teal" />
          <span>Layer 2 Language Suggestions: Gõ ≥ 2 ký tự để kích hoạt gợi ý từ ngữ</span>
        </div>
        <span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
          Từ điển 4,000+ từ & Bigram Offline
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-full bg-white border border-clinical-border rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs"
      data-testid="suggestion-strip"
    >
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1.5 text-clinical-teal font-bold text-xs tracking-wider uppercase">
          <Sparkles className="w-4 h-4" />
          <span>AI Suggestions ({kOfN})</span>
        </div>
        <span className="text-[10px] font-mono text-clinical-secondary hidden sm:inline">
          (Cần người dùng cam kết)
        </span>
      </div>

      {/* Candidate Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {candidates.map((word, idx) => {
          const isHighlighted = idx === highlightedIndex;
          return (
            <button
              key={`${word}-${idx}`}
              type="button"
              onClick={() => onSelectCandidate?.(word, idx)}
              disabled={disabled}
              data-testid={`suggestion-candidate-${idx}`}
              data-highlighted={isHighlighted ? 'true' : 'false'}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-100 flex items-center space-x-1 border ${
                isHighlighted
                  ? 'bg-clinical-blue text-white border-clinical-blue shadow-sm shadow-blue-500/30 font-bold scale-105'
                  : 'bg-gray-50 text-clinical-text border-clinical-border hover:border-clinical-blue/40 hover:bg-blue-50/40'
              }`}
            >
              <span className="text-xs opacity-75 mr-1 font-mono">{idx + 1}.</span>
              <span>{word}</span>
            </button>
          );
        })}
      </div>

      {/* Action buttons (NEXT, ACCEPT, CONTINUE) */}
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onReject?.()}
          className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-clinical-text border border-clinical-border transition-colors flex items-center space-x-1 cursor-pointer select-none"
          title="Bỏ qua các từ gợi ý và tiếp tục gõ từng chữ cái"
        >
          <span>CONTINUE</span>
        </button>

        <button
          type="button"
          onClick={() => onCycleNext?.()}
          className="px-2.5 py-1 text-xs font-mono font-medium rounded-lg bg-gray-100 hover:bg-gray-200 text-clinical-text border border-clinical-border transition-colors flex items-center space-x-1 cursor-pointer select-none"
          title="Chuyển đến từ gợi ý tiếp theo (k/n)"
        >
          <span>NEXT (k/n)</span>
        </button>

        <button
          type="button"
          onClick={() => onAccept?.()}
          className="px-3.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/30 transition-all flex items-center space-x-1 cursor-pointer select-none"
          title="Chấp nhận từ gợi ý và đưa vào câu xác nhận chính thức"
        >
          <span>ACCEPT</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
