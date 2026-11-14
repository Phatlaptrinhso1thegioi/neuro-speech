/**
 * apps/web/src/components/public/PublicFooter.tsx
 * Footer component for public marketing & legal pages.
 * Deep black industrial finish with required clinical & ethics disclaimers.
 * Bilingual support (VI / EN).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Cpu } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const PublicFooter: React.FC = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-black border-t border-neutral-800 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-base tracking-wider text-cyan-400 font-mono">NEURO-SPEECH</span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {language === 'vi'
                ? 'Nguyên mẫu nghiên cứu giao diện não - máy tính (BCI) hỗ trợ người suy giảm vận động và phát âm nặng giao tiếp tiếng Việt chuẩn Telex qua điện thế gợi P300.'
                : 'Research brain-computer interface (BCI) prototype assisting severely paralyzed and non-verbal patients to communicate via P300 evoked potentials.'}
            </p>
            <div className="flex items-center space-x-2 text-[11px] text-cyan-500 font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>Pipeline: Causal SOS + Regularized LDA</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              {language === 'vi' ? 'Khám phá' : 'Explore'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-cyan-400 transition-colors">
                  {language === 'vi' ? 'Trang chủ' : 'Home'}
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-cyan-400 transition-colors">
                  {language === 'vi' ? 'Về dự án NEURO-SPEECH' : 'About NEURO-SPEECH'}
                </Link>
              </li>
              <li>
                <Link to="/technology" className="hover:text-cyan-400 transition-colors">
                  {language === 'vi' ? 'Kiến trúc Công nghệ & Khoa học' : 'Technology Architecture'}
                </Link>
              </li>
              <li>
                <Link to="/features" className="hover:text-cyan-400 transition-colors">
                  {language === 'vi' ? 'Tính năng Hỗ trợ Giao tiếp' : 'Assistive Features'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Research & Legal */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">
              {language === 'vi' ? 'Pháp lý & Đạo đức BCI' : 'Legal & Ethics'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="hover:text-cyan-400 transition-colors">
                  {language === 'vi' ? 'Chính sách Bảo mật Dữ liệu Não' : 'Neural Data Privacy Policy'}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-cyan-400 transition-colors">
                  {language === 'vi' ? 'Điều khoản Sử dụng & Miễn trừ' : 'Terms of Use & Disclaimers'}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-400 transition-colors">
                  {language === 'vi' ? 'Hợp tác Lâm sàng & Liên hệ' : 'Clinical Collaboration'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Mandatory Medical Notice */}
          <div className="bg-neutral-900/90 border border-amber-500/40 rounded-2xl p-4 text-amber-200/90 text-xs space-y-2 shadow-lg">
            <div className="flex items-center space-x-2 font-bold text-amber-400">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>
                {language === 'vi'
                  ? 'Lưu ý Y tế Bắt buộc'
                  : 'Mandatory Medical Notice (Lưu ý Y tế Bắt buộc)'}
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-300">
              {language === 'vi'
                ? 'NEURO-SPEECH là nguyên mẫu công nghệ hỗ trợ và nghiên cứu khoa học. Hệ thống không phải là thiết bị chẩn đoán y tế được cấp chứng nhận.'
                : 'NEURO-SPEECH is a research and assistive technology prototype. It is not an FDA/CE certified medical diagnostic device.'}
            </p>
            <p className="text-[11px] leading-relaxed text-amber-400/90 font-medium">
              {language === 'vi'
                ? 'Chức năng khẩn cấp (F3) không thay thế việc gọi cấp cứu khẩn cấp 115 / 911.'
                : 'Emergency functions (F3) do not replace contacting official emergency services (115 / 911).'}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-neutral-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500">
          <div>
            © 2026 NEURO-SPEECH Project. Open Research & Assistive Technology Platform.
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <span>BNCI 2014-009 Dataset of Record</span>
            <span>•</span>
            <span>Unicode NFC Vietnamese Telex</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
