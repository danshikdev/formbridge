import React, { createContext, useContext, useMemo, useState } from "react";
import { translations } from "./i18n";

const KEY = "fb_lang";

const LocaleContext = createContext(null);

function readLang() {
  try {
    const stored = localStorage.getItem(KEY);
    return translations[stored] ? stored : "kk";
  } catch {
    return "kk";
  }
}

function writeLang(next) {
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // ignore storage failures
  }
}

export function LocaleProvider({ children }) {
  const [lang, setLangState] = useState(readLang);

  function setLang(next) {
    writeLang(next);
    setLangState(next);
  }

  const t = useMemo(() => {
    const selected = translations[lang] || translations.kk;
    return selected;
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t,
    hasLanguage: true
  }), [lang, t]);

  return React.createElement(LocaleContext.Provider, { value }, children);
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    // Fallback in case useLocale is called outside of the provider
    const [lang, setLangState] = useState(readLang);

    const setLang = (next) => {
      writeLang(next);
      setLangState(next);
    };

    const t = translations[lang] || translations.kk;

    return { lang, setLang, t, hasLanguage: true };
  }
  return context;
}
