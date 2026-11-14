/**
 * apps/web/src/pages/admin/AdminModelsPage.tsx
 * Professional Clinical Admin Model Management & Checkpoint Inspection (M6).
 * Clinical Minimalism × Modern AI Workspace.
 */

import React from 'react';
import { Tab4Models } from '../../components/Tab4Models';
import { Cpu } from 'lucide-react';

export const AdminModelsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      <div className="bg-white p-6 rounded-2xl border border-clinical-border shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-clinical-text">Quản Lý Mô Hình & Checkpoint BCI</h1>
            <p className="text-xs text-clinical-secondary">
              Kiểm tra metrics held-out, kích hoạt mô hình active, huấn luyện tiến trình nền và tải lên an toàn
            </p>
          </div>
        </div>
      </div>

      <Tab4Models />
    </div>
  );
};
