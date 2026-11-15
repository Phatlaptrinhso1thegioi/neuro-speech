import React, { useState, useEffect } from 'react';
import {
  Volume2,
  CheckCircle,
  RefreshCw,
  Delete,
  RotateCcw,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  AlertOctagon,
  VolumeX,
  Copy,
  Check,
  Sliders,
  Radio,
  Keyboard,
  ShieldCheck,
  Send,
} from 'lucide-react';
import { SpellerMatrix } from './SpellerMatrix';
import { SuggestionStrip } from './SuggestionStrip';
import { FourWayPanel } from './FourWayPanel';
import { SpellerState, FourWayEntry } from '../types';
import { useToast } from '../hooks/useToast';
import { getVietnameseVoice } from '../utils/tts';
import { useLanguage } from '../hooks/useLanguage';
import { ConfirmModal } from './common/ConfirmModal';

interface Tab2SpellerProps {
  spellerState: SpellerState;
  activeFlashGroup: number | null;
  lastDecodedCell: { row: number; col: number; char: string; score: number } | null;
  fourWayEntries: FourWayEntry[];
  staffOverrideActive: boolean;
  onInputChar: (char: string, row?: number, col?: number) => void;
  onAccept: (candidateIndex?: number) => void;
  onContinue: () => void;
  onNext: () => void;
  onBackspace: () => void;
  onClear: () => void;
  onHighStakesAction: (actionId: string) => void;
}

