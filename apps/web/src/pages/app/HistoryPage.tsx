/**
 * apps/web/src/pages/app/HistoryPage.tsx
 * Clinical Communication History & Exporting (VI / EN bilingual).
 */

import React, { useState, useEffect } from 'react';
import {
  History,
  Volume2,
  Filter,
  RefreshCw,
  Search,
  Download,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useLanguage } from '../../hooks/useLanguage';
import { CommunicationHistoryItem } from '../../types';

export const HistoryPage: React.FC = () => {
  const toast = useToast();
  const { language } = useLanguage();
  const [items, setItems] = useState<CommunicationHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [modeFilter, setModeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.communication.list({
        mode: modeFilter || undefined,
        limit: 100,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load communication history', err);
      toast.error(
        language === 'vi'
          ? 'Không thể tải lịch sử giao tiếp từ máy chủ.'
          : 'Failed to load communication history from server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [modeFilter]);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      toast.info(language === 'vi' ? `Đang phát âm lại: "${text}"` : `Speaking: "${text}"`);
    } else {
      toast.warning(language === 'vi' ? 'Trình duyệt chưa hỗ trợ phát âm TTS.' : 'Browser does not support Web Speech TTS.');
    }
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.warning(language === 'vi' ? 'Không có bản ghi nào để xuất dữ liệu.' : 'No records available to export.');
      return;
    }

    const headers = ['ID', 'Timestamp', 'Subsystem', 'Confirmed Text', 'Duration (s)', 'Model', 'TTS'];
    const rows = items.map((i) => [
      i.id,
      new Date(i.created_at).toISOString(),
      `"${i.mode}"`,
      `"${i.confirmed_text.replace(/"/g, '""')}"`,
      i.duration_s,
      `"${i.model_version || ''}"`,
      i.tts_status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `neuro_speech_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(language === 'vi' ? 'Đã xuất lịch sử giao tiếp ra tệp .CSV thành công.' : 'Exported communication history to CSV.');
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    return (
      item.confirmed_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mode.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div className="bg-white p-6 rounded-2xl border border-clinical-border shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-clinical-blue/10 border border-clinical-blue/20 rounded-xl text-clinical-blue">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-clinical-text">
              {language === 'vi' ? 'Lịch Sử Giao Tiếp Đã Cam Kết' : 'Committed Communication History'}
            </h1>
            <p className="text-xs text-clinical-secondary">
              {language === 'vi'
                ? `Nhật ký kiểm toán toàn bộ câu nói và mệnh lệnh sinh tồn đã được bệnh nhân xác nhận (Tổng: ${total})`
                : `Audit trail of all patient-confirmed sentences and survival broadcasts (Total: ${total})`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-clinical-border text-xs font-semibold text-clinical-text transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-clinical-blue" />
            <span>{language === 'vi' ? 'Xuất CSV' : 'Export CSV'}</span>
          </button>

          <button
            type="button"
            onClick={fetchHistory}
            className="p-2 bg-gray-50 hover:bg-gray-100 border border-clinical-border rounded-xl text-clinical-secondary hover:text-clinical-text transition-colors"
            title={language === 'vi' ? 'Làm mới' : 'Refresh'}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-clinical-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-clinical-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm kiếm nội dung đã nói...' : 'Search committed sentences...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-sans"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-clinical-secondary" />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-sans w-full sm:w-auto"
          >
            <option value="">{language === 'vi' ? 'Tất cả phân hệ' : 'All Subsystems'}</option>
            <option value="NEURAL WRITING STUDIO">Neural Writing Studio</option>
            <option value="QUICK SURVIVAL">Quick Survival (F1–F4)</option>
            <option value="REAL DATASET REPLAY">Real Dataset Replay</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-clinical-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">
            {language === 'vi' ? 'Đang tải dữ liệu lịch sử giao tiếp...' : 'Loading communication history...'}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">
            {language === 'vi' ? 'Không tìm thấy bản ghi giao tiếp nào phù hợp.' : 'No matching communication records found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-clinical-border text-clinical-secondary font-mono">
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Thời Gian' : 'Timestamp'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Phân Hệ' : 'Subsystem'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Văn Bản Đã Cam Kết' : 'Confirmed Output'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Thời Lượng' : 'Duration'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Mô Hình' : 'Decoder Model'}</th>
                  <th className="py-3.5 px-4">{language === 'vi' ? 'Trạng Thái TTS' : 'TTS Status'}</th>
                  <th className="py-3.5 px-4 text-right">{language === 'vi' ? 'Thao Tác' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clinical-border font-mono">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-clinical-secondary whitespace-nowrap text-[11px]">
                      {new Date(item.created_at).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-clinical-blue border border-blue-200">
                        {item.mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans font-bold text-clinical-text text-sm">
                      {item.confirmed_text}
                    </td>
                    <td className="py-3 px-4 text-clinical-secondary text-[11px]">
                      {item.duration_s}s
                    </td>
                    <td className="py-3 px-4 text-clinical-secondary text-[11px]">
                      {item.model_version || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {item.tts_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSpeak(item.confirmed_text)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-50 hover:bg-clinical-blue/10 border border-clinical-border text-clinical-blue rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Phát âm' : 'Speak'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
