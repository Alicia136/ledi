import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ChevronRight, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface EventVarsel {
  event: {
    id: number;
    slug: string;
    navn: string;
    sted: string;
    by: string;
    dato: string;
    klokkeslett: string;
    kategori: string;
    emoji: string;
    antallBilletter: number;
    estimertParkeringssokere: number;
  };
  nearbySpaces: { id: number; tittel: string; adresse: string; distM: number }[];
  eventPris: number;
  estimertInntekt: number;
  alleredeAktivert: boolean;
}

const KATEGORI_COLOR: Record<string, { border: string; accent: string; bg: string }> = {
  konsert:  { border: "rgba(167,139,250,0.3)", accent: "#A78BFA", bg: "rgba(139,92,246,0.08)" },
  fotball:  { border: "rgba(52,211,153,0.3)",  accent: "#34D399", bg: "rgba(16,185,129,0.08)" },
  festival: { border: "rgba(251,146,60,0.3)",  accent: "#FB923C", bg: "rgba(234,88,12,0.08)"  },
  hockey:   { border: "rgba(56,189,248,0.3)",  accent: "#38BDF8", bg: "rgba(2,132,199,0.08)"  },
  default:  { border: "rgba(0,180,216,0.3)",   accent: "#00B4D8", bg: "rgba(0,180,216,0.08)"  },
};

function formatDatoKort(dato: string) {
  return new Date(dato + "T12:00:00").toLocaleDateString("nb-NO", {
    weekday: "short", day: "numeric", month: "short",
  });
}

