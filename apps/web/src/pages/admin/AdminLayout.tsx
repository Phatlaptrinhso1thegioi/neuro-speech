/**
 * apps/web/src/pages/admin/AdminLayout.tsx
 * Bright, Crisp, Full-Height Sidebar Admin Console Layout with 403 RBAC Guard.
 * Supports full VI/EN localization and persistent Light/Dark mode.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Users,
  HeartPulse,
  Database,
  Cpu,
  FileSpreadsheet,
  FileText,
  Settings,
  ArrowLeft,
  Menu,
  X,
  ShieldAlert,
  LogOut,
  ChevronRight,
  ChevronDown,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const topbarRef = useRef<HTMLDivElement>(null);

  const { user, isAdmin, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const isVi = language === 'vi';

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    const handleClickOutside = (e: MouseEvent) => {
      if (topbarRef.current && !topbarRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
        setLangOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setLangOpen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Route Guard: If not admin, render 403 Unauthorized
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F3F6FA] dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {isVi ? '403 — Quyền Truy Cập Bị Từ Chối' : '403 — Access Denied'}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isVi ? (
              <>
                Khu vực Quản trị Hệ thống (<code className="text-rose-600 dark:text-rose-400 font-mono font-semibold">/admin/*</code>) yêu cầu vai trò tài khoản <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">admin</span>. Vai trò hiện tại của bạn là <span className="text-amber-700 dark:text-amber-400 font-mono font-bold">{user?.role || 'Khách'}</span>.
              </>
            ) : (
              <>
                The System Admin area (<code className="text-rose-600 dark:text-rose-400 font-mono font-semibold">/admin/*</code>) requires the <span className="text-blue-600 dark:text-blue-400 font-mono font-bold">admin</span> role. Your current role is <span className="text-amber-700 dark:text-amber-400 font-mono font-bold">{user?.role || 'Guest'}</span>.
              </>
            )}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/app/dashboard"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs tracking-wide shadow-sm transition-all"
            >
              {isVi ? 'Về Trang Cá Nhân' : 'Back to Dashboard'}
            </Link>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all"
            >
              {isVi ? 'Đăng Nhập Khác' : 'Switch Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const adminGroups = [
    {
      group: isVi ? 'QUẢN TRỊ TỔNG QUAN' : 'ADMIN OVERVIEW',
      items: [
        { label: isVi ? 'Tổng quan Admin' : 'Admin Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: isVi ? 'Quản lý Người dùng' : 'User Management', path: '/admin/users', icon: Users },
        { label: isVi ? 'Quản lý Bệnh nhân' : 'Patient Registry', path: '/admin/patients', icon: HeartPulse },
      ],
    },
    {
      group: isVi ? 'KHOA HỌC & DỮ LIỆU' : 'SCIENCE & DATA',
      items: [
        { label: isVi ? 'Dữ liệu EEG Benchmark' : 'EEG Benchmark Datasets', path: '/admin/datasets', icon: Database },
        { label: isVi ? 'Mô hình & Checkpoint' : 'Models & Checkpoints', path: '/admin/models', icon: Cpu },
        { label: isVi ? 'Quản lý Phiên EEG' : 'EEG Sessions Manager', path: '/admin/sessions', icon: FileSpreadsheet },
      ],
    },
    {
      group: isVi ? 'KIỂM TOÁN & CẤU HÌNH' : 'AUDIT & CONFIG',
      items: [
        { label: isVi ? 'Nhật ký Kiểm toán' : 'Audit Logs', path: '/admin/logs', icon: FileText },
        { label: isVi ? 'Cấu hình Hệ thống' : 'System Configuration', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  const handleConfirmLogout = () => {
    logout();
    toast.info(isVi ? 'Đã đăng xuất khỏi bảng quản trị.' : 'Signed out of admin console.');
    navigate('/login');
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      toast.warning(isVi ? 'Không thể chuyển chế độ toàn màn hình.' : 'Cannot toggle fullscreen.');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const initials = (user.full_name || user.username)
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className="h-screen bg-[#F3F6FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex overflow-hidden font-sans transition-colors">
      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 transition-all duration-200 flex-shrink-0 z-30 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <Link
          to="/admin/dashboard"
          className={`h-16 border-b border-slate-100 dark:border-slate-800 flex items-center ${
            collapsed ? 'justify-center px-2' : 'px-5 space-x-3'
          } hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition-colors`}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none truncate">
                ADMIN CONSOLE
              </div>
              <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mt-1 truncate">
                NEURO-SPEECH RBAC
              </div>
            </div>
          )}
        </Link>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {adminGroups.map((g, idx) => (
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
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-medium'
                      } ${collapsed ? 'justify-center px-2' : ''}`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Icon
                          className={`w-[17px] h-[17px] flex-shrink-0 ${
                            active
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                          }`}
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && (
                        <ChevronRight
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            active
                              ? 'text-indigo-500'
                              : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-400'
                          }`}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {isVi ? 'KHÔNG GIAN BÁC SĨ' : 'CLINICAL WORKSPACE'}
              </div>
            )}
            <Link
              to="/app/dashboard"
              title={collapsed ? (isVi ? 'Về Không Gian Bác Sĩ' : 'Clinical Workspace') : undefined}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 dark:hover:bg-blue-900/50 border border-blue-200/60 dark:border-blue-800/60 transition-all ${
                collapsed ? 'justify-center px-2' : ''
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <ArrowLeft className="w-[17px] h-[17px] flex-shrink-0 text-blue-600 dark:text-blue-400" />
                {!collapsed && (
                  <span className="truncate">{isVi ? 'Về Không Gian Bác Sĩ' : 'Clinical Workspace'}</span>
                )}
              </div>
            </Link>
          </div>
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            className={`w-full flex items-center ${
              collapsed ? 'justify-center px-2' : 'space-x-2.5 px-3'
            } py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{isVi ? 'Đăng xuất Admin' : 'Admin Sign Out'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          ref={topbarRef}
          className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-20 transition-colors"
        >
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
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>
                {isVi ? 'Chế độ Quản trị Hệ thống (SQLite WAL)' : 'System Admin Mode (SQLite WAL)'}
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <Link
              to="/app/dashboard"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{isVi ? 'Không Gian Bác Sĩ' : 'Clinical Studio'}</span>
            </Link>

            {/* Language Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setLangOpen(!langOpen);
                  setUserMenuOpen(false);
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
              >
                <span>{isVi ? '🇻🇳' : '🇬🇧'}</span>
                <span className="hidden sm:inline">{isVi ? 'VI' : 'EN'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-1 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('vi');
                      setLangOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs ${
                      isVi ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                    }}
                    className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs ${
                      !isVi ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                  </button>
                </div>
              )}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? (isVi ? 'Giao diện Sáng' : 'Light Mode') : isVi ? 'Giao diện Tối' : 'Dark Mode'}
              className="p-2 rounded-xl text-slate-600 dark:text-amber-300 hover:text-slate-900 dark:hover:text-amber-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="hidden sm:inline-flex p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isVi ? 'Toàn màn hình' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(!userMenuOpen);
                  setLangOpen(false);
                }}
                className="flex items-center space-x-2.5 pl-2 pr-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                  {initials}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-xs text-slate-800 dark:text-white leading-tight">
                    {user.full_name}
                  </div>
                  <div className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase font-bold leading-tight">
                    {user.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/app/dashboard');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                    <span>{isVi ? 'Về Không Gian Bác Sĩ' : 'Clinical Workspace'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{isVi ? 'Đăng xuất Admin' : 'Admin Sign Out'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#F3F6FA] dark:bg-slate-950 transition-colors">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 z-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                {isVi ? 'Quản Trị BCI' : 'BCI Admin'}
              </span>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-5 flex-1 overflow-y-auto">
              {adminGroups.map((g, idx) => (
                <div key={idx}>
                  <h5 className="px-3 mb-1.5 text-[10px] font-bold uppercase text-slate-400">{g.group}</h5>
                  <div className="space-y-1">
                    {g.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                            active
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
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
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400"
              >
                <LogOut className="w-4 h-4" />
                <span>{isVi ? 'Đăng xuất Admin' : 'Admin Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirm Modal */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        title={isVi ? 'Xác Nhận Đăng Xuất Admin' : 'Confirm Admin Sign Out'}
        message={
          isVi
            ? 'Bạn có chắc chắn muốn đăng xuất khỏi giao diện quản trị an toàn?'
            : 'Are you sure you want to leave the secure admin console?'
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
