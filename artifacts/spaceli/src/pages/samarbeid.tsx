import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { ChevronDown, ChevronRight, Check } from "lucide-react";

const STATS = [
  { num: "8%", label: "Gebyr begge parter" },
  { num: "Vipps", label: "Umiddelbar utbetaling" },
  { num: "BankID", label: "Verifisert" },
];

const CATEGORIES = [
  {
    icon: "🏘️",
    title: "Borettslag og sameier",
    desc: "Lei ut fellesplasser og boder direkte til beboere og naboer. Inntekten går rett til fellesfondet.",
    color: "#00B4D8",
    btnColor: "linear-gradient(135deg, #1B4F8C, #00B4D8)",
    benefits: [
      "Gratis å registrere alle plasser",
      "Reduser felleskostnader",
      "Automatisk Vipps-utbetaling",
      "Månedlig rapport til styret",
      "Vi setter det opp for dere gratis",
    ],
    estimate: "Et borettslag med 20 plasser kan tjene 40 000 – 80 000 kr/år",
    btnLabel: "Registrer borettslag →",
    btnHref: "/borettslag",
  },
  {
    icon: "🏢",
    title: "Bedrifter og næringsparker",
    desc: "Har dere tomme parkeringsplasser på kveld og helg? Gjør dem om til en inntektskilde – helt uten administrasjon.",
    color: "#10B981",
    btnColor: "linear-gradient(135deg, #065F46, #10B981)",
    benefits: [
      "Faktura til bedriftskunder",
      "Administrer alle plasser samlet",
      "API-integrasjon med egne systemer",
      "Dedikert kontaktperson i Ledi",
      "Skreddersydd avtale",
    ],
    estimate: "En næringspark med 50 plasser kan tjene 300 000 – 600 000 kr/år",
    btnLabel: "Ta kontakt →",
    btnHref: "#kontakt",
  },
  {
    icon: "🌾",
    title: "Bønder og grunneiere",
    desc: "Har du ledig jord, gårdsplass eller låve? Lei ut til camping, bobil, henger og lagring – og tjen penger på areal du allerede eier.",
    color: "#F59E0B",
    btnColor: "linear-gradient(135deg, #92400E, #F59E0B)",
    benefits: [
      "Campingplass: 150–400 kr/natt",
      "Hengerplass: 800–2 000 kr/mnd",
      "Lagring i låve: 500–1 500 kr/mnd",
      "Sesongbasert – perfekt for sommer",
      "Vi markedsfører plassen for deg",
    ],
    estimate: "En gård med 10 campingplasser kan tjene 100 000 – 200 000 kr/sommer",
    btnLabel: "Registrer gård →",
    btnHref: "#kontakt",
  },
  {
    icon: "🔌",
    title: "Teknologi og API-partnere",
    desc: "Integrer Ledi i din egen app eller tjeneste. Perfekt for eiendomsmeglere, parkeringssystemer og reiseapper.",
    color: "#8B5CF6",
    btnColor: "linear-gradient(135deg, #4C1D95, #8B5CF6)",
    benefits: [
      "Åpent REST API",
      "Webhook ved nye bookinger",
      "White-label mulighet",
      "Provisjon per booking",
      "Teknisk support inkludert",
    ],
    estimate: "Typer: 🏠 Eiendomsmeglere · 🅿️ Parkeringssystemer · ✈️ Reiseapper · 🏨 Hoteller",
    btnLabel: "Se API-dokumentasjon →",
    btnHref: "/api",
  },
];


const FAQ = [
  {
    q: "Koster det noe å bli partner?",
    a: "Nei – det er gratis å registrere seg og legge ut plasser. Ledi tar kun 8% fra begge parter når en booking gjennomføres.",
  },
  {
    q: "Hvor raskt kommer pengene?",
    a: "Utbetaling skjer via Vipps umiddelbart etter bekreftet booking. Ingen ventetid.",
  },
  {
    q: "Kan vi styre tilgjengeligheten selv?",
    a: "Ja – dere bestemmer selv når plassene er tilgjengelige. Per time, dag, uke eller måned.",
  },
  {
    q: "Hva med forsikring?",
    a: "Ledi har ingen egen forsikring eller ansvarsgaranti. Utleiere må ha gyldig forsikring som dekker eiendommen ved utleie, og leietakere må ha forsikring for egne kjøretøy og eiendeler. Begge parter bekrefter dette som et krav ved registrering.",
  },
  {
    q: "Kan vi integrere Ledi i vårt eget system?",
    a: "Ja – vi tilbyr et åpent API for teknologipartnere. Ta kontakt for dokumentasjon.",
  },
];

const TYPES = ["Borettslag / Sameie", "Bedrift / Næringspark", "Bonde / Grunneier", "Teknologi / API", "Annet"];
const ANTALL = ["1–10 plasser", "11–50 plasser", "51–200 plasser", "200+ plasser"];

