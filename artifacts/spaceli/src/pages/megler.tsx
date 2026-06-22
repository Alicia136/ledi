import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  TrendingUp, Building2, Users, Star, ChevronRight, CheckCircle2,
  Calculator, ExternalLink, Award, Zap, BarChart3, MessageSquare,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface Estimat {
  postnummer: string;
  type: string;
  typeLabel: string;
  by: string;
  prisPerMaaned: number;
  prisPerAar: number;
  nettoPerAar: number;
  nettoPerMaaned: number;
  lediFee: number;
  populaertOmraade: boolean;
  eksempelSetning: string;
}

const SPACE_TYPES = [
  { value: "garasje",     label: "🏠 Garasje",             desc: "Låsbar garasje" },
  { value: "parkering",   label: "🅿️ Parkeringsplass",     desc: "Utendørs / karnapp" },
  { value: "bod",         label: "📦 Bod",                  desc: "Kjeller eller loft" },
  { value: "campingvogn", label: "🚐 Campingvognplass",     desc: "For campingvogn" },
  { value: "henger",      label: "🚛 Hengerplass",          desc: "For tilhenger" },
];


const HOW_IT_WORKS = [
  { step: "1", ikon: "🔗", tittel: "Registrer deg gratis", tekst: "Få din personlige megler-link og kalkulatorverktøy — ingen kostnad, ingen binding." },
  { step: "2", ikon: "📋", tittel: "Del med kunder", tekst: "Legg kalkulatoren på ditt nettsted, del i boligannonser på Finn.no, eller send direkte til kunden." },
  { step: "3", ikon: "💰", tittel: "Kunden registrerer plassen", tekst: "Kunden legger ut garasjen/parkeringen på Ledi. Pengene begynner å komme — du har tilført ekstra verdi." },
  { step: "4", ikon: "🏆", tittel: "Du differensierer deg", tekst: "Ikke bare en bolig, men en inntektskilde. Sterk grunn til å velge deg som megler." },
];

