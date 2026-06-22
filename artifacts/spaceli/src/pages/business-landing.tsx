import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { useSEO } from "@/lib/useSEO";
import { Building2, Users, MapPin, Layers, FileText, BarChart3, Key, Headphones, Upload, Zap, Shield, TrendingUp, CheckCircle2, ArrowRight, Star } from "lucide-react";

const WHO_FOR = [
  { icon: Building2, title: "Parkeringshus", desc: "10+ plasser under ett tak. Administrer alle fra ett sted og øk inntjeningen med dynamisk prising.", color: "#00B4D8" },
  { icon: Users, title: "Borettslag og sameier", desc: "Gjesteparkeringen og ubrukte plasser kan generere inntekter til fellesutgiftene.", color: "#7C3AED" },
  { icon: MapPin, title: "Næringsparker og kontorbygg", desc: "Ansattes plasser er ledige i helgene. Lei dem ut automatisk og dekk driftskostnadene.", color: "#10B981" },
  { icon: Layers, title: "Kjøpesentre og hoteller", desc: "Maksimer belegg i lavsesonger med smarte ventelister og dynamisk prising.", color: "#F59E0B" },
];

const BENEFITS = [
  { icon: Layers, title: "Administrer alt samlet", desc: "Alle dine plasser, inntekter og bookinger på ett dashbord. Ikke mer manuell oppfølging per plass.", color: "#00B4D8" },
  { icon: FileText, title: "Faktura til bedriftskunder", desc: "Send automatiske fakturaer med 30 dagers betalingsfrist. Integrasjon med Fiken inkludert.", color: "#7C3AED" },
  { icon: Headphones, title: "Dedikert support og onboarding", desc: "Vi setter opp alle plassene for deg. Gratis opplæring av ditt team. Norsk support.", color: "#10B981" },
];

const FEATURES = [
  {
    icon: Upload,
    title: "Bulk-registrering",
    desc: "Last opp en CSV med hundrevis av plasser på sekunder. Sett felles regler, priser og tilgjengelighet for alle plasser i én operasjon.",
    badge: "Pro",
    badgeColor: "#7C3AED",
  },
  {
    icon: FileText,
    title: "Faktura og regnskap",
    desc: "Bedriftskunder betaler på faktura med 30 dagers frist. PDF-kvittering, automatisk bilagsnummering og eksport til Fiken.",
    badge: "Pro",
    badgeColor: "#7C3AED",
  },
  {
    icon: BarChart3,
    title: "Rapporter og statistikk",
    desc: "Månedlig inntektsrapport, skattebilag, beleggstatistikk per kvartal. Eksporter alt til Excel med ett klikk.",
    badge: "Pro",
    badgeColor: "#7C3AED",
  },
  {
    icon: Users,
    title: "Team og roller",
    desc: "Legg til ansatte med skreddersydde roller: Admin, Manager og Viewer. Full kontroll over hvem som ser og gjør hva.",
    badge: "Pro",
    badgeColor: "#7C3AED",
  },
  {
    icon: Key,
    title: "REST API-tilgang",
    desc: "Koble Ledi direkte til parkeringssystemet ditt via vårt API. Webhooks ved ny booking, sanntids tilgjengelighet.",
    badge: "Enterprise",
    badgeColor: "#F59E0B",
  },
  {
    icon: Headphones,
    title: "Personlig onboarding",
    desc: "Dedikert onboarding-kall med Ledi-teamet. Vi setter opp alle plassene for deg og trener opp dine ansatte.",
    badge: "Alle planer",
    badgeColor: "#10B981",
  },
];

