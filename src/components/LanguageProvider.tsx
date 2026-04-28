"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getStoredLanguage,
  saveStoredLanguage,
  TranslationLanguage,
  UiTranslations,
  uiTranslations,
} from "../lib/language";

type LanguageContextValue = {
  language: TranslationLanguage;
  setLanguage: (language: TranslationLanguage) => void;
  t: UiTranslations;
};

const fallbackLanguage: TranslationLanguage = "en";

const fallbackLanguageContext: LanguageContextValue = {
  language: fallbackLanguage,
  setLanguage: () => {
    // No-op fallback used during prerendering if a page is not wrapped yet.
  },
  t: uiTranslations[fallbackLanguage] as UiTranslations,
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<TranslationLanguage>(fallbackLanguage);

  useEffect(() => {
    setLanguageState(getStoredLanguage());

    const handleStorage = () => {
      setLanguageState(getStoredLanguage());
    };

    const handleLanguageChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ language?: TranslationLanguage }>;
      if (customEvent.detail?.language) {
        setLanguageState(customEvent.detail.language);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("facegrem-language-change", handleLanguageChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("facegrem-language-change", handleLanguageChange);
    };
  }, []);

  const setLanguage = (nextLanguage: TranslationLanguage) => {
    saveStoredLanguage(nextLanguage);
    setLanguageState(nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: uiTranslations[language] as UiTranslations,
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext) ?? fallbackLanguageContext;
}
