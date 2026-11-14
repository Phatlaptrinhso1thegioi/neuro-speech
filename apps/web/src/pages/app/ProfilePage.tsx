/**
 * apps/web/src/pages/app/ProfilePage.tsx
 * Professional Clinical User Profile & Identity Management (M6).
 */

import React from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-clinical-border shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-clinical-blue/10 border border-clinical-blue/20 rounded-xl text-clinical-blue">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-clinical-text">
              {language === 'vi' ? 'Hồ Sơ Chuyên Viên / Bác Sĩ' : 'Clinician & Operator Profile'}
            </h1>
            <p className="text-xs text-clinical-secondary">
              {language === 'vi'
                ? 'Thông tin định danh và phân quyền vận hành hệ thống BCI lâm sàng NEURO-SPEECH'
                : 'Identity credentials and role-based clinical BCI operational permissions'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-clinical-border shadow-xs space-y-6">
        <div className="flex items-center space-x-4 pb-6 border-b border-clinical-border">
          <div className="w-16 h-16 rounded-2xl bg-clinical-blue/10 border border-clinical-blue/20 flex items-center justify-center text-clinical-blue text-2xl font-bold font-mono">
            {user?.username?.slice(0, 2).toUpperCase() || 'NS'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-clinical-text">{user?.full_name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-blue-50 text-clinical-blue border border-blue-200">
                {language === 'vi' ? `Vai trò: ${user?.role}` : `Role: ${user?.role}`}
              </span>
            </div>
            <span className="text-xs font-mono text-clinical-secondary block">@{user?.username}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-gray-50/80 rounded-xl border border-clinical-border space-y-1">
            <span className="text-clinical-secondary font-medium">
              {language === 'vi' ? 'Mã Định Danh (User ID)' : 'User Identifier (ID)'}
            </span>
            <p className="text-clinical-text font-mono font-bold text-sm">#{user?.id}</p>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-clinical-border space-y-1">
            <span className="text-clinical-secondary font-medium">
              {language === 'vi' ? 'Email Liên Kết' : 'Registered Email'}
            </span>
            <p className="text-clinical-text font-mono text-sm">{user?.email}</p>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-clinical-border space-y-1">
            <span className="text-clinical-secondary font-medium">
              {language === 'vi' ? 'Cơ Chế Xác Thực Lâm Sàng' : 'Clinical Authentication Engine'}
            </span>
            <p className="text-clinical-text font-mono font-semibold">
              {language === 'vi'
                ? 'JWT Offline • Băm Argon2id Chuẩn Y Tế'
                : 'Offline JWT Bearer • Argon2id Medical Hashing'}
            </p>
          </div>

          <div className="p-4 bg-gray-50/80 rounded-xl border border-clinical-border space-y-1">
            <span className="text-clinical-secondary font-medium">
              {language === 'vi' ? 'Quyền Hạn BCI' : 'BCI System Privileges'}
            </span>
            <p className="text-clinical-text font-mono font-semibold">
              {user?.role === 'admin'
                ? language === 'vi'
                  ? 'Toàn quyền Quản trị & Kích hoạt Model Checkpoint'
                  : 'SuperAdmin & AI Checkpoint Governance'
                : user?.role === 'researcher'
                ? language === 'vi'
                  ? 'Huấn luyện BCI & Quản lý Bệnh nhân'
                  : 'BCI Signal Research, Training & Patient Telemetry'
                : language === 'vi'
                ? 'Chuyên viên chăm sóc lâm sàng (Speller & Survival)'
                : 'Clinical Caregiver (Speller & Survival Mode)'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
