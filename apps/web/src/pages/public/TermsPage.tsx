/**
 * apps/web/src/pages/public/TermsPage.tsx
 * Terms of Use & Legal Disclaimers for NEURO-SPEECH (M6).
 */

import React from 'react';
import { PublicNav } from '../../components/public/PublicNav';
import { PublicFooter } from '../../components/public/PublicFooter';
import { AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';

export const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100 flex flex-col font-sans">
      <PublicNav />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div className="space-y-3">
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">Pháp Lý & Phạm Vi Ứng Dụng</span>
          <h1 className="text-3xl font-extrabold text-white">Điều Khoản Sử Dụng & Miễn Trừ Trách Nhiệm</h1>
          <p className="text-xs text-gray-400">Phiên bản 2.1 • Cập nhật: Tháng 11 năm 2026</p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
          <div className="bg-amber-950/30 border border-amber-800/50 p-6 rounded-2xl space-y-3 text-amber-200">
            <h2 className="text-base font-bold text-amber-300 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>1. Bản Thử Nghiệm Khoa Học — Không Phải Thiết Bị Y Tế Được Chứng Nhận</span>
            </h2>
            <p className="text-amber-200/90 leading-relaxed">
              NEURO-SPEECH là phần mềm nguyên mẫu nghiên cứu khoa học và công nghệ hỗ trợ. Hệ thống KHÔNG phải là thiết bị chẩn đoán y khoa đạt chứng nhận CE Medical Device hay FDA 510(k). Người dùng và cơ sở y tế chịu trách nhiệm áp dụng với sự giám sát chuyên môn của bác sĩ.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>2. Cảnh Báo Cuộc Gọi Khẩn Cấp (Nút F3)</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Tính năng hỗ trợ khẩn cấp F3 ("Tôi cần trợ giúp khẩn cấp.") đóng vai trò thông báo cho nhân viên chăm sóc tại chỗ qua loa hoặc màn hình. Tính năng này KHÔNG tự động kết nối và không thay thế việc quay số gọi dịch vụ cấp cứu khẩn cấp 115 tại Việt Nam hoặc 911 tại Bắc Mỹ.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>3. Quyền Sở Hữu Mã Nguồn Mở & Giấy Phép Dữ Liệu</span>
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Mã nguồn hệ thống tuân thủ giấy phép nguồn mở. Bộ dữ liệu BNCI 2014-009 được cấp phép nghiên cứu công cộng. Từ điển tần suất tiếng Việt tuân thủ giấy phép MIT / CC-BY-SA 3.0 như đã được ghi nhận chi tiết tại <code className="text-cyan-400 font-mono">docs/WORDLIST_LICENSE.md</code>.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
