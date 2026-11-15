/**
 * apps/web/src/pages/auth/ResetPasswordPage.tsx
 * Reset Password Page for NEURO-SPEECH (M6).
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert, CheckCircle2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api';

export const ResetPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.auth.resetPassword(email, token, newPassword);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra lại email hoặc mã xác thực.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center space-x-2">
          <img
            src="/brand_logo.jpg"
            alt="NEURO-SPEECH Logo"
            className="w-12 h-12 rounded-xl object-cover border border-cyan-500/40 shadow-lg shadow-cyan-500/20"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/logo.svg';
            }}
          />
        </Link>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Đặt Lại Mật Khẩu</h2>
        <p className="text-xs text-gray-400">
          Nhập mã xác thực khôi phục và thiết lập mật khẩu mới.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#0B1220] py-8 px-6 sm:px-10 rounded-2xl border border-gray-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-6 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Mật Khẩu Đã Được Cập Nhật!</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Mật khẩu tài khoản của bạn đã được thay đổi an toàn với hàm băm mật mã. Bạn có thể đăng nhập ngay với mật khẩu mới.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold shadow-md transition-all"
                >
                  <span>Đăng Nhập Ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Email đăng ký *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="caregiver@neuro-speech.local"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Mã xác thực khôi phục (Reset Token) *</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="Nhập mã xác thực (vd: 123456)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 pr-10 transition-colors"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nhập lại mật khẩu mới *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 pr-10 transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200"
                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-md shadow-cyan-600/30 flex items-center justify-center space-x-2 transition-all mt-4"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang cập nhật mật khẩu...' : 'Xác Nhận Đặt Lại Mật Khẩu'}</span>
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
