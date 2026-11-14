/**
 * apps/web/src/pages/admin/AdminLogsPage.tsx
 * Professional Clinical Admin System Security & Audit Log Inspection (M6).
 * Clinical Minimalism × Modern AI Workspace.
 */

import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, ShieldAlert, CheckCircle2, User, Clock, Search, Filter } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';

export const AdminLogsPage: React.FC = () => {
  const toast = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.audit.list(100);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs', err);
      toast.error('Không thể tải nhật ký kiểm toán.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    return (
      (l.action && l.action.toLowerCase().includes(search.toLowerCase())) ||
      (l.username && l.username.toLowerCase().includes(search.toLowerCase())) ||
      (l.details && JSON.stringify(l.details).toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-clinical-border shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-clinical-text">Nhật Ký Kiểm Toán Hệ Thống (Audit Logs)</h1>
          <p className="text-xs text-clinical-secondary">
            Ghi nhận toàn bộ thao tác bảo mật, xác thực tài khoản và can thiệp tham số lâm sàng (Tổng: {logs.length})
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-clinical-border text-xs text-clinical-text font-semibold transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-clinical-secondary" />
          <span>Làm Mới Logs</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-clinical-border shadow-xs flex items-center justify-between text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-clinical-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo hành động hoặc người dùng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-sans"
          />
        </div>
        <span className="text-[11px] font-mono text-clinical-secondary hidden sm:inline">
          Nhật ký bất biến lưu trữ SQLite
        </span>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-clinical-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">Đang tải nhật ký kiểm toán...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">Chưa có nhật ký kiểm toán nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-clinical-border text-clinical-secondary font-mono">
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4">Người Thực Hiện</th>
                  <th className="py-3.5 px-4">Hành Động</th>
                  <th className="py-3.5 px-4">Chi Tiết Sự Kiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-clinical-border font-mono">
                {filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-4 text-clinical-secondary whitespace-nowrap text-[11px]">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 font-bold text-clinical-blue whitespace-nowrap">
                      {log.username || 'System'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-clinical-text font-sans text-xs">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || '—'}
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
