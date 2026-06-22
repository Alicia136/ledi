import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Users, Ticket, ChevronRight, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";

interface EventData {
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
  tilgjengeligePlasser: {
    id: number;
    tittel: string;
    adresse: string;
    by: string;
    type: string;
    distM: number;
    erAktivForEvent: boolean;
    eventPris: number | null;
  }[];
  antallAktivert: number;
}

const KATEGORI_CONFIG: Record<string, { bg: string; color: string; gradient: string }> = {
  konsert:  { bg: "rgba(139,92,246,0.15)", color: "#A78BFA", gradient: "135deg, #4C1D95, #7C3AED" },
  fotball:  { bg: "rgba(16,185,129,0.15)", color: "#34D399", gradient: "135deg, #064E3B, #059669" },
  festival: { bg: "rgba(251,146,60,0.15)", color: "#FB923C", gradient: "135deg, #7C2D12, #EA580C" },
  hockey:   { bg: "rgba(14,165,233,0.15)", color: "#38BDF8", gradient: "135deg, #0C4A6E, #0284C7" },
  default:  { bg: "rgba(0,180,216,0.15)",  color: "#00B4D8", gradient: "135deg, #164E63, #0891B2" },
};

function formatDato(dato: string) {
  return new Date(dato + "T12:00:00").toLocaleDateString("nb-NO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function distLabel(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`;
}

export default function ArrangementPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [data, setData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<number | null>(null);
  const [booked, setBooked] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    fetch(`/api/arrangementer/${slug}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleBook = async (plassId: number) => {
    if (!user) { window.location.href = "/logg-inn"; return; }
    setBooking(plassId);
    await new Promise(r => setTimeout(r, 900));
    setBooked(prev => new Set(prev).add(plassId));
    setBooking(null);
    showToast("✅ Plass reservert! Bekreftelse sendes på e-post.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1B2A" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00B4D8", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "#0D1B2A", color: "#fff" }}>
        <span className="text-5xl">🎪</span>
        <p className="text-white/60">Arrangementet ble ikke funnet.</p>
        <Link href="/" className="text-sm text-cyan-400 underline">Gå til forsiden</Link>
      </div>
    );
  }

  const { event, tilgjengeligePlasser, antallAktivert } = data;
  const cfg = KATEGORI_CONFIG[event.kategori] ?? KATEGORI_CONFIG.default;
  const spotsLeft = tilgjengeligePlasser.filter(p => !booked.has(p.id)).length;

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", color: "#fff" }}>
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(${cfg.gradient})`, minHeight: 320 }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)" }} />
        <div className="max-w-4xl mx-auto px-4 pt-28 pb-12 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider"
                style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                {event.by}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-bold"
                style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                {event.kategori}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-bold"
                style={{ background: "rgba(0,0,0,0.2)", color: "rgba(255,255,255,0.8)" }}>
                🔴 {spotsLeft} ledige plasser
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black mb-3 text-white" style={{ fontFamily: "Syne, sans-serif" }}>
              {event.emoji} {event.navn}
            </h1>

            <div className="flex flex-wrap gap-4 text-white/80 text-sm mb-6">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} /> {event.sted}, {event.by}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} /> {formatDato(event.dato)} kl. {event.klokkeslett}
              </span>
              <span className="flex items-center gap-1.5">
                <Ticket size={14} /> {event.antallBilletter.toLocaleString("nb")} billetter
              </span>
              <span className="flex items-center gap-1.5">
                <Users size={14} /> {event.estimertParkeringssokere.toLocaleString("nb")} søker parkering
              </span>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl inline-flex"
              style={{ background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.15)" }}>
              <div className="text-2xl">🅿️</div>
              <div>
                <p className="font-bold text-white text-sm">Dedikert parkeringsside for dette arrangementet</p>
                <p className="text-xs text-white/60">{antallAktivert} utleiere har åpnet plassen sin · Booket med Vipps</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Spaces list */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
            Tilgjengelige parkeringsplasser
          </h2>
          <span className="text-sm text-white/40">
            Innen 2,5 km fra {event.sted}
          </span>
        </div>

        {tilgjengeligePlasser.length === 0 ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-white/60">Ingen plasser tilgjengelig ennå nær dette arrangementet.</p>
            <p className="text-white/40 text-sm mt-1">Sjekk igjen nærmere arrangementsdatoen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tilgjengeligePlasser.map((plass, i) => {
              const isBooked = booked.has(plass.id);
              const isBooking = booking === plass.id;
              const pris = plass.eventPris ?? 150;

              return (
                <motion.div
                  key={plass.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-5 flex items-center gap-4"
                  style={{
                    background: isBooked
                      ? "rgba(16,185,129,0.08)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${isBooked ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)"}`,
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    🅿️
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{plass.tittel}</p>
                    <div className="flex items-center gap-2 text-xs text-white/40 mt-0.5">
                      <MapPin size={10} />
                      <span>{plass.adresse}</span>
                      <span className="px-1.5 py-0.5 rounded-full"
                        style={{ background: "rgba(0,180,216,0.12)", color: "#00B4D8" }}>
                        {distLabel(plass.distM)} unna
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {plass.erAktivForEvent && (
                      <span className="text-xs px-2 py-0.5 rounded-full block mb-1 text-center"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        ★ Event-plass
                      </span>
                    )}
                    <p className="font-black text-white text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
                      {pris} kr
                    </p>
                    <p className="text-xs text-white/40">per dag</p>
                  </div>

                  <button
                    onClick={() => handleBook(plass.id)}
                    disabled={isBooked || isBooking}
                    className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center gap-2"
                    style={{
                      background: isBooked
                        ? "rgba(16,185,129,0.2)"
                        : `linear-gradient(${cfg.gradient})`,
                      opacity: isBooking ? 0.7 : 1,
                      minWidth: 100,
                      justifyContent: "center",
                    }}
                  >
                    {isBooked ? (
                      <><CheckCircle2 size={14} /> Booket</>
                    ) : isBooking ? (
                      <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#fff", borderTopColor: "transparent" }} />
                    ) : (
                      <>Book med Vipps</>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Info box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 rounded-2xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-sm font-semibold text-white mb-3">💡 Slik fungerer event-parkering på Ledi</p>
          <div className="grid sm:grid-cols-3 gap-3 text-xs text-white/50">
            <div>⚡ <strong className="text-white/80">Book nå</strong> — bekreftelse på e-post + Vipps</div>
            <div>📍 <strong className="text-white/80">Finn plassen</strong> — adresse + navigasjon i appen</div>
            <div>🔒 <strong className="text-white/80">Trygg betaling</strong> — penger holdes i escrow til etter arrangementet</div>
          </div>
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-semibold text-white z-50 shadow-xl"
            style={{ background: "#10B981", boxShadow: "0 4px 20px rgba(16,185,129,0.4)" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
