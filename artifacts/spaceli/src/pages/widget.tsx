import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import LediLogo from "@/components/LediLogo";

const BUSINESS_TYPES = [
  { key: "restaurant",   label: "Restaurant",    emoji: "🍽️", eks: "Restaurantgjester parkerer trygt mens de spiser" },
  { key: "hotell",       label: "Hotell",         emoji: "🏨", eks: "Gjestene booker parkering ved innsjekk" },
  { key: "kjoepesenter", label: "Kjøpesenter",   emoji: "🛍️", eks: "Kunder finner plass uten stress" },
  { key: "treningssenter",label: "Treningssenter",emoji: "🏋️", eks: "Medlemmer reserverer plass i appen" },
  { key: "sykehus",      label: "Sykehus",        emoji: "🏥", eks: "Pasienter og pårørende slipper å lete" },
  { key: "kino",         label: "Kino/Event",     emoji: "🎬", eks: "Besøkende booker rett fra billettbestilling" },
  { key: "annet",        label: "Annen bedrift",  emoji: "🏢", eks: "Alle med egne parkeringsplasser" },
];

const HOW_IT_WORKS = [
  { n: "1", title: "Lim inn én kodelinje", desc: "Kopier script-taggen og lim den inn på nettsiden din. Det tar 30 sekunder." },
  { n: "2", title: "Kunden klikker og booker", desc: "Knappen åpner Ledi direkte. Kunden betaler og får bekreftet plass." },
  { n: "3", title: "Du tjener 2% automatisk", desc: "Pengene overføres månedlig. Full oversikt i dashbordet ditt." },
];

function CodeSnippet({ partnerId }: { partnerId: string }) {
  const [copied, setCopied] = useState(false);
  const code = `<script src="https://ledi.no/widget.js"\n  data-partner="${partnerId}"\n  data-style="floating">\n</script>`;

  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "#0D1B2A", border: "1px solid rgba(0,180,216,0.25)" }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
          <div className="w-3 h-3 rounded-full bg-green-500/60" />
        </div>
        <span className="text-xs text-white/30 font-mono">index.html</span>
        <button
          onClick={copy}
          className="text-xs px-3 py-1 rounded-full font-semibold transition-all"
          style={{
            background: copied ? "rgba(16,185,129,0.2)" : "rgba(0,180,216,0.15)",
            color: copied ? "#10B981" : "#00B4D8",
            border: `1px solid ${copied ? "rgba(16,185,129,0.3)" : "rgba(0,180,216,0.3)"}`,
          }}
        >
          {copied ? "✓ Kopiert!" : "Kopier"}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono overflow-x-auto" style={{ color: "#e2e8f0", lineHeight: 1.7 }}>
        <span style={{ color: "#7dd3fc" }}>&lt;script</span>
        {" "}
        <span style={{ color: "#86efac" }}>src</span>
        <span style={{ color: "#fff" }}>=</span>
        <span style={{ color: "#fde68a" }}>"https://ledi.no/widget.js"</span>
        {"\n  "}
        <span style={{ color: "#86efac" }}>data-partner</span>
        <span style={{ color: "#fff" }}>=</span>
        <span style={{ color: "#fde68a" }}>"{partnerId}"</span>
        {"\n  "}
        <span style={{ color: "#86efac" }}>data-style</span>
        <span style={{ color: "#fff" }}>=</span>
        <span style={{ color: "#fde68a" }}>"floating"</span>
        <span style={{ color: "#7dd3fc" }}>&gt;</span>
        {"\n"}
        <span style={{ color: "#7dd3fc" }}>&lt;/script&gt;</span>
      </pre>
    </div>
  );
}

