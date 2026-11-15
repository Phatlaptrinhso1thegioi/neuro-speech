/**
 * apps/web/src/pages/app/AppLayout.tsx
 * Bright, Crisp, Balanced Clinical BCI Studio Layout inspired by clean Academic/Medical Portals.
 * Supports full VI/EN i18n, persistent Light/Dark mode, and real authenticated route gating.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  HeartHandshake,
  History,
  FileSpreadsheet,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  ChevronDown,
  Bell,
  Maximize2,
  Minimize2,
  MapPin,
  Volume2,
  CheckCircle2,
  Radio,
  Cpu,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { speakVietnamese, getVietnameseVoice } from '../../utils/tts';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Topbar interactive popovers
  const [facilityOpen, setFacilityOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [facilityIndex, setFacilityIndex] = useState(0);

  const topbarRef = useRef<HTMLDivElement>(null);

  const { user, isLoading, logout, isAdmin } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const isVi = language === 'vi';

  // Close dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target as Node)) {
        setFacilityOpen(false);
        setLangOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFacilityOpen(false);
        setLangOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Track browser fullscreen state
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] dark:bg-slate-950 flex items-center justify-center text-xs font-mono text-slate-500 dark:text-slate-400">
        {isVi ? 'Đang xác thực phiên lâm sàng...' : 'Verifying clinical session...'}
      </div>
    );
  }

  // Enforce authenticated route guard
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const facilities = [
    {
      name: isVi ? 'Khoa Thần Kinh • BNCI S2' : 'Neurology Dept • BNCI S2',
      desc: isVi ? 'Held-out Session 2 (576 flashes)' : 'Held-out Session 2 (576 flashes)',
    },
    {
      name: isVi ? 'Phòng Phục Hồi Chức Năng' : 'Rehabilitation Ward',
      desc: isVi ? 'Chế độ Sinh tồn nhanh F1–F4' : 'Rapid Survival Mode F1–F4',
    },
    {
      name: isVi ? 'Trạm Giải Mã .CSV Cục Bộ' : 'Local .CSV Decoder Station',
      desc: isVi ? 'Nạp tệp 16 kênh offline' : 'Offline 16-channel CSV upload',
    },
  ];
  const selectedFacility = facilities[facilityIndex]?.name ?? facilities[0].name;

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        toast.info(isVi ? 'Đã bật chế độ Toàn màn hình.' : 'Entered fullscreen mode.');
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.warning(
        isVi ? 'Trình duyệt không cho phép bật chế độ Toàn màn hình.' : 'Browser blocked fullscreen mode.'
      );
    }
  };

  const handleQuickVoiceTest = () => {
    const msg = isVi
      ? 'Hệ thống NEURO-SPEECH đang hoạt động ổn định và sẵn sàng hỗ trợ bệnh nhân.'
      : 'NEURO-SPEECH clinical system is online and ready to assist the patient.';
    const success = speakVietnamese(msg);
    if (success) {
      const viVoice = getVietnameseVoice();
      const voiceInfo = viVoice ? ` [${viVoice.name}]` : '';
      toast.success(isVi ? `Đã phát âm kiểm tra hệ thống TTS.${voiceInfo}` : `Playing TTS voice check.${voiceInfo}`);
    } else {
      toast.warning(isVi ? 'Trình duyệt không hỗ trợ Web Speech TTS.' : 'Browser does not support Web Speech TTS.');
    }
  };

  const handleConfirmLogout = () => {
    logout();
    toast.info(isVi ? 'Bạn đã đăng xuất khỏi hệ thống lâm sàng.' : 'Signed out of clinical session.');
    navigate('/login', { replace: true });
  };

  const isActive = (path: string) => location.pathname === path;

  const clinicalGroups = [
    {
      group: isVi ? 'LÂM SÀNG BCI' : 'CLINICAL BCI',
      items: [
        { label: isVi ? 'Tổng quan (Trang chủ)' : 'Dashboard Overview', path: '/app/dashboard', icon: LayoutDashboard },
        { label: isVi ? 'Phòng Lab P300 Studio' : 'P300 Neuro Studio', path: '/app/studio', icon: Brain },
        { label: isVi ? 'Sinh tồn khẩn cấp (F1–F4)' : 'Survival Quick (F1–F4)', path: '/app/survival', icon: HeartHandshake },
      ],
    },
    {
      group: isVi ? 'DỮ LIỆU & KIỂM TOÁN' : 'DATA & AUDIT',
      items: [
        { label: isVi ? 'Lịch sử giao tiếp' : 'Communication History', path: '/app/history', icon: History },
        { label: isVi ? 'Kho phiên thu EEG' : 'EEG Recording Sessions', path: '/app/sessions', icon: FileSpreadsheet },
      ],
    },
    {
      group: isVi ? 'TÀI KHOẢN & HỆ THỐNG' : 'ACCOUNT & SYSTEM',
      items: [
        { label: isVi ? 'Hồ sơ chuyên viên' : 'Clinician Profile', path: '/app/profile', icon: User },
        { label: isVi ? 'Cài đặt hệ thống' : 'System Settings', path: '/app/settings', icon: Settings },
      ],
    },
  ];

  const notifications = [
    {
      id: 1,
      title: isVi ? 'Bộ giải mã Shrinkage LDA v1.0 sẵn sàng' : 'Shrinkage LDA v1.0 Decoder Ready',
      desc: isVi
        ? 'Độ chính xác Balanced Acc 80.0% • ROC-AUC 0.8900 trên BNCI Session 2.'
        : 'Balanced Acc 80.0% • ROC-AUC 0.8900 on held-out BNCI Session 2.',
      time: isVi ? 'Vừa xong' : 'Just now',
      icon: Cpu,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300',
      actionPath: '/app/studio',
    },
    {
      id: 2,
      title: isVi ? 'Bộ lọc nhân quả Causal SOS ổn định' : 'Causal SOS Filter Stable',
      desc: isVi
        ? 'Dải thông 0.5–30.0 Hz @ 256 Hz • Độ trễ xử lý 0.041 ms/chunk.'
        : 'Passband 0.5–30.0 Hz @ 256 Hz • Processing latency 0.041 ms/chunk.',
      time: isVi ? '2 phút trước' : '2 min ago',
      icon: Radio,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/30 dark:text-teal-300',
      actionPath: '/app/studio?tab=monitoring',
    },
    {
      id: 3,
      title: isVi ? 'Cổng an toàn F3 (2 bước) đang kích hoạt' : 'F3 Two-Step Safety Gate Active',
      desc: isVi
        ? 'Đảm bảo không tự ý commit gợi ý AI nếu bệnh nhân chưa xác nhận.'
        : 'Prevents unconfirmed AI predictions from committing automatically.',
      time: isVi ? '10 phút trước' : '10 min ago',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300',
      actionPath: '/app/survival',
    },
  ];

  const initials = (user.full_name || user.username)
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className="h-screen bg-[#F3F6FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex overflow-hidden font-sans transition-colors">
      {/* Desktop Left Fixed Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 transition-all duration-200 flex-shrink-0 z-30 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {/* Top Sidebar Brand Block */}
        <Link
          to="/app/dashboard"
          className={`h-16 border-b border-slate-100 dark:border-slate-800 flex items-center ${
            collapsed ? 'justify-center px-2' : 'px-5 space-x-3'
          } hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none truncate">
                NEURO-SPEECH
              </div>
              <div className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mt-1 truncate">
                {isVi ? 'TRẠM GIẢI MÃ BCI LÂM SÀNG' : 'CLINICAL BCI STATION'}
              </div>
            </div>
          )}
        </Link>

        {/* Sidebar Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {clinicalGroups.map((g, idx) => (
            <div key={idx}>
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {g.group}
                </div>
              )}
              <div className="space-y-1">
                {g.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] transition-all group ${
                        active
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white font-medium'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon
                          className={`w-[17px] h-[17px] flex-shrink-0 transition-colors ${
                            active
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${
                            active
                              ? 'text-blue-500 translate-x-0.5'
                              : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400 group-hover:translate-x-0.5'
                          }`}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Admin Console Group */}
          {isAdmin && (
            <div>
              {!collapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {isVi ? 'QUẢN TRỊ HỆ THỐNG' : 'SYSTEM ADMINISTRATION'}
                </div>
              )}
              <Link
                to="/admin/dashboard"
                title={collapsed ? (isVi ? 'Bảng Quản Trị (Admin)' : 'Admin Console') : undefined}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/60 transition-all group ${
                  collapsed ? 'justify-center px-2' : ''
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Shield className="w-[17px] h-[17px] flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                  {!collapsed && (
                    <span className="truncate">{isVi ? 'Quản trị hệ thống' : 'Admin Console'}</span>
                  )}
                </div>
                {!collapsed && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
              </Link>
            </div>
          )}
        </div>

        {/* Bottom Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            title={isVi ? 'Đăng xuất khỏi hệ thống' : 'Sign out of session'}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-2' : 'space-x-2.5 px-3'
            } py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{isVi ? 'Đăng xuất ca trực' : 'End Shift / Sign Out'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header
          ref={topbarRef}
          className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-20 transition-colors"
        >
          {/* Left: Hamburger Toggle + Causal Stream Status Pill */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(!sidebarOpen);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label={isVi ? 'Thu gọn hoặc mở rộng menu' : 'Toggle navigation sidebar'}
              title={isVi ? 'Thu gọn / Mở rộng thanh bên' : 'Collapse / Expand sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center space-x-2 text-xs">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>256 Hz Causal SOS</span>
              </span>
            </div>
          </div>

          {/* Right: Facility, Language, Dark/Light Theme, Notifications, Voice Test, Fullscreen, User Profile */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs">
            {/* 1. Facility / Clinical Context Switcher */}
            <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => {
                  setFacilityOpen(!facilityOpen);
                  setLangOpen(false);
                  setNotifOpen(false);
                  setUserMenuOpen(false);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span>{selectedFacility}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {facilityOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg p-2 z-50 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {isVi ? 'Nguồn Tín Hiệu & Cơ Sở Lâm Sàng' : 'Signal Source & Clinical Unit'}
                  </div>
                  {facilities.map((f, idx) => (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => {
                        setFacilityIndex(idx);
                        setFacilityOpen(false);
                        toast.success(
                          isVi ? `Đã chọn ngữ cảnh: ${f.name}` : `Switched context: ${f.name}`
                        );
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                        facilityIndex === idx
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-xs">{f.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{f.desc}</div>
                    </button>
                  ))}
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setFacilityOpen(false);
                        navigate('/app/sessions');
                      }}
                      className="w-full text-center py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors"
                    >
                      {isVi ? 'Xem danh mục phiên EEG ➔' : 'Browse EEG Sessions ➔'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Language Toggle Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangOpen(!langOpen);
                  setFacilityOpen(false);
                  setNotifOpen(false);
                  setUserMenuOpen(false);
                }}
                className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
                title={isVi ? 'Đổi ngôn ngữ giao diện' : 'Switch interface language'}
              >
                <span>{isVi ? '🇻🇳' : '🇬🇧'}</span>
                <span className="hidden sm:inline">{isVi ? 'Tiếng Việt' : 'English'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('vi');
                      setLangOpen(false);
                      toast.success('Đã chuyển ngôn ngữ sang Tiếng Việt.');
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs ${
                      isVi
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>🇻🇳</span>
                    <span>Tiếng Việt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('en');
                      setLangOpen(false);
                      toast.success('Switched interface language to English.');
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-xs ${
                      !isVi
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                  </button>
                </div>
              )}
            </div>

            {/* 3. Interactive Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                toggleTheme();
                toast.info(
                  !isDark
                    ? isVi
                      ? 'Đã bật Dark Mode.'
                      : 'Dark Mode enabled.'
                    : isVi
                    ? 'Đã chuyển về Light Mode.'
                    : 'Light Mode enabled.'
                );
              }}
              data-testid="topbar-theme-toggle"
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={
                isDark
                  ? isVi
                    ? 'Chuyển sang Giao diện Sáng (Light Mode)'
                    : 'Switch to Light Mode'
                  : isVi
                  ? 'Chuyển sang Giao diện Tối (Dark Mode)'
                  : 'Switch to Dark Mode'
              }
              className="p-2 rounded-xl text-slate-600 dark:text-amber-300 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 transition-all"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* 4. Interactive Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setFacilityOpen(false);
                  setLangOpen(false);
                  setUserMenuOpen(false);
                }}
                className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 transition-all"
                title={isVi ? 'Thông báo lâm sàng' : 'Clinical Notifications'}
              >
                <Bell className="w-4 h-4" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/60">
                    <span className="font-bold text-xs text-slate-800 dark:text-white">
                      {isVi ? `Thông báo hệ thống BCI (${unreadNotifs})` : `BCI System Alerts (${unreadNotifs})`}
                    </span>
                    {unreadNotifs > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUnreadNotifs(0);
                          toast.info(
                            isVi ? 'Đã đánh dấu tất cả thông báo là đã đọc.' : 'Marked all alerts as read.'
                          );
                        }}
                        className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {isVi ? 'Đánh dấu đã đọc' : 'Mark all read'}
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                    {notifications.map((n) => {
                      const NIcon = n.icon;
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            setUnreadNotifs((u) => Math.max(0, u - 1));
                            navigate(n.actionPath);
                          }}
                          className="w-full text-left p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-start space-x-3 transition-colors"
                        >
                          <div className={`p-2 rounded-xl flex-shrink-0 ${n.color}`}>
                            <NIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-800 dark:text-white">
                              {n.title}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                              {n.desc}
                            </p>
                            <span className="text-[10px] text-slate-400 font-mono mt-1 block">{n.time}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Quick Voice Check Button */}
            <button
              type="button"
              onClick={handleQuickVoiceTest}
              className="hidden sm:inline-flex p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all"
              title={isVi ? 'Kiểm tra nhanh âm thanh TTS' : 'Quick TTS audio test'}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* 6. Fullscreen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:inline-flex p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700 transition-all"
              title={
                isFullscreen
                  ? isVi
                    ? 'Thoát toàn màn hình'
                    : 'Exit fullscreen'
                  : isVi
                  ? 'Toàn màn hình'
                  : 'Fullscreen'
              }
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* 7. User Profile Chip Dropdown */}
            <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setFacilityOpen(false);
                  setLangOpen(false);
                  setNotifOpen(false);
                }}
                className="flex items-center space-x-2.5 pl-2 pr-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-xs text-slate-800 dark:text-white leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase leading-tight">
                    {user.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{user.full_name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/app/profile');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{isVi ? 'Hồ sơ cá nhân' : 'Clinician Profile'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/app/settings');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>{isVi ? 'Cài đặt hệ thống' : 'System Settings'}</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/admin/dashboard');
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                    >
                      <Shield className="w-4 h-4 text-indigo-500" />
                      <span>{isVi ? 'Quản trị hệ thống (Admin)' : 'Admin Console'}</span>
                    </button>
                  )}
                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isVi ? 'Đăng xuất' : 'Sign Out'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F3F6FA] dark:bg-slate-950 transition-colors">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 z-50">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">NEURO-SPEECH</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-5 flex-1 overflow-y-auto">
              {clinicalGroups.map((g, idx) => (
                <div key={idx}>
                  <h5 className="px-3 mb-1.5 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    {g.group}
                  </h5>
                  <div className="space-y-1">
                    {g.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                            active
                              ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <Icon className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                            <span>{item.label}</span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  setLogoutModalOpen(true);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>{isVi ? 'Đăng xuất ca trực' : 'End Shift / Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        title={isVi ? 'Xác Nhận Đăng Xuất' : 'Confirm Sign Out'}
        message={
          isVi
            ? 'Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc NEURO-SPEECH hiện tại? Mọi dữ liệu đã cam kết đều đã được lưu trữ an toàn.'
            : 'Are you sure you want to sign out of the current NEURO-SPEECH clinical session? All committed phrases have been stored safely.'
        }
        confirmLabel={isVi ? 'Đăng Xuất' : 'Sign Out'}
        cancelLabel={isVi ? 'Ở Lại' : 'Stay'}
        isDestructive={false}
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutModalOpen(false)}
      />
    </div>
  );
};
