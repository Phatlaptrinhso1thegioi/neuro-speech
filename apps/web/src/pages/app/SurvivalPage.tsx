/**
 * apps/web/src/pages/app/SurvivalPage.tsx
 * Professional Clinical Quick Survival Communication Interface (M6).
 */

import React from 'react';
import { Tab3Survival } from '../../components/Tab3Survival';
import { HeartHandshake, Activity, Cpu } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const SurvivalPage: React.FC = () => {
  const { language } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div className="bg-white p-6 rounded-2xl border border-clinical-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold text-clinical-text">
                {language === 'vi' ? 'Giao Tiếp Sinh Tồn Nhanh (F1–F4)' : 'Quick Survival Communication (F1–F4)'}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold">
                BCI P300 Oddball
              </span>
            </div>
            <p className="text-xs text-clinical-secondary">
              {language === 'vi'
                ? 'Nạp tệp .CSV sóng não để hệ thống tự động nhận diện nhu cầu sinh tồn và phát âm tiếng Việt qua loa.'
                : 'Load EEG .CSV recordings for automated survival intent decoding and instant TTS synthesis.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-clinical-secondary">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-clinical-border text-[11px]">
            <Activity className="w-3.5 h-3.5 text-clinical-teal" />
            <span className="text-clinical-text font-medium">256 Hz Causal SOS</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gray-50 border border-clinical-border text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-clinical-text font-medium">Shrinkage LDA (v1.0)</span>
          </div>
        </div>
      </div>

      <Tab3Survival />
    </div>
  );
};
