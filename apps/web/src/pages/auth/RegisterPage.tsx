/**
 * apps/web/src/pages/auth/RegisterPage.tsx
 * Bright Clinical Registration Page (with Light/Dark & VI/EN support).
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ShieldAlert, CheckCircle2, ArrowRight, Brain, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'caregiver',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError(language === 'vi' ? 'Mật khẩu nhập lại không khớp.' : 'Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError(
        language === 'vi' ? 'Mật khẩu phải có ít nhất 6 ký tự.' : 'Password must be at least 6 characters.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(
        err?.message ||
          (language === 'vi'
            ? 'Đăng ký tài khoản không thành công. Vui lòng thử lại.'
            : 'Account registration failed. Please try again.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F6FA] dark:bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors relative">
      {/* Top-right Controls */}
      <div className="absolute top-5 right-5 flex items-center space-x-2">
        <button
          type="button"
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs"
        >
          {language === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 shadow-2xs"
          title="Light / Dark Mode"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 px-4">
        <Link to="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/20">
          <Brain className="w-7 h-7" />
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {language === 'vi' ? 'Tạo Tài Khoản NEURO-SPEECH' : 'Create Account — NEURO-SPEECH'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'vi' ? 'Đã có tài khoản? ' : 'Already have an account? '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">
            {language === 'vi' ? 'Đăng nhập ngay' : 'Sign in now'}
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

          {success ? (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'vi' ? 'Đăng Ký Thành Công!' : 'Registration Successful!'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'vi'
                  ? 'Tài khoản của bạn đã được khởi tạo và lưu trữ an toàn trong cơ sở dữ liệu. Bây giờ bạn có thể đăng nhập để sử dụng.'
                  : 'Your account has been initialized and securely stored in SQLite. You can now sign in to access the Studio.'}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all"
              >
                <span>{language === 'vi' ? 'Chuyển Đến Trang Đăng Nhập' : 'Go to Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {language === 'vi' ? 'Họ và tên *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder={language === 'vi' ? 'Bác sĩ / Kỹ thuật viên / Người thân' : 'Clinician / Researcher / Caregiver'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {language === 'vi' ? 'Tên đăng nhập *' : 'Username *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder={language === 'vi' ? 'viết liền, không dấu (vd: bs_nam)' : 'no spaces (e.g. dr_nam)'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="user@hospital.local"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {language === 'vi' ? 'Vai trò trong hệ thống' : 'System Role'}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="caregiver">
                    {language === 'vi' ? 'Người chăm sóc lâm sàng (Caregiver)' : 'Clinical Caregiver'}
                  </option>
                  <option value="researcher">
                    {language === 'vi' ? 'Nhà nghiên cứu / Kỹ sư BCI (Researcher)' : 'BCI Researcher / Engineer'}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {language === 'vi' ? 'Mật khẩu *' : 'Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder={language === 'vi' ? 'Tối thiểu 6 ký tự' : 'Minimum 6 characters'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  {language === 'vi' ? 'Nhập lại mật khẩu *' : 'Confirm Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-sm shadow-blue-600/20 flex items-center justify-center space-x-2 transition-all mt-4"
              >
                <UserPlus className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? language === 'vi'
                      ? 'Đang tạo tài khoản...'
                      : 'Creating account...'
                    : language === 'vi'
                    ? 'Đăng Ký Tài Khoản'
                    : 'Register Account'}
                </span>
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium">
            {language === 'vi' ? '← Quay lại trang đăng nhập' : '← Back to Sign In'}
          </Link>
        </div>
      </div>
    </div>
  );
};
