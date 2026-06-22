import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeftRight, MapPin, Check, Send, Bell, RefreshCw, X, ChevronRight, Sparkles } from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────

const BYDELER = [
  "Oslo Frogner", "Oslo Sentrum", "Oslo Sagene", "Oslo Grünerløkka",
  "Oslo Majorstuen", "Oslo St. Hanshaugen", "Oslo Nordstrand",
  "Bergen Sentrum", "Bergen Fana", "Trondheim", "Stavanger", "Tromsø",
  "Drammen", "Fredrikstad", "Kristiansand",
];

const TYPER = [
  { value: "parkering", label: "🅿️ Parkering" },
  { value: "lagring", label: "📦 Lagring" },
  { value: "elbil", label: "⚡ Elbil-lader" },
  { value: "henger", label: "🚛 Hengerplass" },
];

// ─── Demo scenario for non-logged-in users ────────────────────────────────────

const DEMO_MATCHER = [
  {
    userId: 99,
    navn: "Mari H.",
    nåværendeBydel: "Oslo Grünerløkka",
    ønsketBydel: "Oslo Frogner",
    type: "parkering",
    sparBeløp: 400,
    forespørselStatus: null,
    beskrivelse: "Har fast månedsplass i Grünerløkka, men jobber i Frogner.",
  },
  {
    userId: 98,
    navn: "Bjørn K.",
    nåværendeBydel: "Bergen Fana",
    ønsketBydel: "Bergen Sentrum",
    type: "parkering",
    sparBeløp: 350,
    forespørselStatus: null,
    beskrivelse: "Pendler inn til sentrum daglig – vil ha plass nærmere jobben.",
  },
];

// ─── Match card ───────────────────────────────────────────────────────────────

