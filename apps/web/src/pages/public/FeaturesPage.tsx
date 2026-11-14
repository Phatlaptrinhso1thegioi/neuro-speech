/**
 * apps/web/src/pages/public/FeaturesPage.tsx
 * Product Features Showcase for NEURO-SPEECH (M6).
 */

import React from 'react';
import { PublicNav } from '../../components/public/PublicNav';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Layers, Zap, Volume2, ShieldAlert, Cpu, CheckSquare } from 'lucide-react';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100 flex flex-col font-sans">
      <PublicNav />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">Tính Năng Toàn Diện</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Tính Năng Nền Tảng NEURO-SPEECH</h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            Được thiết kế chuyên biệt để đáp ứng cả nhu cầu giao tiếp khẩn cấp tức thời lẫn soạn thảo văn bản tự do bằng tiếng Việt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 mb-2">
              <Layers className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Ma Trận Đánh Vần 6×6 Đa Ký Tự</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Bao gồm đầy đủ 26 chữ cái Latinh, 10 chữ số (0–9) và ký tự khoảng trắng (_). Thuật toán nhấp nháy ngẫu nhiên theo hàng và cột (Row-Column Speller) với độ dài chớp sáng 125 ms và khoảng nghỉ 125 ms chuẩn y sinh.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-950 flex items-center justify-center text-blue-400 mb-2">
              <Zap className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Quick Survival Communication (F1–F4)</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Các nút kích hoạt sinh tồn kích thước lớn, độ tương phản cao cho 4 nhu cầu thiết yếu: Nước uống (F1), Thức ăn (F2), Cần trợ giúp khẩn cấp (F3), Vệ sinh (F4). Thời gian đếm ngược 5 giây cho phép hủy bỏ trước khi phát chuông cảnh báo.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-green-950 flex items-center justify-center text-green-400 mb-2">
              <Volume2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Phát Âm Tiếng Việt Web Speech API</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Hệ thống tự động nhận diện và lựa chọn giọng đọc tiếng Việt (<code className="text-green-300 font-mono">vi-VN</code>) có sẵn trên trình duyệt. Chỉ phát âm những văn bản đã được người dùng hoặc người chăm sóc xác nhận dứt khoát.
            </p>
          </div>

          <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-950 flex items-center justify-center text-purple-400 mb-2">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Ghi Nhận Lịch Sử & Kiểm Toán Đầy Đủ</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Mỗi câu nói và thông điệp được xác nhận đều được lưu vào cơ sở dữ liệu SQLite cục bộ (WAL mode) cùng với thông tin phiên giải mã, độ chính xác, số lần lặp và nguồn dữ liệu để phục vụ việc theo dõi tiến triển lâm sàng.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
