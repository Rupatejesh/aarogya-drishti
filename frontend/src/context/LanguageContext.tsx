import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, Translations } from '../i18n/translations.ts';
import { dictionary, wordDictionary, applyDOMTranslation, translateValue } from '../i18n/translator.ts';

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (keyOrPhrase: string) => string;
  strings: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aarogya_language') || localStorage.getItem('aarogya_lang');
      if (saved === 'te' || saved === 'hi' || saved === 'en') {
        return saved;
      }
    }
    return 'te'; // Default to Telugu as primary tribal regional language
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('aarogya_language', newLang);
      localStorage.setItem('aarogya_lang', newLang);
      document.documentElement.lang = newLang === 'te' ? 'te-IN' : newLang === 'hi' ? 'hi-IN' : 'en';
      // Immediate translation pass
      applyDOMTranslation(document.body, newLang);
    }
  };

  // Sync document attribute and DOM translation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.documentElement.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en';
    applyDOMTranslation(document.body, lang);

    // Dynamic observer to catch newly rendered components, modals, and dynamic data tables
    const observer = new MutationObserver(() => {
      applyDOMTranslation(document.body, lang);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, [lang]);

  // Unified translation function
  const t = (keyOrPhrase: string): string => {
    if (!keyOrPhrase) return '';
    if (lang === 'en') return keyOrPhrase;

    // 1. Check direct translation key in translations[lang]
    const curTranslations = translations[lang] as unknown as Record<string, string>;
    if (curTranslations && curTranslations[keyOrPhrase]) {
      return curTranslations[keyOrPhrase];
    }

    // 2. Check full phrase in dictionary
    if (dictionary[keyOrPhrase]?.[lang]) {
      return dictionary[keyOrPhrase][lang];
    }

    // 3. Fallback to translateValue
    return translateValue(keyOrPhrase, lang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, strings: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;

