import { useState, useEffect } from "react";
import { Link } from "wouter";
import { X } from "lucide-react";
import { getCookieConsent, type CookieConsent } from "@/lib/cookies";

const STORAGE_KEY = "ledi_cookie_consent";

function saveConsent(analytics: boolean) {
  const consent: CookieConsent = {
    necessary: true,
    analytics,
    acceptedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  if (analytics && typeof window !== "undefined" && (window as any).enablePlausible) {
    (window as any).enablePlausible();
  }
  return consent;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (consent) return;
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const accept = (analytics: boolean) => {
    saveConsent(analytics);
    setVisible(false);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] px-4 pb-4"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="max-w-2xl mx-auto rounded-2xl p-5 shadow-2xl"
        style={{
          background: "rgba(13,27,42,0.97)",
          border: "1px solid rgba(0,180,216,0.25)",
          backdropFilter: "blur(20px)",
          pointerEvents: "auto",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍪</span>
            <p className="text-white font-semibold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>
              Vi bruker informasjonskapsler
            </p>
          </div>
          <button
            onClick={() => accept(false)}
            className="text-white/40 hover:text-white/70 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-white/60 text-xs leading-relaxed mb-4">
          Ledi bruker nødvendige informasjonskapsler for at tjenesten skal fungere, og analytiske
          for å forstå hvordan du bruker siden. Du bestemmer selv.{" "}
          <Link href="/personvern" className="underline text-white/70 hover:text-white">
            Les personvernreglene våre
          </Link>
          .
        </p>

        {expanded && (
          <div
            className="mb-4 rounded-xl p-3 text-xs"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="mb-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-white font-semibold">Nødvendige</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
                >
                  Alltid aktiv
                </span>
              </div>
              <p className="text-white/45">Innlogging, booking-session, sikkerhet.</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-white font-semibold">Analytiske</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "rgba(0,180,216,0.12)", color: "#00B4D8" }}
                >
                  Valgfri
                </span>
              </div>
              <p className="text-white/45">Plausible Analytics — ingen tredjeparts-sporing, GDPR-vennlig.</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => accept(true)}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
          >
            Godta alle
          </button>
          <button
            onClick={() => accept(false)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            Kun nødvendige
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-white/40 hover:text-white/60 transition-colors ml-auto"
          >
            {expanded ? "Skjul detaljer ↑" : "Tilpass ↓"}
          </button>
        </div>
      </div>
    </div>
  );
}
