/**
 * apps/web/src/pages/public/PrivacyPage.tsx
 * Neural Data Privacy & Audit Logging Policy for NEURO-SPEECH (M6).
 */

import React from 'react';
import { PublicNav } from '../../components/public/PublicNav';
import { PublicFooter } from '../../components/public/PublicFooter';
import { ShieldCheck, Lock, EyeOff, Server } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100 flex flex-col font-sans">
      <PublicNav />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">Quyền Riêng Tư & An Ninh Dữ Liệu Não</span>
          <h1 className="text-3xl font-extrabold text-white">Chính Sách Bảo Mật Dữ Liệu NEURO-SPEECH</h1>
          <p className="text-xs text-gray-400">Cập nhật lần cuối: Tháng 11 năm 2026 • Phiên bản 2.1</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>1. Dữ Liệu Tín Hiệu Điện Não (EEG) Là Dữ Liệu Nhạy Cảm Cao Cấp</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Tín hiệu điện não cá nhân được mã hóa và lưu trữ cục bộ. Hệ thống NEURO-SPEECH vận hành hoàn toàn offline, không truyền bất kỳ mẫu sóng não thô nào về các máy chủ điện toán đám mây công cộng bên thứ ba.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <EyeOff className="w-4 h-4 text-cyan-400" />
              <span>2. Tuyệt Đối Không Giám Sát Suy Nghĩ Tự Do</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Mô hình P300 chỉ giải mã các phản ứng thị giác đối với kích thích nhấp nháy có cấu trúc (6×6 Matrix hoặc F1–F4 Survival Targets). Không có cơ chế nào để ghi lại hoặc suy đoán các luồng suy nghĩ nội tâm không liên quan của người bệnh.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>3. Nhật Ký Kiểm Toán (Audit Logs) & Minh Bạch Hành Động</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Mọi hành vi đăng nhập, thay đổi thông tin bệnh nhân, huấn luyện mô hình, và xác nhận văn bản giao tiếp đều được ghi lại trong bảng <code className="text-cyan-400 font-mono">audit_logs</code> của SQLite. Quản trị viên y tế có thể tra cứu lịch sử bất kỳ lúc nào để bảo vệ quyền lợi người bệnh.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
