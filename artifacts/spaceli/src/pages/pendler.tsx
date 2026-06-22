import { useState, useEffect } from "react";
import { useSEO } from "@/lib/useSEO";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import LediLogo from "@/components/LediLogo";
import {
  MapPin, Clock, TrendingDown, ChevronRight, ArrowRight,
  Navigation, Bike, Car, Star, CheckCircle2, Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface Lokasjon { navn: string; lat: number; lng: number; by: string; region: string }
interface Anbefaling {
  id: number;
  tittel: string;
  adresse: string;
  by: string;
  type: string;
  fasiliteter: string[];
  maanedPris: number;
  detourM: number;
  routeAvstandM: number;
  tidsbesparelsePerDag: number;
  kostbesparelsePerAar: number;
  gangAvstandM: number;
  walkMinutter: number;
  projection: number;
  score: number;
}
interface Resultat {
  hjem: Lokasjon;
  jobb: Lokasjon;
  routeDistKm: number;
  sentrumsreferansePris: number;
  arbeidstider: string;
  anbefalinger: Anbefaling[];
}

const ARBEIDSTIDER = [
  "07:00–15:00", "08:00–16:00", "09:00–17:00",
  "10:00–18:00", "06:00–14:00", "Fleksibel",
];

function distLabel(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10}m` : `${(m / 1000).toFixed(1)}km`;
}
function typeEmoji(type: string) {
  const map: Record<string, string> = {
    parking: "🚗", storage: "📦", ev: "⚡", henger: "🚛",
    camping: "🏕️", bobil: "🚐", gaard: "🏠", baatplass: "⚓",
  };
  return map[type] ?? "🅿️";
}

function RouteDiagram({ hjem, jobb, space }: { hjem: string; jobb: string; space: string }) {
  return (
    <div className="flex items-center gap-2 py-3 text-xs overflow-x-auto">
      <div className="flex items-center gap-1 shrink-0">
        <span className="w-2 h-2 rounded-full" style={{ background: "#00B4D8" }} />
        <span style={{ color: "rgba(255,255,255,0.7)" }}>{hjem}</span>
      </div>
      <div className="flex-1 border-t border-dashed min-w-6" style={{ borderColor: "rgba(255,255,255,0.2)" }} />
      <div className="flex flex-col items-center shrink-0">
        <span className="text-base">🅿️</span>
        <span className="mt-0.5 font-semibold" style={{ color: "#00B4D8", whiteSpace: "nowrap", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis" }}>{space}</span>
      </div>
      <div className="flex-1 border-t border-dashed min-w-6" style={{ borderColor: "rgba(255,255,255,0.2)" }} />
      <div className="flex items-center gap-1 shrink-0">
        <span className="w-2 h-2 rounded-full" style={{ background: "#10B981" }} />
        <span style={{ color: "rgba(255,255,255,0.7)" }}>{jobb}</span>
      </div>
    </div>
  );
}

function AnbefalingCard({
  item, index, resultat, booked, onBook,
}: {
  item: Anbefaling; index: number; resultat: Resultat;
  booked: Set<number>; onBook: (id: number) => void;
}) {
  const isBest = index === 0;
  const isBooked = booked.has(item.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: isBest ? "rgba(0,180,216,0.06)" : "rgba(255,255,255,0.03)",
        border: `1.5px solid ${isBest ? "rgba(0,180,216,0.3)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {/* Best match banner */}
      {isBest && (
        <div className="px-5 py-2 flex items-center gap-2 text-xs font-bold"
          style={{ background: "rgba(0,180,216,0.12)", color: "#00B4D8" }}>
          <Star size={11} fill="#00B4D8" /> Beste match for din pendlerute
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            {typeEmoji(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm truncate">{item.tittel}</p>
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "rgba(255,255,255,0.4)" }}>
              <MapPin size={10} /> {item.adresse}, {item.by}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-white text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
              {item.maanedPris.toLocaleString("nb-NO")}
            </p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>kr/mnd</p>
          </div>
        </div>

        {/* Route diagram */}
        <RouteDiagram hjem={resultat.hjem.navn} jobb={resultat.jobb.navn} space={item.tittel} />

        {/* Savings grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 mb-4">
          <div className="rounded-xl p-3 text-center"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
            <p className="font-black text-sm" style={{ color: "#34D399", fontFamily: "Syne, sans-serif" }}>
              {item.kostbesparelsePerAar > 0
                ? `${item.kostbesparelsePerAar.toLocaleString("nb-NO")} kr`
                : "Billigst"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {item.kostbesparelsePerAar > 0 ? "spart per år" : "i området"}
            </p>
          </div>
          <div className="rounded-xl p-3 text-center"
            style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}>
            <p className="font-black text-sm" style={{ color: "#FBB924", fontFamily: "Syne, sans-serif" }}>
              {item.tidsbesparelsePerDag > 0
                ? `${item.tidsbesparelsePerDag} min`
                : "Direkte"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              {item.tidsbesparelsePerDag > 0 ? "spart per dag" : "på ruten"}
            </p>
          </div>
          <div className="rounded-xl p-3 text-center"
            style={{ background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.15)" }}>
            <p className="font-black text-sm" style={{ color: "#00B4D8", fontFamily: "Syne, sans-serif" }}>
              {item.walkMinutter} min
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              gang til jobb
            </p>
          </div>
        </div>

        {/* Savings sentence (Ledi-style) */}
        {(item.tidsbesparelsePerDag > 0 || item.kostbesparelsePerAar > 0) && (
          <div className="rounded-xl px-4 py-2.5 mb-4 text-xs"
            style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.12)" }}>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>
              Med denne plassen sparer du{" "}
              {item.tidsbesparelsePerDag > 0 && (
                <strong className="text-white">{item.tidsbesparelsePerDag} minutter per dag</strong>
              )}
              {item.tidsbesparelsePerDag > 0 && item.kostbesparelsePerAar > 0 && " og "}
              {item.kostbesparelsePerAar > 0 && (
                <strong className="text-white">{item.kostbesparelsePerAar.toLocaleString("nb-NO")} kr per år</strong>
              )}
              {" "}sammenlignet med sentrum-parkering
            </span>
          </div>
        )}

        {/* Fasiliteter */}
        {item.fasiliteter?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {item.fasiliteter.slice(0, 4).map(f => (
              <span key={f} className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onBook(item.id)}
            disabled={isBooked}
            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
            style={{
              background: isBooked
                ? "rgba(16,185,129,0.2)"
                : isBest
                  ? "linear-gradient(135deg, #00B4D8, #0284C7)"
                  : "rgba(255,255,255,0.08)",
              boxShadow: isBest && !isBooked ? "0 4px 16px rgba(0,180,216,0.3)" : "none",
            }}
          >
            {isBooked ? <><CheckCircle2 size={13} /> Booket!</> : <>Book denne plassen</>}
          </button>
          <Link href={`/?id=${item.id}`}>
            <button className="px-4 py-2.5 rounded-xl text-sm flex items-center gap-1 transition-all"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Se detaljer <ChevronRight size={12} />
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function PendlerPage() {
  useSEO({
    title: "Pendlerparkering – Finn fast månedsparkering nær jobben | Ledi",
    description: "Spar tid og penger med fast månedsparkering nær arbeidsplassen din. Sammenlign priser på pendlerparkering i Oslo, Bergen, Trondheim og mer. Book på Ledi.",
    canonical: "https://ledi.no/pendler",
  });

  const [lokasjoner, setLokasjoner] = useState<string[]>([]);
  const [hjem, setHjem] = useState("");
  const [jobb, setJobb] = useState("");
  const [arbeidstider, setArbeidstider] = useState("08:00–16:00");
  const [loading, setLoading] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [error, setError] = useState("");
  const [booked, setBooked] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pendler/lokasjoner").then(r => r.json()).then(setLokasjoner).catch(() => {});
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleBook = (id: number) => {
    setBooked(prev => new Set(prev).add(id));
    showToast("✅ Forespørsel sendt! Utleier bekrefter innen 24 timer.");
  };

  const handleSok = async () => {
    if (!hjem || !jobb) { setError("Velg både hjemsted og jobbsted."); return; }
    if (hjem === jobb) { setError("Hjemsted og jobbsted kan ikke være det samme."); return; }
    setError("");
    setLoading(true);
    setResultat(null);
    try {
      const res = await fetch(
        `/api/pendler/finn?hjem=${encodeURIComponent(hjem)}&jobb=${encodeURIComponent(jobb)}&arbeidstider=${encodeURIComponent(arbeidstider)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultat(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noe gikk galt. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  const arbeidsdag = ARBEIDSTIDER.find(a => a === arbeidstider) ?? "08:00–16:00";
  const [startH, sluttH] = arbeidsdag.includes("–")
    ? arbeidsdag.split("–").map(t => parseInt(t))
    : [8, 16];
  const timerPerDag = !isNaN(startH) && !isNaN(sluttH) ? sluttH - startH : 8;

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", color: "#fff" }}>
      <Navbar />

      {/* ── Hero ── */}
      <div className="relative overflow-hidden pt-24 pb-14 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-10 rounded-full"
            style={{ background: "radial-gradient(ellipse, #00B4D8, transparent 70%)", top: 40 }} />
        </div>
        <div className="max-w-2xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold"
              style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.2)", color: "#00B4D8" }}>
              <Navigation size={11} /> For daglige pendlere
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4 leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>
              Spar tid på{" "}
              <span style={{ color: "#00B4D8" }}>vei til jobb</span>
            </h1>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7 }}>
              <LediLogo size={18} /> finner automatisk den beste parkeringsplassen langs pendlerruten din —
              den som sparer deg mest tid og penger.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Søkeskjema ── */}
      <div className="max-w-2xl mx-auto px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="space-y-4">
            {/* Home */}
            <div>
              <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#00B4D8" }} />
                Hjemsted
              </label>
              <select
                value={hjem}
                onChange={e => setHjem(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "DM Sans, sans-serif" }}
              >
                <option value="" style={{ background: "#0D1B2A" }}>Velg din hjemadresse / bydel</option>
                {lokasjoner.map(l => (
                  <option key={l} value={l} style={{ background: "#0D1B2A" }}>{l}</option>
                ))}
              </select>
            </div>

            {/* Arrow */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }} />
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,180,216,0.1)", color: "#00B4D8" }}>
                <ArrowRight size={14} />
              </div>
              <div className="flex-1 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }} />
            </div>

            {/* Job */}
            <div>
              <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#10B981" }} />
                Jobb / skole
              </label>
              <select
                value={jobb}
                onChange={e => setJobb(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none cursor-pointer"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontFamily: "DM Sans, sans-serif" }}
              >
                <option value="" style={{ background: "#0D1B2A" }}>Velg arbeidssted / bydel</option>
                {lokasjoner.map(l => (
                  <option key={l} value={l} style={{ background: "#0D1B2A" }}>{l}</option>
                ))}
              </select>
            </div>

            {/* Work hours */}
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "rgba(255,255,255,0.55)" }}>
                <Clock size={11} className="inline mr-1" /> Arbeidstider
              </label>
              <div className="flex flex-wrap gap-2">
                {ARBEIDSTIDER.map(t => (
                  <button
                    key={t}
                    onClick={() => setArbeidstider(t)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: arbeidstider === t ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.06)",
                      border: `1px solid ${arbeidstider === t ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.1)"}`,
                      color: arbeidstider === t ? "#00B4D8" : "rgba(255,255,255,0.55)",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              onClick={handleSok}
              disabled={loading || !hjem || !jobb}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
              style={{
                background: (!hjem || !jobb)
                  ? "rgba(255,255,255,0.07)"
                  : loading
                    ? "rgba(0,180,216,0.4)"
                    : "linear-gradient(135deg, #00B4D8, #0284C7)",
                boxShadow: hjem && jobb && !loading ? "0 4px 20px rgba(0,180,216,0.3)" : "none",
              }}
            >
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#fff", borderTopColor: "transparent" }} /> Søker etter plasser langs ruten…</>
              ) : (
                <><Navigation size={14} /> Finn min pendlerparkering</>
              )}
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Resultater ── */}
      <div className="max-w-2xl mx-auto px-4 pb-20">
        <AnimatePresence>
          {resultat && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Route summary */}
              <div className="rounded-2xl p-4 mb-5 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex-1 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#00B4D8" }} />
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{resultat.hjem.navn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#10B981" }} />
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>{resultat.jobb.navn}</span>
                  </div>
                </div>
                <div className="text-right text-xs shrink-0">
                  <p className="font-bold text-white">{resultat.routeDistKm} km</p>
                  <p style={{ color: "rgba(255,255,255,0.4)" }}>pendleravstand</p>
                </div>
                <div className="text-right text-xs shrink-0">
                  <p className="font-bold text-white">{timerPerDag}t/dag</p>
                  <p style={{ color: "rgba(255,255,255,0.4)" }}>{resultat.arbeidstider}</p>
                </div>
              </div>

              {resultat.anbefalinger.length === 0 ? (
                <div className="rounded-2xl p-10 text-center"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <span className="text-4xl block mb-3">🔍</span>
                  <p className="text-white font-semibold mb-2">Ingen plasser funnet langs denne ruten</p>
                  <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>
                    Prøv en annen rute, eller søk direkte i kartet.
                  </p>
                  <Link href="/">
                    <button className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                      style={{ background: "rgba(0,180,216,0.15)", border: "1px solid rgba(0,180,216,0.25)", color: "#00B4D8" }}>
                      Søk alle plasser
                    </button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-white" style={{ fontFamily: "Syne, sans-serif" }}>
                      {resultat.anbefalinger.length} anbefalt{resultat.anbefalinger.length !== 1 ? "e" : ""} plass{resultat.anbefalinger.length !== 1 ? "er" : ""}
                    </h2>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      vs. {resultat.sentrumsreferansePris.toLocaleString("nb-NO")} kr/mnd sentrum
                    </span>
                  </div>

                  <div className="space-y-4">
                    {resultat.anbefalinger.map((item, i) => (
                      <AnbefalingCard
                        key={item.id}
                        item={item}
                        index={i}
                        resultat={resultat}
                        booked={booked}
                        onBook={handleBook}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Value props — shown before search */}
        {!resultat && !loading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="grid sm:grid-cols-3 gap-4 mt-2">
              {[
                { ikon: <TrendingDown size={18} />, tittel: "Spar penger", tekst: "Finn plasser opptil 60% billigere enn sentrumsgarasjer — langs din eksisterende rute." },
                { ikon: <Clock size={18} />, tittel: "Spar tid", tekst: "Ingen omvei til parkering. Plassen er på veien — du stopper og går rett til jobb." },
                { ikon: <Zap size={18} />, tittel: "Automatisk", tekst: "Oppgi ruten én gang. Ledi oppdaterer anbefalingene basert på nye plasser i området." },
              ].map(p => (
                <div key={p.tittel} className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: "rgba(0,180,216,0.1)", color: "#00B4D8" }}>
                    {p.ikon}
                  </div>
                  <p className="font-bold text-white text-sm mb-1">{p.tittel}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{p.tekst}</p>
                </div>
              ))}
            </div>

            {/* Example result teaser */}
            <div className="rounded-2xl p-5 mt-4"
              style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#34D399" }}>💡 Eksempel på resultat</p>
              <p className="text-sm text-white mb-1">
                <strong>"Med denne plassen sparer du{" "}
                  <span style={{ color: "#FBB924" }}>23 minutter per dag</span> og{" "}
                  <span style={{ color: "#34D399" }}>4 600 kr per år</span>{" "}
                  sammenlignet med sentrum-parkering"
                </strong>
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Basert på 220 arbeidsdager/år og snittpriser i ditt område
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-semibold text-white z-50"
            style={{ background: "#10B981", boxShadow: "0 4px 20px rgba(16,185,129,0.4)", whiteSpace: "nowrap" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