function FinnMockup({ estimat }: { estimat: Estimat }) {
  return (
    <div className="rounded-2xl overflow-hidden border" style={{ border: "1px solid rgba(255,255,255,0.1)", background: "#fff" }}>
      {/* Finn.no header bar */}
      <div className="px-4 py-2 flex items-center gap-2" style={{ background: "#06ADEF" }}>
        <span className="text-white font-black text-sm">finn</span>
        <span className="text-white/80 text-xs">no</span>
        <span className="text-white/60 text-xs ml-auto">Eiendom · Bolig til salgs</span>
      </div>

      {/* Listing image placeholder */}
      <div className="h-32 relative" style={{ background: "linear-gradient(135deg, #dde4ec, #bcc5d1)" }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 size={40} style={{ color: "#8899aa" }} />
        </div>
        <div className="absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded"
          style={{ background: "#cc3300" }}>SELGES</div>
      </div>

      {/* Listing content */}
      <div className="p-4">
        <p className="text-gray-500 text-xs mb-1">Grünerløkka · Oslo</p>
        <p className="font-bold text-gray-900 text-sm mb-0.5">3-roms leilighet med garasje — 68 m²</p>
        <p className="text-xs text-gray-500 mb-3">Totalvurdering: 4 950 000 kr</p>

        {/* Ledi badge — the key feature */}
        <div
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #0D1B2A, #1a2f45)", border: "1.5px solid rgba(0,180,216,0.4)" }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
            style={{ background: "rgba(0,180,216,0.15)" }}>
            💰
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold" style={{ color: "#00B4D8" }}>Ledi Inntektspotensial</p>
            <p className="text-white text-xs leading-snug">
              {estimat.eksempelSetning}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-black text-white text-sm">{estimat.nettoPerMaaned.toLocaleString("nb-NO")}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>kr/mnd netto</p>
          </div>
        </div>

        <p className="text-gray-400 text-xs mt-2 text-center">
          Beregnet av <span style={{ color: "#06ADEF" }}>finn.no</span> × <span style={{ color: "#00B4D8" }}>ledi.no</span>
        </p>
      </div>
    </div>
  );
}

function KalkulatorWidget({ onResult }: { onResult: (e: Estimat) => void }) {
  const [postnummer, setPostnummer] = useState("");
  const [type, setType] = useState("garasje");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCalc = async () => {
    if (postnummer.length < 4) { setError("Skriv inn gyldig postnummer (4 siffer)"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/megler/estimat?postnummer=${postnummer}&type=${type}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noe gikk galt");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
            Postnummer
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={postnummer}
            onChange={e => setPostnummer(e.target.value.replace(/\D/g, ""))}
            placeholder="f.eks. 0150"
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none focus:ring-2 transition-all"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontFamily: "DM Sans, sans-serif",
            }}
            onFocus={e => (e.target.style.border = "1px solid rgba(0,180,216,0.5)")}
            onBlur={e => (e.target.style.border = "1px solid rgba(255,255,255,0.12)")}
          />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.6)" }}>
            Plasstype
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            {SPACE_TYPES.map(t => (
              <option key={t.value} value={t.value} style={{ background: "#0D1B2A" }}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        onClick={handleCalc}
        disabled={loading}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2"
        style={{
          background: loading ? "rgba(0,180,216,0.4)" : "linear-gradient(135deg, #00B4D8, #0284C7)",
          boxShadow: loading ? "none" : "0 4px 20px rgba(0,180,216,0.35)",
        }}
      >
        {loading ? (
          <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#fff", borderTopColor: "transparent" }} />
        ) : (
          <><Calculator size={15} /> Beregn inntektspotensial</>
        )}
      </button>
    </div>
  );
}

function EstimatResultat({ estimat }: { estimat: Estimat }) {
  const bars = [
    { label: "Jan", h: 60 }, { label: "Feb", h: 65 }, { label: "Mar", h: 70 },
    { label: "Apr", h: 80 }, { label: "Mai", h: 90 }, { label: "Jun", h: 100 },
    { label: "Jul", h: 95 }, { label: "Aug", h: 92 }, { label: "Sep", h: 88 },
    { label: "Okt", h: 82 }, { label: "Nov", h: 72 }, { label: "Des", h: 68 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Main number */}
      <div className="rounded-2xl p-5 text-center"
        style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.15), rgba(2,132,199,0.08))", border: "1px solid rgba(0,180,216,0.25)" }}>
        {estimat.populaertOmraade && (
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold mb-3 inline-block"
            style={{ background: "rgba(251,191,36,0.15)", color: "#FBB924" }}>
            🔥 Populært område — høy etterspørsel
          </span>
        )}
        <p className="text-4xl font-black text-white mb-1" style={{ fontFamily: "Syne, sans-serif" }}>
          {estimat.nettoPerAar.toLocaleString("nb-NO")} kr
        </p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
          estimert nettoinntekt per år · {estimat.by}
        </p>
        <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.35)" }}>
          Etter {estimat.lediFee}% Ledi-avgift · {estimat.typeLabel.toLowerCase()} · pnr {estimat.postnummer}
        </p>
      </div>

      {/* Monthly breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Per måned", val: `${estimat.nettoPerMaaned.toLocaleString("nb-NO")} kr` },
          { label: "Per år", val: `${estimat.nettoPerAar.toLocaleString("nb-NO")} kr` },
          { label: "Over 5 år", val: `${(estimat.nettoPerAar * 5).toLocaleString("nb-NO")} kr` },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-3 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs font-semibold text-white">{item.val}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{item.label}</p>
          </div>
        ))}
      </div>

      {/* Mini bar chart */}
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>Estimert inntekt per måned</p>
        <div className="flex items-end gap-1" style={{ height: 48 }}>
          {bars.map(b => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-sm"
                style={{
                  height: `${(b.h / 100) * 40}px`,
                  background: b.h >= 90 ? "rgba(0,180,216,0.7)" : "rgba(0,180,216,0.3)",
                }}
              />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)", fontSize: 8 }}>{b.label}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function MeglerPage() {
  const [estimat, setEstimat] = useState<Estimat | null>(null);
  const [kontaktSendt, setKontaktSendt] = useState(false);
  const [form, setForm] = useState({ navn: "", epost: "", firma: "", postnummer: "", antallKunder: "" });
  const [kontaktLoading, setKontaktLoading] = useState(false);
  const kalkulatorRef = useRef<HTMLDivElement>(null);

  const scrollToKalk = () => kalkulatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const sendKontakt = async () => {
    if (!form.navn || !form.epost || !form.firma) return;
    setKontaktLoading(true);
    try {
      const res = await fetch("/api/megler/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setKontaktSendt(true);
    } finally {
      setKontaktLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", color: "#fff" }}>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-4">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #00B4D8, transparent 70%)" }} />
          <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full opacity-6"
            style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)" }} />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold"
                  style={{ background: "rgba(0,180,216,0.12)", border: "1px solid rgba(0,180,216,0.25)", color: "#00B4D8" }}>
                  <Building2 size={13} /> For eiendomsmeglere
                </div>

                <h1 className="text-5xl font-black leading-tight mb-5" style={{ fontFamily: "Syne, sans-serif" }}>
                  Garasjen er{" "}
                  <span style={{ color: "#00B4D8" }}>mer verdt</span>{" "}
                  enn kundene dine vet
                </h1>

                <p className="text-lg mb-4" style={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
                  Vis kunder hva garasjen, parkeringsplassen eller boden kan generere i leieinntekt — automatisk, i salgsannonsen.
                </p>

                <div className="rounded-2xl p-4 mb-6 inline-block"
                  style={{ background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.2)" }}>
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>
                    En typisk garasje i Oslo kan gi:
                  </p>
                  <p className="text-3xl font-black mt-1" style={{ fontFamily: "Syne, sans-serif", color: "#00B4D8" }}>
                    27 600 – 33 600 kr/år
                  </p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>netto, via Ledi · 8% plattformavgift</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={scrollToKalk}
                    className="px-6 py-3 rounded-xl font-bold text-white text-sm flex items-center gap-2 transition-all"
                    style={{ background: "linear-gradient(135deg, #00B4D8, #0284C7)", boxShadow: "0 4px 20px rgba(0,180,216,0.35)" }}
                  >
                    <Calculator size={15} /> Prøv kalkulatoren
                  </button>
                  <a href="#registrer" className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
                    Bli megler-partner <ChevronRight size={14} />
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Finn.no preview */}
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <p className="text-xs font-semibold mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                Slik ser det ut i boligannonsen på Finn.no:
              </p>
              <FinnMockup estimat={{
                postnummer: "0150",
                type: "garasje",
                typeLabel: "Garasje",
                by: "Oslo sentrum",
                prisPerMaaned: 2800,
                prisPerAar: 33600,
                nettoPerAar: 30800,
                nettoPerMaaned: 2300,
                lediFee: 8,
                populaertOmraade: true,
                eksempelSetning: "Denne garasjen kan gi 33 600 kr/år i leieinntekt via Ledi",
              }} />
              <p className="text-xs mt-2 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>
                * Demo-preview. Faktisk Finn.no-integrasjon krever partneravtale.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-10 px-4 border-y" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { val: "0 kr",  label: "kostnad for meglere" },
            { val: "8%",    label: "Ledis plattformavgift" },
            { val: "24t",   label: "svar på henvendelser" },
          ].map(s => (
            <div key={s.label}>
              <p className="text-3xl font-black" style={{ fontFamily: "Syne, sans-serif", color: "#00B4D8" }}>{s.val}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Kalkulator ── */}
      <section ref={kalkulatorRef} className="py-20 px-4" id="kalkulator">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
              Inntektskalkulator
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)" }}>
              Beregn potensielle leieinntekter for kundens plass på sekunder
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input card */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Calculator size={15} style={{ color: "#00B4D8" }} /> Fyll inn detaljer
              </p>
              <KalkulatorWidget onResult={setEstimat} />

              <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                  💡 Del kalkulatoren direkte med kunder:
                  <span className="ml-1 font-mono" style={{ color: "#00B4D8" }}>ledi.no/megler#kalkulator</span>
                </p>
              </div>
            </div>

            {/* Result card */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={15} style={{ color: "#00B4D8" }} /> Beregningsresultat
              </p>
              <AnimatePresence mode="wait">
                {estimat ? (
                  <EstimatResultat key={estimat.postnummer + estimat.type} estimat={estimat} />
                ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-52 flex flex-col items-center justify-center gap-3"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    <Calculator size={36} />
                    <p className="text-sm">Resultater vises her</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Live Finn.no preview */}
          <AnimatePresence>
            {estimat && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                <p className="text-sm font-semibold mb-3 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Slik ville Finn.no-annonsen sett ut med Ledi-merket:
                </p>
                <div className="max-w-sm mx-auto">
                  <FinnMockup estimat={estimat} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── Slik fungerer det ── */}
      <section className="py-16 px-4" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10" style={{ fontFamily: "Syne, sans-serif" }}>
            Slik fungerer det for meglere
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="text-3xl mb-3">{step.ikon}</div>
                <p className="font-bold text-white text-sm mb-2">{step.tittel}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{step.tekst}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Value props for meglere ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10" style={{ fontFamily: "Syne, sans-serif" }}>
            Hva du får som Ledi megler-partner
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { ikon: <Calculator size={20} />, tittel: "Gratis kalkulator-widget", tekst: "Bygg inn på ditt nettsted. Kunder kan beregne inntektspotensial direkte fra din boligside." },
              { ikon: <ExternalLink size={20} />, tittel: "Finn.no-badge", tekst: "Søk om å vise Ledi-inntektspotensial direkte i dine boligannonser. Differensiert fra konkurrentene." },
              { ikon: <Award size={20} />, tittel: "Megler-sertifisering", tekst: "Bli listet som 'Ledi-sertifisert megler' på ledi.no og i appen." },
              { ikon: <Users size={20} />, tittel: "Kundehenvisninger", tekst: "Utleiere som trenger bistand til kjøp eller salg av bolig med parkering henvist til deg." },
              { ikon: <BarChart3 size={20} />, tittel: "Markedsdata-rapporter", tekst: "Månedlige rapporter: hvilke bydeler har høyest etterspørsel, snittpris per type, trender." },
              { ikon: <Zap size={20} />, tittel: "API-tilgang", tekst: "Integrer Ledi-priser direkte i ditt meglersystem via REST-API. Full dokumentasjon inkludert." },
            ].map(prop => (
              <div key={prop.tittel} className="rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(0,180,216,0.12)", color: "#00B4D8" }}>
                  {prop.ikon}
                </div>
                <p className="font-bold text-white text-sm mb-1.5">{prop.tittel}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{prop.tekst}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Sign up form ── */}
      <section className="py-20 px-4" id="registrer">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-black text-center mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
            Bli megler-partner
          </h2>
          <p className="text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            Gratis. Ingen binding. Vi tar kontakt innen 24 timer.
          </p>

          {kontaktSendt ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}
            >
              <CheckCircle2 size={40} style={{ color: "#34D399", margin: "0 auto 12px" }} />
              <p className="font-bold text-white text-lg mb-2">Takk for interessen!</p>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                Vi tar kontakt innen 24 timer med din personlige Ledi megler-partner-pakke.
              </p>
            </motion.div>
          ) : (
            <div className="rounded-2xl p-6 space-y-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { key: "navn",         label: "Fullt navn *",         placeholder: "Kari Nordmann",      type: "text" },
                { key: "epost",        label: "E-post *",             placeholder: "kari@meglerkontor.no", type: "email" },
                { key: "firma",        label: "Meglerkontor *",       placeholder: "DNB Eiendom Majorstuen", type: "text" },
                { key: "postnummer",   label: "Ditt postnummer",      placeholder: "0150",               type: "text" },
                { key: "antallKunder", label: "Antall kunder/år ca.", placeholder: "50",                 type: "text" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontFamily: "DM Sans, sans-serif",
                    }}
                    onFocus={e => (e.target.style.border = "1px solid rgba(0,180,216,0.5)")}
                    onBlur={e => (e.target.style.border = "1px solid rgba(255,255,255,0.1)")}
                  />
                </div>
              ))}

              <button
                onClick={sendKontakt}
                disabled={kontaktLoading || !form.navn || !form.epost || !form.firma}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all flex items-center justify-center gap-2 mt-2"
                style={{
                  background: (!form.navn || !form.epost || !form.firma)
                    ? "rgba(255,255,255,0.08)"
                    : "linear-gradient(135deg, #00B4D8, #0284C7)",
                  boxShadow: (!form.navn || !form.epost || !form.firma) ? "none" : "0 4px 20px rgba(0,180,216,0.3)",
                }}
              >
                {kontaktLoading
                  ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#fff", borderTopColor: "transparent" }} />
                  : <><MessageSquare size={14} /> Send meg megler-pakken</>}
              </button>

              <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                Vi deler ikke din informasjon med tredjeparter · <Link href="/personvern" className="underline">Personvern</Link>
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA bottom ── */}
      <section className="py-12 px-4 text-center border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          Spørsmål? Kontakt oss direkte:
        </p>
        <a href="mailto:hei@ledi.no"
          className="font-semibold text-sm"
          style={{ color: "#00B4D8" }}>
          hei@ledi.no
        </a>
        <span className="mx-3" style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
        <a href="tel:+4722333344" className="font-semibold text-sm" style={{ color: "#00B4D8" }}>
          +47 22 33 33 44
        </a>
      </section>
    </div>
  );
}
