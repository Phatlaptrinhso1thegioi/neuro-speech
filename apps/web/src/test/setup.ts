import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock browser SpeechSynthesis if not available in jsdom
if (typeof window !== 'undefined') {
  if (!window.speechSynthesis) {
    window.speechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([
        { name: 'Google Tiếng Việt', lang: 'vi-VN', default: true },
        { name: 'English US', lang: 'en-US', default: false },
      ]),
      onvoiceschanged: null,
      pending: false,
      speaking: false,
      paused: false,
    } as unknown as SpeechSynthesis;
  }

  if (!(window as any).SpeechSynthesisUtterance) {
    (window as any).SpeechSynthesisUtterance = class {
      text: string;
      lang: string = 'vi-VN';
      rate: number = 1;
      voice: any = null;
      onstart: any = null;
      onend: any = null;
      onerror: any = null;
      constructor(text: string) {
        this.text = text;
      }
    };
  }

  if (!(window as any).AudioContext) {
    (window as any).AudioContext = class {
      currentTime = 0;
      destination = {};
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
      }
      createGain() {
        return {
          gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
          connect: vi.fn(),
        };
      }
    };
  }
}
