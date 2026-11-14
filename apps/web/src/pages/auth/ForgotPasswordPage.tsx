/**
 * apps/web/src/pages/auth/ForgotPasswordPage.tsx
 * Forgot Password Request Page for NEURO-SPEECH (M6).
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
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
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Khôi Phục Mật Khẩu</h2>
        <p className="text-xs text-gray-400">
          Nhập địa chỉ email liên kết với tài khoản NEURO-SPEECH của bạn.
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

          {submitted ? (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Yêu Cầu Đã Được Tiếp Nhận</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Nếu địa chỉ email <span className="text-cyan-300 font-mono">{email}</span> tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu và mã xác thực đã được gửi đi.
              </p>
              <div className="pt-2">
                <Link
                  to="/reset-password"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
                >
                  <span>Chuyển đến trang Đặt Lại Mật Khẩu</span>
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
                  className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="caregiver@neuro-speech.local"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-md shadow-cyan-600/30 flex items-center justify-center space-x-2 transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>{isSubmitting ? 'Đang gửi yêu cầu...' : 'Gửi Mã Xác Thực Khôi Phục'}</span>
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