const PLANS = [
  {
    name: "Gratis",
    price: "0",
    period: "for alltid",
    desc: "Perfekt for å komme i gang",
    color: "#64748B",
    highlight: false,
    features: [
      "1–5 parkeringsplasser",
      "Enkeltbookinger og abonnement",
      "Grunnleggende statistikk",
      "E-post-støtte",
      "Venteliste",
    ],
    cta: "Kom i gang",
    href: "/registrer",
  },
  {
    name: "Pro",
    price: "499",
    period: "kr / mnd",
    desc: "For voksende bedrifter",
    color: "#00B4D8",
    highlight: true,
    features: [
      "6–50 parkeringsplasser",
      "Alt i Gratis",
      "Bulk-registrering via CSV",
      "Faktura til bedriftskunder",
      "Rapporter og Excel-eksport",
      "Team-tilgang (5 brukere)",
      "Prioritert support",
    ],
    cta: "Start Pro-periode",
    href: "/registrer",
  },
  {
    name: "Enterprise",
    price: "Tilbud",
    period: "etter antall plasser",
    desc: "For store aktører",
    color: "#F59E0B",
    highlight: false,
    features: [
      "50+ parkeringsplasser",
      "Alt i Pro",
      "REST API og webhooks",
      "Ubegrenset team-tilgang",
      "SLA-avtale",
      "Dedikert account manager",
      "Tilpasset integrasjon",
    ],
    cta: "Kontakt salg",
    href: "mailto:hei@ledi.no",
  },
];

const TESTIMONIALS = [
  { name: "Bjørn Henriksen", role: "Eiendomssjef, Oslo Parkeringshus AS", text: "Vi gikk fra Excel til Ledi Business på én dag. 38 plasser administreres nå automatisk.", stars: 5 },
  { name: "Kari Dalgaard", role: "Styreleder, Majorstuen Borettslag", text: "Gjesteparkering genererer nå 14 000 kr/mnd til fellesutgiftene. Enkelt og uanstrengt.", stars: 5 },
  { name: "Thomas Mosberg", role: "Driftssjef, Nydalen Næringspark", text: "API-integrasjonen lot oss koble Ledi til det eksisterende tilgangssystemet på to timer.", stars: 5 },
];

