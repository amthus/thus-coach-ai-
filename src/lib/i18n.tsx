import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Language } from '../../shared/types';

const STORAGE_KEY = 'ts_language';

function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

interface I18nValue {
  lang: Language;
  setLang: (l: Language) => void;
  /** Inline bilingual string helper: t('Bonjour', 'Hello'). */
  t: (fr: string, en: string) => string;
  locale: string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(initialLanguage);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (fr, en) => (lang === 'fr' ? fr : en), locale: lang === 'fr' ? 'fr-FR' : 'en-GB' }),
    [lang, setLang],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
