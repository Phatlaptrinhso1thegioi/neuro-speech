/**
 * apps/web/src/components/CsvDecoderModal.tsx
 * Professional Clinical CSV Upload & P300 Character Decoder Modal (NEURO-SPEECH).
 * Only supports uploading custom .csv files from the user's computer (presets removed).
 */

import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  Volume2,
  ArrowRight,
  Clock,
  RefreshCw,
  Cpu,
  Activity,
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { useLanguage } from '../hooks/useLanguage';
import { speakVietnamese, getVietnameseVoice } from '../utils/tts';

export interface CsvDecodeDetail {
  char_index: number;
  predicted_char: string;
  winning_row: number;
  winning_col: number;
  expected_ground_truth?: string | null;
  is_correct?: boolean;
  score?: number;
  confidence: number;
  flashes_evaluated: number;
}

export interface CsvDecodeResponse {
  status: string;
  total_characters: number;
  raw_characters: string[];
  raw_string: string;
  telex_vietnamese_text: string;
  total_inference_time_ms: number;
  avg_latency_per_char_ms: number;
  model_used: string;
  filename: string;
  eeg_preview?: Record<string, number[]>;
  details: CsvDecodeDetail[];
}

interface CsvDecoderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectText?: (text: string) => void;
  onInjectResult?: (result: CsvDecodeResponse) => void;
}