function WidgetPreview() {
  const [clicked, setClicked] = useState(false);
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #f8fafc, #e2e8f0)", minHeight: 220 }}>
      <div className="p-6">
        <div className="w-32 h-3 rounded-full mb-3" style={{ background: "#cbd5e1" }} />
        <div className="w-48 h-3 rounded-full mb-2" style={{ background: "#e2e8f0" }} />
        <div className="w-40 h-3 rounded-full mb-6" style={{ background: "#e2e8f0" }} />
        <div className="flex gap-3 mb-4">
          <div className="h-8 w-24 rounded-lg" style={{ background: "#cbd5e1" }} />
          <div className="h-8 w-20 rounded-lg" style={{ background: "#e2e8f0" }} />
        </div>
        <div className="text-xs text-gray-400 italic">– Din nettside –</div>
      </div>
      {/* Widget button */}
      <div className="absolute bottom-5 right-5">
        <motion.button
          onClick={() => setClicked(true)}
          whileHover={{ scale: 1.04, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white text-sm shadow-xl cursor-pointer"
          style={{ background: "linear-gradient(135deg, #00B4D8, #0090a8)", boxShadow: "0 4px 20px rgba(0,180,216,0.4)" }}
        >
          <span className="text-lg">🅿️</span>
          <span>Book parkering via <LediLogo size={14} /></span>
        </motion.button>
        <p className="text-center text-gray-400 mt-1 flex items-center justify-center gap-1" style={{ fontSize: 9 }}>Powered by <LediLogo size={9} /></p>
      </div>

      <AnimatePresence>
        {clicked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center rounded-2xl"
            style={{ background: "rgba(13,27,42,0.92)" }}
          >
            <div className="text-center">
              <div className="text-4xl mb-3">🅿️</div>
              <p className="text-white font-bold text-lg">Åpner Ledi booking...</p>
              <p className="text-white/50 text-sm mt-1">Kunden reserverer plass direkte</p>
              <button
                onClick={() => setClicked(false)}
                className="mt-4 text-xs text-white/40 underline"
              >Tilbake til demo</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WidgetPage() {
  const [selectedType, setSelectedType] = useState("restaurant");
  const [form, setForm] = useState({ navn: "", type: "restaurant", epost: "", nettside: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.navn || !form.epost) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/widget/registrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ navn: form.navn, type: form.type, kontaktEpost: form.epost, nettside: form.nettside }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Noe gikk galt");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", color: "#fff" }}>
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,180,216,0.12) 0%, transparent 70%)"
        }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
            style={{ background: "rgba(0,180,216,0.12)", color: "#00B4D8", border: "1px solid rgba(0,180,216,0.2)" }}
          >
            🔌 <LediLogo size={14} /> Widget
          </span>
          <h1 className="text-5xl sm:text-6xl font-black mb-4" style={{ fontFamily: "Syne, sans-serif", lineHeight: 1.05 }}>
            Tilby parkering<br />
            <span style={{ color: "#00B4D8" }}>på din nettside</span>
          </h1>
          <p className="text-xl text-white/60 max-w-xl mx-auto mb-8">
            Én kodelinje. Kunden booker direkte.<br />Du tjener <strong className="text-white">2%</strong> av hver booking — automatisk.
          </p>
          <a
            href="#registrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-lg font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #00B4D8, #0090a8)", boxShadow: "0 4px 24px rgba(0,180,216,0.35)" }}
          >
            Bli partner gratis
          </a>
        </motion.div>
      </section>

      {/* Live demo */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
              Slik ser det ut på nettsiden din
            </h2>
            <p className="text-white/50 mb-6 text-sm">
              En elegant Ledi-knapp vises fast i hjørnet. Kunden klikker og booker uten å forlate konteksten.
            </p>
            <div className="space-y-2 mb-6">
              {[
                ["floating", "Svevende knapp (fast i hjørnet)"],
                ["inline", "Inline-knapp (midt i innholdet)"],
              ].map(([val, lbl]) => (
                <label key={val} className="flex items-center gap-3 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: "#00B4D8" }}>
                    <div className="w-2 h-2 rounded-full" style={{ background: "#00B4D8", opacity: val === "floating" ? 1 : 0 }} />
                  </div>
                  <span className="text-sm text-white/70">{lbl}</span>
                </label>
              ))}
            </div>
            <CodeSnippet partnerId="din-partner-id" />
          </div>
          <div>
            <WidgetPreview />
            <p className="text-center text-white/30 text-xs mt-3">Klikk på knappen for å se flyten →</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12" style={{ fontFamily: "Syne, sans-serif" }}>
          Slik fungerer det
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-6 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black mx-auto mb-4"
                style={{ background: "linear-gradient(135deg, #00B4D8, #0090a8)", fontFamily: "Syne, sans-serif" }}
              >
                {step.n}
              </div>
              <h3 className="font-bold text-white mb-2">{step.title}</h3>
              <p className="text-white/50 text-sm">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Business types */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-center mb-4" style={{ fontFamily: "Syne, sans-serif" }}>
          Perfekt for
        </h2>
        <p className="text-center text-white/50 mb-10">Alle bedrifter med kunder som trenger parkering</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {BUSINESS_TYPES.map(bt => (
            <button
              key={bt.key}
              onClick={() => setSelectedType(bt.key)}
              className="rounded-2xl p-4 text-left transition-all"
              style={{
                background: selectedType === bt.key ? "rgba(0,180,216,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${selectedType === bt.key ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              <div className="text-2xl mb-2">{bt.emoji}</div>
              <div className="text-sm font-semibold text-white">{bt.label}</div>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {BUSINESS_TYPES.filter(bt => bt.key === selectedType).map(bt => (
            <motion.div
              key={bt.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 rounded-2xl p-5 flex items-center gap-4"
              style={{ background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.2)" }}
            >
              <span className="text-3xl">{bt.emoji}</span>
              <p className="text-white/70 text-sm">{bt.eks}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* Revenue model */}
      <section className="max-w-3xl mx-auto px-4 pb-20">
        <div
          className="rounded-3xl p-8 text-center"
          style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.12), rgba(0,144,168,0.08))", border: "1px solid rgba(0,180,216,0.25)" }}
        >
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Inntektsmodellen</h2>
          <p className="text-white/50 text-sm mb-8">Per booking som skjer via widgeten din</p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Leietaker betaler", value: "100 kr", color: "#e2e8f0" },
              { label: "Din bedrift tjener", value: "2 kr", color: "#00B4D8", big: true },
              { label: "Ledi tar", value: "14 kr", color: "#8B5CF6" },
            ].map(row => (
              <div key={row.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div
                  className={`font-black mb-1 ${row.big ? "text-3xl" : "text-2xl"}`}
                  style={{ color: row.color, fontFamily: "Syne, sans-serif" }}
                >
                  {row.value}
                </div>
                <div className="text-xs text-white/40">{row.label}</div>
              </div>
            ))}
          </div>
          <p className="text-white/40 text-xs">
            Utbetaling månedlig · Ingen setup-kostnad · Ingen bindingstid
          </p>
        </div>
      </section>

      {/* Registration form */}
      <section id="registrer" className="max-w-xl mx-auto px-4 pb-28">
        <h2 className="text-3xl font-bold text-center mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
          Bli partner gratis
        </h2>
        <p className="text-center text-white/50 mb-8 text-sm">
          Vi setter opp widget-ID-en din og sender koden innen 24 timer
        </p>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl p-10 text-center"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-white mb-2">Søknad mottatt!</h3>
              <p className="text-white/60 text-sm">
                Vi kontakter deg på e-post med partner-ID og koden innen 24 timer.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="rounded-3xl p-8 space-y-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div>
                <label className="block text-xs text-white/50 mb-1.5">Bedriftsnavn *</label>
                <input
                  type="text"
                  value={form.navn}
                  onChange={e => setForm(f => ({ ...f, navn: e.target.value }))}
                  placeholder="f.eks. Oslo Grand Hotell"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Type bedrift</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {BUSINESS_TYPES.map(bt => (
                    <button
                      type="button"
                      key={bt.key}
                      onClick={() => setForm(f => ({ ...f, type: bt.key }))}
                      className="flex flex-col items-center gap-1 p-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: form.type === bt.key ? "rgba(0,180,216,0.18)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${form.type === bt.key ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: form.type === bt.key ? "#00B4D8" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      <span className="text-lg">{bt.emoji}</span>
                      <span>{bt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">E-postadresse *</label>
                <input
                  type="email"
                  value={form.epost}
                  onChange={e => setForm(f => ({ ...f, epost: e.target.value }))}
                  placeholder="kontakt@bedriften.no"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-white/50 mb-1.5">Nettside <span className="text-white/25">(valgfritt)</span></label>
                <input
                  type="url"
                  value={form.nettside}
                  onChange={e => setForm(f => ({ ...f, nettside: e.target.value }))}
                  placeholder="https://bedriften.no"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 rounded-xl font-bold text-white text-base transition-all"
                style={{
                  background: submitting ? "rgba(0,180,216,0.4)" : "linear-gradient(135deg, #00B4D8, #0090a8)",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Sender..." : "Send søknad — gratis"}
              </button>

              <p className="text-center text-white/30 text-xs">
                Ingen betal · Ingen begrensning · Vi kontakter deg innen 24t
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

    </div>
  );
}
