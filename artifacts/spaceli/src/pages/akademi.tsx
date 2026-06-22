import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useSEO } from "@/lib/useSEO";
import { BookOpen, Play, Calculator, ChevronDown, Clock, Globe, Star, TrendingUp, Shield, Camera, FileText, X } from "lucide-react";
import LediLogo from "@/components/LediLogo";

// ─── Articles ─────────────────────────────────────────────────────────────────

const ARTICLES = [
  {
    icon: <Camera size={20} />,
    color: "#00B4D8",
    tag: "Markedsføring",
    title: "Slik tar du gode bilder av plassen",
    desc: "Bilder er det første leietakere ser. Lær hva som skiller en 5-stjerners annonse fra en som ikke booker.",
    mins: 5,
    content: `Gode bilder er den enkeltfaktoren som oftest avgjør om noen klikker på annonsen din. Her er de viktigste triksene:

**Lys er alt**
Ta bilder midt på dagen med naturlig lys. Åpne alle porter og dører. Unngå flash – det flater ut dybden.

**Rydd før du fotograferer**
Fjern personlige eiendeler, søppel og kabler. En ryddig plass ser større ut og gir trygghetsfølelse.

**Vinkler som selger**
- Ta bilder fra hjørnet av rommet – det gjør plassen større
- Fotografer fra hofthøyde, ikke øyehøyde
- Ta med referanseobjekter (bil, sykkel) for å vise faktisk størrelse

**Vis tilgangspunkter**
Leietakere er opptatt av: Hvordan kommer jeg inn? Fotografer port, låssystem og innkjørsel tydelig.

**Minst 5 bilder**
Annonser med 5+ bilder får 3x flere visninger. Ta med: oversiktsbilde, inngang, innvendig, eventuelle fasiliteter og nabolaget.`,
  },
  {
    icon: <TrendingUp size={20} />,
    color: "#10B981",
    tag: "Prissetting",
    title: "Optimal prissetting i Oslo",
    desc: "Lær markedsdynamikken bydel for bydel, og bruk Ledi Smart Pris for å maksimere inntekten automatisk.",
    mins: 8,
    content: `Prissetting er den viktigste variabelen du kontrollerer. For lite = penger på bordet. For mye = ingen bookinger.

**Bydelsforskjeller i Oslo**
| Bydel | Snitt parkering/dag | Snitt lagring/mnd |
|---|---|---|
| Frogner | 280–420 kr | 1 800–2 800 kr |
| Sentrum | 350–600 kr | 2 200–3 500 kr |
| Sagene | 200–320 kr | 1 200–2 000 kr |
| Grünerløkka | 220–350 kr | 1 400–2 200 kr |

**Sesong og tidspunkt**
- Sommer (juni–august): +25–40% for camping og båtplass
- Julehandel (nov–des): +15–20% for korttidsparkering i sentrum
- Helger: +30–50% over ukedagspris for dagsparkering

**Smart Pris vs. fast pris**
Smart Pris justerer automatisk basert på etterspørsel i ditt område. Utleiere med Smart Pris tjener i snitt 23% mer enn de med fast pris.

**Start lavt, juster opp**
De første 5 bookingene er viktigst for anmeldelser. Start 10–15% under markedspris, bygg opp vurderinger, øk deretter prisen.`,
  },
  {
    icon: <Star size={20} />,
    color: "#F59E0B",
    tag: "Kundeservice",
    title: "Slik får du 5-stjerners anmeldelser",
    desc: "Anmeldelser er valutaen på Ledi. Følg disse stegene for å konsekvent score perfekte vurderinger.",
    mins: 6,
    content: `5-stjerners anmeldelser gir deg Topp-utleier-status og øker bookinger med opptil 60%.

**Sjekkliste før innsjekk**
✅ Send tilgangskode 24 timer i forveien (aldri siste minutt)
✅ Sjekk at porten/låsen virker dagen før
✅ Send en vennlig velkomstmelding med praktisk info
✅ Sørg for at plassen er ryddig og tilgjengelig til avtalt tid

**Under oppholdet**
Svar på meldinger innen 2 timer. Leietakere vurderer responshastighet. Bruk Ledi-appen til varsler.

**Etter innsjekk**
Send en kort oppfølgingsmelding: "Hei [navn], alt i orden med plassen? Ta kontakt om noe er uklart." Dette alene gir deg merkbart bedre vurderinger.

**Be om anmeldelse**
Etter fullført booking, send: "Takk for et godt samarbeid! Det ville bety mye for meg om du tar deg tid til å gi en vurdering." Folk glemmer – en vennlig påminnelse dobler anmeldelsesraten.

**Håndter negative opplevelser**
Responser profesjonelt på all feedback. Potensielle leietakere leser svarene dine.`,
  },
  {
    icon: <Shield size={20} />,
    color: "#8B5CF6",
    tag: "Forsikring",
    title: "Forsikring: ditt ansvar som utleier",
    desc: "Ledi har ingen egen forsikring. Både utleier og leietaker må ha egne forsikringer – dette er et absolutt krav på plattformen.",
    mins: 7,
    content: `Forsikring er et tema mange utleiere utsetter – ta deg tid til å forstå dette nå.

**Viktig: Ledi har ingen egen forsikring**
Ledi er en formidlingsplattform og tilbyr ikke ansvarsforsikring, ansvarsgaranti eller annen dekning for skader som oppstår i forbindelse med utleie. Alt ansvar ligger hos partene i leieavtalen.

**Utleiers forsikringsplikt**
Du som utleier må selv ha gyldig forsikring som dekker eiendommen og utleieaktiviteten. Dette bekrefter du når du registrerer en plass. Uten gyldig forsikring kan du ikke legge ut plassen på Ledi.

Relevante forsikringer:
- Innbo-/husforsikring med utleiedekking
- Ansvarsforsikring for privat utleie
- Næringsvirksomhet fra privat eiendom

**Leietakers forsikringsplikt**
Leietaker er selv ansvarlig for egne kjøretøy og eiendeler. Leietaker bekrefter ved registrering av konto at de har relevante forsikringer (f.eks. bilforsikring, innboforsikring, campingvognforsikring).

**Hva skjer ved skade?**
Utleier og leietaker gjør opp seg imellom, eventuelt via sine respektive forsikringsselskaper. Ledi kan hjelpe med å formidle kontakt mellom partene, men er ikke part i tvisten og kan ikke pålegge noen erstatning.

**Borettslag og sameier**
Sjekk vedtektene dine. Mange borettslag krever styregodkjenning for kommersiell utleie.

**Skattemessige konsekvenser**
Forsikringspremien er fradragsberettiget mot utleieinntekter. Ta vare på kvitteringer.`,
  },
  {
    icon: <FileText size={20} />,
    color: "#EF4444",
    tag: "Økonomi",
    title: "Skatt og fradrag på leieinntekter",
    desc: "Norske skatteregler for utleie av parkering og lagring er gunstige – men du må vite reglene.",
    mins: 10,
    content: `Skattereglene for utleie av parkering, lagring og camping er annerledes enn boligutleie – og ofte mer gunstige.

**Ikke-boligeiendom = næringsinntekt**
Utleie av parkering, garasje, bod og lagerplass klassifiseres som næringsinntekt (ikke kapitalinntekt som for boliger). Dette betyr:

**Skattesats (2026)**
- Inntil 50 000 kr/år: Normalt ikke skattepliktig som privatperson
- Over 50 000 kr/år: 22% ordinær skatt + eventuell trygdeavgift
- Driver du som enkeltpersonforetak: Næringsinntekt beskattes ulikt

**Fradrag du kan kreve**
✅ Forsikringspremie
✅ Vedlikeholds- og reparasjonskostnader
✅ Ledi sin gebyr (8%) er direkte fradragsberettiget
✅ Strøm og vann knyttet til utleieobjektet
✅ Markedsføring og annonsering
✅ Bankkostnader på dedikert utleiekonto

**Praktisk tips**
Opprett en egen konto for utleieinntekter. Da er alt samlet og revisjon er enkel. Ledi sender månedlig rapport du kan bruke direkte til skattemelding.

*NB: Dette er generell informasjon. Kontakt en regnskapsfører for din konkrete situasjon.*`,
  },
];

