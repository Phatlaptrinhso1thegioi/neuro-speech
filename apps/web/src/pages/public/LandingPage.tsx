/**
 * apps/web/src/pages/public/LandingPage.tsx
 * High-End Cyber-Robotics & Neurotechnology Landing Page for NEURO-SPEECH (M6).
 *
 * Features:
 * 1. Fixed floating capsule navigation bar with interactive VI / EN language switcher.
 * 2. Hero: Bright, natural looping background video with fixed lower-left text placement.
 * 3. Body: Pristine high-tech light/white theme (bg-white / bg-slate-50) with dark slate text.
 * 4. Footer: Deep industrial pure black (bg-black).
 * 5. Full bilingual Vietnamese / English responsiveness.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicNav } from '../../components/public/PublicNav';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Brain3DViewer } from '../../components/Brain3DViewer';
import { useLanguage } from '../../hooks/useLanguage';
import {
  Brain,
  Activity,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
  Volume2,
  Layers,
  Clock,
  Radio,
  Check,
  ChevronDown,
  Play,
  Pause,
} from 'lucide-react';

const MATRIX_6X6_CHARS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9', '_'],
];

export const LandingPage: React.FC = () => {
  const [previewTab, setPreviewTab] = useState<'speller' | '3d'>('speller');
  const { language } = useLanguage();

  // P300 Oddball Speller Interactive Simulation State
  const [isMatrixFlashing, setIsMatrixFlashing] = useState<boolean>(true);
  const [targetChar, setTargetChar] = useState<string>('B');
  const [currentGroup, setCurrentGroup] = useState<number | null>(1); // 0..5: rows 0..5; 6..11: cols 0..5; null: ISI
  const [flashPhase, setFlashPhase] = useState<'flash' | 'isi'>('flash');
  const [epochCount, setEpochCount] = useState<number>(1);
  const [stimulusIndex, setStimulusIndex] = useState<number>(0);

  // Farwell-Donchin randomized stimulus groups (6 rows: 0..5, 6 columns: 6..11)
  const STIMULUS_GROUPS = [1, 7, 3, 0, 8, 10, 4, 6, 2, 9, 5, 11];

  // Map target character to (row, col)
  const targetCoords = React.useMemo(() => {
    for (let r = 0; r < MATRIX_6X6_CHARS.length; r++) {
      for (let c = 0; c < MATRIX_6X6_CHARS[r].length; c++) {
        if (MATRIX_6X6_CHARS[r][c] === targetChar) {
          return { r, c };
        }
      }
    }
    return { r: 0, c: 1 }; // Default 'B'
  }, [targetChar]);

  // Is target hit during the active flash?
  const isTargetHit = React.useMemo(() => {
    if (currentGroup === null || flashPhase !== 'flash') return false;
    if (currentGroup < 6) {
      return targetCoords.r === currentGroup;
    } else {
      return targetCoords.c === (currentGroup - 6);
    }
  }, [currentGroup, flashPhase, targetCoords]);

  // Timer effect: 125ms flash, 125ms ISI (SOA = 250ms, 4 Hz)
  useEffect(() => {
    if (!isMatrixFlashing || previewTab !== 'speller') {
      return;
    }

    const interval = setInterval(() => {
      setFlashPhase((prevPhase) => {
        if (prevPhase === 'flash') {
          // Transition from flash -> ISI blank
          setCurrentGroup(null);
          return 'isi';
        } else {
          // Transition from ISI -> next flash
          setStimulusIndex((prevIdx) => {
            const nextIdx = (prevIdx + 1) % STIMULUS_GROUPS.length;
            if (nextIdx === 0) {
              setEpochCount((e) => (e >= 15 ? 1 : e + 1));
            }
            setCurrentGroup(STIMULUS_GROUPS[nextIdx]);
            return nextIdx;
          });
          return 'flash';
        }
      });
    }, 125);

    return () => clearInterval(interval);
  }, [isMatrixFlashing, previewTab]);

  const getFlashStatusText = () => {
    if (!isMatrixFlashing) {
      return language === 'vi' ? 'Tạm dừng nhấp nháy' : 'Simulation Paused';
    }
    if (currentGroup === null) {
      return language === 'vi' ? 'Nghỉ giữa xung (ISI 125ms)' : 'ISI Gap (125ms)';
    }
    if (isTargetHit) {
      return language === 'vi'
        ? `🎯 ERP P300 Đỉnh: [${targetChar}] (+16.33 µV)`
        : `🎯 P300 Peak: [${targetChar}] (+16.33 µV)`;
    }
    if (currentGroup < 6) {
      return language === 'vi'
        ? `Đang kích thích: Hàng ${currentGroup + 1} / 6`
        : `Stimulus: Row ${currentGroup + 1} / 6`;
    }
    return language === 'vi'
      ? `Đang kích thích: Cột ${currentGroup - 5} / 6`
      : `Stimulus: Column ${currentGroup - 5} / 6`;
  };

  const pipelineSteps = language === 'vi' ? [
    { num: '01', title: 'Thu nhận EEG 16 Kênh', desc: 'Ghi nhận tín hiệu điện não 256 Hz từ các vị trí chuẩn 10-20 (Fz, Cz, Pz, Oz, P3, P4...).' },
    { num: '02', title: 'Lọc Causal SOS 0.1–20 Hz', desc: 'Bộ lọc IIR nhân quả mang trạng thái (sosfilt_zi), không rò rỉ mẫu tương lai và không có độ trễ pha acausal.' },
    { num: '03', title: 'Trích xuất Epoch Khóa Kích thích', desc: 'Cắt cửa sổ -100ms đến +800ms theo từng flash hàng/cột, hiệu chỉnh baseline tiền kích thích.' },
    { num: '04', title: 'Giải mã Shrinkage LDA', desc: 'Ước lượng ma trận hiệp phương sai tối ưu Ledoit-Wolf, phân loại oddball P300 trong 0.119 ms.' },
    { num: '05', title: 'Bộ đệm Telex Tiếng Việt', desc: 'Xử lý gõ Telex quy chuẩn dấu truyền thống (hòa/hóa), hoàn nguyên modifier undo, chuẩn hóa NFC.' },
    { num: '06', title: 'Gợi ý Từ Ngữ Offline + Bigram', desc: 'Từ điển 4,000+ từ và xác suất chuyển tiếp bigram tăng tốc gõ phím mà không cần mạng Internet.' },
    { num: '07', title: 'Cổng Xác nhận Rõ ràng', desc: 'Nguyên tắc bất di bất dịch: Từ gợi ý AI không bao giờ tự ý ghi nhận nếu người dùng chưa chọn ACCEPT.' },
    { num: '08', title: 'Tổng hợp Giọng nói TTS', desc: 'Chỉ phát âm qua loa văn bản đã được người bệnh cam kết xác nhận bằng giọng đọc tiếng Việt.' },
  ] : [
    { num: '01', title: '16-Channel EEG Acquisition', desc: 'Records 256 Hz brain signals from international 10-20 montage (Fz, Cz, Pz, Oz, P3, P4...).' },
    { num: '02', title: 'Causal SOS 0.1–20 Hz Filter', desc: 'Stateful causal IIR filter (sosfilt_zi) preventing future data leakage and zero-phase delay.' },
    { num: '03', title: 'Stimulus-Locked Epochs', desc: 'Windows -100ms to +800ms per row/column flash with pre-stimulus baseline correction.' },
    { num: '04', title: 'Shrinkage LDA Decoder', desc: 'Optimal Ledoit-Wolf covariance estimation classifying P300 oddball in 0.119 ms.' },
    { num: '05', title: 'Vietnamese Telex Buffer', desc: 'Standard Telex engine with traditional tone marks, modifier undo, and NFC normalization.' },
    { num: '06', title: 'Offline Bigram Suggestions', desc: '4,000+ word dictionary and transition probabilities boosting typing without internet.' },
    { num: '07', title: 'Explicit Confirmation Gate', desc: 'Strict safety principle: AI predictions are never committed without user ACCEPT action.' },
    { num: '08', title: 'TTS Speech Synthesis', desc: 'Speaks confirmed text aloud using high-fidelity natural speech synthesis.' },
  ];

  const stats = language === 'vi' ? [
    { value: '256 Hz', label: 'Tần số lấy mẫu EEG', desc: 'Ghi nhận 16 kênh theo chuẩn quốc tế 10-20' },
    { value: '0.89', label: 'Chỉ số ROC-AUC', desc: 'Kiểm định trên tập kiểm thử độc lập (Held-out)' },
    { value: '21.8 bits/phút', label: 'Tốc độ truyền tin ITR', desc: 'Đo theo chuẩn Wolpaw cho BCI P300' },
    { value: '16 Kênh', label: 'Điện cực Bề mặt', desc: 'Gắn ngoài da đầu không xâm lấn (Fz, Cz, Pz, Oz...)' },
  ] : [
    { value: '256 Hz', label: 'EEG Sampling Rate', desc: 'Synchronized 16-channel 10-20 montage' },
    { value: '0.89', label: 'Test ROC-AUC', desc: 'Evaluated on strictly held-out test split' },
    { value: '21.8 bits/min', label: 'Information Bitrate (ITR)', desc: 'Wolpaw definition for P300 oddball BCI' },
    { value: '16 Ch.', label: 'Surface Electrodes', desc: 'Non-invasive scalp montage (Fz, Cz, Pz, Oz...)' },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-800 relative">
      {/* Sticky / Fixed Capsule Navigation Bar (Follows scroll & stays pinned) */}
      <PublicNav floating={true} />

      {/* ========================================================================= */}
      {/* 1. HERO SECTION: Full-Screen Bright Video with Centered Typography        */}
      {/* ========================================================================= */}
      <section className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden py-24 sm:py-32">
        {/* Full-bleed Bright Video Background (No dark filters, vivid & clear) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/landing_hero_bg.mp4" type="video/mp4" />
          </video>

          {/* Balanced cinematic vignette keeping the video bright while enhancing centered text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/80 pointer-events-none" />
          <div className="absolute inset-0 bg-black/15 pointer-events-none" />
        </div>

        {/* Centered Hero Content with ample spacing */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-10 lg:px-12 text-center flex flex-col items-center">
          <div className="max-w-4xl flex flex-col items-center space-y-6">
            {/* Minimalist Centered Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/20 text-cyan-300 text-xs font-mono backdrop-blur-md shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="tracking-wider uppercase">Cognitive BCI & Neural Speech • v2.1</span>
            </div>

            {/* Main Title - Centered & Crisp with drop shadow */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[1.12] text-balance drop-shadow-[0_4px_20px_rgba(0,0,0,0.85)] max-w-4xl mx-auto">
              {language === 'vi' ? (
                <>
                  Giao tiếp Tiếng Việt qua <br />
                  <span className="font-semibold text-white">Tín hiệu Sóng não P300</span>
                </>
              ) : (
                <>
                  Assistive Vietnamese Speech via <br />
                  <span className="font-semibold text-white">P300 Brainwave Signals</span>
                </>
              )}
            </h1>

            {/* Subtitle - Centered */}
            <p className="text-base sm:text-xl text-white/90 font-light max-w-2xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {language === 'vi'
                ? 'Kỷ nguyên mới phục hồi tiếng nói cho người bệnh ALS & hội chứng khóa trong.'
                : 'A new era of communication restoration for patients with ALS & locked-in syndrome.'}
            </p>

            {/* Centered Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/register"
                className="group px-8 py-3.5 rounded-full bg-cyan-400 hover:bg-cyan-300 text-gray-950 font-black text-sm tracking-wide shadow-xl shadow-cyan-400/25 flex items-center space-x-2.5 transition-all duration-200 active:scale-95"
              >
                <span>{language === 'vi' ? 'Bắt đầu Trải nghiệm' : 'Start Experience'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/technology"
                className="px-8 py-3.5 rounded-full border border-white/30 hover:border-white bg-black/50 hover:bg-black/70 text-white font-medium text-sm backdrop-blur-md transition-all duration-200 flex items-center space-x-2 shadow-lg"
              >
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>{language === 'vi' ? 'Tìm hiểu Công nghệ' : 'Explore Technology'}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Centered Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center space-y-1 text-xs font-mono text-white/80 drop-shadow-md animate-bounce pointer-events-none">
          <span>{language === 'vi' ? 'Cuộn xuống' : 'Scroll down'}</span>
          <ChevronDown className="w-4 h-4 text-cyan-400" />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. STATS STRIP: Clean White High-Impact Metrics Bar                      */}
      {/* ========================================================================= */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-cyan-500/50 hover:bg-white transition-all duration-300 group hover:-translate-y-1 shadow-sm hover:shadow-md"
              >
                <div className="font-mono text-3xl sm:text-4xl font-black text-slate-900 group-hover:text-cyan-600 transition-colors">
                  {s.value}
                </div>
                <div className="mt-2 text-sm font-bold text-slate-800">
                  {s.label}
                </div>
                <div className="mt-1 text-xs text-slate-500 font-normal">
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SHOWCASE: 3D Hologram & P300 Oddball Matrix               */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <span className="text-xs font-mono font-bold text-cyan-600 uppercase tracking-widest">
              {language === 'vi' ? 'Trải Nghiệm Tương Tác Trực Tiếp' : 'Interactive Live Demonstration'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {language === 'vi' ? 'Mô Phỏng Phòng Lab BCI & Ma Trận P300' : 'BCI Lab Simulation & P300 Matrix'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {language === 'vi'
                ? 'Trực quan hóa hoạt động điện thế gợi P300 và mô phỏng đánh vần Telex tiếng Việt theo thời gian thực.'
                : 'Real-time visualization of P300 ERP potentials and Vietnamese Telex speller matrix.'}
            </p>
          </div>

          {/* High-Tech Dark Console Card Framed Elegantly in the Light Section */}
          <div className="max-w-6xl mx-auto rounded-3xl border border-slate-800 bg-[#070D18] text-gray-100 shadow-2xl overflow-hidden">
            {/* Showcase Header Toolbar */}
            <div className="px-5 py-4 bg-gray-950 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
                <span className="ml-2 font-mono text-gray-300 hidden sm:inline tracking-wider">
                  neuro-speech://held-out-replay/session-2
                </span>
              </div>

              {/* Segmented Switcher */}
              <div className="flex bg-[#0A1322] border border-white/10 rounded-full p-1 text-xs font-mono">
                <button
                  onClick={() => setPreviewTab('speller')}
                  className={`px-4 py-1.5 rounded-full transition-all flex items-center space-x-2 ${
                    previewTab === 'speller'
                      ? 'bg-cyan-500 text-gray-950 font-black shadow-md shadow-cyan-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Ma Trận & Chỉ Số Thực' : 'Matrix & Telemetry'}</span>
                </button>
                <button
                  onClick={() => setPreviewTab('3d')}
                  className={`px-4 py-1.5 rounded-full transition-all flex items-center space-x-2 ${
                    previewTab === '3d'
                      ? 'bg-cyan-500 text-gray-950 font-black shadow-md shadow-cyan-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Brain className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Mô Hình Não Bộ 3D (Hologram)' : '3D Brain Hologram'}</span>
                </button>
              </div>

              <div className="hidden lg:flex items-center space-x-3 font-mono text-[11px]">
                <span className="text-cyan-400 font-bold bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/40">
                  REAL DATASET REPLAY
                </span>
                <span>SOA: 250 ms</span>
                <span>ITR: 21.77 bits/min</span>
              </div>
            </div>

            {/* Tab 1: P300 Oddball Matrix Preview */}
            {previewTab === 'speller' ? (
              <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* Matrix Control Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-200 tracking-wide text-sm">
                        {language === 'vi' ? 'Ma trận Đánh vần 6×6 (P300 Oddball Speller)' : '6×6 P300 Oddball Speller Matrix'}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold flex items-center space-x-1">
                        <span>{language === 'vi' ? 'Mục tiêu:' : 'Target:'}</span>
                        <strong className="text-white text-xs underline decoration-cyan-400 decoration-2">{targetChar}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Play/Pause Button */}
                      <button
                        type="button"
                        onClick={() => setIsMatrixFlashing(!isMatrixFlashing)}
                        className="px-2.5 py-1 rounded-lg bg-gray-900 border border-white/10 hover:border-cyan-500/50 hover:bg-gray-800 text-gray-200 text-xs font-mono flex items-center space-x-1.5 transition-all shadow-sm"
                        title={isMatrixFlashing ? 'Tạm dừng nhấp nháy' : 'Tiếp tục nhấp nháy'}
                      >
                        {isMatrixFlashing ? (
                          <>
                            <Pause className="w-3.5 h-3.5 text-amber-400" />
                            <span>{language === 'vi' ? 'Tạm dừng' : 'Pause'}</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{language === 'vi' ? 'Tiếp tục' : 'Resume'}</span>
                          </>
                        )}
                      </button>

                      {/* Live Flashing Status Badge */}
                      <span
                        className={`font-mono text-[11px] flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border transition-colors ${
                          !isMatrixFlashing
                            ? 'text-gray-400 bg-gray-900/60 border-white/5'
                            : isTargetHit
                            ? 'text-emerald-300 bg-emerald-950/70 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)] font-bold'
                            : currentGroup !== null
                            ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/40'
                            : 'text-gray-400 bg-gray-900/40 border-white/5'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full inline-block ${
                            !isMatrixFlashing
                              ? 'bg-gray-500'
                              : isTargetHit
                              ? 'bg-emerald-400 animate-ping'
                              : currentGroup !== null
                              ? 'bg-cyan-400 animate-pulse'
                              : 'bg-gray-600'
                          }`}
                        />
                        <span>{getFlashStatusText()}</span>
                      </span>
                    </div>
                  </div>

                  {/* 6x6 Dynamic Flashing Grid */}
                  <div className="grid grid-cols-6 gap-2 sm:gap-2.5 bg-[#040812] p-4 sm:p-5 rounded-2xl border border-white/10 font-mono font-bold text-center text-sm sm:text-base select-none">
                    {MATRIX_6X6_CHARS.map((row, rIdx) =>
                      row.map((char, cIdx) => {
                        const isFlashingInRow = currentGroup !== null && currentGroup < 6 && currentGroup === rIdx;
                        const isFlashingInCol = currentGroup !== null && currentGroup >= 6 && (currentGroup - 6) === cIdx;
                        const isCellFlashing = isFlashingInRow || isFlashingInCol;
                        const isTarget = rIdx === targetCoords.r && cIdx === targetCoords.c;

                        let cellClass = 'bg-gray-900/40 text-gray-300 border-white/5 hover:border-cyan-400/50 hover:bg-gray-800/60';

                        if (isCellFlashing) {
                          if (isTarget) {
                            // Target Hit (Oddball ERP stimulus)
                            cellClass = 'bg-white text-slate-950 font-black scale-110 shadow-[0_0_28px_rgba(34,211,238,0.95)] ring-4 ring-cyan-300 z-10';
                          } else {
                            // Non-target stimulus flash
                            cellClass = 'bg-cyan-400 text-slate-950 font-black scale-105 shadow-[0_0_16px_rgba(34,211,238,0.7)]';
                          }
                        } else if (isTarget) {
                          // Target character waiting for stimulus
                          cellClass = 'bg-cyan-950/50 text-cyan-200 border-cyan-400/80 ring-2 ring-cyan-400/30 font-extrabold shadow-[inset_0_0_12px_rgba(34,211,238,0.25)]';
                        }

                        return (
                          <button
                            key={`${rIdx}-${cIdx}-${char}`}
                            type="button"
                            onClick={() => setTargetChar(char)}
                            title={
                              language === 'vi'
                                ? `Ký tự: ${char} (Hàng ${rIdx + 1}, Cột ${cIdx + 1}) - Nhấp để chọn làm mục tiêu P300`
                                : `Char: ${char} (Row ${rIdx + 1}, Col ${cIdx + 1}) - Click to set P300 target`
                            }
                            className={`relative py-3 sm:py-3.5 rounded-xl border transition-all duration-75 flex items-center justify-center cursor-pointer ${cellClass}`}
                          >
                            <span>{char}</span>
                            {isTarget && (
                              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Interactive Hint & Rate Indicator */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-mono text-gray-400">
                    <span className="flex items-center space-x-1.5 text-cyan-400/90">
                      <span>✦</span>
                      <span>
                        {language === 'vi'
                          ? 'Mẹo: Nhấp vào bất kỳ ký tự nào trong ma trận để chuyển mục tiêu tập trung P300.'
                          : 'Tip: Click any character in the matrix to redirect P300 focus target.'}
                      </span>
                    </span>
                    <span className="text-gray-400">
                      {language === 'vi' ? 'Chu kỳ kích thích:' : 'Flash rate:'} <strong className="text-gray-300">4.0 Hz</strong> (Flash 125ms / ISI 125ms)
                    </span>
                  </div>

                  {/* Telex Buffer Display */}
                  <div className="flex items-center justify-between p-3.5 bg-gray-950/80 rounded-xl border border-white/10 font-mono text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 uppercase font-bold text-[10px]">
                        {language === 'vi' ? 'Buffer Telex:' : 'Telex Buffer:'}
                      </span>
                      <span className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                        XIN CHÀO
                      </span>
                      <span className="text-gray-400 text-[11px]">(Raw: X I N _ C H A O F)</span>
                    </div>
                    <span className="text-emerald-400 text-[11px] font-semibold flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Đã chuẩn hóa NFC' : 'NFC Normalized'}</span>
                    </span>
                  </div>
                </div>

                {/* Right Side: Live Telemetry Card */}
                <div className="space-y-4 bg-gray-950/70 p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>{language === 'vi' ? 'Chỉ số Đo lường Thực' : 'Live Decoding Metrics'}</span>
                    </h4>
                    <div className="space-y-2.5 font-mono text-xs">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-400">{language === 'vi' ? 'Ký tự Mục tiêu:' : 'Target Character:'}</span>
                        <span className="text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                          {targetChar} (H{targetCoords.r + 1} : C{targetCoords.c + 1})
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-400">{language === 'vi' ? 'Điện thế gợi P300 (Pz):' : 'P300 ERP Potential (Pz):'}</span>
                        {isTargetHit ? (
                          <span className="text-emerald-400 font-black animate-pulse">+16.33 µV [ODDBALL HIT]</span>
                        ) : currentGroup !== null ? (
                          <span className="text-slate-400 font-medium">-0.42 µV [Standard]</span>
                        ) : (
                          <span className="text-slate-500 font-medium">0.00 µV [Baseline]</span>
                        )}
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-400">{language === 'vi' ? 'Vòng lặp (Epoch):' : 'Stimulus Epoch:'}</span>
                        <span className="text-cyan-400 font-bold">#{epochCount} / 15</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-400">{language === 'vi' ? 'Mô hình:' : 'Model:'}</span>
                        <span className="text-cyan-300 font-bold">Shrinkage LDA</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-400">{language === 'vi' ? 'ROC-AUC Test:' : 'Test ROC-AUC:'}</span>
                        <span className="text-emerald-400 font-black">0.8900</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-400">{language === 'vi' ? 'Độ chính xác Cân bằng:' : 'Balanced Accuracy:'}</span>
                        <span className="text-emerald-400 font-black">80.00% (Flash Test)</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-400">{language === 'vi' ? 'Độ trễ suy luận (p50):' : 'Inference Latency:'}</span>
                        <span className="text-cyan-400 font-bold">0.116 ms</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span className="text-gray-400">{language === 'vi' ? 'Độ trễ lọc (chunk):' : 'Filter Latency:'}</span>
                        <span className="text-cyan-400 font-bold">0.041 ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{language === 'vi' ? 'Tỷ lệ truyền tin ITR:' : 'ITR Bitrate:'}</span>
                        <span className="text-amber-400 font-bold">21.77 bits/min</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-xl p-3.5 text-xs text-cyan-200 space-y-1.5">
                    <div className="font-bold text-cyan-300 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      <span>{language === 'vi' ? 'Xác nhận 4 Thành phần Tách biệt:' : '4-Component Decoupled Invariant:'}</span>
                    </div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Ground Truth (a) ➔ Predicted (b) ➔ Suggested (c) ➔ Confirmed (d)
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Tab 2: 3D Hologram Brain Viewer with Clinical Panel */
              <div className="p-4 sm:p-6 bg-[#040812]">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-3">
                    <Brain3DViewer className="border border-white/10 rounded-2xl shadow-none" />
                  </div>

                  <div className="bg-gray-950/80 p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div className="flex items-center space-x-2">
                          <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                          <span className="font-bold text-sm text-white">
                            {language === 'vi' ? 'Chẩn Đoán BCI' : 'BCI Diagnostics'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-bold">
                          ONLINE
                        </span>
                      </div>

                      <div className="bg-[#0A1322] p-3.5 rounded-xl border border-cyan-500/30 space-y-1">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                          {language === 'vi' ? 'Kết luận AI:' : 'AI Conclusion:'}
                        </span>
                        <div className="text-sm font-black text-white">
                          P300 ERP Đỉnh Nhọn (+16.33 µV)
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {language === 'vi'
                            ? 'Phản ứng kích thích thị giác đồng bộ tại điện cực đỉnh Pz & chẩm Oz.'
                            : 'Synchronized visual evoked response at parietal Pz & occipital Oz.'}
                        </p>
                      </div>

                      <div className="space-y-2.5 font-mono text-xs">
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-gray-400">{language === 'vi' ? 'Chỉ số ROC-AUC:' : 'ROC-AUC Metric:'}</span>
                          <span className="text-emerald-400 font-bold">0.8900 (Held-out)</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-gray-400">{language === 'vi' ? 'Vị trí đáp ứng chính:' : 'Primary ROI:'}</span>
                          <span className="text-white font-semibold">Parietal Midline (Pz)</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-gray-400">{language === 'vi' ? 'Độ trễ đỉnh P300:' : 'P300 Peak Latency:'}</span>
                          <span className="text-amber-400 font-bold">~320 ms</span>
                        </div>
                        <div className="flex justify-between border-b border-white/5 pb-1.5">
                          <span className="text-gray-400">{language === 'vi' ? 'Bộ lọc Causal SOS:' : 'Causal SOS Filter:'}</span>
                          <span className="text-cyan-400 font-bold">0.1 - 20.0 Hz</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">{language === 'vi' ? 'Quy chuẩn Đạo trình:' : 'Electrode Montage:'}</span>
                          <span className="text-gray-300">10-20 Standard</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to="/app/dashboard"
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs tracking-wide text-center transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>{language === 'vi' ? 'Mở Phòng Lab Neuro Studio' : 'Open Neuro Studio Lab'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PROBLEM & MISSION: Light Modern Crisp Aesthetic                       */}
      {/* ========================================================================= */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-mono font-bold text-cyan-600 uppercase tracking-widest">
              {language === 'vi' ? 'Sứ Mệnh Nhân Văn' : 'Humanitarian Mission'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {language === 'vi' ? 'Rào cản Giao tiếp & Sứ mệnh Trợ giúp' : 'Communication Barriers & Our Mission'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {language === 'vi'
                ? 'Những bệnh nhân mất khả năng vận động và giọng nói cần một kênh kết nối trung thực, tức thời và an toàn với thế giới xung quanh.'
                : 'Paralyzed and non-verbal patients require an honest, instantaneous, and safe communication channel to the world.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-red-400 hover:shadow-lg transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'vi' ? 'Hội chứng Khóa trong & Liệt cơ Toàn thân' : 'Locked-in Syndrome & Full Paralysis'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {language === 'vi'
                  ? 'Khi mọi đường dẫn truyền vận động bị tổn thương sau đột quỵ hoặc bệnh lý xơ cứng teo cơ bên (ALS), các cơ quan phát âm và bàn tay không thể vận động, nhưng não bộ vẫn nhận thức hoàn toàn minh mẫn.'
                  : 'When motor pathways are severed by stroke or ALS, speech organs and limbs cannot move, but cognitive abilities and visual processing remain fully intact.'}
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-cyan-500 hover:shadow-lg transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700 mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'vi' ? 'Đáp ứng Điện thế Khóa Kích thích (P300)' : 'Stimulus-Locked P300 ERP Response'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {language === 'vi'
                  ? 'Não bộ tự nhiên phát sinh một xung điện thế dương rõ rệt (P300, biên độ ~16 µV) tại vùng vỏ não đính Pz sau 300 ms khi người dùng tập trung ánh nhìn vào một ký tự mục tiêu trong luồng nhấp nháy ngẫu nhiên.'
                  : 'The brain naturally elicits a positive potential peak (P300, ~16 µV) at parietal electrode Pz around 300 ms whenever the user focuses visual attention on a target item.'}
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-blue-500 hover:shadow-lg transition-all duration-300 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 mb-4">
                <Volume2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'vi' ? 'Tiếng nói Tự chủ & Xác nhận Rõ ràng' : 'Autonomous Voice & Explicit Commit'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {language === 'vi'
                  ? 'NEURO-SPEECH kết hợp bộ giải mã điện não với ngữ pháp tiếng Việt Telex và bộ gợi ý từ offline. Người bệnh toàn quyền kiểm soát, xác nhận trước khi tổng hợp thành giọng nói rõ ràng.'
                  : 'NEURO-SPEECH combines neural decoders with Vietnamese Telex grammar and offline suggestions. The patient retains full autonomy, confirming every word before it is spoken.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CLOSED-LOOP PIPELINE: 8 Processing Steps                              */}
      {/* ========================================================================= */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-mono font-bold text-cyan-600 uppercase tracking-widest">
              {language === 'vi' ? 'Kiến Trúc Khép Kín' : 'Closed-Loop Architecture'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {language === 'vi' ? 'Quy trình Xử lý Tín hiệu & Ngôn ngữ' : 'Signal Processing & Language Pipeline'}
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              {language === 'vi'
                ? 'Mỗi bước trong chuỗi xử lý đều tuân thủ nguyên tắc xử lý tín hiệu nhân quả thời gian thực và tách biệt ranh giới tầng giải mã.'
                : 'Every step strictly adheres to causal real-time DSP principles with distinct separation of decoded states.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pipelineSteps.map((step) => (
              <div
                key={step.num}
                className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-cyan-500 transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5 shadow-sm hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-cyan-600 font-black text-lg">{step.num}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-cyan-500 transition-colors" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. BENTO GRID: 4 Core Functional Subsystems                               */}
      {/* ========================================================================= */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-mono font-bold text-cyan-600 uppercase tracking-widest">
              {language === 'vi' ? 'Hệ Thống Phân Hệ' : 'Core Subsystems'}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {language === 'vi' ? 'Các Phân hệ Tính năng Chính' : 'Platform Modules & Capabilities'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-cyan-500 hover:bg-white hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-cyan-100 border border-cyan-200 rounded-2xl text-cyan-700">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'vi' ? 'Neural Writing Studio (Phòng Gõ Chữ)' : 'Neural Writing Studio'}
                  </h3>
                  <span className="text-xs text-cyan-700 font-mono font-semibold">
                    {language === 'vi' ? 'Ma trận 6x6 • Telex Tiếng Việt • Gợi ý Bigram' : '6×6 Matrix • Vietnamese Telex • Bigram Suggestions'}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {language === 'vi'
                  ? 'Người dùng nhìn vào ma trận ký tự nhấp nháy để ghép chữ. Bộ gợi ý từ ngữ hiển thị tối đa 5 ứng viên theo xác suất tần suất. Người dùng có các nút lệnh chuyên biệt ACCEPT (chọn từ), CONTINUE (tiếp tục đánh vần), NEXT (đổi ứng viên), và BACKSPACE.'
                  : 'Patients attend flashing matrix rows/columns to type characters. Offline dictionary ranks top 5 word candidates. Dedicated BCI command targets include ACCEPT, CONTINUE, NEXT, and BACKSPACE.'}
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-amber-500 hover:bg-white hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-amber-100 border border-amber-200 rounded-2xl text-amber-700">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'vi' ? 'Quick Survival Communication (Sinh tồn Nhanh)' : 'Quick Survival Communication (F1–F4)'}
                  </h3>
                  <span className="text-xs text-amber-700 font-mono font-semibold">
                    {language === 'vi' ? 'F1–F4 Targets • 5s Hủy • Cam kết 2 Bước cho F3' : 'F1–F4 Targets • 5s Cancel Window • 2-Step Commit for F3'}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {language === 'vi'
                  ? 'Cung cấp 4 câu lệnh thiết yếu hàng ngày: Uống nước (F1), Ăn uống (F2), Cần trợ giúp khẩn cấp (F3), Đi vệ sinh (F4). Nút F3 khẩn cấp áp dụng quy trình xác nhận 2 bước chống kích hoạt nhầm và đi kèm chuông cảnh báo Web Audio.'
                  : 'Provides 4 essential daily urgent phrases: Water (F1), Food (F2), Emergency Assistance (F3), Restroom (F4). High-stakes F3 enforces two-step confirmation with Web Audio siren alerts.'}
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-blue-500 hover:bg-white hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 border border-blue-200 rounded-2xl text-blue-700">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'vi' ? 'Giám sát Tín hiệu & Đường cong ERP' : 'EEG Signal Telemetry & ERP Monitor'}
                  </h3>
                  <span className="text-xs text-blue-700 font-mono font-semibold">
                    {language === 'vi' ? 'Canvas 60 FPS • Đồ thị Pz Grand-Average • Lọc Causal' : '60 FPS Canvas • Grand-Average Pz Curve • Causal SOS'}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {language === 'vi'
                  ? 'Trực quan hóa luồng 16 kênh điện não thời gian thực qua công nghệ HTML5 Canvas nhẹ nhàng, không giật lag. Đường cong Pz so sánh giữa kích thích Target (+16.33 µV) và NonTarget (-0.42 µV) giúp nhân viên y tế kiểm tra độ tin cậy của điện cực.'
                  : 'Lightweight HTML5 Canvas streaming 16 channels at 60 FPS without lag. Real-time grand-average Pz curve contrasts target vs non-target responses for clinical electrode verification.'}
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 hover:border-emerald-500 hover:bg-white hover:shadow-xl transition-all duration-300 space-y-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {language === 'vi' ? 'Bảo mật Offline & Quản trị Theo Vai trò' : 'Offline Zero-Trust Security & RBAC'}
                  </h3>
                  <span className="text-xs text-emerald-700 font-mono font-semibold">
                    {language === 'vi' ? 'JWT Offline • Mã hóa Argon2 • Nhật ký Kiểm toán' : 'Offline JWT • Argon2 Hashing • Immutable Audit Logs'}
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {language === 'vi'
                  ? 'Phân quyền chặt chẽ giữa 3 vai trò: Quản trị viên (Admin), Nhà nghiên cứu (Researcher), và Người chăm sóc (Caregiver). Kiểm soát chặt chẽ việc tải lên mô hình BCI (chống thực thi mã độc qua pickle, bắt buộc xác thực SHA-256).'
                  : 'Strict role-based access control separating Admin, Researcher, and Caregiver. Secure model uploads enforce SHA-256 checksums and safe deserialization against pickle exploits.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. SCIENTIFIC HONESTY & ETHICS                                            */}
      {/* ========================================================================= */}
      <section className="py-20 bg-slate-100 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <div className="inline-flex items-center space-x-2 text-cyan-700 bg-cyan-100 px-3.5 py-1 rounded-full font-mono text-xs font-semibold">
            <Radio className="w-4 h-4" />
            <span>{language === 'vi' ? 'Minh bạch Khoa học (Honest Telemetry & Principles)' : 'Scientific Transparency & Principles'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
            {language === 'vi' ? 'Hệ thống Không "Đọc Suy Nghĩ Tùy Ý"' : 'The System Does Not "Read Thoughts Arbitrarily"'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed text-justify sm:text-center">
            {language === 'vi'
              ? 'Khác với những tuyên bố thổi phồng, BCI không đọc được suy nghĩ tự do trong đầu. NEURO-SPEECH dựa trên nguyên lý điện sinh học chính xác: người dùng chủ động hướng sự chú ý thị giác vào một kích thích nhấp nháy hiếm gặp để tạo điện thế gợi P300. Mọi dự đoán đều được xử lý nghiêm ngặt qua mô hình toán học và bắt buộc có xác nhận rõ ràng của con người trước khi phát âm.'
              : 'Unlike hyperbolic science fiction claims, non-invasive BCIs cannot read unconstrained thoughts. NEURO-SPEECH operates on rigorous electrophysiological principles: the patient voluntarily focuses visual attention onto an oddball stimulus to generate a P300 ERP. All decoded candidates are mathematical predictions requiring explicit human confirmation.'}
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TRANSITION TO BLACK: Luxury CTA Banner Leading to Pure Black Footer    */}
      {/* ========================================================================= */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-black text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {language === 'vi' ? 'Sẵn sàng Thử nghiệm Nền tảng NEURO-SPEECH?' : 'Ready to Experience NEURO-SPEECH?'}
          </h2>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">
            {language === 'vi'
              ? 'Hệ thống sẵn sàng vận hành trên dữ liệu benchmark BNCI 2014-009 với tài khoản thử nghiệm có sẵn cho Bác sĩ, Nhà nghiên cứu và Kỹ sư BCI.'
              : 'The system is ready to evaluate on the BNCI 2014-009 benchmark with pre-seeded demo accounts for clinicians, researchers, and BCI engineers.'}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-9 py-4 rounded-full bg-cyan-400 hover:bg-cyan-300 text-gray-950 font-black text-sm shadow-xl shadow-cyan-400/25 transition-all active:scale-95"
            >
              {language === 'vi' ? 'Đăng nhập Hệ thống Ngay' : 'Sign In Now'}
            </Link>
            <Link
              to="/features"
              className="w-full sm:w-auto px-9 py-4 rounded-full border border-white/20 hover:border-cyan-400/50 text-white text-sm font-semibold transition-all backdrop-blur-sm"
            >
              {language === 'vi' ? 'Xem Chi tiết Tính năng' : 'Explore Platform Features'}
            </Link>
          </div>
        </div>
      </section>

      {/* Pure Black Footer */}
      <PublicFooter />
    </div>
  );
};
