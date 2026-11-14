import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

export const MATRIX_6X6 = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9', '_'],
];

interface SpellerMatrixProps {
  activeFlashGroup?: number | null; // 1-6 for rows, 7-12 for cols
  targetCell?: { row: number; col: number } | null;
  lastDecodedCell?: { row: number; col: number } | null;
  onCellClick?: (row: number, col: number, char: string) => void;
  compact?: boolean;
}

export const SpellerMatrix: React.FC<SpellerMatrixProps> = ({
  activeFlashGroup = null,
  targetCell = null,
  lastDecodedCell = null,
  onCellClick,
  compact = false,
}) => {
  const { language } = useLanguage();

  const isCellFlashing = (rowIdx: number, colIdx: number): boolean => {
    if (activeFlashGroup === null) return false;
    if (activeFlashGroup >= 1 && activeFlashGroup <= 6) {
      return activeFlashGroup - 1 === rowIdx;
    }
    if (activeFlashGroup >= 7 && activeFlashGroup <= 12) {
      return activeFlashGroup - 7 === colIdx;
    }
    return false;
  };

  const getFlashLabel = () => {
    if (!activeFlashGroup) return language === 'vi' ? 'Sẵn sàng (Idle)' : 'Idle (Ready)';
    if (activeFlashGroup <= 6)
      return language === 'vi'
        ? `Đang phát xung: Hàng ${activeFlashGroup} / 6`
        : `Flashing: Row ${activeFlashGroup} / 6`;
    return language === 'vi'
      ? `Đang phát xung: Cột ${activeFlashGroup - 6} / 6`
      : `Flashing: Col ${activeFlashGroup - 6} / 6`;
  };

  return (
    <div className="bg-white rounded-2xl border border-clinical-border p-4 sm:p-5 flex flex-col items-center shadow-xs">
      {/* Matrix Header */}
      <div className="w-full flex items-center justify-between mb-3.5 pb-2.5 border-b border-clinical-border text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-clinical-teal inline-block" />
          <h3 className="font-bold text-clinical-text uppercase tracking-wider text-xs">
            {language === 'vi' ? 'Ma Trận Đánh Vần 6×6 P300 Oddball' : '6×6 P300 Oddball Speller Matrix'}
          </h3>
        </div>
        <div className="flex items-center space-x-2 font-mono text-[11px]">
          <span className="text-clinical-secondary">4.0 Hz</span>
          <span className="px-2 py-0.5 rounded-md bg-clinical-teal/10 text-clinical-teal font-bold border border-clinical-teal/20">
            {getFlashLabel()}
          </span>
        </div>
      </div>

      {/* 6x6 Grid */}
      <div
        className={`grid grid-cols-6 gap-2 w-full max-w-lg select-none ${compact ? 'max-w-sm gap-1.5' : ''}`}
        data-testid="speller-matrix"
      >
        {MATRIX_6X6.map((row, rIdx) =>
          row.map((char, cIdx) => {
            const flashing = isCellFlashing(rIdx, cIdx);
            const isTarget = targetCell?.row === rIdx + 1 && targetCell?.col === cIdx + 1;
            const isDecoded = lastDecodedCell?.row === rIdx + 1 && lastDecodedCell?.col === cIdx + 1;

            let cellStyle =
              'bg-gray-50/90 text-clinical-text border-clinical-border hover:bg-blue-50/60 hover:border-blue-300 shadow-2xs';

            if (flashing) {
              if (isTarget) {
                cellStyle =
                  'bg-emerald-600 text-white font-black border-emerald-400 scale-[1.06] shadow-lg shadow-emerald-500/40 z-10 ring-2 ring-emerald-300';
              } else {
                cellStyle =
                  'bg-clinical-teal text-white font-black border-clinical-teal scale-[1.03] shadow-md shadow-teal-600/30 z-10 ring-2 ring-teal-200';
              }
            } else if (isDecoded) {
              cellStyle =
                'bg-blue-50 text-clinical-blue border-clinical-blue font-bold ring-2 ring-blue-300/60 shadow-xs';
            } else if (isTarget) {
              cellStyle =
                'bg-emerald-50 text-emerald-900 border-emerald-500 font-extrabold ring-2 ring-emerald-300/70 shadow-xs';
            }

            return (
              <button
                key={`${rIdx}-${cIdx}`}
                type="button"
                onClick={() => onCellClick?.(rIdx + 1, cIdx + 1, char)}
                data-testid={`matrix-cell-${rIdx}-${cIdx}`}
                data-flashing={flashing ? 'true' : 'false'}
                title={`${char === '_' ? 'Space' : char} (Row ${rIdx + 1}, Col ${cIdx + 1})`}
                className={`relative flex flex-col items-center justify-center rounded-xl border transition-all duration-75 cursor-pointer ${
                  compact ? 'h-11 text-base' : 'h-13 sm:h-15 text-lg sm:text-xl'
                } ${cellStyle}`}
              >
                <span className="font-mono tracking-wider font-bold">{char === '_' ? '␣' : char}</span>
                <span className="text-[9px] font-mono opacity-50 block leading-none mt-0.5">
                  R{rIdx + 1}C{cIdx + 1}
                </span>
                {isTarget && !flashing && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-4 text-[11px] font-mono text-clinical-secondary">
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-clinical-teal inline-block shadow-2xs" />
          <span>{language === 'vi' ? 'Kích thích Flash (SOA 250ms)' : 'Flash Stimulus (250ms SOA)'}</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-blue-50 border border-clinical-blue inline-block shadow-2xs" />
          <span>{language === 'vi' ? 'Giải mã LDA (Predicted)' : 'LDA Predicted Cell'}</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-500 inline-block shadow-2xs" />
          <span>{language === 'vi' ? 'Ký tự Mục tiêu (Target)' : 'Target Ground Truth'}</span>
        </span>
      </div>
    </div>
  );
};
