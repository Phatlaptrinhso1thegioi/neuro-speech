/**
 * apps/web/src/pages/public/TechnologyPage.tsx
 * Scientific & Technical Deep Dive for NEURO-SPEECH (M6).
 */

import React from 'react';
import { PublicNav } from '../../components/public/PublicNav';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Cpu, Zap, Activity, Clock, Layers, ShieldCheck } from 'lucide-react';

export const TechnologyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100 flex flex-col font-sans">
      <PublicNav />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">Kiến Trúc Khoa Học</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Công Nghệ & Xử Lý Tín Hiệu</h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            Nền tảng vận hành trên các nguyên lý điện sinh lý học chính xác, thuật toán xử lý tín hiệu nhân quả và mô hình học máy tối ưu cho dữ liệu nhỏ.
          </p>
        </div>

        {/* Section 1: Causal SOS Filtering */}
        <div className="bg-gray-900/60 p-8 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center space-x-3 text-cyan-400">
            <Cpu className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">1. Bộ Lọc Nhân Quả Causal SOS với Lưu Giữ Trạng Thái</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Trong nghiên cứu EEG truyền thống, các nhà khoa học thường áp dụng bộ lọc hai chiều zero-phase (<code className="text-cyan-300 font-mono">filtfilt</code>). Tuy nhiên, phương pháp này đòi hỏi phải có toàn bộ tín hiệu trong tương lai, hoàn toàn bất khả thi trong luồng thời gian thực hoặc phát lại trực tiếp.
          </p>
          <div className="bg-[#070B14] p-4 rounded-xl border border-gray-800 text-xs font-mono text-gray-300 space-y-2">
            <p className="text-cyan-400 font-semibold">// Bộ lọc 4th-order Butterworth Bandpass (0.1–20 Hz) biểu diễn dưới dạng Second-Order Sections (SOS):</p>
            <p className="text-gray-400">y_k, z_k+1 = scipy.signal.sosfilt(sos, x_k, zi=z_k)</p>
            <p className="text-gray-400">// Khởi tạo trạng thái ban đầu ổn định qua scipy.signal.sosfilt_zi và tái khởi động ấm 2.0s khi tua timeline.</p>
          </div>
        </div>

        {/* Section 2: LDA Baseline vs CNN-Transformer */}
        <div className="bg-gray-900/60 p-8 rounded-2xl border border-gray-800 space-y-6">
          <div className="flex items-center space-x-3 text-blue-400">
            <Activity className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">2. So Sánh Mô Hình: Shrinkage LDA vs PyTorch CNN-Transformer</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Đánh giá nghiêm ngặt trên cùng tập kiểm thử độc lập (Held-Out Session 2, 576 flash, 96 target, 480 non-target):
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="py-2.5 px-3 font-semibold">Chỉ số Đo lường</th>
                  <th className="py-2.5 px-3 font-semibold text-cyan-400">Shrinkage LDA (M1 Baseline)</th>
                  <th className="py-2.5 px-3 font-semibold text-purple-400">CNN-Transformer (M5 PyTorch)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                <tr>
                  <td className="py-2.5 px-3 text-gray-300">ROC-AUC Test Flash</td>
                  <td className="py-2.5 px-3 text-green-400 font-bold">0.8900</td>
                  <td className="py-2.5 px-3 text-gray-400">0.6321</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-gray-300">Balanced Accuracy</td>
                  <td className="py-2.5 px-3 text-green-400 font-bold">80.00%</td>
                  <td className="py-2.5 px-3 text-gray-400">60.73%</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-gray-300">Độ chính xác Ký tự (3 reps)</td>
                  <td className="py-2.5 px-3 text-green-400 font-bold">100.0% (6/6: 6 _ C 4 B 5)</td>
                  <td className="py-2.5 px-3 text-gray-400">50.0% (3/6)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-gray-300">Tốc độ truyền tin (Peak ITR)</td>
                  <td className="py-2.5 px-3 text-green-400 font-bold">21.77 bits/min</td>
                  <td className="py-2.5 px-3 text-gray-400">8.12 bits/min</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-gray-300">Độ trễ suy luận (Median p50)</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold">0.116 ms</td>
                  <td className="py-2.5 px-3 text-gray-400">1.826 ms</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-gray-950/80 rounded-xl border border-gray-800 text-xs text-gray-300 space-y-1.5">
            <span className="font-semibold text-amber-400">Kết luận Khoa học (Honest Telemetry):</span>
            <p className="text-gray-400 leading-relaxed">
              Mô hình Shrinkage LDA với ước lượng co hiệp phương sai Ledoit-Wolf vượt trội hoàn toàn so với mạng nơ-ron sâu trong môi trường mẫu hiệu chuẩn nhỏ (1,152 epoch huấn luyện). Do đó, Shrinkage LDA được giữ làm mô hình chuẩn vận hành chính thức của hệ thống.
            </p>
          </div>
        </div>

        {/* Section 3: Latency Budget */}
        <div className="bg-gray-900/60 p-8 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center space-x-3 text-green-400">
            <Clock className="w-6 h-6" />
            <h2 className="text-xl font-bold text-white">3. Ngân Sách Độ Trễ Thời Gian Thực (Latency Budget)</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Để đảm bảo người bệnh không bị mỏi nhận thức và giao diện luôn tức thì, toàn bộ quy trình từ lúc kết thúc chu kỳ nhấp nháy đến khi hiển thị chữ cái lên màn hình có tổng độ trễ tính toán dưới 5 ms:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono text-xs">
            <div className="bg-[#070B14] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 block mb-1">Lọc Causal SOS</span>
              <span className="text-cyan-400 text-sm font-bold">0.041 ms</span>
            </div>
            <div className="bg-[#070B14] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 block mb-1">Suy luận LDA</span>
              <span className="text-cyan-400 text-sm font-bold">0.116 ms</span>
            </div>
            <div className="bg-[#070B14] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 block mb-1">Tra cứu Từ Điển</span>
              <span className="text-cyan-400 text-sm font-bold">0.180 ms</span>
            </div>
            <div className="bg-[#070B14] p-3 rounded-xl border border-gray-800">
              <span className="text-gray-400 block mb-1">Vẽ Canvas 60 FPS</span>
              <span className="text-cyan-400 text-sm font-bold">2.100 ms</span>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