// ─── Videos ───────────────────────────────────────────────────────────────────

const VIDEOS = [
  { title: "Kom i gang som utleier på Ledi", mins: 3, langs: ["no", "en", "pl"], thumb: "🎬" },
  { title: "Slik registrerer du din første plass", mins: 2, langs: ["no", "en"], thumb: "📱" },
  { title: "Smart Pris forklart", mins: 3, langs: ["no", "en"], thumb: "📈" },
  { title: "Administrer bookinger og tilgjengelighet", mins: 4, langs: ["no"], thumb: "📅" },
  { title: "Borettslag-løsningen – komplett gjennomgang", mins: 5, langs: ["no"], thumb: "🏘️" },
];

const LANG_FLAGS: Record<string, string> = { no: "🇳🇴", en: "🇬🇧", pl: "🇵🇱" };

// ─── Article modal ─────────────────────────────────────────────────────────────

function ArticleModal({ article, onClose }: { article: typeof ARTICLES[0]; onClose: () => void }) {
  const lines = article.content.split("\n");
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-2xl rounded-3xl mb-10"
        style={{ background: "#0D1B2A", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        {/* Header */}
        <div className="p-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${article.color}20`, color: article.color }}>
                {article.icon}
              </div>
              <div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ background: `${article.color}18`, color: article.color }}>{article.tag}</span>
                <h2 className="text-xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{article.title}</h2>
                <div className="flex items-center gap-1.5 mt-1 text-xs text-white/40">
                  <Clock size={11} /> {article.mins} min lesing
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="p-6 prose prose-invert max-w-none">
          {lines.map((line, i) => {
            if (line.startsWith("**") && line.endsWith("**"))
              return <p key={i} className="font-bold text-white mt-4 mb-1">{line.slice(2, -2)}</p>;
            if (line.startsWith("✅") || line.startsWith("- "))
              return <p key={i} className="text-white/70 text-sm pl-3">{line}</p>;
            if (line.trim() === "")
              return <div key={i} className="h-2" />;
            if (line.startsWith("*NB:"))
              return <p key={i} className="text-xs text-white/35 mt-4 italic">{line.slice(1, -1)}</p>;
            return <p key={i} className="text-white/65 text-sm leading-relaxed">{line}</p>;
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Calculator ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "parkering", label: "🅿️ Parkering" },
  { value: "lagring", label: "📦 Lagring" },
  { value: "camping", label: "⛺ Camping" },
  { value: "batplass", label: "⛵ Båtplass" },
  { value: "henger", label: "🚛 Hengerplass" },
  { value: "elbil", label: "⚡ Elbil-lader" },
];

const PERIOD_OPTIONS = [
  { value: "time", label: "Per time" },
  { value: "dag", label: "Per dag" },
  { value: "uke", label: "Per uke" },
  { value: "maaned", label: "Per måned" },
];

const BASE_PRICES: Record<string, Record<string, number>> = {
  parkering: { time: 35, dag: 280, uke: 1400, maaned: 2200 },
  lagring:   { time: 20, dag: 150, uke: 700,  maaned: 1600 },
  camping:   { time: 0,  dag: 280, uke: 1400, maaned: 4000 },
  batplass:  { time: 0,  dag: 250, uke: 1200, maaned: 2800 },
  henger:    { time: 0,  dag: 200, uke: 800,  maaned: 1400 },
  elbil:     { time: 45, dag: 200, uke: 900,  maaned: 1800 },
};

const DAYS_PER_PERIOD: Record<string, number> = { time: 1/8, dag: 1, uke: 7, maaned: 30 };

function Kalkulator() {
  const [type, setType] = useState("parkering");
  const [period, setPeriod] = useState("dag");
  const [pris, setPris] = useState(280);
  const [dagerPerUke, setDagerPerUke] = useState(5);
  const [ukerPerAar, setUkerPerAar] = useState(48);

  const pricePerDay = pris / DAYS_PER_PERIOD[period];
  const bruttoPerAar = pricePerDay * dagerPerUke * ukerPerAar;
  const lediGebyr = bruttoPerAar * 0.08;
  const nettoPerAar = bruttoPerAar - lediGebyr;
  const nettoPerMnd = nettoPerAar / 12;

  function suggestPrice(t: string, p: string) {
    const base = BASE_PRICES[t]?.[p] ?? 0;
    setPris(base);
  }

  return (
    <div className="rounded-3xl p-6 sm:p-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Type plass</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map(o => (
                <button key={o.value} onClick={() => { setType(o.value); suggestPrice(o.value, period); }}
                  className="py-2 px-3 rounded-xl text-xs font-semibold text-left transition-all"
                  style={{
                    background: type === o.value ? "rgba(0,180,216,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${type === o.value ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.1)"}`,
                    color: type === o.value ? "#00B4D8" : "rgba(255,255,255,0.6)",
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Priseperiode</label>
            <div className="grid grid-cols-4 gap-1.5">
              {PERIOD_OPTIONS.filter(o => BASE_PRICES[type]?.[o.value] > 0).map(o => (
                <button key={o.value} onClick={() => { setPeriod(o.value); suggestPrice(type, o.value); }}
                  className="py-2 px-2 rounded-xl text-xs font-semibold text-center transition-all"
                  style={{
                    background: period === o.value ? "rgba(0,180,216,0.15)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${period === o.value ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.1)"}`,
                    color: period === o.value ? "#00B4D8" : "rgba(255,255,255,0.55)",
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
              Din pris ({PERIOD_OPTIONS.find(o => o.value === period)?.label.toLowerCase()})
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={50} max={5000} step={50} value={pris} onChange={e => setPris(Number(e.target.value))}
                className="flex-1 accent-[#00B4D8]" />
              <div className="min-w-[72px] px-3 py-2 rounded-xl text-sm font-bold text-white text-right"
                style={{ background: "rgba(0,180,216,0.12)", border: "1px solid rgba(0,180,216,0.3)" }}>
                {pris.toLocaleString("nb-NO")} kr
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Dager ledig per uke: {dagerPerUke}</label>
            <input type="range" min={1} max={7} step={1} value={dagerPerUke} onChange={e => setDagerPerUke(Number(e.target.value))}
              className="w-full accent-[#10B981]" />
            <div className="flex justify-between text-[10px] text-white/25 mt-1">
              <span>1 dag</span><span>7 dager</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Uker per år: {ukerPerAar}</label>
            <input type="range" min={4} max={52} step={1} value={ukerPerAar} onChange={e => setUkerPerAar(Number(e.target.value))}
              className="w-full accent-[#F59E0B]" />
            <div className="flex justify-between text-[10px] text-white/25 mt-1">
              <span>4 uker</span><span>52 uker</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-4">
          {/* Main result */}
          <div className="rounded-2xl p-6 text-center" style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.12) 0%, rgba(16,185,129,0.08) 100%)", border: "1px solid rgba(0,180,216,0.25)" }}>
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Du kan tjene</p>
            <motion.p
              key={nettoPerAar}
              initial={{ scale: 0.95, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-black text-white mb-1"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {Math.round(nettoPerAar).toLocaleString("nb-NO")} kr
            </motion.p>
            <p className="text-sm text-white/50">per år etter Ledi-gebyr</p>
            <div className="mt-3 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <p className="text-xl font-bold mt-3" style={{ color: "#10B981" }}>
              ≈ {Math.round(nettoPerMnd).toLocaleString("nb-NO")} kr / måned
            </p>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            {[
              { label: "Bruttoinntekt", val: Math.round(bruttoPerAar), color: "rgba(255,255,255,0.7)" },
              { label: "Ledi-gebyr (8%)", val: -Math.round(lediGebyr), color: "#EF4444" },
              { label: "Din nettoinntekt", val: Math.round(nettoPerAar), color: "#10B981" },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                <span className="text-white/50">{row.label}</span>
                <span className="font-bold" style={{ color: row.color }}>
                  {row.val >= 0 ? "" : ""}{Math.abs(row.val).toLocaleString("nb-NO")} kr
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a href="/registrer">
            <button className="w-full py-3.5 rounded-2xl font-bold text-white text-sm mt-1 transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", boxShadow: "0 4px 20px rgba(0,180,216,0.25)" }}>
              Start utleie gratis nå →
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AkademiPage() {
  useSEO({
    title: "Ledi Akademi – Lær å tjene penger på ledig plass",
    description: "Gratis guider, videoer og kalkulator for deg som vil leie ut parkering, garasje eller lagerplass. Finn ut hva plassen din er verdt og kom i gang på minutter.",
    canonical: "https://ledi.no/akademi",
  });

  const [activeSection, setActiveSection] = useState<"artikler" | "videoer" | "kalkulator">("artikler");
  const [openArticle, setOpenArticle] = useState<typeof ARTICLES[0] | null>(null);
  const [expandedVideo, setExpandedVideo] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-10 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,180,216,0.13) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-5" style={{ background: "rgba(0,180,216,0.12)", border: "1px solid rgba(0,180,216,0.3)", color: "#00B4D8" }}>
            📚 Gratis læringssenter for utleiere
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            <LediLogo size={48} /> Akademi
          </h1>
          <p className="text-lg text-white/50 mb-8 max-w-xl mx-auto">
            Alt du trenger for å lykkes som utleier — gratis artikler, videoguider og kalkulator.
          </p>

          {/* Section tabs */}
          <div className="flex gap-1.5 justify-center flex-wrap">
            {[
              { id: "artikler", icon: <BookOpen size={14} />, label: "Artikler & guider" },
              { id: "videoer", icon: <Play size={14} />, label: "Videoguider" },
              { id: "kalkulator", icon: <Calculator size={14} />, label: "Kalkulator" },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => setActiveSection(tab.id as typeof activeSection)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
                style={activeSection === tab.id
                  ? { background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", color: "white", boxShadow: "0 4px 16px rgba(0,180,216,0.3)" }
                  : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 pb-20">

        {/* ARTIKLER */}
        <AnimatePresence mode="wait">
          {activeSection === "artikler" && (
            <motion.div key="artikler" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {ARTICLES.map((art, i) => (
                  <motion.button
                    key={art.title}
                    onClick={() => setOpenArticle(art)}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                    className="rounded-2xl p-5 text-left transition-all group"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${art.color}44`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${art.color}18`, color: art.color }}>
                        {art.icon}
                      </div>
                      <div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${art.color}18`, color: art.color }}>{art.tag}</span>
                        <h3 className="text-base font-bold text-white mt-1.5 leading-tight group-hover:text-[#00B4D8] transition-colors" style={{ fontFamily: "'Syne', sans-serif" }}>
                          {art.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-sm text-white/50 leading-relaxed mb-3">{art.desc}</p>
                    <div className="flex items-center justify-between text-xs text-white/30">
                      <span className="flex items-center gap-1"><Clock size={11} /> {art.mins} min</span>
                      <span className="font-semibold" style={{ color: art.color }}>Les artikkel →</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* VIDEOGUIDER */}
          {activeSection === "videoer" && (
            <motion.div key="videoer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-2 mb-5 px-1">
                <Globe size={14} style={{ color: "#00B4D8" }} />
                <span className="text-sm text-white/50">Tilgjengelig på norsk, engelsk og polsk</span>
              </div>
              <div className="space-y-3">
                {VIDEOS.map((vid, i) => (
                  <motion.div key={vid.title} whileHover={{ y: -1 }} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <button className="w-full flex items-center gap-4 p-4 text-left" onClick={() => setExpandedVideo(expandedVideo === i ? null : i)}>
                      {/* Thumbnail */}
                      <div className="w-16 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden"
                        style={{ background: "linear-gradient(135deg, rgba(27,79,140,0.6), rgba(0,180,216,0.4))" }}>
                        {vid.thumb}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
                            <Play size={10} className="text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{vid.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-white/40"><Clock size={10} /> {vid.mins} min</span>
                          <div className="flex gap-1">
                            {vid.langs.map(l => <span key={l} className="text-sm">{LANG_FLAGS[l]}</span>)}
                          </div>
                        </div>
                      </div>
                      <ChevronDown size={16} className="text-white/30 flex-shrink-0 transition-transform" style={{ transform: expandedVideo === i ? "rotate(180deg)" : undefined }} />
                    </button>

                    <AnimatePresence>
                      {expandedVideo === i && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4">
                            {/* Video placeholder */}
                            <div className="rounded-2xl flex flex-col items-center justify-center py-12 gap-3"
                              style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", boxShadow: "0 0 30px rgba(0,180,216,0.3)" }}>
                                <Play size={22} className="text-white ml-1" />
                              </div>
                              <p className="text-white/60 text-sm font-medium">{vid.title}</p>
                              <p className="text-white/30 text-xs">Video kommer snart · {vid.mins} minutters guide</p>
                              <div className="flex gap-2 mt-1">
                                {vid.langs.map(l => (
                                  <span key={l} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                                    {LANG_FLAGS[l]} {l.toUpperCase()}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* KALKULATOR */}
          {activeSection === "kalkulator" && (
            <motion.div key="kalkulator" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>Hva kan du tjene på din plass?</h2>
                <p className="text-white/40 text-sm">Juster variablene og se estimert inntekt i sanntid.</p>
              </div>
              <Kalkulator />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Article modal */}
      <AnimatePresence>
        {openArticle && <ArticleModal article={openArticle} onClose={() => setOpenArticle(null)} />}
      </AnimatePresence>
    </div>
  );
}
