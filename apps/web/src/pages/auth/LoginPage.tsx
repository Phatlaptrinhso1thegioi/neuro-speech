/**
 * apps/web/src/pages/auth/LoginPage.tsx
 * Bright Clinical Authentication Login Page (with Light/Dark & VI/EN support).
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Eye, EyeOff, ShieldAlert, Sun, Moon, Brain } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('caregiver');
  const [password, setPassword] = useState('Caregiver@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, user } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/app/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(
        err?.message ||
          (language === 'vi'
            ? 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản hoặc mật khẩu.'
            : 'Authentication failed. Please verify your username and password.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors relative">
      {/* Top-right Controls (Language + Theme) */}
      <div className="absolute top-5 right-5 flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs hover:bg-slate-50 transition-colors"
          title={isDark ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 px-4">
        <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/20">
          <Brain className="w-7 h-7" />
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {language === 'vi' ? 'Đăng Nhập NEURO-SPEECH' : 'Sign In — NEURO-SPEECH'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'vi' ? 'Chưa có tài khoản? ' : "Don't have an account? "}
          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
            {language === 'vi' ? 'Đăng ký tài khoản mới' : 'Create new account'}
          </Link>
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-9 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                {language === 'vi' ? 'Tên đăng nhập / Username *' : 'Username *'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="admin / researcher / caregiver"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                  {language === 'vi' ? 'Mật khẩu *' : 'Password *'}
                </label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-blue-600 hover:underline">
                  {language === 'vi' ? 'Quên mật khẩu?' : 'Forgot password?'}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 pr-10 transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-sm shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? language === 'vi'
                    ? 'Đang xác thực...'
                    : 'Authenticating...'
                  : language === 'vi'
                  ? 'Đăng Nhập'
                  : 'Sign In'}
              </span>
            </button>
          </form>

          {/* Quick-fill pre-seeded demo accounts */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 text-center font-bold">
              {language === 'vi'
                ? 'Tài Khoản Thử Nghiệm Có Sẵn (Nhấn Để Điền Nhanh):'
                : 'Pre-Seeded Clinical Accounts (Click to Fill):'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('caregiver', 'Caregiver@12345')}
                className="py-2 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-[11px] text-slate-700 hover:text-blue-700 text-center font-mono font-semibold transition-all"
              >
                Caregiver
              </button>
              <button
                type="button"
                onClick={() => fillDemo('researcher', 'Researcher@12345')}
                className="py-2 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-[11px] text-slate-700 hover:text-blue-700 text-center font-mono font-semibold transition-all"
              >
                Researcher
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin', 'Admin@12345')}
                className="py-2 px-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-[11px] text-slate-700 hover:text-indigo-700 text-center font-mono font-semibold transition-all"
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium">
            {language === 'vi' ? '← Quay lại trang chủ NEURO-SPEECH' : '← Back to NEURO-SPEECH Home'}
          </Link>
        </div>
      </div>
    </div>
  );
};
