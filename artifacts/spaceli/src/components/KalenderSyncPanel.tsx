import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Unlink, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

interface Integrasjon {
  id: number;
  provider: "google" | "outlook";
  accountEmail: string | null;
  plassId: number | null;
  status: string;
  demoModus: boolean;
  sistSynkronisert: string | null;
}

interface BlockedDay {
  dato: string;
  grunn: string;
  plassId: number;
}

const PROVIDER_CONFIG = {
  google: {
    label: "Google Kalender",
    logo: (
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#4285F4" d="M45.5 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h12.1c-.5 2.7-2.1 5-4.5 6.5v5.4h7.3c4.3-3.9 6.6-9.7 6.6-15.6z"/>
        <path fill="#34A853" d="M24 46c6.1 0 11.2-2 14.9-5.4l-7.3-5.4c-2 1.4-4.6 2.1-7.6 2.1-5.8 0-10.8-3.9-12.5-9.2H4v5.6C7.7 41.6 15.3 46 24 46z"/>
        <path fill="#FBBC05" d="M11.5 28.1c-.5-1.4-.7-2.9-.7-4.1s.3-2.7.7-4.1V14.3H4C2.4 17.4 1.5 20.6 1.5 24s.9 6.6 2.5 9.7l7.5-5.6z"/>
        <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.4-6.4C34.9 4.2 29.8 2 24 2 15.3 2 7.7 6.4 4 13.3l7.5 5.6c1.7-5.3 6.7-8.1 12.5-8.1z"/>
      </svg>
    ),
    connectLabel: "Koble til Google Kalender",
    demoEmail: "deg@gmail.com",
    color: "#4285F4",
    bgColor: "rgba(66,133,244,0.1)",
    borderColor: "rgba(66,133,244,0.25)",
  },
  outlook: {
    label: "Outlook / Teams",
    logo: (
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#0078D4" d="M28 4h12a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H28V4z"/>
        <path fill="#50D9FF" d="M28 4H16L4 16v16l12 12h12V4z" opacity=".5"/>
        <path fill="#50D9FF" d="M4 16h12V4L4 16z"/>
        <rect x="18" y="20" width="14" height="2" rx="1" fill="white"/>
        <rect x="18" y="25" width="14" height="2" rx="1" fill="white"/>
        <rect x="18" y="30" width="10" height="2" rx="1" fill="white"/>
      </svg>
    ),
    connectLabel: "Koble til Outlook / Teams",
    demoEmail: "deg@bedrift.no",
    color: "#0078D4",
    bgColor: "rgba(0,120,212,0.1)",
    borderColor: "rgba(0,120,212,0.25)",
  },
};

function MiniCalendar({ blocks }: { blocks: BlockedDay[] }) {
  const today = new Date();
  const blockedSet = new Set(blocks.map(b => b.dato));

  const weeks: Date[][] = [];
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1);

  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + w * 7 + d);
      week.push(day);
    }
    weeks.push(week);
  }

  const dayLabels = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

  return (
    <div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {dayLabels.map(d => (
          <div key={d} className="text-center text-xs font-semibold" style={{ color: "rgba(255,255,255,0.3)" }}>{d}</div>
        ))}
      </div>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
        {weeks.flat().map((day, i) => {
          const iso = day.toISOString().slice(0, 10);
          const isToday = iso === today.toISOString().slice(0, 10);
          const isBlocked = blockedSet.has(iso);
          const isPast = day < today && !isToday;
          const isThisMonth = day.getMonth() === today.getMonth();

          return (
            <div
              key={i}
              title={isBlocked ? (blocks.find(b => b.dato === iso)?.grunn ?? "") : ""}
              className="rounded-md flex items-center justify-center text-xs font-medium transition-all"
              style={{
                height: 28,
                fontSize: 11,
                background: isBlocked
                  ? "rgba(239,68,68,0.25)"
                  : isToday
                  ? "rgba(0,180,216,0.3)"
                  : "rgba(255,255,255,0.04)",
                color: isBlocked
                  ? "#FCA5A5"
                  : isToday
                  ? "#00B4D8"
                  : isPast || !isThisMonth
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.7)",
                border: isToday ? "1px solid rgba(0,180,216,0.5)" : "1px solid transparent",
                cursor: isBlocked ? "help" : "default",
              }}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.4)" }} />
          Opptatt (fra kalender)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: "rgba(0,180,216,0.3)", border: "1px solid rgba(0,180,216,0.5)" }} />
          I dag
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: "rgba(255,255,255,0.04)" }} />
          Ledig
        </span>
      </div>
    </div>
  );
}

