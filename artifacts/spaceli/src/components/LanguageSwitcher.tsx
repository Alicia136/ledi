import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useLanguage, type LangCode } from "@/lib/language-context";

const LANGUAGES: { code: LangCode; flag: string; name: string }[] = [
  { code: "no", flag: "🇳🇴", name: "Norsk" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "sv", flag: "🇸🇪", name: "Svenska" },
  { code: "dk", flag: "🇩🇰", name: "Dansk" },
  { code: "pl", flag: "🇵🇱", name: "Polski" },
  { code: "ua", flag: "🇺🇦", name: "Українська" },
];

export default function LanguageSwitcher() {
  const { lang, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0" data-testid="language-switcher">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-[10px] text-white text-[13px] font-semibold transition-all select-none"
        style={{
          padding: "8px 14px",
          background: open ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
          border: open ? "1px solid rgba(0,180,216,0.4)" : "1px solid rgba(255,255,255,0.15)",
        }}
        data-testid="button-language-toggle"
      >
        <span>{current.flag}</span>
        <span>{current.name}</span>
        <ChevronDown
          size={13}
          className="transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 overflow-hidden"
            style={{
              background: "#1a2d42",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "14px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              minWidth: "180px",
              zIndex: 1000,
            }}
          >
            {LANGUAGES.map(l => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  onClick={() => { setLanguage(l.code); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors"
                  style={{
                    color: active ? "#00B4D8" : "white",
                    background: "transparent",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(0,180,216,0.1)";
                    if (!active) (e.currentTarget as HTMLElement).style.color = "#00B4D8";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    if (!active) (e.currentTarget as HTMLElement).style.color = "white";
                  }}
                  data-testid={`language-option-${l.code}`}
                >
                  <span className="text-base">{l.flag}</span>
                  <span className="flex-1 font-medium">{l.name}</span>
                  {active && <Check size={14} style={{ color: "#00B4D8" }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