function MatchKort({
  match,
  minProfil,
  onSend,
}: {
  match: typeof DEMO_MATCHER[0];
  minProfil: { nåværendeBydel: string; ønsketBydel: string } | null;
  onSend: (userId: number) => void;
}) {
  const [sent, setSent] = useState(match.forespørselStatus === "venter");

  function send() {
    onSend(match.userId);
    setSent(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(0,180,216,0.25)" }}
    >
      {/* Match badge */}
      <div className="px-5 py-2.5 flex items-center gap-2" style={{ background: "rgba(0,180,216,0.1)", borderBottom: "1px solid rgba(0,180,216,0.15)" }}>
        <Sparkles size={12} style={{ color: "#00B4D8" }} />
        <span className="text-xs font-bold" style={{ color: "#00B4D8" }}>Perfekt bytte funnet!</span>
        <span className="ml-auto text-xs font-black" style={{ color: "#10B981" }}>Spar {match.sparBeløp} kr/mnd</span>
      </div>

      <div className="p-5">
        {/* Swap visualisation */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="text-[10px] text-white/40 mb-0.5">Du gir</div>
            <div className="text-xs font-bold text-white">{minProfil?.nåværendeBydel ?? match.ønsketBydel}</div>
          </div>
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}>
            <ArrowLeftRight size={14} className="text-white" />
          </div>
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="text-[10px] text-white/40 mb-0.5">Du får</div>
            <div className="text-xs font-bold text-white">{minProfil?.ønsketBydel ?? match.nåværendeBydel}</div>
          </div>
        </div>

        {/* Match user info */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #1B4F8C55, #00B4D855)" }}>
            {match.navn[0]}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{match.navn}</p>
            <p className="text-xs text-white/50">{match.beskrivelse}</p>
          </div>
        </div>

        {/* Savings highlight */}
        <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <p className="text-sm font-bold" style={{ color: "#10B981" }}>
            💰 Dere sparer <strong>{match.sparBeløp} kr</strong> per måned <span className="font-normal text-white/50">— begge to!</span>
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={send}
          disabled={sent}
          className="w-full py-3 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
          style={sent
            ? { background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }
            : { background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", boxShadow: "0 4px 16px rgba(0,180,216,0.25)" }}
        >
          {sent ? <><Check size={15} /> Forespørsel sendt!</> : <><Send size={15} /> Foreslå bytte</>}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Registration form ────────────────────────────────────────────────────────

function RegistrerForm({ onDone }: { onDone: (profil: { nåværendeBydel: string; ønsketBydel: string; type: string; beskrivelse: string }) => void }) {
  const [steg, setSteg] = useState(1);
  const [nåværende, setNåværende] = useState("");
  const [ønsket, setØnsket] = useState("");
  const [type, setType] = useState("parkering");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!nåværende || !ønsket || nåværende === ønsket) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("ledi_token");
      await fetch("/api/bytte/profil", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nåværendeBydel: nåværende, ønsketBydel: ønsket, type, beskrivelse }),
      });
      onDone({ nåværendeBydel: nåværende, ønsketBydel: ønsket, type, beskrivelse });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
      {/* Progress */}
      <div className="flex gap-2 mb-6">
        {[1, 2].map(s => (
          <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <motion.div className="h-full rounded-full" style={{ background: "#00B4D8" }}
              animate={{ width: steg >= s ? "100%" : "0%" }} transition={{ duration: 0.3 }} />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {steg === 1 && (
          <motion.div key="steg1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Hvor har du plass i dag?</h3>
            <p className="text-sm text-white/40 mb-5">Og hvilken bydel ønsker du å bytte til?</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                  <MapPin size={11} className="inline mr-1" />Min nåværende plass er i
                </label>
                <select value={nåværende} onChange={e => setNåværende(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-white focus:outline-none appearance-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${nåværende ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.12)"}` }}>
                  <option value="">Velg bydel...</option>
                  {BYDELER.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.2)" }}>
                  <ArrowLeftRight size={14} style={{ color: "#00B4D8" }} />
                </div>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                  <MapPin size={11} className="inline mr-1" />Jeg ønsker plass i
                </label>
                <select value={ønsket} onChange={e => setØnsket(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl text-sm text-white focus:outline-none appearance-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: `1px solid ${ønsket ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.12)"}` }}>
                  <option value="">Velg bydel...</option>
                  {BYDELER.filter(b => b !== nåværende).map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <button disabled={!nåværende || !ønsket}
              onClick={() => setSteg(2)}
              className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}>
              Videre <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        {steg === 2 && (
          <motion.div key="steg2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Litt mer info</h3>
            <p className="text-sm text-white/40 mb-5">Fortell potensielle byttetakere om plassen din.</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Type plass</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPER.map(t => (
                    <button key={t.value} onClick={() => setType(t.value)}
                      className="py-2.5 px-3 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: type === t.value ? "rgba(0,180,216,0.15)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${type === t.value ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.1)"}`,
                        color: type === t.value ? "#00B4D8" : "rgba(255,255,255,0.6)",
                      }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Kort beskrivelse (valgfri)</label>
                <textarea value={beskrivelse} onChange={e => setBeskrivelse(e.target.value)} rows={2}
                  placeholder="F.eks. «Har fast plass i kjeller, innendørs. Søker plass nær Marienlyst.»"
                  className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/20 focus:outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }} />
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(0,180,216,0.07)", border: "1px solid rgba(0,180,216,0.2)" }}>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/60">{nåværende}</span>
                <ArrowLeftRight size={12} style={{ color: "#00B4D8" }} />
                <span className="font-bold text-white">{ønsket}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setSteg(1)} className="px-4 py-3 rounded-2xl font-semibold text-white/50 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}>
                Tilbake
              </button>
              <button onClick={submit} disabled={loading}
                className="flex-1 py-3 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: loading ? "rgba(0,180,216,0.4)" : "linear-gradient(135deg, #1B4F8C, #00B4D8)", boxShadow: "0 4px 16px rgba(0,180,216,0.25)" }}>
                {loading ? <RefreshCw size={15} className="animate-spin" /> : <><Bell size={15} /> Finn byttemuligheter</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ByttePage() {
  const { user } = useAuth();
  const [profil, setProfil] = useState<{ nåværendeBydel: string; ønsketBydel: string; type: string; beskrivelse: string } | null>(null);
  const [matcher, setMatcher] = useState(DEMO_MATCHER);
  const [søker, setSøker] = useState(false);
  const [registrert, setRegistrert] = useState(false);

  async function hentMatcher() {
    setSøker(true);
    try {
      const token = localStorage.getItem("ledi_token");
      const r = await fetch("/api/bytte/matcher", { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const data = await r.json();
        if (data.length > 0) setMatcher(data);
      }
    } catch { /* keep demo data */ }
    setSøker(false);
  }

  function handleRegistrert(p: typeof profil) {
    setProfil(p);
    setRegistrert(true);
    hentMatcher();
  }

  function sendForespørsel(userId: number) {
    const token = localStorage.getItem("ledi_token");
    fetch(`/api/bytte/forespor/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
      body: JSON.stringify({}),
    }).catch(() => {});
  }

  const visMinProfil = profil ?? { nåværendeBydel: "Oslo Frogner", ønsketBydel: "Oslo Grünerløkka" };

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-10 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,180,216,0.13) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: "rgba(0,180,216,0.12)", border: "1px solid rgba(0,180,216,0.3)", color: "#00B4D8" }}>
            ✨ Helt nytt — ingen andre tilbyr dette
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Bytt plass med
            <br />
            <span style={{ background: "linear-gradient(135deg, #00B4D8, #0077A8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>en annen bruker</span>
          </h1>
          <p className="text-lg text-white/55 mb-3">
            Har du månedsplass på feil side av byen? Ledi matcher deg automatisk med noen som vil ha din plass — og som har din ideelle plass.
          </p>
          <p className="text-sm font-semibold" style={{ color: "#10B981" }}>Spar 200–600 kr per måned. Begge to.</p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { n: "1", emoji: "📍", title: "Fortell oss situasjonen", desc: "Hvor har du plass i dag, og hvilken bydel ønsker du å bytte til?" },
            { n: "2", emoji: "🤖", title: "Ledi matcher automatisk", desc: "Vi finner brukere med motsatt situasjon — et perfekt gjensides bytte." },
            { n: "3", emoji: "🤝", title: "Avtal og bytt", desc: "Kontakt hverandre via Ledi, bli enige og sett opp ny månedlig booking." },
          ].map(step => (
            <div key={step.n} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}>
                  {step.n}
                </div>
                <span className="text-xl">{step.emoji}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>{step.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Main content */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Left: register / profile */}
          <div>
            <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
              {registrert ? "Din bytteønsket" : "Registrer bytteønske"}
            </h2>

            {registrert && profil ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-3xl p-5"
                style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <Check size={16} style={{ color: "#10B981" }} />
                  <span className="text-sm font-bold" style={{ color: "#10B981" }}>Aktiv bytteønsket</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="text-[10px] text-white/40 mb-0.5">Nåværende</div>
                    <div className="text-xs font-bold text-white">{profil.nåværendeBydel}</div>
                  </div>
                  <ArrowLeftRight size={16} style={{ color: "#00B4D8" }} />
                  <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div className="text-[10px] text-white/40 mb-0.5">Ønsket</div>
                    <div className="text-xs font-bold text-white">{profil.ønsketBydel}</div>
                  </div>
                </div>
                <p className="text-xs text-white/40 mb-3">Du varsles på e-post når vi finner nye matcher.</p>
                <button onClick={() => { setRegistrert(false); setProfil(null); }}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <X size={12} className="inline mr-1.5" />Trekk tilbake bytteønsket
                </button>
              </motion.div>
            ) : (
              <RegistrerForm onDone={handleRegistrert} />
            )}

            {/* Demo notice */}
            {!user && (
              <div className="mt-4 rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p className="text-xs font-semibold" style={{ color: "#F59E0B" }}>
                  💡 Demo-modus. <a href="/logg-inn" className="underline">Logg inn</a> for å registrere et ekte bytteønske.
                </p>
              </div>
            )}
          </div>

          {/* Right: matches */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                {registrert ? "Dine matcher" : "Eksempel på matcher"}
              </h2>
              {registrert && (
                <button onClick={hentMatcher} disabled={søker}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all"
                  style={{ color: "#00B4D8", background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.2)" }}>
                  <RefreshCw size={12} className={søker ? "animate-spin" : ""} />
                  Oppdater
                </button>
              )}
            </div>

            {!registrert && (
              <div className="mb-4 rounded-2xl px-4 py-2.5" style={{ background: "rgba(0,180,216,0.07)", border: "1px solid rgba(0,180,216,0.15)" }}>
                <p className="text-xs text-white/50">
                  🔍 Her ser du matcher basert på scenariet «Frogner ↔ Grünerløkka». Ekte matcher vises etter registrering.
                </p>
              </div>
            )}

            <div className="space-y-4">
              {matcher.length === 0 ? (
                <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Bell size={24} className="mx-auto mb-3 text-white/20" />
                  <p className="text-white/50 text-sm font-medium mb-1">Ingen matcher ennå</p>
                  <p className="text-white/30 text-xs">Vi varsler deg på e-post så snart noen registrerer motsatt bytteønske.</p>
                </div>
              ) : (
                matcher.map(m => (
                  <MatchKort
                    key={m.userId}
                    match={m}
                    minProfil={profil ?? { nåværendeBydel: "Oslo Frogner", ønsketBydel: "Oslo Grünerløkka" }}
                    onSend={sendForespørsel}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA for non-registered */}
      {!registrert && (
        <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
          <div className="rounded-3xl p-8" style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.08), rgba(27,79,140,0.12))", border: "1px solid rgba(0,180,216,0.2)" }}>
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Klar til å bytte?</h3>
            <p className="text-white/40 text-sm mb-5">Det tar under 1 minutt å registrere bytteønsket ditt. Ledi håndterer matchingen automatisk.</p>
            <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="px-8 py-3.5 rounded-2xl font-bold text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", boxShadow: "0 4px 20px rgba(0,180,216,0.3)" }}>
              Registrer bytteønske →
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
