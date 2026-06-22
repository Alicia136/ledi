import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { Gift, Send, Copy, Check, Star, Building2, Heart, ChevronRight } from "lucide-react";

const AMOUNTS = [500, 1000, 2000];

const USE_CASES = [
  {
    icon: <Building2 size={22} />,
    title: "Bedriftsgave",
    desc: "Gi ansatte noe de faktisk bruker – gratis parkering sparer dem for både tid og penger.",
    color: "#00B4D8",
  },
  {
    icon: <Heart size={22} />,
    title: "Bursdagsgave",
    desc: "Perfekt til noen som hater å lete etter parkering. Praktisk og uventet.",
    color: "#7C3AED",
  },
  {
    icon: <Star size={22} />,
    title: "Julegave",
    desc: "Til den pendlende kollegaen som alltid er sen fordi han/hun leter etter plass.",
    color: "#F59E0B",
  },
];

interface GavekortResult {
  id: number;
  kode: string;
  belop: number;
  mottakerNavn: string;
  mottakerEpost: string;
}

export default function GavekortPage() {
  const [belop, setBelop] = useState(1000);
  const [avsenderNavn, setAvsenderNavn] = useState("");
  const [avsenderEpost, setAvsenderEpost] = useState("");
  const [mottakerNavn, setMottakerNavn] = useState("");
  const [mottakerEpost, setMottakerEpost] = useState("");
  const [melding, setMelding] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GavekortResult | null>(null);
  const [kopiert, setKopiert] = useState(false);
  const [kodeInput, setKodeInput] = useState("");
  const [sjekket, setSjekket] = useState<{ kode: string; belop: number; status: string; mottakerNavn: string } | null>(null);
  const [sjekkFeil, setSjekkFeil] = useState<string | null>(null);
  const [sjekkLoading, setSjekkLoading] = useState(false);

  async function kjop() {
    setError(null);
    if (!avsenderNavn.trim() || !avsenderEpost.trim() || !mottakerNavn.trim() || !mottakerEpost.trim()) {
      setError("Fyll ut alle obligatoriske felt.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/gavekort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ belop: String(belop), avsenderNavn, avsenderEpost, mottakerNavn, mottakerEpost, melding: melding || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Noe gikk galt");
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  }

  function kopierKode() {
    if (!result) return;
    navigator.clipboard.writeText(result.kode).then(() => {
      setKopiert(true);
      setTimeout(() => setKopiert(false), 2000);
    });
  }

  async function sjekkKode() {
    setSjekkFeil(null);
    setSjekket(null);
    const kode = kodeInput.trim().toUpperCase();
    if (!kode) return;
    setSjekkLoading(true);
    try {
      const res = await fetch(`/api/gavekort/${kode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ikke funnet");
      setSjekket(data);
    } catch (e: unknown) {
      setSjekkFeil(e instanceof Error ? e.message : "Ikke funnet");
    } finally {
      setSjekkLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12 px-4 text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,180,216,0.15) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(0,180,216,0.12)", border: "1px solid rgba(0,180,216,0.3)", color: "#00B4D8" }}
          >
            <Gift size={13} /> Ledi Gavekort
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Send en parkeringsplass{" "}
            <span style={{ background: "linear-gradient(135deg, #00B4D8, #0077A8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              som gave
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-xl mx-auto">
            Kjøp gavekort — mottaker bruker det på valgfri parkering, lagerplass eller lader i hele Norge.
          </p>
        </div>
      </section>

      {/* Use cases */}
      <section className="max-w-4xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {USE_CASES.map(u => (
            <div
              key={u.title}
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${u.color}22`, color: u.color }}>
                {u.icon}
              </div>
              <div className="font-semibold text-white mb-1">{u.title}</div>
              <div className="text-sm text-white/50">{u.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <div
          className="rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/70"
          style={{ background: "rgba(0,180,216,0.07)", border: "1px solid rgba(0,180,216,0.2)" }}
        >
          {["Velg beløp: 500 / 1000 / 2000 kr", "Send på e-post til mottaker", "Mottaker bruker koden på valgfri plass"].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "#00B4D8", color: "#0D1B2A" }}>
                {i + 1}
              </span>
              <span>{step}</span>
              {i < 2 && <ChevronRight size={14} className="text-white/20 hidden sm:block" />}
            </div>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {result ? (
          /* Success state */
          <motion.section
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto px-4 pb-20"
          >
            {/* Gift card visual */}
            <div
              className="rounded-3xl p-8 mb-6 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #0D2A3F 0%, #0D1B2A 50%, #0A2238 100%)", border: "1px solid rgba(0,180,216,0.3)" }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10" style={{ background: "#00B4D8", transform: "translate(30%, -30%)" }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="font-bold text-white text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>Ledi</div>
                  <Gift size={22} style={{ color: "#00B4D8" }} />
                </div>
                <div className="text-4xl font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
                  {result.belop.toLocaleString("nb-NO")} kr
                </div>
                <div className="text-white/50 text-sm mb-8">Gavekort · Gyldig i 12 måneder</div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/40 mb-1">Til</div>
                    <div className="text-white font-medium">{result.mottakerNavn}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/40 mb-1">Kode</div>
                    <div className="font-mono font-bold text-lg tracking-widest" style={{ color: "#00B4D8" }}>{result.kode}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(0,180,216,0.15)" }}>
                <Check size={22} style={{ color: "#00B4D8" }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Gavekort opprettet!</h2>
              <p className="text-white/50 text-sm">Del koden med <span className="text-white">{result.mottakerNavn}</span> på e-post eller Vipps.</p>
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={kopierKode}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: kopiert ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: kopiert ? "#00B4D8" : "white" }}
              >
                {kopiert ? <Check size={15} /> : <Copy size={15} />}
                {kopiert ? "Kopiert!" : "Kopier kode"}
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", color: "white" }}
                onClick={() => {
                  const subject = encodeURIComponent(`Gavekort fra Ledi – ${result.belop} kr`);
                  const body = encodeURIComponent(`Hei ${result.mottakerNavn}!\n\nDu har fått et Ledi-gavekort på ${result.belop} kr.\n\nBruk koden: ${result.kode}\n\nGo to ledi.no and enter the code at checkout.\n\nGyldig i 12 måneder.`);
                  window.location.href = `mailto:${result.mottakerEpost}?subject=${subject}&body=${body}`;
                }}
              >
                <Send size={15} /> Send på e-post
              </button>
            </div>

            <button
              onClick={() => { setResult(null); setAvsenderNavn(""); setAvsenderEpost(""); setMottakerNavn(""); setMottakerEpost(""); setMelding(""); }}
              className="w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Kjøp et nytt gavekort
            </button>
          </motion.section>
        ) : (
          /* Purchase form */
          <motion.section
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-lg mx-auto px-4 pb-20"
          >
            <div
              className="rounded-3xl p-6 sm:p-8"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {/* Amount */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white/70 mb-3">Velg beløp</label>
                <div className="grid grid-cols-3 gap-3">
                  {AMOUNTS.map(a => (
                    <button
                      key={a}
                      onClick={() => setBelop(a)}
                      className="py-3 rounded-xl font-bold text-lg transition-all"
                      style={belop === a
                        ? { background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", color: "white", boxShadow: "0 4px 16px rgba(0,180,216,0.3)" }
                        : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "white/80" }
                      }
                    >
                      {a.toLocaleString("nb-NO")} kr
                    </button>
                  ))}
                </div>
              </div>

              {/* Sender */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-white/70 mb-3">Fra deg</label>
                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    placeholder="Ditt navn *"
                    value={avsenderNavn}
                    onChange={e => setAvsenderNavn(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                  <input
                    type="email"
                    placeholder="Din e-post *"
                    value={avsenderEpost}
                    onChange={e => setAvsenderEpost(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                </div>
              </div>

              {/* Recipient */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-white/70 mb-3">Til mottaker</label>
                <div className="flex flex-col gap-2.5">
                  <input
                    type="text"
                    placeholder="Mottakerens navn *"
                    value={mottakerNavn}
                    onChange={e => setMottakerNavn(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                  <input
                    type="email"
                    placeholder="Mottakerens e-post *"
                    value={mottakerEpost}
                    onChange={e => setMottakerEpost(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                </div>
              </div>

              {/* Message */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-white/70 mb-3">Personlig hilsen <span className="font-normal text-white/30">(valgfri)</span></label>
                <textarea
                  placeholder="Skriv en melding til mottakeren..."
                  value={melding}
                  onChange={e => setMelding(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>

              {/* Live preview */}
              <div
                className="rounded-2xl p-5 mb-6 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #0D2A3F 0%, #0D1B2A 100%)", border: "1px solid rgba(0,180,216,0.2)" }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: "#00B4D8", transform: "translate(30%, -30%)" }} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-white text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Ledi</span>
                    <Gift size={15} style={{ color: "#00B4D8" }} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {belop.toLocaleString("nb-NO")} kr
                  </div>
                  <div className="text-white/40 text-xs mb-4">Gavekort · Gyldig i 12 måneder</div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-xs text-white/30 mb-0.5">Til</div>
                      <div className="text-white text-sm font-medium">{mottakerNavn || "Mottakerens navn"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/30 mb-0.5">Fra</div>
                      <div className="text-white text-sm font-medium">{avsenderNavn || "Ditt navn"}</div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}>
                  {error}
                </div>
              )}

              <button
                onClick={kjop}
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-white text-base transition-all"
                style={{
                  background: loading ? "rgba(0,180,216,0.3)" : "linear-gradient(135deg, #1B4F8C, #00B4D8)",
                  boxShadow: loading ? "none" : "0 4px 20px rgba(0,180,216,0.3)",
                }}
              >
                {loading ? "Oppretter gavekort..." : `🎁 Kjøp gavekort – ${belop.toLocaleString("nb-NO")} kr`}
              </button>

              <p className="text-center text-xs text-white/25 mt-3">
                Gyldig i 12 måneder · Kan brukes på alle plasser i Norge
              </p>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Check gift card code section */}
      <section className="max-w-lg mx-auto px-4 pb-20">
        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <h3 className="font-semibold text-white mb-1">Har du mottatt et gavekort?</h3>
          <p className="text-sm text-white/40 mb-4">Sjekk saldo og gyldighet ved å skrive inn koden.</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="XXXX-XXXX-XX"
              value={kodeInput}
              onChange={e => setKodeInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && sjekkKode()}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-mono text-white placeholder:text-white/25 focus:outline-none tracking-wider"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
            />
            <button
              onClick={sjekkKode}
              disabled={sjekkLoading}
              className="px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
            >
              {sjekkLoading ? "..." : "Sjekk"}
            </button>
          </div>
          {sjekkFeil && (
            <p className="mt-3 text-sm" style={{ color: "#FCA5A5" }}>Feil: {sjekkFeil}</p>
          )}
          {sjekket && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-xl"
              style={{
                background: sjekket.status === "aktiv" ? "rgba(0,180,216,0.08)" : "rgba(239,68,68,0.08)",
                border: `1px solid ${sjekket.status === "aktiv" ? "rgba(0,180,216,0.25)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/40 mb-0.5">Til: {sjekket.mottakerNavn}</div>
                  <div className="text-xl font-bold text-white">{sjekket.belop.toLocaleString("nb-NO")} kr</div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${sjekket.status === "aktiv" ? "text-emerald-400" : "text-red-400"}`}
                  style={{ background: sjekket.status === "aktiv" ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)" }}>
                  {sjekket.status === "aktiv" ? "✓ Gyldig" : "Brukt"}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
