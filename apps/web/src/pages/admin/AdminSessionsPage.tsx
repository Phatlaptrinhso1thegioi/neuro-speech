/**
 * apps/web/src/pages/admin/AdminSessionsPage.tsx
 * Professional Clinical Admin EEG Sessions Auditing & Quality Inspection (M6).
 * Clinical Minimalism × Modern AI Workspace.
 */

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, RefreshCw, CheckCircle2, Clock, Search, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { EEGSessionItem } from '../../types';

export const AdminSessionsPage: React.FC = () => {
  const toast = useToast();
  const [sessions, setSessions] = useState<EEGSessionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.sessions.list({ limit: 100 });
      setSessions(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load sessions', err);
      toast.error('Không thể tải danh sách phiên EEG.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (!search.trim()) return true;
    return (
      s.patient_code.toLowerCase().includes(search.toLowerCase()) ||
      s.session_type.toLowerCase().includes(search.toLowerCase()) ||
      s.mode_badge.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-clinical-border shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-clinical-text">Quản Trị Các Phiên Thu EEG & Replay</h1>
          <p className="text-xs text-clinical-secondary">
            Kiểm tra chất lượng tín hiệu, thời lượng thu và độ chính xác phân loại theo từng phiên (Tổng số: {total})
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSessions}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-clinical-border text-xs text-clinical-text font-semibold transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-clinical-secondary" />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-clinical-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">Đang tải danh sách phiên...</div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">Chưa có phiên EEG nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-clinical-border text-clinical-secondary font-mono">
                  <th className="py-3.5 px-4">Mã Phiên</th>
                  <th className="py-3.5 px-4">Bệnh Nhân</th>
                  <th className="py-3.5 px-4">Loại Phiên</th>
                  <th className="py-3.5 px-4">Chế Độ Phân Hệ</th>
                  <th className="py-3.5 px-4">Tập Dữ Liệu / Split</th>
                  <th className="py-3.5 px-4">Thời Lượng</th>
                  <th className="py-3.5 px-4">Độ Chính Xác</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clinical-border font-mono">
                {filteredSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-clinical-secondary">#{sess.id}</td>
                    <td className="py-3 px-4 text-clinical-blue font-bold">{sess.patient_code}</td>
                    <td className="py-3 px-4 text-clinical-text font-sans font-medium">{sess.session_type}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-clinical-blue border border-blue-200 whitespace-nowrap">
                        {sess.mode_badge}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-clinical-secondary text-[11px]">{sess.split_name || '—'}</td>
                    <td className="py-3 px-4 text-clinical-text">{sess.duration_s}s</td>
                    <td className="py-3 px-4 text-emerald-700 font-bold">
                      {sess.accuracy !== undefined ? `${(sess.accuracy * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/app/studio"
                        className="inline-flex items-center space-x-1 px-2.5 py-1 bg-clinical-blue hover:bg-clinical-blueHover text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Xem Replay</span>
                      </Link>
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
