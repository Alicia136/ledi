import { createContext, useState, useContext } from "react";
import no, { type TranslationKeys } from "@/translations/no";
import en from "@/translations/en";
import de from "@/translations/de";
import sv from "@/translations/sv";
import dk from "@/translations/dk";
import pl from "@/translations/pl";
import ua from "@/translations/ua";

export type LangCode = "no" | "en" | "de" | "sv" | "dk" | "pl" | "ua";

const translations: Record<LangCode, Record<string, string>> = { no, en, de, sv, dk, pl, ua };

function detectLang(): LangCode {
  const saved = localStorage.getItem("ledi_lang") as LangCode | null;
  if (saved && saved in translations) return saved;
  const browser = navigator.language.slice(0, 2);
  const map: Record<string, LangCode> = {
    no: "no", nb: "no", nn: "no",
    en: "en",
    de: "de",
    sv: "sv",
    da: "dk",
    pl: "pl",
    uk: "ua",
  };
  return map[browser] ?? "no";
}

interface LangCtx {
  lang: LangCode;
  setLanguage: (l: LangCode) => void;
  t: (key: TranslationKeys) => string;
}

const LanguageContext = createContext<LangCtx>({
  lang: "no",
  setLanguage: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<LangCode>(detectLang);

  const t = (key: TranslationKeys): string =>
    translations[lang][key] ?? translations["no"][key] ?? key;

  const setLanguage = (newLang: LangCode) => {
    setLang(newLang);
    localStorage.setItem("ledi_lang", newLang);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
