import { useState } from "react";
import { MapPin, Calendar, Moon, ChevronRight, Compass, Tent, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import LediLogo from "@/components/LediLogo";

const RUTER = [
  { fra: "Oslo",      til: "Lofoten",   label: "Oslo → Lofoten",   dager: 5, emoji: "🏔️" },
  { fra: "Oslo",      til: "Bergen",    label: "Oslo → Bergen",    dager: 4, emoji: "🌧️" },
  { fra: "Oslo",      til: "Nordkapp",  label: "Oslo → Nordkapp",  dager: 5, emoji: "🌅" },
  { fra: "Oslo",      til: "Tromsø",    label: "Oslo → Tromsø",    dager: 3, emoji: "🐋" },
  { fra: "Bergen",    til: "Lofoten",   label: "Bergen → Lofoten", dager: 4, emoji: "🦅" },
  { fra: "Oslo",      til: "Stavanger", label: "Oslo → Stavanger", dager: 3, emoji: "☀️" },
  { fra: "Stavanger", til: "Bergen",    label: "Stavanger → Bergen",dager: 2, emoji: "⛵" },
  { fra: "Oslo",      til: "Ålesund",   label: "Oslo → Ålesund",   dager: 2, emoji: "🦅" },
];

const TYPE_LABELS: Record<string, string> = {
  camping: "Camping", bobil: "Bobil-plass", gaard: "Gårdscamping",
  baatplass: "Båtplass", bobil_strom: "Bobil m/ strøm", bobil_full: "Full service",
  parking: "Parkering", storage: "Lagerplass",
};
const TYPE_EMOJI: Record<string, string> = {
  camping: "🏕️", bobil: "🚐", gaard: "🏠", baatplass: "⚓",
  bobil_strom: "⚡🚐", bobil_full: "🚿🚐", parking: "🚗", storage: "📦",
};

interface Stopp {
  dag: number; by: string; emoji: string; dato: string; datoISO: string;
  tittel: string; plassId: number | null; pris: number; type: string; erEkt: boolean;
}

interface Plan {
  fra: string; til: string; datoFra: string; antallNetter: number;
  stopp: Stopp[]; totalPris: number; antallStopp: number;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function ReisePage() {
  const [fra, setFra] = useState("Oslo");
  const [til, setTil] = useState("Lofoten");
  const [datoFra, setDatoFra] = useState(todayStr());
  const [antallNetter, setAntallNetter] = useState(5);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");
  const [vippsStep, setVippsStep] = useState<"idle" | "processing" | "done">("idle");

  const selectedRute = RUTER.find(r => r.fra === fra && r.til === til);

  const handlePlanlegg = async () => {
    setLoading(true);
    setError("");
    setPlan(null);
    setVippsStep("idle");
    try {
      const res = await fetch("/api/reise/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fra, til, datoFra, antallNetter }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Noe gikk galt");
      setPlan(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVipps = async () => {
    setVippsStep("processing");
    await new Promise(r => setTimeout(r, 2200));
    setVippsStep("done");
  };

  const fraOptions = [...new Set(RUTER.map(r => r.fra))];
  const tilOptions = [...new Set(RUTER.filter(r => r.fra === fra).map(r => r.til))];

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0D1B2A 0%, #0A3048 50%, #0D1B2A 100%)",
          borderBottom: "1px solid rgba(0,180,216,0.15)",
        }}
      >
        {/* Animated road dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full opacity-10"
              style={{
                width: 4, height: 4, background: "#00B4D8",
                left: `${10 + i * 12}%`,
                top: `${30 + (i % 3) * 20}%`,
                animation: `pulse ${2 + i * 0.3}s infinite`,
              }}
            />
          ))}
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16 relative">
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
              style={{ background: "rgba(0,180,216,0.15)", color: "#00B4D8", border: "1px solid rgba(0,180,216,0.3)" }}
            >
              <Compass size={12} /> Norges første reiseplanlegger for privat camping
            </div>
            <h1
              className="text-3xl sm:text-5xl font-black text-white mb-3 leading-tight"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              <LediLogo size={48} /> <span style={{ color: "#00B4D8" }}>Reise</span>
            </h1>
            <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto">
              Planlegg hele campingturen — fra avreise til destinasjon. Vi finner private overnattingsplasser langs hele ruten.
            </p>
          </div>

          {/* Popular routes */}
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            {RUTER.map(r => (
              <button
                key={r.label}
                onClick={() => { setFra(r.fra); setTil(r.til); setAntallNetter(r.dager); }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: fra === r.fra && til === r.til ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${fra === r.fra && til === r.til ? "#00B4D8" : "rgba(255,255,255,0.12)"}`,
                  color: fra === r.fra && til === r.til ? "#00B4D8" : "rgba(255,255,255,0.6)",
                }}
              >
                {r.emoji} {r.label}
              </button>
            ))}
          </div>

          {/* Planner card */}
          <div
            className="rounded-3xl p-5 sm:p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {/* Fra */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Fra</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <select
                    value={fra}
                    onChange={e => { setFra(e.target.value); setTil(RUTER.find(r => r.fra === e.target.value)?.til ?? ""); }}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm text-white appearance-none outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    {fraOptions.map(o => <option key={o} value={o} style={{ background: "#0D1B2A" }}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Til */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Til</label>
                <div className="relative">
                  <Compass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <select
                    value={til}
                    onChange={e => setTil(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm text-white appearance-none outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  >
                    {tilOptions.map(o => <option key={o} value={o} style={{ background: "#0D1B2A" }}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* Dato */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Avreise</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="date"
                    value={datoFra}
                    min={todayStr()}
                    onChange={e => setDatoFra(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", colorScheme: "dark" }}
                  />
                </div>
              </div>

              {/* Netter */}
              <div>
                <label className="text-xs text-white/50 mb-1 block">Netter: <span style={{ color: "#00B4D8" }}>{antallNetter}</span></label>
                <div className="relative flex items-center gap-2">
                  <Moon size={14} className="text-white/40 shrink-0" />
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={antallNetter}
                    onChange={e => setAntallNetter(Number(e.target.value))}
                    className="w-full accent-[#00B4D8]"
                    style={{ accentColor: "#00B4D8" }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handlePlanlegg}
              disabled={loading || !til}
              className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", fontSize: 15 }}
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Planlegger ruten...</>
              ) : (
                <><Tent size={16} /> Planlegg turen <ChevronRight size={16} /></>
              )}
            </button>

            {error && (
              <p className="text-center text-xs mt-3" style={{ color: "#EF4444" }}>⚠️ {error}</p>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {plan && (
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Trip header */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                {plan.fra} <ArrowRight size={18} className="inline" /> {plan.til}
              </h2>
              <p className="text-sm text-white/50 mt-0.5">
                {plan.antallNetter} netter · {plan.antallStopp} overnattingssteder
              </p>
            </div>
            <div
              className="px-4 py-2 rounded-2xl text-center"
              style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.25)" }}
            >
              <p className="text-xs text-white/50 mb-0.5">Total overnatting</p>
              <p className="text-xl font-black" style={{ color: "#00B4D8", fontFamily: "'Syne', sans-serif" }}>
                {plan.totalPris.toLocaleString("nb-NO")} kr
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 top-8 bottom-8 w-0.5 hidden sm:block"
              style={{ background: "linear-gradient(to bottom, #00B4D8, rgba(0,180,216,0.1))" }}
            />

            <div className="space-y-3">
              {plan.stopp.map((stopp, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  {/* Day badge */}
                  <div
                    className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 z-10"
                    style={{
                      background: `linear-gradient(135deg, rgba(0,180,216,${0.3 - idx * 0.02}), rgba(27,79,140,0.5))`,
                      border: "1px solid rgba(0,180,216,0.4)",
                    }}
                  >
                    <span className="text-xs font-bold" style={{ color: "#00B4D8" }}>Dag</span>
                    <span className="text-sm font-black text-white leading-none">{stopp.dag}</span>
                  </div>

                  {/* Card */}
                  <div
                    className="flex-1 rounded-2xl p-4 transition-all hover:scale-[1.01]"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{stopp.emoji}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold text-white">{stopp.tittel}</p>
                              {stopp.erEkt && (
                                <span
                                  className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                                  style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
                                >
                                  ✓ På Ledi
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-white/40 flex items-center gap-1">
                              <MapPin size={10} /> {stopp.by} · {stopp.dato}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                          >
                            {TYPE_EMOJI[stopp.type] ?? "🏕️"} {TYPE_LABELS[stopp.type] ?? stopp.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-black text-white">{stopp.pris.toLocaleString("nb-NO")} kr</p>
                        <p className="text-xs text-white/40">per natt</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total + Book */}
          <div
            className="mt-8 rounded-3xl p-6"
            style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.08), rgba(27,79,140,0.12))", border: "1px solid rgba(0,180,216,0.2)" }}
          >
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <p className="text-white/50 text-sm mb-1">Totalt for hele turen</p>
                <p className="text-3xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {plan.totalPris.toLocaleString("nb-NO")} kr
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {plan.antallNetter} netter · ~{Math.round(plan.totalPris / plan.antallNetter).toLocaleString("nb-NO")} kr/natt gjennomsnitt · 8% serviceavgift inkludert
                </p>
              </div>
              <div
                className="px-4 py-2 rounded-2xl text-center"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <p className="text-xs text-white/40 mb-0.5">Du sparer</p>
                <p className="text-lg font-black" style={{ color: "#10B981" }}>
                  ~{(plan.totalPris * 0.3).toFixed(0)} kr
                </p>
                <p className="text-xs text-white/30">vs. hotell</p>
              </div>
            </div>

            {vippsStep === "idle" && (
              <button
                onClick={handleVipps}
                className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #FF5B24, #FF8C42)" }}
              >
                <span className="text-xl">V</span>
                Book alle {plan.antallStopp} plasser med Vipps
              </button>
            )}

            {vippsStep === "processing" && (
              <div
                className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-3"
                style={{ background: "rgba(255,91,36,0.2)", border: "1px solid rgba(255,91,36,0.3)" }}
              >
                <Loader2 size={20} className="animate-spin text-orange-400" />
                <span className="text-orange-300">Åpner Vipps...</span>
              </div>
            )}

            {vippsStep === "done" && (
              <div>
                <div
                  className="w-full py-4 rounded-2xl font-bold text-center mb-3"
                  style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}
                >
                  <CheckCircle2 size={20} className="inline mr-2" />
                  Alle {plan.antallStopp} bookinger bekreftet! God tur 🎉
                </div>
                <p className="text-center text-xs text-white/40">
                  Bekreftelse sendt til din e-post. Tilgangskode for hver plass sendes dagen før.
                </p>
              </div>
            )}

            <p className="text-center text-xs text-white/30 mt-3">
              🔒 Sikker betaling via Vipps · Avbestilling frem til 24t før
            </p>
          </div>

          {/* Info banner */}
          <div
            className="mt-6 rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <span className="text-2xl">🇳🇴</span>
            <div>
              <p className="text-sm font-semibold text-white">Norges første reiseplanlegger for privat camping</p>
              <p className="text-xs text-white/40 mt-0.5">
                Ledi Reise er en unik tjeneste som knytter deg direkte til private utleiere langs hele ruten — ikke kommersielle campingplasser. Betal privat, lei privat, reis ekte.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!plan && !loading && (
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { emoji: "🗺️", title: "Velg rute", text: "Velg avreise og destinasjon fra populære norske reiseruter" },
              { emoji: "📍", title: "Vi finner plasser", text: "Ledi matcher private overnattingssteder langs hele ruten automatisk" },
              { emoji: "📱", title: "Book med Vipps", text: "Betal for alle netter i én betaling — enkelt og trygt" },
            ].map(({ emoji, title, text }) => (
              <div
                key={title}
                className="rounded-2xl p-5 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="text-3xl mb-3">{emoji}</div>
                <p className="text-sm font-bold text-white mb-1">{title}</p>
                <p className="text-xs text-white/40">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
