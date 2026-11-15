/**
 * apps/web/src/utils/tts.ts
 * Dedicated Vietnamese-First Web Speech TTS Utility for NEURO-SPEECH.
 * Handles voice loading, robust Vietnamese voice selection (Google tiếng Việt,
 * Microsoft Hoài My, Microsoft Nam Minh, macOS Linh, iOS, etc.), and fallbacks.
 */

// Cached voices list
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const updateVoices = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
  updateVoices();
  window.speechSynthesis.onvoiceschanged = updateVoices;
}

/**
 * Finds the highest quality Vietnamese voice available in the current browser/OS.
 */
export const getVietnameseVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  let voices = cachedVoices;
  if (!voices || voices.length === 0) {
    voices = window.speechSynthesis.getVoices();
    cachedVoices = voices;
  }
  if (!voices || voices.length === 0) return null;

  // 1. Prioritize Google Tiếng Việt (Chrome on Windows/Mac/Android)
  const googleVi = voices.find(
    (v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith('vi') &&
      (v.name.toLowerCase().includes('google') || v.name.toLowerCase().includes('tiếng việt'))
  );
  if (googleVi) return googleVi;

  // 2. Prioritize Microsoft Natural Vietnamese Voices (Edge on Windows)
  const msNaturalVi = voices.find(
    (v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith('vi') &&
      (v.name.toLowerCase().includes('hoaimy') ||
        v.name.toLowerCase().includes('namminh') ||
        v.name.toLowerCase().includes('natural'))
  );
  if (msNaturalVi) return msNaturalVi;

  // 3. Any voice explicitly matching vi-VN
  const exactViVN = voices.find((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l === 'vi-vn' || l === 'vi';
  });
  if (exactViVN) return exactViVN;

  // 4. Any voice whose lang starts with 'vi'
  const anyVi = voices.find((v) => v.lang.toLowerCase().startsWith('vi'));
  if (anyVi) return anyVi;

  // 5. Any voice whose name mentions Vietnamese
  const nameVi = voices.find((v) => v.name.toLowerCase().includes('viet'));
  if (nameVi) return nameVi;

  return null;
};

/**
 * Speaks text using the optimal Vietnamese voice.
 */
export const speakVietnamese = (
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): boolean => {
  if (!text || !text.trim()) return false;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;

  try {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const viVoice = getVietnameseVoice();

    if (viVoice) {
      utterance.voice = viVoice;
      utterance.lang = viVoice.lang;
    } else {
      utterance.lang = 'vi-VN';
    }

    utterance.rate = options?.rate ?? 0.95;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;

    if (options?.onStart) utterance.onstart = options.onStart;
    if (options?.onEnd) utterance.onend = options.onEnd;
    if (options?.onError) utterance.onerror = options.onError;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (e) {
    console.error('Speech synthesis error:', e);
    return false;
  }
};
