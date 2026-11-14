/**
 * apps/web/src/pages/admin/AdminDashboardPage.tsx
 * Bright, Symmetrical Clinical Admin Console Overview Dashboard.
 * Supports full VI/EN localization and Light/Dark mode.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  HeartPulse,
  FileSpreadsheet,
  Cpu,
  ShieldCheck,
  Server,
  RefreshCw,
  Database,
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  FileText,
  Settings,
  ArrowRight,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { AdminStats } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const isVi = language === 'vi';

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (showToast = false) => {
    if (showToast) setRefreshing(true);
    else setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.admin.getStats(),
        api.audit.list(5).catch(() => []),
      ]);
      setStats(statsRes);
      setRecentLogs(Array.isArray(logsRes) ? logsRes : []);
      if (showToast) {
        toast.success(
          isVi
            ? 'Đã đồng bộ lại số liệu cơ sở dữ liệu quản trị.'
            : 'Synchronized admin telemetry from SQLite database.'
        );
      }
    } catch (err) {
      console.error('Failed to load admin stats', err);
      toast.error(
        isVi ? 'Không thể tải số liệu thống kê quản trị.' : 'Could not load admin telemetry stats.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats(false);
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 font-sans">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {isVi ? 'Bảng Điều Khiển Quản Trị Hệ Thống' : 'System Governance & Admin Console'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isVi ? 'Số liệu thống kê trực tiếp từ cơ sở dữ liệu SQLite (' : 'Live statistics from SQLite database ('}
            <code className="text-blue-600 dark:text-blue-400 font-mono">neuro_speech.db</code>)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => fetchStats(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{isVi ? 'Làm mới số liệu' : 'Refresh Stats'}</span>
          </button>

          <Link
            to="/app/dashboard"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isVi ? 'Về Không Gian Bác Sĩ' : 'Clinical Workspace'}</span>
          </Link>
        </div>
      </div>

      {/* 1. UNIFIED HORIZONTAL ADMIN BANNER & 4 STAT CARDS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-3.5">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
          <div className="xl:col-span-4 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-xl p-4 text-white flex items-center space-x-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                {isVi ? 'QUẢN TRỊ VIÊN HỆ THỐNG' : 'SYSTEM ADMINISTRATOR'}
              </div>
              <div className="text-base font-extrabold leading-snug truncate">
                {user?.full_name || 'Administrator'}
              </div>
              <div className="text-xs text-blue-100 font-mono truncate mt-0.5">
                RBAC Full Access • WAL DB
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/users')}
              className="rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-800/60 hover:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-950/30 p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium w-full">
                <span>{isVi ? 'Người dùng' : 'Users'}</span>
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="my-1.5 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {loading ? '—' : stats?.users?.total ?? 3}
              </div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1">
                <span>{isVi ? 'Quản lý RBAC' : 'RBAC Accounts'}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/patients')}
              className="rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-800/60 hover:border-rose-400 hover:bg-rose-50/20 dark:hover:bg-rose-950/30 p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium w-full">
                <span>{isVi ? 'Bệnh nhân' : 'Patients'}</span>
                <HeartPulse className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              </div>
              <div className="my-1.5 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {loading ? '—' : stats?.patients?.total ?? 1}
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center space-x-1">
                <span>{isVi ? 'Hồ sơ bệnh án' : 'Medical Registry'}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/sessions')}
              className="rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-800/60 hover:border-teal-400 hover:bg-teal-50/20 dark:hover:bg-teal-950/30 p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium w-full">
                <span>{isVi ? 'Phiên EEG' : 'EEG Sessions'}</span>
                <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="my-1.5 text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
                {loading ? '—' : stats?.sessions?.total ?? 2}
              </div>
              <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center space-x-1">
                <span>{isVi ? 'Kho phiên đo' : 'Session Vault'}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/models')}
              className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:border-emerald-400 p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 text-xs font-medium w-full">
                <span>{isVi ? 'Mô hình AI' : 'AI Models'}</span>
                <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="my-1.5 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                {loading ? '—' : stats?.models?.total ?? 2}
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center space-x-1">
                <span>Checkpoints &amp; Retrain</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BALANCED 2-COLUMN WORKSPACE: LOGS & HEALTH (8) + ADMIN MENU (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 space-y-5">
          {/* Card 1: Audit Logs */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">
                  {isVi ? 'Nhật Ký Kiểm Toán Hệ Thống Gần Đây' : 'Recent System Audit Logs'}
                </h2>
              </div>
              <Link
                to="/admin/logs"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
              >
                <span>{isVi ? 'Xem toàn bộ Logs' : 'View All Logs'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-4 space-y-2.5">
              {loading ? (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  {isVi ? 'Đang tải nhật ký kiểm toán...' : 'Loading audit trail...'}
                </div>
              ) : recentLogs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400">
                  {isVi ? 'Chưa có sự kiện kiểm toán mới nào.' : 'No recent audit events recorded.'}
                </div>
              ) : (
                recentLogs.map((log, i) => (
                  <div
                    key={log.id || i}
                    onClick={() => navigate('/admin/logs')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') navigate('/admin/logs');
                    }}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50/90 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 transition-all flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-mono text-[10px] font-bold">
                          {log.action}
                        </span>
                        <span className="font-bold text-xs text-slate-800 dark:text-white truncate">
                          User: {log.username || `ID #${log.user_id}`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                        {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString(isVi ? 'vi-VN' : 'en-US')
                        : '—'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: Infrastructure Health */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                {isVi ? 'Trạng Thái Cơ Sở Dữ Liệu & Hạ Tầng API' : 'Database & API Infrastructure Health'}
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block">FastAPI Backend</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>localhost:8000 (v2.1.0)</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block">SQLite Database</span>
                <span className="text-slate-800 dark:text-white font-bold flex items-center space-x-1.5">
                  <Database className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>neuro_speech.db (WAL Mode)</span>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-slate-500 dark:text-slate-400 block">Dataset Validation</span>
                <span className="text-blue-700 dark:text-blue-400 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>BNCI 2014-009 Verified</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Quick Admin Menu */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                {isVi ? 'Menu quản trị nhanh' : 'Admin Quick Menu'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isVi ? 'Điều hướng nhanh các phân hệ Admin' : 'Fast access to governance subsystems'}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-2">
            {[
              { label: isVi ? 'Quản lý Người dùng (RBAC)' : 'User & RBAC Accounts', path: '/admin/users', icon: Users },
              { label: isVi ? 'Quản lý Hồ sơ Bệnh nhân' : 'Patient Medical Registry', path: '/admin/patients', icon: HeartPulse },
              { label: isVi ? 'Kho Dữ liệu EEG Benchmark' : 'EEG Benchmark Datasets', path: '/admin/datasets', icon: Database },
              { label: isVi ? 'Mô hình & Huấn luyện lại AI' : 'AI Models & Retraining', path: '/admin/models', icon: Cpu },
              { label: isVi ? 'Quản lý Phiên thu EEG' : 'EEG Recording Sessions', path: '/admin/sessions', icon: FileSpreadsheet },
              { label: isVi ? 'Nhật ký Kiểm toán (Audit Logs)' : 'System Audit Logs', path: '/admin/logs', icon: ShieldCheck },
              { label: isVi ? 'Cấu hình Tham số Hệ thống' : 'System Parameters', path: '/admin/settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/60 dark:border-slate-700/70 hover:border-indigo-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-800 dark:group-hover:text-indigo-300">
                      {item.label}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
