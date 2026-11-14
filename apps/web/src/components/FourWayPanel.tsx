import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { FourWayEntry } from '../types';
import { useLanguage } from '../hooks/useLanguage';

interface FourWayPanelProps {
  entries: FourWayEntry[];
  currentGroundTruth?: string;
  currentPredicted?: string;
  currentSuggested?: string;
  currentConfirmed?: string;
}

export const FourWayPanel: React.FC<FourWayPanelProps> = ({
  entries,
  currentGroundTruth = '—',
  currentPredicted = '—',
  currentSuggested = '—',
  currentConfirmed = '—',
}) => {
  const { language } = useLanguage();

  return (
    <div className="bg-white rounded-2xl border border-clinical-border p-4 sm:p-5 flex flex-col space-y-3.5 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-clinical-border pb-2.5">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-clinical-teal" />
          <h3 className="text-xs font-bold text-clinical-text uppercase tracking-wider">
            {language === 'vi'
              ? 'Bảo Đảm An Toàn: Phân Tách 4 Thành Phần (Four-Way Distinction)'
              : 'Safety Invariant: Four-Way Distinction Gate'}
          </h3>
        </div>
        <div className="text-[11px] font-mono text-clinical-secondary">
          {language === 'vi' ? 'Tách biệt Tầng 1 (Sóng não) & Tầng 2 (Ngôn ngữ AI)' : 'Layer 1 Neural vs Layer 2 NLP'}
        </div>
      </div>

      {/* Real-time 4-Way Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl flex flex-col">
          <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
            (a) Ground Truth
          </span>
          <span className="text-xl font-mono font-bold text-emerald-950 mt-1 truncate">
            {currentGroundTruth || '—'}
          </span>
          <span className="text-[10px] text-emerald-700 font-mono mt-0.5">
            {language === 'vi' ? 'Mục tiêu lâm sàng' : 'Clinical target'}
          </span>
        </div>

        <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-xl flex flex-col">
          <span className="text-[10px] uppercase font-bold text-clinical-blue tracking-wider">
            (b) Raw Predicted
          </span>
          <span className="text-xl font-mono font-bold text-blue-950 mt-1 truncate">
            {currentPredicted || '—'}
          </span>
          <span className="text-[10px] text-blue-700 font-mono mt-0.5">
            {language === 'vi' ? 'Tầng 1: Giải mã LDA' : 'Layer 1: LDA Margin'}
          </span>
        </div>

        <div className="bg-purple-50/70 border border-purple-200 p-3 rounded-xl flex flex-col">
          <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">
            (c) AI Suggested
          </span>
          <span className="text-xl font-mono font-bold text-purple-950 mt-1 truncate">
            {currentSuggested || '—'}
          </span>
          <span className="text-[10px] text-purple-700 font-mono mt-0.5">
            {language === 'vi' ? 'Tầng 2: Gợi ý Bigram' : 'Layer 2: Word Candidate'}
          </span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl flex flex-col">
          <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
            (d) Confirmed Output
          </span>
          <span className="text-xl font-mono font-bold text-amber-950 mt-1 truncate">
            {currentConfirmed || '—'}
          </span>
          <span className="text-[10px] text-amber-700 font-mono mt-0.5">
            {language === 'vi' ? 'Người bệnh cam kết' : 'User committed'}
          </span>
        </div>
      </div>

      {/* Historical Telemetry Log Table */}
      <div className="w-full max-h-52 overflow-y-auto rounded-xl border border-clinical-border bg-gray-50/50">
        <table className="w-full text-left text-xs font-mono text-clinical-text">
          <thead className="bg-white text-clinical-secondary uppercase text-[10px] sticky top-0 border-b border-clinical-border shadow-2xs">
            <tr>
              <th className="py-2.5 px-3">{language === 'vi' ? 'Lượt' : 'Step'}</th>
              <th className="py-2.5 px-3 text-emerald-700">(a) Truth</th>
              <th className="py-2.5 px-3 text-blue-700">(b) Predicted</th>
              <th className="py-2.5 px-3 text-purple-700">(c) Suggested</th>
              <th className="py-2.5 px-3 text-amber-700">(d) Confirmed</th>
              <th className="py-2.5 px-3">{language === 'vi' ? 'Nguồn' : 'Source'}</th>
              <th className="py-2.5 px-3">{language === 'vi' ? 'Trạng Thái' : 'State'}</th>
              <th className="py-2.5 px-3 text-right">{language === 'vi' ? 'Độ Trễ' : 'Latency'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-clinical-border">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-5 text-center text-clinical-secondary font-sans italic">
                  {language === 'vi'
                    ? 'Chưa có lượt giải mã nào. Hãy bắt đầu phát Replay hoặc nhấp vào ký tự trong ma trận.'
                    : 'No decoded trials yet. Start Replay or click any character in the 6×6 matrix.'}
                </td>
              </tr>
            ) : (
              entries
                .slice(-20)
                .reverse()
                .map((e, idx) => (
                  <tr key={idx} className="hover:bg-white transition-colors">
                    <td className="py-2 px-3 text-clinical-secondary">{e.step}</td>
                    <td className="py-2 px-3 text-emerald-800 font-bold">{e.groundTruth}</td>
                    <td className="py-2 px-3 text-clinical-blue font-bold">{e.predicted}</td>
                    <td className="py-2 px-3 text-purple-800">{e.aiSuggested}</td>
                    <td className="py-2 px-3 text-amber-800 font-semibold">{e.confirmed}</td>
                    <td className="py-2 px-3 text-clinical-secondary text-[11px]">{e.source}</td>
                    <td className="py-2 px-3 text-clinical-secondary text-[11px]">{e.state}</td>
                    <td className="py-2 px-3 text-right text-clinical-teal font-bold">{e.latencyMs.toFixed(3)}ms</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