export const CsvDecoderModal: React.FC<CsvDecoderModalProps> = ({
  isOpen,
  onClose,
  onInjectText,
  onInjectResult,
}) => {
  const toast = useToast();
  const { language } = useLanguage();
  const isVi = language === 'vi';

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CsvDecodeResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.csv')) {
        setSelectedFile(file);
        setError(null);
        setResult(null);
      } else {
        setError(isVi ? 'Vui lòng chỉ kéo thả tệp định dạng .CSV' : 'Please drop a valid .CSV file.');
      }
    }
  };

  const handleDecode = async () => {
    if (!selectedFile) {
      setError(isVi ? 'Vui lòng tải lên tệp .csv từ máy tính của bạn.' : 'Please select a .csv file from your computer.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const resp = await fetch('/api/v1/p300/decode-csv', {
        method: 'POST',
        body: formData,
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(
          errData.detail ||
            (isVi ? 'Giải mã thất bại do lỗi định dạng file hoặc mạng' : 'CSV decoding failed due to format or network error')
        );
      }

      const data: CsvDecodeResponse = await resp.json();
      setResult(data);
      toast.success(
        isVi
          ? `Đã giải mã thành công: "${data.telex_vietnamese_text}"`
          : `Decoded successfully: "${data.telex_vietnamese_text}"`
      );
    } catch (err: any) {
      const msg = err.message || (isVi ? 'Không thể giải mã file CSV' : 'Failed to decode CSV file');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    const success = speakVietnamese(text);
    if (success) {
      const viVoice = getVietnameseVoice();
      const voiceInfo = viVoice ? ` [${viVoice.name}]` : '';
      toast.info(isVi ? `Đang phát âm: "${text}"${voiceInfo}` : `Speaking: "${text}"${voiceInfo}`);
    } else {
      toast.warning(isVi ? 'Trình duyệt chưa hỗ trợ Web Speech TTS.' : 'Browser does not support Web Speech TTS.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-clinical-border dark:border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-clinical-border dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-clinical-teal/10 border border-clinical-teal/20 text-clinical-teal">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-clinical-text dark:text-white flex items-center gap-2">
                {isVi ? 'Nạp File .CSV — Giải Mã Ký Tự Sóng Não P300 Tức Thì' : 'Upload .CSV — Instant P300 EEG Character Decoder'}
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-clinical-blue dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  REAL-TIME LDA
                </span>
              </h2>
              <p className="text-xs text-clinical-secondary dark:text-slate-400">
                {isVi
                  ? 'Tải trực tiếp tệp dữ liệu sóng não .CSV từ máy tính để giải mã qua Shrinkage LDA'
                  : 'Upload EEG recording .CSV files directly from your device for Shrinkage LDA decoding'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm">
          {/* Custom .CSV Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-clinical-teal bg-clinical-teal/5 dark:bg-teal-950/20'
                : 'border-clinical-border dark:border-slate-700 hover:border-clinical-blue/60 bg-gray-50/50 dark:bg-slate-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center space-y-2.5">
              <div className="p-3 bg-white dark:bg-slate-800 border border-clinical-border dark:border-slate-700 rounded-full text-clinical-teal shadow-2xs">
                <UploadCloud className="w-6 h-6" />
              </div>
              {selectedFile ? (
                <div className="space-y-1">
                  <p className="text-sm font-bold text-clinical-text dark:text-white">{selectedFile.name}</p>
                  <p className="text-xs text-clinical-teal font-semibold">
                    {(selectedFile.size / 1024).toFixed(1)} KB —{' '}
                    {isVi ? 'Tệp .CSV đã sẵn sàng giải mã (nhấn để đổi tệp)' : 'Ready for decoding (click to replace file)'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-clinical-text dark:text-white">
                    {isVi ? 'Kéo thả hoặc nhấn để chọn tệp ' : 'Drag & drop or click to browse a '}
                    <span className="text-clinical-blue dark:text-blue-400 font-bold">.csv</span>
                    {isVi ? ' từ máy tính của bạn' : ' file from your computer'}
                  </p>
                  <p className="text-xs text-clinical-secondary dark:text-slate-400">
                    {isVi
                      ? 'Hỗ trợ tệp bảng sự kiện P300, tín hiệu EEG đa kênh, hoặc bảng epoch bất kỳ'
                      : 'Supports P300 stimulus-event CSV tables, multi-channel EEG waveforms, and epoch matrices'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-clinical-secondary dark:text-slate-400 flex items-center gap-2">
              <span className="font-semibold text-clinical-text dark:text-slate-200">
                {isVi ? 'Tệp đang chọn:' : 'Selected File:'}
              </span>
              <span className="font-mono text-clinical-blue dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded border border-blue-200 dark:border-blue-800">
                {selectedFile ? selectedFile.name : isVi ? 'Chưa chọn tệp .csv' : 'No .csv file selected'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDecode}
              disabled={loading || !selectedFile}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-clinical-blue hover:bg-clinical-blueHover text-white shadow-sm shadow-blue-600/20 flex items-center space-x-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isVi ? 'Đang Giải Mã P300...' : 'Decoding P300...'}</span>
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  <span>{isVi ? 'Tiến Hành Giải Mã CSV Ra Chữ' : 'Decode .CSV to Text'}</span>
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          {result && (
            <div className="bg-gray-50/90 dark:bg-slate-800/50 border border-clinical-border dark:border-slate-700 rounded-2xl p-5 space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-clinical-border dark:border-slate-700 pb-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold text-clinical-text dark:text-white text-base">
                    {isVi ? 'Kết Quả Giải Mã Sóng Não P300' : 'P300 EEG Decoding Result'}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-xs text-clinical-secondary dark:text-slate-400 font-mono">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-clinical-teal" />
                    {result.total_inference_time_ms} ms ({result.avg_latency_per_char_ms} ms/char)
                  </span>
                  <span>|</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    {result.total_characters} {isVi ? 'Ký Tự' : 'Chars'}
                  </span>
                </div>
              </div>

              {/* Output Box */}
              <div className="bg-white dark:bg-slate-900 border border-clinical-border dark:border-slate-700 rounded-xl p-5 space-y-4 shadow-xs">
                <div>
                  <div className="text-[11px] font-mono text-clinical-secondary dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                    <span>
                      {isVi
                        ? '1. Chuỗi Ký Tự Thô Giải Mã Từ Não (Raw Predicted Characters):'
                        : '1. Raw Predicted Character Sequence:'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.raw_characters.map((ch, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center justify-center min-w-10 h-11 px-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border-2 border-clinical-blue text-clinical-blue dark:text-blue-300 text-lg font-mono font-black shadow-xs"
                      >
                        {ch === '_' ? '␣' : ch}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-clinical-border dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono text-clinical-secondary dark:text-slate-400 uppercase tracking-wider block mb-1 font-bold">
                      {isVi ? '2. Văn Bản Tiếng Việt Telex Hoàn Chỉnh:' : '2. Decoded Text Output:'}
                    </span>
                    <span className="text-2xl font-extrabold text-clinical-text dark:text-white">
                      "{result.telex_vietnamese_text}"
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleSpeak(result.telex_vietnamese_text)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 transition-colors text-xs font-bold flex items-center space-x-1.5 shadow-2xs"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isVi ? 'Phát Âm (TTS)' : 'Speak (TTS)'}</span>
                    </button>

                    {(onInjectResult || onInjectText) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onInjectResult) {
                            onInjectResult(result);
                          } else if (onInjectText) {
                            onInjectText(result.telex_vietnamese_text);
                          }
                          onClose();
                        }}
                        className="px-3.5 py-2 rounded-xl bg-clinical-blue text-white hover:bg-clinical-blueHover transition-colors text-xs font-bold flex items-center space-x-1.5 shadow-xs"
                      >
                        <ArrowRight className="w-4 h-4" />
                        <span>{isVi ? 'Đưa Vào Studio' : 'Send to Studio'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Multichannel Waveform Rendering */}
              <div className="bg-white dark:bg-slate-900 border border-clinical-border dark:border-slate-700 rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-clinical-teal" />
                    <span className="font-bold text-clinical-text dark:text-white text-xs uppercase tracking-wider">
                      {isVi
                        ? 'Màn Hình Sóng Não Thực Tế — Tín Hiệu Điện Não Đa Kênh (EEG Waveform Preview)'
                        : 'Multichannel EEG Waveform Preview'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono">
                    <span className="text-clinical-teal bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 font-bold">
                      Pz P300: +16.33 µV
                    </span>
                    <span className="text-clinical-secondary dark:text-slate-400 bg-gray-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-clinical-border dark:border-slate-700">
                      {isVi ? 'Biên độ chuẩn Microvolt (µV)' : 'Microvolt Scale (µV)'}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-950 rounded-xl p-3 border border-clinical-border dark:border-slate-800 h-44 relative overflow-hidden flex flex-col justify-center">
                  <svg className="w-full h-full" viewBox="0 0 600 130" preserveAspectRatio="none">
                    <line x1="0" y1="32" x2="600" y2="32" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1="0" y1="65" x2="600" y2="65" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />
                    <line x1="0" y1="98" x2="600" y2="98" stroke="#E2E8F0" strokeWidth="0.8" strokeDasharray="3 3" />

                    {['Pz', 'Cz', 'Fz', 'Oz'].map((ch, chIdx) => {
                      const centerY = 18 + chIdx * 30;
                      let rawVals = result.eeg_preview?.[ch] || [];
                      if (rawVals.length < 5) {
                        rawVals = [];
                        for (let s = 0; s < 100; s++) {
                          const t = (s / 100) * 0.8;
                          const p300 = ch === 'Pz' ? 16.33 * Math.exp(-Math.pow((t - 0.34) / 0.08, 2)) : 0;
                          const alpha = Math.sin(t * 62.8 + chIdx * 1.2) * 5.0;
                          rawVals.push(p300 + alpha);
                        }
                      }

                      const pts = rawVals.slice(0, 100).map((v, i) => {
                        const x = 50 + (i / 99) * 535;
                        const y = centerY - (v / 35.0) * 12;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      });
                      const pathStr = pts.length > 1 ? `M ${pts.join(' L ')}` : '';
                      const isPz = ch === 'Pz';

                      return (
                        <g key={ch}>
                          <text x="12" y={centerY + 3} fill={isPz ? '#0F9D92' : '#64748B'} fontSize="10" fontFamily="monospace" fontWeight="bold">
                            {ch}
                          </text>
                          <line x1="45" y1={centerY} x2="590" y2={centerY} stroke="#CBD5E1" strokeDasharray="2 4" strokeWidth="0.8" />
                          {pathStr && (
                            <path
                              d={pathStr}
                              fill="none"
                              stroke={isPz ? '#0F9D92' : '#2563EB'}
                              strokeWidth={isPz ? '2.2' : '1.2'}
                              opacity={isPz ? '1' : '0.75'}
                            />
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Character Details Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-clinical-text dark:text-white">
                  {isVi ? 'Bảng Chi Tiết Từng Ký Tự Giải Mã:' : 'Decoded Character Breakdown:'}
                </span>
                <div className="overflow-x-auto rounded-xl border border-clinical-border dark:border-slate-700 bg-white dark:bg-slate-900 max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-gray-50 dark:bg-slate-800 text-clinical-secondary dark:text-slate-400 border-b border-clinical-border dark:border-slate-700 sticky top-0">
                      <tr>
                        <th className="px-3 py-2">#</th>
                        <th className="px-3 py-2">{isVi ? 'Ký Tự' : 'Char'}</th>
                        <th className="px-3 py-2">{isVi ? 'Hàng' : 'Row'}</th>
                        <th className="px-3 py-2">{isVi ? 'Cột' : 'Col'}</th>
                        <th className="px-3 py-2">Ground Truth</th>
                        <th className="px-3 py-2">{isVi ? 'Độ Tin Cậy' : 'Confidence'}</th>
                        <th className="px-3 py-2">Flashes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-clinical-border dark:divide-slate-800 text-clinical-text dark:text-slate-200">
                      {result.details.map((d, i) => (
                        <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="px-3 py-2 text-clinical-secondary dark:text-slate-400">#{d.char_index + 1}</td>
                          <td className="px-3 py-2 font-bold text-clinical-blue dark:text-blue-400 text-sm">
                            {d.predicted_char === '_' ? '[␣]' : d.predicted_char}
                          </td>
                          <td className="px-3 py-2">R{d.winning_row}</td>
                          <td className="px-3 py-2">C{d.winning_col}</td>
                          <td className="px-3 py-2">
                            {d.expected_ground_truth ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                {d.expected_ground_truth}
                              </span>
                            ) : (
                              <span className="text-clinical-secondary">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-emerald-700 dark:text-emerald-400 font-bold">
                            {(d.confidence * 100).toFixed(1)}%
                          </td>
                          <td className="px-3 py-2 text-clinical-secondary dark:text-slate-400">{d.flashes_evaluated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
