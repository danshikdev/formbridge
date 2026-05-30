import { useMemo, useState } from "react";
import { translations } from "./i18n";

const KEY = "fb_lang";

export function useLocale() {
  const [lang, setLangState] = useState(localStorage.getItem(KEY) || "");

  function setLang(next) {
    localStorage.setItem(KEY, next);
    setLangState(next);
  }

  const t = useMemo(() => {
    const selected = translations[lang] || translations.en;
    return selected;
  }, [lang]);

  return { lang, setLang, t, hasLanguage: Boolean(lang) };
}
