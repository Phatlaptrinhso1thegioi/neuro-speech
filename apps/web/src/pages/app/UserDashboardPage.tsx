/**
 * apps/web/src/pages/app/UserDashboardPage.tsx
 * Bright, Clean, Symmetrical Clinical BCI Overview Dashboard.
 * Supports full VI/EN localization and persistent Light/Dark mode.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Brain,
  Activity,
  HeartHandshake,
  History,
  FileSpreadsheet,
  Cpu,
  Clock,
  Volume2,
  ShieldCheck,
  Zap,
  UploadCloud,
  Stethoscope,
  ChevronRight,
  RefreshCw,
  LayoutGrid,
  FileText,
  Radio,
  X,
  ArrowRight,
  BarChart3,
  User,
  Settings,
  Shield,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useToast } from '../../hooks/useToast';
import { api } from '../../services/api';
import { CommunicationHistoryItem, EEGSessionItem } from '../../types';
import { CsvDecoderModal } from '../../components/CsvDecoderModal';
import { speakVietnamese, getVietnameseVoice } from '../../utils/tts';

type FeedCategory = 'all' | 'comm' | 'survival' | 'session' | 'system';

interface UnifiedFeedItem {
  id: string;
  category: Exclude<FeedCategory, 'all'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  timestamp: string;
  speakableText?: string;
  actionRoute?: string;
  raw?: any;
}

type TelemetryModalType =
  | null
  | 'patient'
  | 'eeg'
  | 'model'
  | 'itr'
  | 'latency'
  | 'erp'
  | 'invariant'
  | 'feedDetail';

export const UserDashboardPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const isVi = language === 'vi';

  const [recentComm, setRecentComm] = useState<CommunicationHistoryItem[]>([]);
  const [recentSessions, setRecentSessions] = useState<EEGSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<FeedCategory>('all');
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<TelemetryModalType>(null);
  const [selectedFeedItem, setSelectedFeedItem] = useState<UnifiedFeedItem | null>(null);

  const loadData = async (showFeedback = false) => {
    if (showFeedback) setRefreshing(true);
    else setLoading(true);
    try {
      const [commRes, sessRes] = await Promise.all([
        api.communication.list({ limit: 8 }),
        api.sessions.list({ limit: 6 }),
      ]);
      setRecentComm(commRes.items || []);
      setRecentSessions(sessRes.items || []);
      if (showFeedback) {
        toast.success(
          isVi
            ? 'Đã đồng bộ lại toàn bộ dữ liệu từ máy chủ FastAPI & SQLite.'
            : 'Synchronized all telemetry from FastAPI & SQLite.'
        );
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      toast.error(
        isVi
          ? 'Không thể kết nối máy chủ để tải dữ liệu tổng quan.'
          : 'Could not reach server to load overview telemetry.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, []);

  const handleSpeakText = (text: string) => {
    const success = speakVietnamese(text);
    if (success) {
      const viVoice = getVietnameseVoice();
      const voiceInfo = viVoice ? ` [${viVoice.name}]` : '';
      toast.info(isVi ? `Đang phát âm qua loa: "${text}"${voiceInfo}` : `Speaking aloud: "${text}"${voiceInfo}`);
    } else {
      toast.warning(
        isVi ? 'Trình duyệt chưa hỗ trợ Web Speech TTS.' : 'Browser does not support Web Speech TTS.'
      );
    }
  };

  const unifiedFeed = useMemo<UnifiedFeedItem[]>(() => {
    const items: UnifiedFeedItem[] = [];
    const locale = isVi ? 'vi-VN' : 'en-US';

    recentComm.forEach((c) => {
      const isSurvival = c.mode.toLowerCase().includes('survival') || c.mode.includes('F');
      items.push({
        id: `comm-${c.id}`,
        category: isSurvival ? 'survival' : 'comm',
        categoryLabel: isSurvival
          ? isVi
            ? 'Sinh tồn F1–F4'
            : 'Survival F1–F4'
          : isVi
          ? 'Giao tiếp P300'
          : 'P300 Communication',
        title: c.confirmed_text,
        subtitle: isVi
          ? `Chế độ: ${c.mode} • Thời lượng ${c.duration_s}s • Model: ${c.model_version || 'Shrinkage LDA'}`
          : `Mode: ${c.mode} • Duration ${c.duration_s}s • Model: ${c.model_version || 'Shrinkage LDA'}`,
        timestamp: new Date(c.created_at).toLocaleString(locale),
        speakableText: c.confirmed_text,
        actionRoute: isSurvival ? '/app/survival' : '/app/history',
        raw: c,
      });
    });

    recentSessions.forEach((s) => {
      items.push({
        id: `sess-${s.id}`,
        category: 'session',
        categoryLabel: isVi ? 'Phiên thu EEG' : 'EEG Session',
        title: isVi
          ? `Phiên đo #${s.id} — Bệnh nhân ${s.patient_code} (${s.session_type})`
          : `Session #${s.id} — Patient ${s.patient_code} (${s.session_type})`,
        subtitle: isVi
          ? `Nguồn: ${s.mode_badge} • Thời lượng ${s.duration_s}s • Chính xác: ${
              s.accuracy ? `${(s.accuracy * 100).toFixed(1)}%` : 'Held-out Replay'
            }`
          : `Source: ${s.mode_badge} • Duration ${s.duration_s}s • Accuracy: ${
              s.accuracy ? `${(s.accuracy * 100).toFixed(1)}%` : 'Held-out Replay'
            }`,
        timestamp: new Date(s.created_at).toLocaleString(locale),
        actionRoute: '/app/sessions',
        raw: s,
      });
    });

    items.push({
      id: 'sys-lda',
      category: 'system',
      categoryLabel: isVi ? 'Cảnh báo hệ thống' : 'System Advisory',
      title: isVi
        ? 'Kiểm định bộ giải mã Ledoit-Wolf Shrinkage LDA đạt 100% @ 3 Reps (BNCI Session 2)'
        : 'Ledoit-Wolf Shrinkage LDA decoder validated at 100% @ 3 Reps (BNCI Session 2)',
      subtitle: isVi
        ? 'ROC-AUC: 0.8900 • Balanced Accuracy: 80.00% • Tốc độ truyền tin tối đa: 21.77 bits/min'
        : 'ROC-AUC: 0.8900 • Balanced Accuracy: 80.00% • Peak ITR: 21.77 bits/min',
      timestamp: isVi ? 'Chuẩn thực nghiệm' : 'Empirical Benchmark',
      actionRoute: '/app/studio',
    });

    items.push({
      id: 'sys-sos',
      category: 'system',
      categoryLabel: isVi ? 'Cảnh báo hệ thống' : 'System Advisory',
      title: isVi
        ? 'Kích hoạt bộ lọc nhân quả Causal SOS (0.5–30.0 Hz @ 256 Hz) chống rò rỉ tương lai'
        : 'Causal SOS Bandpass Filter active (0.5–30.0 Hz @ 256 Hz, Zero Future Leakage)',
      subtitle: isVi
        ? 'Trạng thái sosfilt_zi được bảo toàn liên tục qua WebSocket chunking (0.041 ms/chunk)'
        : 'Continuous sosfilt_zi state preserved across WebSocket streaming chunks (0.041 ms/chunk)',
      timestamp: isVi ? 'Đang hoạt động' : 'Active Pipeline',
      actionRoute: '/app/studio?tab=monitoring',
    });

    return items;
  }, [recentComm, recentSessions, isVi]);

  const filteredFeed = useMemo(() => {
    if (selectedCategory === 'all') return unifiedFeed;
    return unifiedFeed.filter((item) => item.category === selectedCategory);
  }, [unifiedFeed, selectedCategory]);

  const filterPills: { key: FeedCategory; label: string }[] = [
    { key: 'all', label: isVi ? 'Tất cả' : 'All' },
    { key: 'comm', label: isVi ? 'Giao tiếp P300' : 'P300 Speller' },
    { key: 'survival', label: isVi ? 'Sinh tồn F1–F4' : 'Survival F1–F4' },
    { key: 'session', label: isVi ? 'Phiên thu EEG' : 'EEG Sessions' },
    { key: 'system', label: isVi ? 'Thông báo hệ thống' : 'System Alerts' },
  ];

  const openFeedDetail = (item: UnifiedFeedItem) => {
    setSelectedFeedItem(item);
    setActiveModal('feedDetail');
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 font-sans">
      {/* Page Greeting Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {isVi
              ? `Chào mừng trở lại, ${user?.full_name || 'Chuyên viên'}!`
              : `Welcome back, ${user?.full_name || 'Clinician'}!`}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isVi
              ? 'Bảng điều khiển lâm sàng sáng, đồng bộ thời gian thực với máy chủ FastAPI & bộ giải mã P300.'
              : 'Clinical BCI control center synchronized in real time with FastAPI & Shrinkage LDA P300 decoder.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{isVi ? 'Làm mới số liệu' : 'Refresh Metrics'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/studio')}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 transition-all"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>{isVi ? 'Mở Neuro Studio' : 'Launch Neuro Studio'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. UNIFIED HORIZONTAL PROFILE & TELEMETRY BANNER (6 EQUAL BOXES)      */}
      {/* ===================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-3.5">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-stretch">
          {/* Left Blue Hero Block (Patient Dossier - Clickable!) */}
          <button
            type="button"
            onClick={() => setActiveModal('patient')}
            className="xl:col-span-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl p-4 text-white flex items-center space-x-3.5 shadow-sm transition-all text-left group"
            title={
              isVi
                ? 'Nhấn để xem hồ sơ bệnh nhân & thông số điện cực'
                : 'Click to inspect patient dossier & electrode setup'
            }
          >
            <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                {isVi ? 'Hồ Sơ Bệnh Nhân' : 'Patient Dossier'}
              </div>
              <div className="text-base font-extrabold leading-snug truncate">
                {isVi ? 'Nguyễn Văn A' : 'Patient A (P001)'}
              </div>
              <div className="text-xs text-blue-100 font-mono truncate mt-0.5">
                {isVi ? 'P001 • ALS Lâm sàng' : 'P001 • Clinical ALS'}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-200 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {/* Right 5 Equal Metric Boxes */}
          <div className="xl:col-span-9 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Box 1: EEG Status */}
            <button
              type="button"
              onClick={() => setActiveModal('eeg')}
              className="rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-800/60 hover:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-950/30 p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="truncate">{isVi ? 'Tần số EEG' : 'EEG Sampling'}</span>
              </div>
              <div className="my-1.5 text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                256 Hz
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {isVi ? '16 Kênh • Causal SOS' : '16-Ch • Causal SOS'}
              </div>
            </button>

            {/* Box 2: AI Decoder */}
            <button
              type="button"
              onClick={() => setActiveModal('model')}
              className="rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-800/60 hover:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-950/30 p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <Cpu className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="truncate">{isVi ? 'Bộ giải mã' : 'BCI Decoder'}</span>
              </div>
              <div className="my-1.5 text-base font-extrabold text-blue-600 dark:text-blue-400 truncate">
                Shrinkage LDA
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                0.8900 ROC-AUC
              </div>
            </button>

            {/* Box 3: Communication ITR */}
            <button
              type="button"
              onClick={() => setActiveModal('itr')}
              className="rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-800/60 hover:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-950/30 p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <Zap className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span className="truncate">{isVi ? 'Tốc độ ITR' : 'Transfer Rate'}</span>
              </div>
              <div className="my-1.5 text-lg font-extrabold text-blue-600 dark:text-blue-400 font-mono truncate">
                21.77 <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">bits/m</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                100% @ 3 Reps (14.25s)
              </div>
            </button>

            {/* Box 4: Inference Latency */}
            <button
              type="button"
              onClick={() => setActiveModal('latency')}
              className="rounded-xl border border-slate-200/90 dark:border-slate-700/90 bg-white dark:bg-slate-800/60 hover:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-950/30 p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
                <Clock className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="truncate">{isVi ? 'Độ trễ p50' : 'Median Latency'}</span>
              </div>
              <div className="my-1.5 text-lg font-extrabold text-slate-900 dark:text-white font-mono truncate">
                0.116 ms
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {isVi ? 'Chuẩn Ledoit-Wolf' : 'Ledoit-Wolf Core'}
              </div>
            </button>

            {/* Box 5: Mint Highlighted ERP Peak */}
            <button
              type="button"
              onClick={() => setActiveModal('erp')}
              className="col-span-2 sm:col-span-1 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:border-emerald-400 p-3.5 transition-all flex flex-col justify-between text-left group"
            >
              <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">{isVi ? 'Đỉnh P300 (Pz)' : 'P300 Peak (Pz)'}</span>
              </div>
              <div className="my-1.5 text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                +16.33 µV
              </div>
              <div className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 font-mono truncate">
                {isVi ? 'Độ trễ đỉnh: 320 ms' : 'Peak Latency: 320 ms'}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. BALANCED 2-COLUMN WORKSPACE: FEED & SUBSYSTEMS (8) + QUICK MENU (4)*/}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN (8 Cols) */}
        <div className="lg:col-span-8 space-y-5">
          {/* Card A: Interactive Clinical Feed */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">
                  {isVi ? 'Nhật ký Giao tiếp & Thông báo mới nhất' : 'Recent Clinical Activity & System Feed'}
                </h2>
              </div>

              <Link
                to="/app/history"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200/80 dark:border-slate-700 hover:border-blue-300 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-700 dark:hover:text-blue-400 transition-colors flex-shrink-0"
              >
                <span>{isVi ? 'Xem tất cả' : 'View All'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Interactive Category Pill Bar */}
            <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
                {isVi ? 'Loại tin:' : 'Filter:'}
              </span>
              {filterPills.map((pill) => {
                const isSelected = selectedCategory === pill.key;
                return (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setSelectedCategory(pill.key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#1E3A8A] dark:bg-blue-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>

            {/* Feed Rows List */}
            <div className="p-4 space-y-2.5">
              {loading ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  {isVi ? 'Đang đồng bộ nhật ký lâm sàng...' : 'Synchronizing clinical activity feed...'}
                </div>
              ) : filteredFeed.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                  {isVi ? 'Không có hoạt động nào trong danh mục này.' : 'No entries found in this category.'}
                </div>
              ) : (
                filteredFeed.slice(0, 6).map((item) => {
                  const badgeColor =
                    item.category === 'survival'
                      ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : item.category === 'comm'
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : item.category === 'session'
                      ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                  return (
                    <div
                      key={item.id}
                      onClick={() => openFeedDetail(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openFeedDetail(item);
                      }}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50/90 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-600 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-950/50 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="font-bold text-[13px] text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors truncate">
                            {item.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {item.subtitle}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className={`px-2 py-0.5 rounded-md border font-semibold text-[10px] ${badgeColor}`}>
                              {item.categoryLabel}
                            </span>
                            <span className="inline-flex items-center space-x-1 font-mono text-[10px] text-slate-400">
                              <Calendar className="w-3 h-3" />
                              <span>{item.timestamp}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {item.speakableText && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSpeakText(item.speakableText!);
                            }}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-950/60 text-slate-500 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors"
                            title={isVi ? 'Phát âm câu này qua loa TTS' : 'Speak phrase aloud (TTS)'}
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Card B: 6 Uniform Interactive Clinical Subsystems (Equal 3x2 Grid) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wide">
                  {isVi
                    ? 'Trạng Thái 6 Phân Hệ Lâm Sàng (Nhấn Để Mở / Kiểm Tra)'
                    : '6 Clinical Subsystems Status (Click to Inspect)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => loadData(true)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center space-x-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{isVi ? 'Kiểm tra đồng bộ' : 'Sync Check'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Pillar 1 */}
              <button
                type="button"
                onClick={() => navigate('/app/studio?tab=monitoring')}
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {isVi ? '1. Thu Nhận EEG 16 Kênh' : '1. 16-Ch EEG Acquisition'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                  {isVi
                    ? '256 Hz montage 10-20 (Fz, Cz, Pz...). Nhấn để xem sóng não 16 kênh.'
                    : '256 Hz 10-20 montage (Fz, Cz, Pz...). Click for live waveform view.'}
                </p>
              </button>

              {/* Pillar 2 */}
              <button
                type="button"
                onClick={() => setActiveModal('eeg')}
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {isVi ? '2. Lọc Nhân Quả Causal SOS' : '2. Causal SOS Filtering'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                  {isVi
                    ? 'Bandpass 0.5–30 Hz giữ trạng thái `sosfilt_zi`. Nhấn để xem chi tiết.'
                    : '0.5–30 Hz stateful `sosfilt_zi` filtering. Click for filter parameters.'}
                </p>
              </button>

              {/* Pillar 3 */}
              <button
                type="button"
                onClick={() => setActiveModal('model')}
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {isVi ? '3. Giải Mã Shrinkage LDA' : '3. Shrinkage LDA Decoder'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold">
                    0.89 AUC
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                  {isVi
                    ? 'Hiệp phương sai Ledoit-Wolf siêu tốc 0.116 ms. Nhấn để xem benchmark.'
                    : 'Ledoit-Wolf covariance @ 0.116 ms latency. Click for benchmark table.'}
                </p>
              </button>

              {/* Pillar 4 */}
              <button
                type="button"
                onClick={() => navigate('/app/studio?tab=speller')}
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {isVi ? '4. Bộ Gõ Telex NFC' : '4. Telex NFC Compositor'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold">
                    READY
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                  {isVi
                    ? 'Bỏ dấu tiếng Việt & chuẩn hóa Unicode NFC. Nhấn để mở Bảng Đánh Vần.'
                    : 'Vietnamese diacritic composition & NFC normalization. Open P300 Speller.'}
                </p>
              </button>

              {/* Pillar 5 */}
              <button
                type="button"
                onClick={() => setActiveModal('invariant')}
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {isVi ? '5. Cổng Bất Biến 4 Bước' : '5. 4-Way Safety Gate'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-bold">
                    SAFE GATE
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                  {isVi
                    ? 'Không bao giờ tự ý chốt gợi ý AI. Nhấn để kiểm tra định lý an toàn.'
                    : 'Never auto-commits AI suggestions. Click to inspect safety invariant.'}
                </p>
              </button>

              {/* Pillar 6 */}
              <button
                type="button"
                onClick={() =>
                  handleSpeakText(
                    isVi
                      ? 'Động cơ giọng nói tiếng Việt đang hoạt động bình thường.'
                      : 'Clinical speech synthesis engine is online and verified.'
                  )
                }
                className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 border border-slate-200/80 dark:border-slate-700/80 hover:border-blue-300 text-left space-y-1.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400">
                    {isVi ? '6. Phát Âm Tiếng Việt TTS' : '6. Clinical Web Speech TTS'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold">
                    SYNTHESIS
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">
                  {isVi
                    ? 'Đọc to câu nói đã cam kết qua loa ngoài. Nhấn để phát thử ngay!'
                    : 'Speaks committed phrases aloud. Click to test audio synthesis now.'}
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (4 Cols): Organized Quick Menu */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                {isVi ? 'Menu nhanh' : 'Quick Actions'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isVi ? 'Truy cập nhanh các chức năng thường dùng' : 'One-click clinical workflow shortcuts'}
              </p>
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* Group 1: Clinical & Real-Time Actions */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5 mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span>{isVi ? 'LÂM SÀNG & GIẢI MÃ BCI' : 'CLINICAL & BCI DECODING'}</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/app/studio')}
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/70 hover:border-blue-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      <Brain className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {isVi ? 'Mở Neuro Studio P300' : 'Open P300 Neuro Studio'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/app/survival')}
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 border border-slate-200/60 dark:border-slate-700/70 hover:border-amber-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      <HeartHandshake className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-amber-800 dark:group-hover:text-amber-300">
                      {isVi ? 'Giao tiếp Sinh tồn (F1–F4)' : 'Survival Quick (F1–F4)'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-500" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsCsvModalOpen(true)}
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-teal-50 dark:hover:bg-teal-950/30 border border-slate-200/60 dark:border-slate-700/70 hover:border-teal-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-teal-800 dark:group-hover:text-teal-300">
                      {isVi ? 'Nạp & Giải mã File .CSV' : 'Load & Decode .CSV File'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-500" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/app/studio?tab=monitoring')}
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/70 hover:border-blue-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      <Activity className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {isVi ? 'Theo dõi Sóng não 16 Kênh' : 'Monitor 16-Ch EEG Waveforms'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSpeakText(
                      isVi
                        ? 'Xin chào, đây là kiểm tra giọng nói lâm sàng từ bảng điều khiển NEURO-SPEECH.'
                        : 'Hello, this is a clinical voice check from NEURO-SPEECH Studio.'
                    )
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/70 hover:border-blue-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {isVi ? 'Kiểm tra Phát âm TTS' : 'Test TTS Audio Output'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                </button>
              </div>
            </div>

            {/* Group 2: Data, Records & Account */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5 mb-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{isVi ? 'DỮ LIỆU & HỆ THỐNG' : 'DATA & SYSTEM'}</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/app/history')}
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/70 hover:border-blue-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 group-hover:text-blue-600 shadow-2xs">
                      <History className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {isVi ? 'Lịch sử Giao tiếp & Xuất CSV' : 'Communication History & CSV'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/app/sessions')}
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/70 hover:border-blue-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 group-hover:text-blue-600 shadow-2xs">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {isVi ? 'Kho Phiên Thu EEG (Replay)' : 'EEG Recording Vault (Replay)'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/app/profile')}
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/70 hover:border-blue-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 group-hover:text-blue-600 shadow-2xs">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {isVi ? 'Hồ sơ Chuyên viên' : 'Clinician Profile'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/app/settings')}
                  className="w-full p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/70 hover:border-blue-300 flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 group-hover:text-blue-600 shadow-2xs">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-200 group-hover:text-blue-700 dark:group-hover:text-blue-400">
                      {isVi ? 'Cài đặt Giao diện & Ngôn ngữ' : 'Theme, Language & Audio'}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500" />
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/dashboard')}
                    className="w-full p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
                        <Shield className="w-4 h-4" />
                      </div>
                      <span className="text-[13px] font-bold text-indigo-800 dark:text-indigo-300">
                        {isVi ? 'Bảng Quản Trị (Admin Console)' : 'Admin Governance Console'}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* INTERACTIVE INSPECTOR MODALS                                          */}
      {/* ===================================================================== */}
      {activeModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {activeModal === 'patient' && <Stethoscope className="w-4 h-4" />}
                  {activeModal === 'eeg' && <Radio className="w-4 h-4" />}
                  {activeModal === 'model' && <Cpu className="w-4 h-4" />}
                  {activeModal === 'itr' && <BarChart3 className="w-4 h-4" />}
                  {activeModal === 'latency' && <Clock className="w-4 h-4" />}
                  {activeModal === 'erp' && <Activity className="w-4 h-4" />}
                  {activeModal === 'invariant' && <ShieldCheck className="w-4 h-4" />}
                  {activeModal === 'feedDetail' && <FileText className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {activeModal === 'patient' && (isVi ? 'Hồ Sơ Bệnh Nhân Đang Theo Dõi (P001)' : 'Active Patient Dossier (P001)')}
                  {activeModal === 'eeg' && (isVi ? 'Thông Số Bộ Lọc Nhân Quả & Điện Cực EEG' : 'Causal Filter & EEG Channel Configuration')}
                  {activeModal === 'model' && (isVi ? 'So Sánh Hiệu Năng Giải Mã: Shrinkage LDA vs CNN-Transformer' : 'Decoder Comparison: Shrinkage LDA vs CNN-Transformer')}
                  {activeModal === 'itr' && (isVi ? 'Bảng Tốc Độ Truyền Tin ITR Theo Số Lần Lặp' : 'ITR Transfer Rate vs Repetition Count')}
                  {activeModal === 'latency' && (isVi ? 'Thống Kê Độ Trễ Suy Luận Thực Nghiệm' : 'Empirical Inference Latency Distribution')}
                  {activeModal === 'erp' && (isVi ? 'Phân Tích Đỉnh Điện Thế Gợi P300 (Grand-Average)' : 'P300 Event-Related Potential Analysis')}
                  {activeModal === 'invariant' && (isVi ? 'Nguyên Lý An Toàn 4 Thành Phần Tách Biệt' : '4-Way Clinical Safety Invariant')}
                  {activeModal === 'feedDetail' && (isVi ? 'Chi Tiết Bản Ghi Lâm Sàng' : 'Clinical Record Details')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 text-xs text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
              {activeModal === 'patient' && (
                <>
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        {isVi ? 'Mã Hồ Sơ' : 'Patient ID'}
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white font-mono">P001</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        {isVi ? 'Họ và Tên' : 'Full Name'}
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {isVi ? 'Nguyễn Văn A' : 'Patient A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        {isVi ? 'Chẩn đoán' : 'Diagnosis'}
                      </span>
                      <div className="font-semibold text-blue-700 dark:text-blue-400">
                        {isVi ? 'Xơ cứng teo cơ (ALS)' : 'Amyotrophic Lateral Sclerosis (ALS)'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">
                        {isVi ? 'Dữ liệu hiệu chuẩn' : 'Calibration Dataset'}
                      </span>
                      <div className="font-mono text-slate-700 dark:text-slate-300">BNCI 2014-009 (S2)</div>
                    </div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    {isVi
                      ? 'Hệ thống sử dụng 16 điện cực chuẩn 10–20 với tần số lấy mẫu 256 Hz. Người chăm sóc hoặc bác sĩ có thể kích hoạt trực tiếp bảng đánh vần hoặc chế độ sinh tồn khẩn cấp.'
                      : 'The system acquires 16 standard 10–20 EEG channels at 256 Hz. Clinicians and caregivers can launch the P300 Speller or rapid Survival mode directly.'}
                  </p>
                </>
              )}

              {activeModal === 'eeg' && (
                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span>{isVi ? 'Bộ lọc dải thông:' : 'Bandpass Filter:'}</span>
                    <strong>Causal Butterworth 4th-Order SOS</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? 'Dải tần số:' : 'Passband:'}</span>
                    <strong>0.5 Hz – 30.0 Hz</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? 'Bảo toàn trạng thái:' : 'State Preservation:'}</span>
                    <strong>sosfilt_zi (Zero Future Leakage)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? 'Cửa sổ Baseline:' : 'Baseline Window:'}</span>
                    <strong>[-100 ms, 0 ms]</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? 'Độ trễ lọc / chunk:' : 'Filter Latency / chunk:'}</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">0.041 ms (p50)</strong>
                  </div>
                </div>
              )}

              {activeModal === 'model' && (
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                      <th className="py-1.5">{isVi ? 'Chỉ số (Held-out S2)' : 'Metric (Held-out S2)'}</th>
                      <th className="py-1.5 font-bold text-blue-700 dark:text-blue-400">Shrinkage LDA</th>
                      <th className="py-1.5">CNN-Transformer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    <tr><td className="py-1.5">Flash ROC-AUC</td><td className="font-bold text-blue-700 dark:text-blue-400">0.8900</td><td>0.6321</td></tr>
                    <tr><td className="py-1.5">Balanced Accuracy</td><td className="font-bold text-blue-700 dark:text-blue-400">80.00%</td><td>60.73%</td></tr>
                    <tr><td className="py-1.5">Character Accuracy</td><td className="font-bold text-blue-700 dark:text-blue-400">100% (6/6)</td><td>50% (3/6)</td></tr>
                    <tr><td className="py-1.5">Peak ITR (3 Reps)</td><td className="font-bold text-blue-700 dark:text-blue-400">21.77 bits/m</td><td>8.12 bits/m</td></tr>
                    <tr><td className="py-1.5">Median Latency</td><td className="font-bold text-emerald-600 dark:text-emerald-400">0.116 ms</td><td>1.826 ms</td></tr>
                  </tbody>
                </table>
              )}

              {activeModal === 'itr' && (
                <div className="space-y-2">
                  <p className="text-slate-600 dark:text-slate-400">
                    {isVi
                      ? 'Bảng hiệu năng giải mã ký tự trên tập kiểm định độc lập Held-out Session 2 (6 _ C 4 B 5):'
                      : 'Character decoding throughput on Held-out Session 2 (6 _ C 4 B 5):'}
                  </p>
                  <table className="w-full text-left border-collapse text-[11px] font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                        <th className="py-1">Reps</th>
                        <th className="py-1">{isVi ? 'Đúng' : 'Correct'}</th>
                        <th className="py-1">{isVi ? 'Thời gian' : 'Time'}</th>
                        <th className="py-1">ITR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr><td className="py-1">1 Rep</td><td>4/6 (66.7%)</td><td>8.25s</td><td>18.49 bits/m</td></tr>
                      <tr><td className="py-1">2 Reps</td><td>5/6 (83.3%)</td><td>11.25s</td><td>19.55 bits/m</td></tr>
                      <tr className="bg-blue-50 dark:bg-blue-950/50 font-bold text-blue-800 dark:text-blue-300">
                        <td className="py-1">{isVi ? '3 Reps (Tối ưu)' : '3 Reps (Optimal)'}</td><td>6/6 (100%)</td><td>14.25s</td><td>21.77 bits/m</td>
                      </tr>
                      <tr><td className="py-1">5 Reps</td><td>6/6 (100%)</td><td>20.25s</td><td>15.32 bits/m</td></tr>
                      <tr><td className="py-1">8 Reps</td><td>6/6 (100%)</td><td>29.25s</td><td>10.60 bits/m</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeModal === 'latency' && (
                <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700 font-mono text-[11px]">
                  <div className="flex justify-between"><span>{isVi ? 'Độ trễ trung vị (p50):' : 'Median Latency (p50):'}</span><strong className="text-blue-600 dark:text-blue-400">0.116 ms</strong></div>
                  <div className="flex justify-between"><span>{isVi ? 'Phân vị 95 (p95):' : '95th Percentile:'}</span><strong>0.170 ms</strong></div>
                  <div className="flex justify-between"><span>{isVi ? 'Phân vị 99 (p99):' : '99th Percentile:'}</span><strong>0.222 ms</strong></div>
                  <div className="flex justify-between"><span>{isVi ? 'Số trọng số mô hình:' : 'Model Parameters:'}</span><strong>240 weights (Ledoit-Wolf)</strong></div>
                  <div className="flex justify-between"><span>{isVi ? 'Giới hạn thời gian thực:' : 'Real-Time Budget:'}</span><strong className="text-emerald-600 dark:text-emerald-400">&lt; 5.0 ms (PASS)</strong></div>
                </div>
              )}

              {activeModal === 'erp' && (
                <div className="space-y-2 bg-emerald-50/50 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 font-mono text-[11px]">
                  <div className="flex justify-between"><span>{isVi ? 'Điện cực khảo sát:' : 'Target Electrode:'}</span><strong>Pz (Parietal Midline)</strong></div>
                  <div className="flex justify-between"><span>{isVi ? 'Số Epoch mục tiêu (Target):' : 'Target Epochs:'}</span><strong>N = 192 flashes</strong></div>
                  <div className="flex justify-between"><span>{isVi ? 'Đỉnh điện thế P300 Target:' : 'Target P300 Peak:'}</span><strong className="text-emerald-700 dark:text-emerald-400">+16.33 µV @ 320 ms</strong></div>
                  <div className="flex justify-between"><span>{isVi ? 'Trung bình Non-Target (N=960):' : 'Non-Target Mean (N=960):'}</span><strong>-0.42 µV</strong></div>
                  <div className="flex justify-between"><span>{isVi ? 'Chênh lệch biên độ (Contrast):' : 'Amplitude Contrast:'}</span><strong className="text-emerald-700 dark:text-emerald-400">+16.75 µV</strong></div>
                </div>
              )}

              {activeModal === 'invariant' && (
                <div className="space-y-2.5 text-slate-700 dark:text-slate-300">
                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 font-mono text-[11px] text-blue-900 dark:text-blue-200">
                    Ground Truth (a) ➔ Predicted (b) ➔ Suggested (c) ➔ [User ACCEPT] ➔ Confirmed (d)
                  </div>
                  <p>
                    {isVi
                      ? 'Hệ thống đã được kiểm chứng qua Hypothesis Property-Based Fuzzing: gợi ý từ từ điển/AI không bao giờ tự động ghi vào câu phát ngôn của bệnh nhân nếu thiếu sự xác nhận chủ động từ người dùng.'
                      : 'Verified via Hypothesis property-based fuzzing: AI/lexicon suggestions are never auto-committed to the confirmed clinical transcript without explicit user acceptance.'}
                  </p>
                </div>
              )}

              {activeModal === 'feedDetail' && selectedFeedItem && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                      {selectedFeedItem.categoryLabel}
                    </span>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {selectedFeedItem.title}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">{selectedFeedItem.subtitle}</div>
                    <div className="text-[11px] font-mono text-slate-400 pt-1">
                      {isVi ? 'Thời gian:' : 'Timestamp:'} {selectedFeedItem.timestamp}
                    </div>
                  </div>
                  {selectedFeedItem.speakableText && (
                    <button
                      type="button"
                      onClick={() => handleSpeakText(selectedFeedItem.speakableText!)}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>{isVi ? 'Phát Âm Nội Dung Này (TTS)' : 'Speak Phrase Aloud (TTS)'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                {isVi ? 'Đóng' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const target =
                    activeModal === 'feedDetail' && selectedFeedItem?.actionRoute
                      ? selectedFeedItem.actionRoute
                      : '/app/studio';
                  setActiveModal(null);
                  navigate(target);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5"
              >
                <span>{isVi ? 'Mở Không Gian Thực Hành' : 'Open Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instant CSV Decoder Modal Triggered Directly from Dashboard */}
      <CsvDecoderModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onInjectText={(text) => {
          toast.success(
            isVi
              ? `Đã giải mã tệp CSV thành công: "${text}". Chuyển vào Studio...`
              : `CSV decoded successfully: "${text}". Opening Studio...`
          );
          setIsCsvModalOpen(false);
          navigate('/app/studio?tab=speller');
        }}
      />
    </div>
  );
};