function distLabel(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`;
}

export default function ArrangementVarselPanel() {
  const { user } = useAuth();
  const [varsler, setVarsler] = useState<EventVarsel[]>([]);
  const [loading, setLoading] = useState(true);
  const [aktiverer, setAktiverer] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const token = typeof window !== "undefined" ? localStorage.getItem("ledi_token") : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadVarsler = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/arrangementer/mine-varsler", { headers });
      if (res.ok) setVarsler(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadVarsler(); }, [loadVarsler]);

  const handleAktiver = async (eventId: number, plassId: number, eventNavn: string, eventPris: number) => {
    setAktiverer(eventId);
    try {
      const res = await fetch(`/api/arrangementer/${eventId}/aktiver`, {
        method: "POST",
        headers,
        body: JSON.stringify({ plassId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`✅ Plass åpnet for ${eventNavn} til ${data.eventPris} kr! Estimert inntekt: ${data.estimertInntekt} kr.`);
      await loadVarsler();
    } catch (e: unknown) {
      showToast(`❌ ${e instanceof Error ? e.message : "Noe gikk galt"}`);
    } finally {
      setAktiverer(null);
    }
  };

  if (loading || varsler.length === 0) return null;

  return (
    <div className="mb-8">
      {/* Header */}
      <button
        onClick={() => setCollapsed(p => !p)}
        className="flex items-center gap-3 mb-4 w-full text-left group"
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(167,139,250,0.15)" }}
        >
          <Zap size={18} style={{ color: "#A78BFA" }} />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Arrangementer nær deg
          </h2>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {varsler.length} event{varsler.length !== 1 ? "er" : ""} — åpne plassen din og tjen ekstra
          </p>
        </div>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0"
          style={{ background: "rgba(167,139,250,0.15)", color: "#A78BFA" }}
        >
          {varsler.filter(v => !v.alleredeAktivert).length} nye
        </span>
        <ChevronRight
          size={16}
          style={{
            color: "rgba(255,255,255,0.3)",
            transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3">
              {varsler.map(varsel => {
                const cfg = KATEGORI_COLOR[varsel.event.kategori] ?? KATEGORI_COLOR.default;
                const closestSpace = varsel.nearbySpaces[0];
                const isAktiverer = aktiverer === varsel.event.id;

                return (
                  <motion.div
                    key={varsel.event.id}
                    layout
                    className="rounded-2xl p-5"
                    style={{
                      background: varsel.alleredeAktivert ? "rgba(16,185,129,0.06)" : cfg.bg,
                      border: `1px solid ${varsel.alleredeAktivert ? "rgba(16,185,129,0.2)" : cfg.border}`,
                    }}
                  >
                    {/* Event header */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-3xl leading-none mt-0.5">{varsel.event.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className="font-bold text-white text-sm truncate">{varsel.event.navn}</p>
                          {varsel.alleredeAktivert && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0"
                              style={{ background: "rgba(16,185,129,0.2)", color: "#34D399" }}>
                              ✓ Aktivert
                            </span>
                          )}
                        </div>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                          📍 {varsel.event.sted} · {formatDatoKort(varsel.event.dato)} kl. {varsel.event.klokkeslett}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold" style={{ color: cfg.accent }}>
                          {varsel.event.estimertParkeringssokere.toLocaleString("nb")} søker parkering
                        </p>
                      </div>
                    </div>

                    {/* Notification message */}
                    {!varsel.alleredeAktivert && (
                      <div
                        className="rounded-xl p-3 mb-3 text-xs"
                        style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.65)" }}
                      >
                        <p className="font-semibold text-white mb-1">
                          🎵 {varsel.event.estimertParkeringssokere.toLocaleString("nb")} søker parkering nær {varsel.event.sted} {formatDatoKort(varsel.event.dato)}!
                        </p>
                        <p>
                          Din plass <strong className="text-white">"{closestSpace?.tittel}"</strong> er {closestSpace ? distLabel(closestSpace.distM) : ""} unna. 
                          Vil du åpne plassen til event-pris denne dagen?
                        </p>
                        <p className="mt-1.5 font-semibold" style={{ color: cfg.accent }}>
                          💰 Estimert inntekt: {varsel.estimertInntekt} kr — event-pris: {varsel.eventPris} kr/dag
                        </p>
                      </div>
                    )}

                    {/* Nearby spaces + actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {varsel.nearbySpaces.slice(0, 2).map(s => (
                        <div
                          key={s.id}
                          className="flex-1 min-w-0 text-xs px-3 py-2 rounded-xl flex items-center gap-2"
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                        >
                          <span className="text-base">🅿️</span>
                          <div className="min-w-0">
                            <p className="text-white font-semibold truncate">{s.tittel}</p>
                            <p style={{ color: "rgba(255,255,255,0.4)" }}>{distLabel(s.distM)} unna</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {!varsel.alleredeAktivert && closestSpace ? (
                        <button
                          onClick={() => handleAktiver(varsel.event.id, closestSpace.id, varsel.event.navn, varsel.eventPris)}
                          disabled={!!aktiverer}
                          className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                          style={{
                            background: isAktiverer
                              ? "rgba(255,255,255,0.1)"
                              : `linear-gradient(135deg, ${cfg.accent}bb, ${cfg.accent}77)`,
                            opacity: aktiverer && !isAktiverer ? 0.5 : 1,
                          }}
                        >
                          {isAktiverer ? (
                            <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#fff", borderTopColor: "transparent" }} />
                          ) : (
                            <><Zap size={14} /> Ja, åpne plassen min</>
                          )}
                        </button>
                      ) : (
                        <div className="flex-1 py-2.5 rounded-xl text-sm text-center font-semibold"
                          style={{ background: "rgba(16,185,129,0.15)", color: "#34D399" }}>
                          ✓ Plass åpnet for dette arrangementet
                        </div>
                      )}
                      <Link href={`/arrangement/${varsel.event.slug}`}>
                        <button
                          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-1"
                          style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
                        >
                          Se side <ChevronRight size={13} />
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-semibold text-white z-50 shadow-xl"
            style={{ background: "#1E3A5F", border: "1px solid rgba(0,180,216,0.3)", whiteSpace: "nowrap" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
