/**
 * apps/web/src/components/public/PublicNav.tsx
 * Floating Capsule Navigation Bar inspired by Neura Robotics aesthetic.
 * Fixed in place on scroll, keeping the capsule navbar pinned at the top
 * of the viewport across all page sections with frosted glass backdrop blur.
 * Features interactive bilingual switcher (VI / EN).
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

interface PublicNavProps {
  floating?: boolean;
}

export const PublicNav: React.FC<PublicNavProps> = ({ floating = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = language === 'vi' ? [
    { label: 'Trang chủ', path: '/' },
    { label: 'Công nghệ', path: '/technology', hasDropdown: true },
    { label: 'Tính năng', path: '/features', hasDropdown: true },
    { label: 'Giới thiệu', path: '/about' },
    { label: 'Phòng Lab BCI', path: '/app/studio' },
    { label: 'Liên hệ', path: '/contact' },
  ] : [
    { label: 'Home', path: '/' },
    { label: 'Technology', path: '/technology', hasDropdown: true },
    { label: 'Features', path: '/features', hasDropdown: true },
    { label: 'About', path: '/about' },
    { label: 'BCI Lab', path: '/app/studio' },
    { label: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-all duration-300">
      {/* Floating Frosted Capsule Pill Navbar */}
      <div
        className={`max-w-7xl mx-auto px-4 sm:px-6 pointer-events-auto transition-all duration-300 ${
          isScrolled ? 'pt-3 pb-2' : 'pt-5 pb-3'
        }`}
      >
        <header
          className={`rounded-full backdrop-blur-2xl border px-5 sm:px-7 py-3 flex items-center justify-between shadow-2xl transition-all duration-300 ${
            isScrolled
              ? 'bg-black/85 border-white/25 shadow-2xl ring-1 ring-white/10'
              : 'bg-black/60 border-white/20 shadow-xl'
          }`}
        >
          {/* Brand Logo - Neura Aesthetic */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            <img
              src="/brand_logo.jpg"
              alt="NEURO-SPEECH Logo"
              className="w-8 h-8 rounded-full object-cover border border-cyan-400/50 shadow-sm shadow-cyan-400/30 group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/logo.svg';
              }}
            />
            <div className="flex items-baseline space-x-1.5">
              <span className="font-mono font-black text-base sm:text-lg tracking-widest text-white group-hover:text-cyan-300 transition-colors uppercase">
                NEURO-SPEECH
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8 text-xs font-medium text-gray-200">
            {navLinks.map((link) => (
              <div key={link.path} className="relative group flex items-center space-x-1">
                <Link
                  to={link.path}
                  className={`py-1 transition-colors hover:text-cyan-300 flex items-center space-x-1 ${
                    isActive(link.path) ? 'text-cyan-400 font-bold' : 'text-gray-200'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.hasDropdown && (
                    <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-cyan-300 transition-transform group-hover:rotate-180" />
                  )}
                </Link>
              </div>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-3">
            {/* Interactive Language Pill Switcher (VI / EN) */}
            <div className="hidden sm:inline-flex items-center space-x-1 text-xs font-mono border-r border-white/20 pr-3 mr-1 select-none">
              <button
                type="button"
                onClick={() => setLanguage('vi')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                  language === 'vi'
                    ? 'bg-cyan-400 text-gray-950 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title="Chuyển sang Tiếng Việt"
              >
                VI
              </button>
              <span className="text-gray-500">/</span>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                  language === 'en'
                    ? 'bg-cyan-400 text-gray-950 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/app/dashboard"
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-cyan-400 hover:bg-cyan-300 text-gray-950 font-bold text-xs tracking-wide shadow-md shadow-cyan-400/30 transition-all active:scale-95"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>
                    {language === 'vi' ? `Vào App (${user.username})` : `Open App (${user.username})`}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-full border border-white/20 hover:border-rose-400 text-gray-200 hover:text-rose-300 text-xs font-medium transition-all"
                >
                  {language === 'vi' ? 'Đăng xuất' : 'Sign Out'}
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full border border-white/25 hover:border-white text-gray-100 hover:text-white text-xs font-semibold transition-all"
                >
                  {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-full bg-cyan-400 hover:bg-cyan-300 text-gray-950 text-xs font-bold shadow-md shadow-cyan-400/20 transition-all active:scale-95"
                >
                  {language === 'vi' ? 'Đăng ký' : 'Register'}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white rounded-full bg-white/10"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 rounded-2xl bg-black/95 backdrop-blur-2xl border border-white/15 p-4 space-y-3 shadow-2xl pointer-events-auto">
            {/* Mobile Language Switcher */}
            <div className="flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl text-xs font-mono">
              <span className="text-gray-400">
                {language === 'vi' ? 'Ngôn ngữ:' : 'Language:'}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setLanguage('vi')}
                  className={`px-3 py-1 rounded transition-all cursor-pointer font-bold ${
                    language === 'vi'
                      ? 'bg-cyan-400 text-gray-950 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  VI
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-1 rounded transition-all cursor-pointer font-bold ${
                    language === 'en'
                      ? 'bg-cyan-400 text-gray-950 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl text-sm font-medium ${
                  isActive(link.path)
                    ? 'bg-cyan-950/60 text-cyan-400 font-bold'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-white/10 flex flex-col space-y-2">
              {user ? (
                <Link
                  to="/app/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-cyan-400 text-gray-950 font-bold text-xs"
                >
                  {language === 'vi' ? `Vào Ứng Dụng (${user.username})` : `Open App (${user.username})`}
                </Link>
              ) : (
                <div className="flex gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 rounded-xl border border-white/20 text-white text-xs font-medium"
                  >
                    {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2 rounded-xl bg-cyan-400 text-gray-950 text-xs font-bold"
                  >
                    {language === 'vi' ? 'Đăng ký' : 'Register'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
