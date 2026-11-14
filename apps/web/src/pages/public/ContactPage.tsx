/**
 * apps/web/src/pages/public/ContactPage.tsx
 * Contact & Clinical Trial Inquiries for NEURO-SPEECH (M6).
 */

import React, { useState } from 'react';
import { PublicNav } from '../../components/public/PublicNav';
import { PublicFooter } from '../../components/public/PublicFooter';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    inquiryType: 'clinical',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-gray-100 flex flex-col font-sans">
      <PublicNav />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <span className="text-xs font-mono font-semibold text-cyan-400 uppercase tracking-widest">Hợp Tác Nghiên Cứu</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Liên Hệ & Thử Nghiệm Lâm Sàng</h1>
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
            Chúng tôi chào đón sự hợp tác từ các bệnh viện phục hồi chức năng, trung tâm nghiên cứu khoa học thần kinh và các tổ chức trợ giúp người khuyết tật.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Info Side */}
          <div className="space-y-6">
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 space-y-4">
              <h3 className="text-lg font-bold text-white">Phòng Thí Nghiệm & Trung Tâm BCI</h3>
              <div className="space-y-3 text-xs text-gray-300">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Khu Công nghệ Cao, TP. Hồ Chí Minh / Hà Nội, Việt Nam</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>research@neuro-speech.local</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>+84 (0) 28 3822 xxxx (Giờ hành chính)</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-950/20 p-6 rounded-2xl border border-blue-800/40 text-xs text-gray-300 space-y-2">
              <h4 className="font-semibold text-blue-300">Đăng Ký Tham Gia Nghiên Cứu</h4>
              <p className="text-gray-400 leading-relaxed">
                Các gia đình có bệnh nhân ALS hoặc di chứng đột quỵ mong muốn tham gia thử nghiệm lâm sàng miễn phí vui lòng liên hệ trực tiếp với nhóm nghiên cứu. Mọi quy trình đều tuân thủ sự chấp thuận của Hội đồng Đạo đức Y sinh.
              </p>
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-gray-900/60 p-8 rounded-2xl border border-gray-800">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">Tin Nhắn Đã Được Gửi Thành Công</h3>
                <p className="text-xs text-gray-400">
                  Cảm ơn bạn đã liên hệ. Đội ngũ nghiên cứu sẽ phản hồi trong vòng 2 ngày làm việc.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs rounded-lg text-white"
                >
                  Gửi tin nhắn khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Nguyễn Văn A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Email liên hệ *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Tổ chức / Đơn vị công tác</label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Bệnh viện / Trường Đại học"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Mục đích liên hệ</label>
                  <select
                    value={formData.inquiryType}
                    onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                    className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="clinical">Đăng ký Thử nghiệm Lâm sàng</option>
                    <option value="research">Hợp tác Học thuật / Dự án Nghiên cứu</option>
                    <option value="technical">Hỗ trợ Kỹ thuật & Cài đặt Mã nguồn</option>
                    <option value="other">Ý kiến đóng góp khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">Nội dung tin nhắn *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-[#070B14] border border-gray-800 rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    placeholder="Vui lòng chia sẻ chi tiết nhu cầu..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-cyan-600/30 flex items-center justify-center space-x-2 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi Yêu Cầu Liên Hệ</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