export default function BusinessLanding() {
  useSEO({
    title: "Ledi Business – Parkeringsløsninger for bedrifter og eiendomsforvaltere",
    description: "Administrer alle parkeringsplasser på ett sted. Automatisk faktura til bedriftskunder, dynamisk prising og norsk support. Ledi Business – for profesjonelle utleiere.",
    canonical: "https://ledi.no/business",
  });

  return (
    <div style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,180,216,0.15) 0%, transparent 60%)" }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center relative">
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(0,180,216,0.1)", color: "#00B4D8", border: "1px solid rgba(0,180,216,0.25)" }}
          >
            <Building2 size={13} /> Ledi Business
          </span>
          <h1
            className="text-4xl sm:text-6xl font-black text-white mb-6 leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            Gjør ledig plass til<br />
            <span style={{ color: "#00B4D8" }}>lønnsom inntekt</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Den komplette plattformen for parkeringshus, borettslag og næringsparker. Administrer alle plasser, fakturer bedriftskunder og få full oversikt — alt på ett sted.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link href="/registrer">
              <button
                className="px-8 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:scale-105"
                style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", boxShadow: "0 8px 30px rgba(0,180,216,0.3)" }}
              >
                Kom i gang gratis
              </button>
            </Link>
            <a href="mailto:hei@ledi.no">
              <button className="px-8 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:bg-white/10" style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
                Kontakt salg →
              </button>
            </a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: "#10B981" }} /> Ingen bindingstid</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: "#10B981" }} /> Oppsett på under 5 min</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: "#10B981" }} /> Norsk support</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} style={{ color: "#10B981" }} /> Over 200 bedrifter</span>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
            Hvem er Ledi Business for?
          </h2>
          <p className="text-white/50">Laget for aktører med mer enn én plass å administrere</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {WHO_FOR.map(item => (
            <div
              key={item.title}
              className="rounded-2xl p-5 flex flex-col gap-3 transition-transform hover:-translate-y-1"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}18` }}>
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <h3 className="font-bold text-white text-sm">{item.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section style={{ background: "rgba(0,180,216,0.04)", borderTop: "1px solid rgba(0,180,216,0.1)", borderBottom: "1px solid rgba(0,180,216,0.1)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
              Tre grunner til å velge Business
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div key={b.title} className="text-center px-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${b.color}15`, border: `1px solid ${b.color}30` }}>
                  <b.icon size={26} style={{ color: b.color }} />
                </div>
                <div className="text-xs font-bold mb-2" style={{ color: b.color }}>0{i + 1}</div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{b.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
            Alt du trenger. Ingenting du ikke trenger.
          </h2>
          <p className="text-white/50">Funksjoner bygget spesielt for norske bedrifter med parkeringsplasser</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,180,216,0.1)" }}>
                  <f.icon size={20} style={{ color: "#00B4D8" }} />
                </div>
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: `${f.badgeColor}15`, color: f.badgeColor, border: `1px solid ${f.badgeColor}30` }}
                >
                  {f.badge}
                </span>
              </div>
              <h3 className="font-bold text-white">{f.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed flex-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
              Enkle og forutsigbare priser
            </h2>
            <p className="text-white/50">Ingen skjulte avgifter. 8% plattformavgift per transaksjon. Alltid.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className="rounded-2xl p-6 flex flex-col relative"
                style={{
                  background: plan.highlight ? "rgba(0,180,216,0.08)" : "rgba(255,255,255,0.04)",
                  border: plan.highlight ? `2px solid ${plan.color}` : "1px solid rgba(255,255,255,0.08)",
                  boxShadow: plan.highlight ? `0 0 40px rgba(0,180,216,0.15)` : "none",
                }}
              >
                {plan.highlight && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                  >
                    Mest populær
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="text-sm font-bold mb-1" style={{ color: plan.color }}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{plan.price}</span>
                    <span className="text-xs text-white/40">{plan.period}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">{plan.desc}</p>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle2 size={14} style={{ color: plan.color, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.href.startsWith("mailto") ? (
                  <a href={plan.href}>
                    <button
                      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                      style={{ background: `linear-gradient(135deg, ${plan.color}aa, ${plan.color})` }}
                    >
                      {plan.cta}
                    </button>
                  </a>
                ) : (
                  <Link href={plan.href}>
                    <button
                      className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90"
                      style={{ background: plan.highlight ? "linear-gradient(135deg, #1B4F8C, #00B4D8)" : `linear-gradient(135deg, ${plan.color}60, ${plan.color}90)` }}
                    >
                      {plan.cta}
                    </button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
            Hva sier kundene?
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => (
            <div
              key={t.name}
              className="rounded-2xl p-5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => <Star key={i} size={13} fill="#F59E0B" style={{ color: "#F59E0B" }} />)}
              </div>
              <p className="text-sm text-white/70 leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="text-sm font-bold text-white">{t.name}</p>
                <p className="text-xs text-white/40">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <Headphones size={13} /> Gratis onboarding inkludert
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Klar til å komme i gang?
          </h2>
          <p className="text-white/50 mb-8">
            Vi setter opp alle plassene for deg. Gratis opplæring av ansatte. Du er i gang på under én dag.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/registrer">
              <button
                className="px-8 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:scale-105 flex items-center gap-2"
                style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", boxShadow: "0 8px 30px rgba(0,180,216,0.3)" }}
              >
                Start gratis i dag <ArrowRight size={16} />
              </button>
            </Link>
            <a href="mailto:hei@ledi.no">
              <button className="px-8 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:bg-white/10" style={{ border: "1px solid rgba(255,255,255,0.2)" }}>
                Kontakt salg
              </button>
            </a>
          </div>
          <p className="text-xs text-white/30 mt-6">Ingen kredittkort nødvendig · Gratis opptil 5 plasser · Avbryt når som helst</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/30">© 2026 Ledi · hei@ledi.no</p>
          <div className="flex gap-6 text-xs text-white/30">
            <Link href="/personvern"><span className="hover:text-white/60 cursor-pointer">Personvern</span></Link>
            <Link href="/vilkar"><span className="hover:text-white/60 cursor-pointer">Vilkår</span></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
