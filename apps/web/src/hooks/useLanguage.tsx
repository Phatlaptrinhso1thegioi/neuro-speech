/**
 * apps/web/src/hooks/useLanguage.tsx
 * Language context & hook supporting bilingual (VI / EN) toggle.
 * Backed by localStorage and cross-component event sync.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../utils/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['vi'];
}

const defaultValue: LanguageContextType = {
  language: 'vi',
  setLanguage: () => {},
  t: translations.vi,
};

const LanguageContext = createContext<LanguageContextType>(defaultValue);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('neuro_speech_lang');
      return (saved === 'en' || saved === 'vi') ? saved : 'vi';
    } catch {
      return 'vi';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('neuro_speech_lang', lang);
      window.dispatchEvent(new Event('languagechange'));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('neuro_speech_lang');
        if (saved === 'en' || saved === 'vi') {
          setLanguageState(saved);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('languagechange', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('languagechange', handleStorage);
    };
  }, []);

  const t = translations[language] || translations.vi;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  const [fallbackLang, setFallbackLang] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('neuro_speech_lang');
      return (saved === 'en' || saved === 'vi') ? saved : 'vi';
    } catch {
      return 'vi';
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem('neuro_speech_lang');
        if (saved === 'en' || saved === 'vi') {
          setFallbackLang(saved);
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('languagechange', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('languagechange', handleStorage);
    };
  }, []);

  if (context !== defaultValue) {
    return context;
  }

  const setLanguage = (lang: Language) => {
    setFallbackLang(lang);
    try {
      localStorage.setItem('neuro_speech_lang', lang);
      window.dispatchEvent(new Event('languagechange'));
    } catch {}
  };

  return {
    language: fallbackLang,
    setLanguage,
    t: translations[fallbackLang] || translations.vi,
  };
};
