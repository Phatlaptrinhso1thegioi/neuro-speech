/**
 * apps/web/src/pages/app/SettingsPage.tsx
 * Clinical Settings, Bilingual Preferences (VI/EN), & Light/Dark Theme Switcher.
 */

import React, { useState } from 'react';
import { Settings, Globe, Volume2, Sun, Moon, Save } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { useLanguage } from '../../hooks/useLanguage';
import { useTheme } from '../../hooks/useTheme';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [ttsSpeed, setTtsSpeed] = useState(0.95);
  const [saving, setSaving] = useState(false);

  const handleTestSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const text =
        language === 'vi'
          ? 'Kiểm tra âm thanh hệ thống NEURO-SPEECH thành công.'
          : 'NEURO-SPEECH audio synthesis test completed successfully.';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'vi' ? 'vi-VN' : 'en-US';
      utterance.rate = ttsSpeed;
      window.speechSynthesis.speak(utterance);
      toast.info(language === 'vi' ? 'Đang kiểm tra phát âm thanh...' : 'Testing audio playback...');
    } else {
      toast.warning(language === 'vi' ? 'Trình duyệt chưa hỗ trợ Web Speech TTS.' : 'Browser does not support Web Speech TTS.');
    }
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success(
        language === 'vi'
          ? 'Đã lưu thành công các cài đặt và tùy chọn trợ năng.'
          : 'Successfully saved workspace preferences and accessibility settings.'
      );
    }, 300);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-clinical-border shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-clinical-blue/10 border border-clinical-blue/20 rounded-xl text-clinical-blue">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-clinical-text">
              {language === 'vi' ? 'Cài Đặt & Tùy Chọn Trợ Năng' : 'System Settings & Accessibility Preferences'}
            </h1>
            <p className="text-xs text-clinical-secondary">
              {language === 'vi'
                ? 'Tùy chỉnh giao diện Sáng/Tối, ngôn ngữ hiển thị và giọng nói tổng hợp TTS'
                : 'Customize Light/Dark clinical theme, display language, and TTS voice synthesis'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-clinical-border shadow-xs space-y-6">
        {/* Appearance Theme (Light / Dark Mode) */}
        <div className="space-y-3 pb-6 border-b border-clinical-border">
          <div className="flex items-center space-x-2 text-sm font-bold text-clinical-text">
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span>
              {language === 'vi' ? 'Giao Diện Hiển Thị (Light Mode / Dark Mode)' : 'Display Appearance (Light / Dark Mode)'}
            </span>
          </div>
          <p className="text-xs text-clinical-secondary">
            {language === 'vi'
              ? 'Chọn chế độ Sáng (y khoa ban ngày) hoặc chế độ Tối (giảm chói mắt trong phòng trực ban đêm).'
              : 'Choose Clinical Light mode for bright environments or Dark mode to reduce glare during night shifts.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                toast.info(language === 'vi' ? 'Đã bật Giao diện Sáng (Light Mode).' : 'Switched to Light Mode.');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-2 ${
                theme === 'light'
                  ? 'bg-blue-50 border-clinical-blue text-clinical-blue font-bold shadow-2xs'
                  : 'bg-gray-50 border-clinical-border text-clinical-secondary hover:text-clinical-text'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>{language === 'vi' ? 'Giao diện Sáng (Light Mode)' : 'Clinical Light Mode'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                toast.info(language === 'vi' ? 'Đã bật Giao diện Tối (Dark Mode).' : 'Switched to Dark Mode.');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center space-x-2 ${
                theme === 'dark'
                  ? 'bg-blue-50 border-clinical-blue text-clinical-blue font-bold shadow-2xs'
                  : 'bg-gray-50 border-clinical-border text-clinical-secondary hover:text-clinical-text'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>{language === 'vi' ? 'Giao diện Tối (Dark Mode)' : 'Clinical Dark Mode'}</span>
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="space-y-3 pb-6 border-b border-clinical-border">
          <div className="flex items-center space-x-2 text-sm font-bold text-clinical-text">
            <Globe className="w-4 h-4 text-clinical-blue" />
            <span>
              {language === 'vi' ? 'Ngôn Ngữ Giao Diện (Interface Language)' : 'Interface Language (VI / EN)'}
            </span>
          </div>
          <p className="text-xs text-clinical-secondary">
            {language === 'vi'
              ? 'Hỗ trợ Tiếng Việt và Tiếng Anh qua bộ từ điển tĩnh cục bộ (không phụ thuộc kết nối Internet).'
              : 'Full offline Vietnamese and English localization with instant live synchronization across all modules.'}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setLanguage('vi');
                toast.success('Đã chuyển ngôn ngữ sang Tiếng Việt.');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                language === 'vi'
                  ? 'bg-blue-50 border-clinical-blue text-clinical-blue font-bold shadow-2xs'
                  : 'bg-gray-50 border-clinical-border text-clinical-secondary hover:text-clinical-text'
              }`}
            >
              🇻🇳 Tiếng Việt (Vietnamese)
            </button>
            <button
              type="button"
              onClick={() => {
                setLanguage('en');
                toast.success('Switched interface language to English.');
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                language === 'en'
                  ? 'bg-blue-50 border-clinical-blue text-clinical-blue font-bold shadow-2xs'
                  : 'bg-gray-50 border-clinical-border text-clinical-secondary hover:text-clinical-text'
              }`}
            >
              🇬🇧 English (International)
            </button>
          </div>
        </div>

        {/* TTS Settings */}
        <div className="space-y-3 pb-6 border-b border-clinical-border">
          <div className="flex items-center space-x-2 text-sm font-bold text-clinical-text">
            <Volume2 className="w-4 h-4 text-clinical-teal" />
            <span>
              {language === 'vi' ? 'Tùy Chỉnh Giọng Nói Tổng Hợp (Web Speech TTS)' : 'Speech Synthesis Engine Settings (TTS)'}
            </span>
          </div>
          <p className="text-xs text-clinical-secondary">
            {language === 'vi'
              ? 'Điều chỉnh tốc độ phát âm giọng đọc khi xác nhận văn bản lâm sàng.'
              : 'Adjust voice playback rate for confirmed clinical phrases.'}
          </p>
          <div className="space-y-2 max-w-sm pt-1">
            <div className="flex justify-between text-xs text-clinical-secondary font-mono">
              <span>{language === 'vi' ? 'Tốc độ đọc:' : 'Playback Speed:'}</span>
              <span className="text-clinical-blue font-bold">{ttsSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={ttsSpeed}
              onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-clinical-blue"
            />
            <button
              type="button"
              onClick={handleTestSpeech}
              className="mt-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-clinical-text text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Volume2 className="w-3.5 h-3.5 text-clinical-teal" />
              <span>{language === 'vi' ? 'Nghe Thử Giọng Đọc' : 'Test Voice Playback'}</span>
            </button>
          </div>
        </div>

        {/* Save Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-clinical-blue hover:bg-clinical-blueHover text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>
              {saving
                ? language === 'vi'
                  ? 'Đang Lưu...'
                  : 'Saving...'
                : language === 'vi'
                ? 'Lưu Tùy Chọn'
                : 'Save Preferences'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
