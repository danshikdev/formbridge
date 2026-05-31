import React, { createContext, useContext, useMemo, useState } from "react";
import { translations } from "./i18n";

const KEY = "fb_lang";

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem(KEY) || "");

  function setLang(next) {
    localStorage.setItem(KEY, next);
    setLangState(next);
  }

  const t = useMemo(() => {
    const selected = translations[lang] || translations.en;
    return selected;
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
    hasLanguage: Boolean(lang)
  }), [lang, t]);

  return React.createElement(LocaleContext.Provider, { value }, children);
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    // Fallback in case useLocale is called outside of the provider
    const [lang, setLangState] = useState(localStorage.getItem(KEY) || "");

    const setLang = (next) => {
      localStorage.setItem(KEY, next);
      setLangState(next);
    };

    const t = translations[lang] || translations.en;

    return { lang, setLang, t, hasLanguage: Boolean(lang) };
  }
  return context;
}
