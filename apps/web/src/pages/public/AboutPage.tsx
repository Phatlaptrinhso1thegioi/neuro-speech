/**
 * apps/web/src/pages/public/AboutPage.tsx
 * About NEURO-SPEECH: Mission, Research Ethics, Non-Invasive BCI.
 */

import React from 'react';
import { PublicNav } from '../../components/public/PublicNav';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Heart, ShieldCheck, Microscope, Award } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100 flex flex-col font-sans">
      <PublicNav />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">Sứ Mệnh & Tầm Nhìn</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Về Dự Án NEURO-SPEECH</h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            NEURO-SPEECH là dự án công nghệ hỗ trợ phi lợi nhuận hướng tới cộng đồng bệnh nhân suy giảm vận động và mất giọng nói nghiêm trọng tại Việt Nam và trên thế giới.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 mb-2">
              <Heart className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Nhân bản & Quyền Giao tiếp Tự chủ</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Mỗi con người đều có quyền bày tỏ suy nghĩ, cảm xúc và nhu cầu chăm sóc cơ bản. NEURO-SPEECH được thiết kế để trao lại quyền tự chủ giao tiếp cho những bệnh nhân bị khóa trong cơ thể của chính mình mà không cần can thiệp phẫu thuật não xâm lấn.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950 flex items-center justify-center text-blue-400 mb-2">
              <Microscope className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Chuẩn mực Nghiên cứu Khoa học Khắt khe</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Hệ thống dựa trên dữ liệu chuẩn quốc tế BNCI 2014-009, áp dụng phương pháp lọc nhân quả Second-Order Sections (SOS) với lưu giữ trạng thái, không rò rỉ dữ liệu qua tập held-out độc lập, và minh bạch hoàn toàn về các độ trễ phần cứng và suy luận.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-green-950 flex items-center justify-center text-green-400 mb-2">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Đạo đức Trí tuệ Nhân tạo & BCI</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Các mô hình ngôn ngữ và gợi ý từ vựng đóng vai trò hỗ trợ tăng tốc gõ, nhưng không bao giờ được phép tự ý thay thế hay sửa đổi tín hiệu mong muốn của người bệnh. Mọi hành động đều cần xác nhận chủ động từ người dùng.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-950 flex items-center justify-center text-amber-400 mb-2">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Tối ưu Riêng cho Tiếng Việt</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Được trang bị bộ phân tích Telex chuẩn quy tắc đặt dấu truyền thống (hòa/hóa), xử lý hoàn nguyên phím gõ (modifier undo), và từ điển tần suất offline tiếng Việt phong phú mà không cần kết nối Internet máy chủ bên ngoài.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