function ProviderCard({
  providerKey,
  integrasjon,
  onConnect,
  onDisconnect,
  onSync,
  loading,
}: {
  providerKey: "google" | "outlook";
  integrasjon: Integrasjon | null;
  onConnect: (provider: string) => void;
  onDisconnect: (id: number) => void;
  onSync: (id: number) => void;
  loading: boolean;
}) {
  const cfg = PROVIDER_CONFIG[providerKey];
  const connected = !!integrasjon;

  return (
    <div
      className="rounded-2xl p-5 transition-all"
      style={{
        background: connected ? cfg.bgColor : "rgba(255,255,255,0.04)",
        border: `1px solid ${connected ? cfg.borderColor : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: connected ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.06)" }}
          >
            {cfg.logo}
          </div>
          <div>
            <p className="font-bold text-white text-sm">{cfg.label}</p>
            {connected ? (
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {integrasjon?.accountEmail}
              </p>
            ) : (
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                Ikke koblet
              </p>
            )}
          </div>
        </div>
        {connected ? (
          <span
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
          >
            <CheckCircle2 size={11} /> Tilkoblet
          </span>
        ) : null}
      </div>

      {connected ? (
        <>
          {integrasjon?.demoModus && (
            <div
              className="rounded-xl px-3 py-2 text-xs mb-3 flex items-center gap-2"
              style={{ background: "rgba(251,191,36,0.1)", color: "#FCD34D", border: "1px solid rgba(251,191,36,0.2)" }}
            >
              <AlertCircle size={12} />
              Demo-modus — simulerer ekte kalendereventer
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => onSync(integrasjon!.id)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Synk nå
            </button>
            <button
              onClick={() => onDisconnect(integrasjon!.id)}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{ background: "rgba(239,68,68,0.1)", color: "#FCA5A5" }}
            >
              <Unlink size={12} />
              Koble fra
            </button>
          </div>
          {integrasjon?.sistSynkronisert && (
            <p className="text-xs mt-2 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
              Sist synkronisert: {new Date(integrasjon.sistSynkronisert).toLocaleString("nb-NO")}
            </p>
          )}
        </>
      ) : (
        <button
          onClick={() => onConnect(providerKey)}
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2"
          style={{
            background: loading ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${cfg.color}cc, ${cfg.color}88)`,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {cfg.logo}
          {loading ? "Kobler til..." : cfg.connectLabel}
        </button>
      )}
    </div>
  );
}

export default function KalenderSyncPanel() {
  const { user } = useAuth();
  const [integrasjoner, setIntegrasioner] = useState<Integrasjon[]>([]);
  const [blocks, setBlocks] = useState<BlockedDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const token = localStorage.getItem("ledi_token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const loadData = useCallback(async () => {
    try {
      const [intRes, blockRes] = await Promise.all([
        fetch("/api/kalender/integrasjoner", { headers }),
        fetch("/api/kalender/forhåndsvisning", { headers }),
      ]);
      if (intRes.ok) setIntegrasioner(await intRes.json());
      if (blockRes.ok) {
        const data = await blockRes.json();
        setBlocks(data);
        if (data.length > 0) setShowCalendar(true);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, loadData]);

  const handleConnect = async (provider: string) => {
    setLoading(true);
    try {
      const cfg = PROVIDER_CONFIG[provider as "google" | "outlook"];
      const res = await fetch("/api/kalender/koble", {
        method: "POST",
        headers,
        body: JSON.stringify({ provider, accountEmail: cfg.demoEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`✅ ${cfg.label} koblet! ${data.antallBlokkerteOpprettet} dager synkronisert.`);
      await loadData();
      setShowCalendar(true);
    } catch (e: unknown) {
      showToast(`❌ ${e instanceof Error ? e.message : "Feil ved tilkobling"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kalender/synk/${id}`, { method: "POST", headers });
      if (!res.ok) throw new Error("Synk feilet");
      showToast("🔄 Kalender synkronisert!");
      await loadData();
    } catch {
      showToast("❌ Synk feilet");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kalender/integrasjoner/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Feil");
      showToast("🔌 Kalender koblet fra.");
      await loadData();
      if (integrasjoner.length <= 1) setShowCalendar(false);
    } catch {
      showToast("❌ Noe gikk galt");
    } finally {
      setLoading(false);
    }
  };

  const googleInt = integrasjoner.find(i => i.provider === "google") ?? null;
  const outlookInt = integrasjoner.find(i => i.provider === "outlook") ?? null;
  const anyConnected = googleInt || outlookInt;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(0,180,216,0.15)" }}
        >
          <Calendar size={18} style={{ color: "#00B4D8" }} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Kalender-synkronisering
          </h2>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            Tilgjengeligheten oppdateres automatisk fra kalenderen din
          </p>
        </div>
        {anyConnected && (
          <span
            className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
          >
            ● Live
          </span>
        )}
      </div>

      {/* How it works — only when not connected */}
      {!anyConnected && (
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)" }}
        >
          <p className="text-sm font-semibold text-white mb-3">Slik fungerer det</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: "📅", label: "Hjemme i kalenderen", desc: "→ Plass markert opptatt automatisk" },
              { icon: "✈️", label: "Feriedager", desc: "→ Plass stengt i hele perioden" },
              { icon: "🏢", label: "Borte / møte", desc: "→ Plass ledig for leietakere" },
            ].map(item => (
              <div key={item.label} className="text-center">
                <div className="text-2xl mb-1.5">{item.icon}</div>
                <p className="text-xs font-semibold text-white mb-0.5">{item.label}</p>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provider cards */}
      <div className="grid sm:grid-cols-2 gap-3 mb-4">
        <ProviderCard
          providerKey="google"
          integrasjon={googleInt}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onSync={handleSync}
          loading={loading}
        />
        <ProviderCard
          providerKey="outlook"
          integrasjon={outlookInt}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onSync={handleSync}
          loading={loading}
        />
      </div>

      {/* Calendar preview */}
      <AnimatePresence>
        {showCalendar && blocks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-5 overflow-hidden"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">
                Tilgjengelighetskalender — neste 6 uker
              </p>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{ background: "rgba(239,68,68,0.15)", color: "#FCA5A5" }}
              >
                {blocks.length} dager blokkert
              </span>
            </div>
            <MiniCalendar blocks={blocks} />

            {/* Upcoming blocked dates list */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                Neste blokkerte perioder
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {blocks.slice(0, 10).map((b, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>
                      {new Date(b.dato).toLocaleDateString("nb-NO", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        color: "#FCA5A5",
                        fontSize: 10,
                      }}
                    >
                      {b.grunn}
                    </span>
                  </div>
                ))}
                {blocks.length > 10 && (
                  <p className="text-xs text-center pt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                    + {blocks.length - 10} flere dager
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-semibold text-white z-50 shadow-xl"
            style={{ background: "#1E3A5F", border: "1px solid rgba(0,180,216,0.3)" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
