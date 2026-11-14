/**
 * apps/web/src/pages/admin/AdminSettingsPage.tsx
 * Professional Clinical Admin System Configurations & Environment Governance (M6).
 * Clinical Minimalism × Modern AI Workspace.
 */

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';

export const AdminSettingsPage: React.FC = () => {
  const toast = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getSettings();
      setSettings(data.settings);
    } catch (err) {
      console.error('Failed to load settings', err);
      toast.error('Không thể tải cấu hình quản trị.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdate = async (key: string, value: string) => {
    try {
      await api.admin.updateSetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
      setSavedKey(key);
      toast.success(`Đã lưu tham số '${key}'.`);
      setTimeout(() => setSavedKey(null), 2500);
    } catch (err: any) {
      toast.error(err?.message || 'Không thể lưu cài đặt.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-clinical-border shadow-xs">
        <div>
          <h1 className="text-xl font-extrabold text-clinical-text">Cấu Hình Quản Trị Hệ Thống</h1>
          <p className="text-xs text-clinical-secondary">
            Các tham số vận hành, chính sách lưu trữ và an ninh của nền tảng NEURO-SPEECH
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSettings}
          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-clinical-border text-xs text-clinical-text font-semibold transition-colors shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-clinical-secondary" />
          <span>Tải Lại Cấu Hình</span>
        </button>
      </div>

      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-clinical-border shadow-xs space-y-6">
        {loading ? (
          <div className="py-12 text-center text-xs text-clinical-secondary">Đang tải cấu hình hệ thống...</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(settings).map(([key, value]) => {
              const isSaved = savedKey === key;
              return (
                <div
                  key={key}
                  className="p-4 rounded-xl bg-gray-50/80 border border-clinical-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 sm:max-w-md">
                    <span className="font-bold text-clinical-text font-mono text-sm block">{key}</span>
                    <span className="text-[11px] text-clinical-secondary">
                      {key === 'REPLAY_DEFAULT_SPEED' && 'Tốc độ phát mặc định của replay engine (1.0 = thời gian thực)'}
                      {key === 'CAUSAL_FILTER_WARMUP_S' && 'Khoảng thời gian làm nóng bộ lọc IIR khi seek để tránh transient'}
                      {key === 'MAX_PREDICTION_CANDIDATES' && 'Số lượng từ tối đa gợi ý trên Suggestion Strip'}
                      {key === 'TTS_AUTO_SPEAK_AFTER_COMMIT' && 'Tự động phát âm thanh qua loa ngay sau khi cam kết'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      defaultValue={value}
                      id={`input-${key}`}
                      className="px-3 py-1.5 rounded-xl border border-clinical-border bg-white text-clinical-text font-mono text-xs w-36 focus:outline-none focus:border-clinical-blue"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`input-${key}`) as HTMLInputElement;
                        if (el) handleUpdate(key, el.value);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-clinical-blue hover:bg-clinical-blueHover text-white font-bold text-xs flex items-center space-x-1 shadow-2xs transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{isSaved ? 'Đã Lưu' : 'Lưu'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
