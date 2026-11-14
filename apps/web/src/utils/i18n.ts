/**
 * Static Bilingual Dictionary (English / Vietnamese) for NEURO-SPEECH (M6).
 * No external API dependencies. Strict static dictionary.
 */

export type Language = 'vi' | 'en';

export const translations = {
  vi: {
    // Navigation & General
    brandName: 'NEURO-SPEECH',
    tagline: 'Hệ Thống Giao Tiếp Não - Máy Không Xâm Lấn',
    home: 'Trang chủ',
    about: 'Giới thiệu',
    technology: 'Công nghệ',
    features: 'Tính năng',
    contact: 'Liên hệ',
    privacy: 'Bảo mật',
    terms: 'Điều khoản',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    dashboard: 'Tổng quan',
    studio: 'Phòng thí nghiệm BCI',
    monitoring: 'Giám sát EEG',
    survival: 'Giao tiếp sinh tồn',
    history: 'Lịch sử giao tiếp',
    sessions: 'Phiên EEG',
    profile: 'Hồ sơ',
    settings: 'Cài đặt',
    admin: 'Quản trị hệ thống',

    // Landing Page
    heroTitle: 'Giao tiếp bằng Tín hiệu Sóng não P300',
    heroSubtitle: 'Công nghệ giao diện não - máy tính (BCI) hỗ trợ người suy giảm vận động và giọng nói nghiêm trọng chuyển đổi ý định thành lời nói tiếng Việt có dấu qua chuẩn Telex.',
    getStarted: 'Bắt đầu sử dụng',
    exploreTech: 'Tìm hiểu công nghệ',
    previewBadge: 'Bản thử nghiệm lâm sàng & nghiên cứu v2.1',

    // Problem Section
    problemTitle: 'Rào cản Giao tiếp & Giải pháp',
    problemDesc: 'Những bệnh nhân mắc hội chứng khóa trong (Locked-in Syndrome), xơ cứng teo cơ một bên (ALS) hay đột quỵ cuống não mất hoàn toàn khả năng phát âm và vận động cơ bắp, nhưng chức năng nhận thức và xử lý kích thích thị giác vẫn còn nguyên vẹn.',
    problemSolTitle: 'Tập trung Thị giác Tạo Sóng P300',
    problemSolDesc: 'Khi người dùng chú ý vào ký tự mong muốn trên ma trận nhấp nháy, não bộ phát ra điện thế gợi P300 sau 300ms. NEURO-SPEECH trích xuất và giải mã tín hiệu này theo thời gian thực.',

    // How It Works Pipeline
    pipelineTitle: 'Quy trình Xử lý Tín hiệu Khép kín',
    step1: 'Thu nhận EEG 16 Kênh (256 Hz)',
    step2: 'Lọc Causal SOS (0.1–20 Hz)',
    step3: 'Trích xuất Epoch Khóa Kích thích',
    step4: 'Bộ giải mã Shrinkage LDA',
    step5: 'Bộ đệm Telex Tiếng Việt (NFC)',
    step6: 'Gợi ý Từ Ngữ Offline + Bigram',
    step7: 'Xác nhận Rõ ràng từ Người dùng',
    step8: 'Tổng hợp Giọng nói Web Speech TTS',

    // Studio & Monitoring
    liveReplay: 'Phát lại Dữ liệu Thật',
    syntheticSim: 'Mô phỏng Nhân tạo',
    heldOutBadge: 'Tập Held-Out Không Rò rỉ',
    staffOverride: 'Ghi đè Nhân viên Chăm sóc',
    speak: 'Phát âm (TTS)',
    confirmedText: 'Văn bản Đã xác nhận:',
    rawBuffer: 'Ký tự Vừa giải mã:',
    telexBuffer: 'Đệm Telex Hiện tại:',
    accept: 'Xác nhận (ACCEPT)',
    continueTyping: 'Tiếp tục gõ (CONTINUE)',
    nextSuggestion: 'Gợi ý tiếp theo (NEXT)',
    backspace: 'Xóa lùi (BACKSPACE)',
    clear: 'Xóa trắng',
    confirmHighStakes: 'Xác nhận Hành động',

    // Survival
    urgentHelp: 'Tôi cần trợ giúp khẩn cấp.',
    urgentWarning: 'Nút trợ giúp khẩn cấp F3 không thay thế việc gọi cấp cứu y tế 115.',
    cancelWindow: 'Hủy trong:',
    confirmed: 'Đã xác nhận',
    seconds: 'giây',

    // Disclaimer
    disclaimer: 'Nguyên mẫu Nghiên cứu & Công nghệ Hỗ trợ — Không phải là thiết bị chẩn đoán y tế được cấp phép.',
  },
  en: {
    // Navigation & General
    brandName: 'NEURO-SPEECH',
    tagline: 'Non-Invasive Brain-Computer Interface',
    home: 'Home',
    about: 'About',
    technology: 'Technology',
    features: 'Features',
    contact: 'Contact',
    privacy: 'Privacy',
    terms: 'Terms',
    login: 'Sign In',
    register: 'Register',
    logout: 'Sign Out',
    dashboard: 'Dashboard',
    studio: 'Neuro Studio',
    monitoring: 'EEG Monitoring',
    survival: 'Quick Survival',
    history: 'Communication History',
    sessions: 'EEG Sessions',
    profile: 'Profile',
    settings: 'Settings',
    admin: 'Admin Console',

    // Landing Page
    heroTitle: 'Communication Through P300 Brain Waves',
    heroSubtitle: 'Assistive Brain-Computer Interface enabling individuals with severe speech and motor impairments to communicate in Vietnamese and English via authentic P300 neural decoding.',
    getStarted: 'Get Started',
    exploreTech: 'Explore Technology',
    previewBadge: 'Research & Assistive Clinical Prototype v2.1',

    // Problem Section
    problemTitle: 'The Communication Barrier & Our Solution',
    problemDesc: 'Individuals with locked-in syndrome, severe ALS, or brainstem stroke lose voluntary motor and vocal abilities while cortical visual and cognitive functions remain fully intact.',
    problemSolTitle: 'Targeted Visual Oddball Paradigm',
    problemSolDesc: 'Attending to a desired character on an oddball flashing matrix elicits a positive P300 event-related potential ~300ms post-stimulus, decoded in real-time by NEURO-SPEECH.',

    // How It Works Pipeline
    pipelineTitle: 'Closed-Loop Signal Processing Pipeline',
    step1: '16-Channel EEG Acquisition (256 Hz)',
    step2: 'Causal SOS Bandpass Filter (0.1–20 Hz)',
    step3: 'Stimulus-Locked Epoching (-100 to +800 ms)',
    step4: 'Shrinkage LDA Classification Engine',
    step5: 'Vietnamese Telex State Machine (NFC)',
    step6: 'Offline Frequency Lexicon & Bigram Boost',
    step7: 'Explicit User Confirmation Gate',
    step8: 'Synthesized Text-to-Speech (TTS)',

    // Studio & Monitoring
    liveReplay: 'Real Dataset Replay',
    syntheticSim: 'Synthetic Simulation',
    heldOutBadge: 'Strict Held-Out Split',
    staffOverride: 'Staff Override Active',
    speak: 'Speak Text (TTS)',
    confirmedText: 'Confirmed Text:',
    rawBuffer: 'Raw Predicted Char:',
    telexBuffer: 'Active Telex Buffer:',
    accept: 'Accept Suggestion',
    continueTyping: 'Continue Typing',
    nextSuggestion: 'Next Candidate',
    backspace: 'Backspace',
    clear: 'Clear',
    confirmHighStakes: 'Confirm High-Stakes Action',

    // Survival
    urgentHelp: 'I need urgent emergency help.',
    urgentWarning: 'F3 Urgent Help does not replace calling 115 or 911 emergency services.',
    cancelWindow: 'Canceling in:',
    confirmed: 'Confirmed',
    seconds: 'seconds',

    // Disclaimer
    disclaimer: 'Research & Assistive-Technology Prototype — Not a certified medical diagnostic device.',
  }
};