export const Tab2Speller: React.FC<Tab2SpellerProps> = ({
  spellerState,
  activeFlashGroup,
  lastDecodedCell,
  fourWayEntries,
  staffOverrideActive,
  onInputChar,
  onAccept,
  onContinue,
  onNext,
  onBackspace,
  onClear,
  onHighStakesAction,
}) => {
  const toast = useToast();
  const { language } = useLanguage();
  const [ttsSpeaking, setTtsSpeaking] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState(0.95);
  const [ttsVolume, setTtsVolume] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);

  // Load browser voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        const viVoice = getVietnameseVoice() || voices.find((v) => v.lang.startsWith('vi') || v.name.toLowerCase().includes('viet'));
        if (viVoice) {
          setSelectedVoiceUri(viVoice.voiceURI);
        }
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Browser SpeechSynthesis for confirmed text (Vietnamese Voice fallback)
  const handleSpeak = () => {
    const textToSpeak = spellerState.confirmed_sentence || spellerState.full_display_text;
    if (!textToSpeak.trim()) {
      toast.warning('Bộ đệm văn bản đang trống. Hãy giải mã hoặc chấp nhận từ ngữ trước.');
      return;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);

      // Selected voice or fallback
      const chosenVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceUri) ||
        getVietnameseVoice() ||
        availableVoices.find((v) => v.lang.startsWith('vi'));

      if (chosenVoice) {
        utterance.voice = chosenVoice;
        utterance.lang = chosenVoice.lang;
      } else {
        utterance.lang = 'vi-VN';
      }

      utterance.rate = ttsSpeed;
      utterance.volume = ttsVolume;
      utterance.onstart = () => setTtsSpeaking(true);
      utterance.onend = () => setTtsSpeaking(false);
      utterance.onerror = () => setTtsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      toast.info(`Đang phát âm: "${textToSpeak}"`);

      // Trigger two-step high stakes commit logging if armed
      onHighStakesAction('SPEAK');
    } else {
      toast.error('Trình duyệt chưa hỗ trợ Web Speech API.');
    }
  };

  const handleStopSpeech = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setTtsSpeaking(false);
      toast.info('Đã dừng phát âm thanh.');
    }
  };

  const handleCopyText = () => {
    const textToCopy = spellerState.confirmed_sentence || spellerState.full_display_text;
    if (!textToCopy.trim()) return;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast.success('Đã sao chép nội dung văn bản vào clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* ========================================================================= */}
      {/* 1. CENTRAL COMMUNICATION WORKSPACE & TEXT BUFFER                         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-clinical-border p-5 space-y-4 shadow-xs">
        {/* Workspace Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-clinical-border text-xs">
          <div className="flex items-center space-x-2">
            <Keyboard className="w-4 h-4 text-clinical-blue" />
            <h3 className="font-bold text-clinical-text uppercase tracking-wider">
              {language === 'vi'
                ? 'Bàn Giao Tiếp Lâm Sàng (Communication Workspace)'
                : 'Clinical Communication Workspace (P300 Speller)'}
            </h3>
          </div>

          <div className="flex items-center space-x-2 font-mono text-[11px]">
            <span className="text-clinical-secondary">
              {language === 'vi' ? 'Trạng thái FSM:' : 'FSM State:'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-clinical-blue font-bold border border-blue-200">
              {spellerState.state}
            </span>
          </div>
        </div>

        {/* Text Display Zones */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Active Sentence & Buffer Display */}
          <div className="lg:col-span-8 p-4 rounded-xl bg-gray-50/80 border border-clinical-border flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[10px] font-mono uppercase font-bold text-clinical-secondary">
                  {language === 'vi'
                    ? 'Bộ đệm văn bản chuẩn NFC (Telex & Từ gợi ý)'
                    : 'NFC Normalized Text Buffer (Telex & Word Candidates)'}
                </span>
                <span className="text-[11px] font-mono text-emerald-700 font-semibold flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{language === 'vi' ? 'Xác nhận rõ ràng' : 'Explicit Confirmation'}</span>
                </span>
              </div>

              {/* Word Pills Display */}
              <div className="flex items-center flex-wrap gap-2 min-h-[44px] text-lg font-mono p-2 bg-white rounded-lg border border-clinical-border">
                {spellerState.sentence_buffer.map((word, i) => (
                  <span
                    key={i}
                    className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-lg font-bold shadow-2xs"
                  >
                    {word}
                  </span>
                ))}

                {/* Currently typing unconfirmed word buffer */}
                {(spellerState.telex_word_buffer || spellerState.raw_word_buffer) && (
                  <span className="bg-blue-50 text-clinical-blue border border-blue-300 px-2.5 py-0.5 rounded-lg font-bold animate-pulse">
                    {spellerState.telex_word_buffer || spellerState.raw_word_buffer}
                    <span className="inline-block w-1.5 h-4 bg-clinical-blue ml-1 align-middle" />
                  </span>
                )}

                {!spellerState.confirmed_sentence && !spellerState.raw_word_buffer && (
                  <span className="text-gray-400 italic text-xs font-sans">
                    Bộ đệm đang trống. Nhấp ký tự trong ma trận hoặc chạy Replay để bắt đầu đánh vần...
                  </span>
                )}
              </div>
            </div>

            {/* Quick Helper Notes */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-clinical-secondary pt-1">
              <span>Quy tắc Telex: s=sắc, f=huyền, r=hỏi, x=ngã, j=nặng, w=ư/ơ, aa=â, dd=đ</span>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-clinical-blue hover:underline flex items-center space-x-1"
                title="Sao chép văn bản"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>

          {/* Top Prediction Telemetry Card */}
          <div className="lg:col-span-4 p-4 rounded-xl bg-blue-50/50 border border-blue-200 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-clinical-blue tracking-wider font-mono">
                  {language === 'vi' ? 'Dự Đoán LDA Hàng Đầu' : 'Top Shrinkage LDA Prediction'}
                </span>
                <span className="text-xs font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200">
                  {lastDecodedCell
                    ? language === 'vi'
                      ? `Hàng ${lastDecodedCell.row} : Cột ${lastDecodedCell.col}`
                      : `Row ${lastDecodedCell.row} : Col ${lastDecodedCell.col}`
                    : 'R— : C—'}
                </span>
              </div>

              <div className="flex items-baseline space-x-3 my-2">
                <span className="text-4xl font-mono font-black text-clinical-text">
                  {lastDecodedCell ? (lastDecodedCell.char === '_' ? '␣' : lastDecodedCell.char) : '—'}
                </span>
                <span className="text-xs font-mono text-clinical-secondary">
                  {language === 'vi' ? 'Điểm margin:' : 'LDA Margin:'}{' '}
                  <strong className="text-clinical-blue">
                    {lastDecodedCell ? lastDecodedCell.score.toFixed(2) : '0.00'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-clinical-secondary border-t border-blue-100 pt-2">
              {language === 'vi'
                ? 'Mô hình: Shrinkage LDA • Lặp: 8 lần'
                : 'Model: Shrinkage LDA • 8 Repetitions'}
            </div>
          </div>
        </div>

        {/* Suggestion Strip Component */}
        <SuggestionStrip
          candidates={spellerState.candidates}
          highlightedIndex={spellerState.highlighted_index}
          kOfN={spellerState.k_of_n}
          onSelectCandidate={(_word, idx) => onAccept(idx)}
          onCycleNext={onNext}
          onAccept={() => onAccept()}
          onReject={onContinue}
        />

        {/* Central Workspace Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-clinical-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-clinical-secondary mr-1">
              {language === 'vi' ? 'Thao tác:' : 'Actions:'}
            </span>
            <button
              type="button"
              onClick={() => onAccept()}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer select-none"
              title="ACCEPT"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Xác Nhận (ACCEPT)' : 'ACCEPT'}</span>
            </button>

            <button
              type="button"
              onClick={() => onContinue()}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-clinical-text text-xs font-medium border border-clinical-border transition-all cursor-pointer select-none"
              title="CONTINUE"
            >
              <span>{language === 'vi' ? 'Bỏ Qua (CONTINUE)' : 'CONTINUE'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNext()}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-clinical-text text-xs font-medium border border-clinical-border transition-all cursor-pointer select-none"
              title="NEXT"
            >
              <span>{language === 'vi' ? 'Từ Kế Tiếp (NEXT)' : 'NEXT Candidate'}</span>
            </button>

            <button
              type="button"
              onClick={() => onInputChar('_', 6, 6)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-800 border border-blue-200 text-xs font-semibold transition-all cursor-pointer select-none"
              title="Space"
            >
              <span>{language === 'vi' ? '␣ Dấu Cách (Space)' : '␣ Space'}</span>
            </button>

            <button
              type="button"
              onClick={() => onBackspace()}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-800 border border-amber-200 text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer select-none"
              title="BACKSPACE"
            >
              <Delete className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Xóa Lùi' : 'Backspace'}</span>
            </button>

            <button
              type="button"
              onClick={() => setClearModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 border border-rose-200 text-xs font-semibold transition-all flex items-center space-x-1 cursor-pointer select-none"
              title="Clear"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? 'Xóa Hết' : 'Clear'}</span>
            </button>
          </div>

          {/* Staff Override Status Indicator */}
          {staffOverrideActive && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-xs font-mono font-bold">
              {language === 'vi' ? 'Chế độ Staff: Đang BẬT' : 'Staff Override: ON'}
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CLINICAL SPEECH ENGINE (TTS) CONTROLS                                 */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-clinical-border p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-clinical-border text-xs">
          <div className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-clinical-teal" />
            <h3 className="font-bold text-clinical-text uppercase tracking-wider">
              {language === 'vi'
                ? 'Động Cơ Phát Âm Tiếng Nói Lâm Sàng (Web Speech TTS)'
                : 'Clinical Speech Synthesis Engine (Web Speech TTS)'}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-clinical-secondary">
            {language === 'vi' ? 'Chỉ phát âm văn bản đã được xác nhận' : 'Speaks confirmed output only'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Voice Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold text-clinical-text block">
              {language === 'vi' ? 'Giọng Đọc (Voice)' : 'Speech Voice'}
            </label>
            <select
              value={selectedVoiceUri}
              onChange={(e) => setSelectedVoiceUri(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-clinical-border bg-gray-50 text-clinical-text focus:outline-none focus:border-clinical-blue text-xs font-sans"
            >
              <option value="">
                {language === 'vi' ? 'Giọng Tiếng Việt chuẩn hệ thống' : 'System Default Speech Voice'}
              </option>
              {availableVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* Speed Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="font-semibold text-clinical-text font-sans">
                {language === 'vi' ? 'Tốc Độ Đọc' : 'Speech Rate'}
              </span>
              <span className="text-clinical-blue font-bold">{ttsSpeed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={ttsSpeed}
              onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-clinical-blue"
            />
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[11px]">
              <span className="font-semibold text-clinical-text font-sans">
                {language === 'vi' ? 'Âm Lượng' : 'Volume'}
              </span>
              <span className="text-clinical-teal font-bold">{Math.round(ttsVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={ttsVolume}
              onChange={(e) => setTtsVolume(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-clinical-teal"
            />
          </div>
        </div>

        {/* Speak / Stop Button Group */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleSpeak}
              disabled={ttsSpeaking}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all shadow-sm ${
                ttsSpeaking
                  ? 'bg-clinical-teal text-white animate-pulse'
                  : 'bg-clinical-blue hover:bg-clinical-blueHover text-white shadow-blue-600/20'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>
                {ttsSpeaking
                  ? language === 'vi'
                    ? 'ĐANG PHÁT ÂM...'
                    : 'SPEAKING...'
                  : language === 'vi'
                  ? 'PHÁT ÂM CÂU ĐÃ XÁC NHẬN (SPEAK)'
                  : 'SPEAK CONFIRMED OUTPUT (TTS)'}
              </span>
            </button>

            {ttsSpeaking && (
              <button
                type="button"
                onClick={handleStopSpeech}
                className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center space-x-1.5 transition-colors"
              >
                <VolumeX className="w-4 h-4" />
                <span>{language === 'vi' ? 'DỪNG NGAY' : 'STOP SPEECH'}</span>
              </button>
            )}
          </div>

          <div className="text-[11px] font-mono text-clinical-secondary">
            Chuẩn đầu ra: Audio Output PCM 48kHz
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN P300 MATRIX & FOUR-WAY TELEMETRY PANEL                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 6x6 Matrix */}
        <div className="lg:col-span-5 flex flex-col">
          <SpellerMatrix
            activeFlashGroup={activeFlashGroup}
            lastDecodedCell={lastDecodedCell}
            onCellClick={(r, c, char) => onInputChar(char, r, c)}
          />
        </div>

        {/* Four-Way Telemetry Panel */}
        <div className="lg:col-span-7 flex flex-col">
          <FourWayPanel
            entries={fourWayEntries}
            currentGroundTruth={fourWayEntries.length > 0 ? fourWayEntries[fourWayEntries.length - 1].groundTruth : '—'}
            currentPredicted={lastDecodedCell ? lastDecodedCell.char : '—'}
            currentSuggested={spellerState.highlighted_word || '—'}
            currentConfirmed={spellerState.confirmed_sentence || '—'}
          />
        </div>
      </div>

      {/* Clear Buffer Confirmation Modal */}
      <ConfirmModal
        isOpen={clearModalOpen}
        title="Xác Nhận Xóa Bộ Đệm"
        message="Bạn có chắc chắn muốn xóa toàn bộ câu và từ ngữ đang soạn thảo trong bộ đệm? Thao tác này không thể hoàn tác."
        confirmLabel="Xóa Hết"
        cancelLabel="Giữ Lại"
        isDestructive={true}
        onConfirm={() => {
          onClear();
          setClearModalOpen(false);
          toast.info('Đã xóa sạch bộ đệm văn bản.');
        }}
        onCancel={() => setClearModalOpen(false)}
      />
    </div>
  );
};