export default function SamarbeidPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ navn: "", epost: "", telefon: "", type: "", antall: "", melding: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(k: string, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.navn || !form.epost || !form.type) return;
    setLoading(true);
    // Simulate sending — open mailto
    const body = `Navn: ${form.navn}\nE-post: ${form.epost}\nTelefon: ${form.telefon}\nType: ${form.type}\nAntall plasser: ${form.antall}\nMelding: ${form.melding}`;
    window.location.href = `mailto:hei@ledi.no?subject=Samarbeidshenvendelse fra ${form.navn}&body=${encodeURIComponent(body)}`;
    setTimeout(() => { setLoading(false); setSent(true); }, 800);
  }

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-12 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(0,180,216,0.16) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: "rgba(0,180,216,0.12)", border: "1px solid rgba(0,180,216,0.3)", color: "#00B4D8" }}>
            🤝 Bli samarbeidspartner
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Voks med{" "}
            <span style={{ background: "linear-gradient(135deg, #00B4D8, #0077A8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Ledi</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10">
            Legg ut dine ledige plasser og tjen penger på areal du allerede eier
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {STATS.map(s => (
              <div key={s.label} className="rounded-2xl py-3 px-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{s.num}</div>
                <div className="text-xs text-white/40 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Category cards */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {CATEGORIES.map(cat => (
            <motion.div
              key={cat.title}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.18 }}
              className="rounded-3xl p-7 flex flex-col"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", transition: "border-color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${cat.color}55`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            >
              <div className="text-3xl mb-4">{cat.icon}</div>
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{cat.title}</h2>
              <p className="text-white/50 text-sm leading-relaxed mb-5">{cat.desc}</p>

              <ul className="space-y-2 mb-5 flex-1">
                {cat.benefits.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm text-white/70">
                    <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: cat.color }} />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="rounded-xl px-4 py-2.5 mb-5 text-sm" style={{ background: `${cat.color}12`, border: `1px solid ${cat.color}22` }}>
                <span className="font-medium" style={{ color: cat.color }}>💰 </span>
                <span className="text-white/60">{cat.estimate}</span>
              </div>

              <Link href={cat.btnHref}>
                <button className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 active:scale-95" style={{ background: cat.btnColor }}>
                  {cat.btnLabel}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Become a partner CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16 text-center">
        <p className="text-white/40 text-sm">
          Interessert i samarbeid? Ta kontakt på{" "}
          <a href="mailto:hei@ledi.no" className="transition-colors hover:text-white" style={{ color: "#00B4D8" }}>hei@ledi.no</a>
        </p>
      </section>

      {/* Contact form */}
      <section id="kontakt" className="max-w-2xl mx-auto px-4 pb-20 scroll-mt-24">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Kom i gang i dag</h2>
          <p className="text-white/40">Vi svarer innen 24 timer</p>
        </div>

        <div className="rounded-3xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(0,180,216,0.15)" }}>
                  <Check size={26} style={{ color: "#00B4D8" }} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Takk!</h3>
                <p className="text-white/50">Vi kontakter deg innen 24 timer på <span className="text-white">{form.epost}</span></p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">Navn *</label>
                    <input required type="text" value={form.navn} onChange={e => handleChange("navn", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                      placeholder="Ditt navn" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white/50 mb-1.5">E-post *</label>
                    <input required type="email" value={form.epost} onChange={e => handleChange("epost", e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                      placeholder="din@epost.no" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Telefon</label>
                  <input type="tel" value={form.telefon} onChange={e => handleChange("telefon", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                    placeholder="+47 000 00 000" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2">Type samarbeid *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {TYPES.map(t => (
                      <label key={t} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer transition-colors"
                        style={{
                          background: form.type === t ? "rgba(0,180,216,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${form.type === t ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.1)"}`,
                        }}>
                        <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => handleChange("type", t)} className="hidden" />
                        <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                          style={{ borderColor: form.type === t ? "#00B4D8" : "rgba(255,255,255,0.3)" }}>
                          {form.type === t && <div className="w-2 h-2 rounded-full" style={{ background: "#00B4D8" }} />}
                        </div>
                        <span className="text-sm" style={{ color: form.type === t ? "#00B4D8" : "rgba(255,255,255,0.7)" }}>{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-2">Antall plasser (omtrent)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {ANTALL.map(a => (
                      <label key={a} className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer text-center transition-colors"
                        style={{
                          background: form.antall === a ? "rgba(0,180,216,0.12)" : "rgba(255,255,255,0.04)",
                          border: `1px solid ${form.antall === a ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.1)"}`,
                        }}>
                        <input type="radio" name="antall" value={a} checked={form.antall === a} onChange={() => handleChange("antall", a)} className="hidden" />
                        <span className="text-xs font-medium" style={{ color: form.antall === a ? "#00B4D8" : "rgba(255,255,255,0.6)" }}>{a}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1.5">Melding</label>
                  <textarea value={form.melding} onChange={e => handleChange("melding", e.target.value)} rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none resize-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" }}
                    placeholder="Fortell oss litt om situasjonen din..." />
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white text-base transition-all"
                  style={{ background: loading ? "rgba(0,180,216,0.4)" : "linear-gradient(135deg, #1B4F8C, #00B4D8)", boxShadow: loading ? "none" : "0 4px 20px rgba(0,180,216,0.25)" }}>
                  {loading ? "Sender..." : "Send henvendelse →"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-4 pb-20">
        <h2 className="text-2xl font-bold text-white text-center mb-8" style={{ fontFamily: "'Syne', sans-serif" }}>Vanlige spørsmål</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5"
              >
                <span className="font-semibold text-white text-sm">{item.q}</span>
                <ChevronDown size={16} className="text-white/40 flex-shrink-0 transition-transform" style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }} />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <p className="px-5 pb-5 text-sm text-white/55 leading-relaxed">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="rounded-3xl p-8" style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.1) 0%, rgba(27,79,140,0.15) 100%)", border: "1px solid rgba(0,180,216,0.2)" }}>
          <div className="text-3xl mb-3">🤝</div>
          <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Klar til å starte?</h3>
          <p className="text-white/50 mb-6 text-sm">Fyll ut skjemaet over eller ta kontakt direkte.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="#kontakt">
              <button className="px-6 py-3 rounded-xl font-bold text-white text-sm" style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}>
                Start samarbeid →
              </button>
            </a>
            <a href="mailto:hei@ledi.no">
              <button className="px-6 py-3 rounded-xl font-semibold text-sm text-white" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
                hei@ledi.no
              </button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
