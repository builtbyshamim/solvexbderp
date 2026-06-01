import { createContext, useContext, useState, type ReactNode } from 'react';
import en from '../locales/en';
import bn from '../locales/bn';

type Lang = 'en' | 'bn';
type Translations = typeof en;

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const dictionaries: Record<Lang, Translations> = { en, bn };

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    return (localStorage.getItem('lang') as Lang) ?? 'en';
  });

  const toggleLang = () => {
    setLang((prev) => {
      const next: Lang = prev === 'en' ? 'bn' : 'en';
      localStorage.setItem('lang', next);
      return next;
    });
  };

  const t = (key: keyof Translations): string => {
    return dictionaries[lang][key] ?? dictionaries['en'][key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};
