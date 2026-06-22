import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "wouter";
import { useSEO } from "@/lib/useSEO";
import {
  Building2, Users, BarChart3, Shield, CheckCircle2, Plus, Trash2,
  ChevronRight, ArrowLeft, CreditCard, MapPin, Lock, Globe, TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import LediLogo from "@/components/LediLogo";

const MONTHS_NO: Record<string, string> = {
  "01": "Januar", "02": "Februar", "03": "Mars", "04": "April",
  "05": "Mai", "06": "Juni", "07": "Juli", "08": "August",
  "09": "September", "10": "Oktober", "11": "November", "12": "Desember",
};

const TYPER = [
  { key: "parking", label: "🚗 Parkering" },
  { key: "storage", label: "📦 Lagerplass" },
  { key: "ev", label: "⚡ Elbil" },
];

// ──────────────── LANDING PAGE ────────────────
function BorettslagLanding({ onGoToSignup }: { onGoToSignup: () => void }) {
  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-16 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(0,180,216,0.14) 0%, transparent 70%)" }} />
        <div className="max-w-3xl mx-auto relative z-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(0,180,216,0.12)", color: "#00B4D8", border: "1px solid rgba(0,180,216,0.25)" }}
          >
            <Building2 size={13} /> For borettslag og sameier
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            Borettslagets plasser.<br />
            <span style={{ color: "#00B4D8" }}>Borettslagets inntekter.</span>
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
            Registrer alle fellesplassene på én gang. Sett regler for hvem som kan booke.
            Pengene går direkte til borettslagets konto. Månedlig rapport til styret.
          </p>
          <button
            onClick={onGoToSignup}
            className="px-7 py-3.5 rounded-2xl text-base font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #00B4D8, #1D4ED8)" }}
            data-testid="button-borettslag-start"
          >
            Kom i gang gratis →
          </button>
          <p className="text-white/30 text-xs mt-3">Ingen bindingstid · Ingen oppstartsavgift</p>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-4 pb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            icon: <Building2 size={20} />, color: "#00B4D8",
            title: "Bulk-registrering",
            desc: "Legg til alle plassene på én gang — parkering, lager, elbil-lader. Angir pris per plass.",
          },
          {
            icon: <Lock size={20} />, color: "#8B5CF6",
            title: "Kun beboere",
            desc: "Velg om plassene er forbeholdt beboere, eller om de er åpne for alle i nabolaget.",
          },
          {
            icon: <CreditCard size={20} />, color: "#10B981",
            title: "Direkte til borettslaget",
            desc: "Leieinntektene settes inn på borettslagets bankkonto — minus 8% Ledi-avgift.",
          },
          {
            icon: <BarChart3 size={20} />, color: "#F59E0B",
            title: "Månedlig rapport",
            desc: "Styret mottar automatisk rapport: antall bookinger, inntekt per plass og total sum.",
          },
          {
            icon: <Users size={20} />, color: "#EC4899",
            title: "Beboerliste",
            desc: "Legg til beboere med e-post og leilighetsnummer. De får automatisk tilgang til plassene.",
          },
          {
            icon: <Shield size={20} />, color: "#00B4D8",
            title: "BankID-verifikasjon",
            desc: "Styreleder verifiseres med BankID. Trygt og sikkert for hele borettslaget.",
          },
        ].map(f => (
          <div
            key={f.title}
            className="rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${f.color}20`, color: f.color }}>
              {f.icon}
            </div>
            <h3 className="text-white font-bold text-sm mb-1">{f.title}</h3>
            <p className="text-white/50 text-xs leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Testimonial / mock report */}
      <section className="max-w-2xl mx-auto px-4 pb-16">
        <div
          className="rounded-2xl p-6"
          style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.08), rgba(13,27,42,0.8))", border: "1px solid rgba(0,180,216,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={16} style={{ color: "#00B4D8" }} />
            <span className="text-white/60 text-xs font-semibold uppercase tracking-wide">Eksempel — Månedlig rapport mai 2026</span>
          </div>
          <p className="text-white text-xl font-bold mb-1">Borettslaget tjente</p>
          <p className="font-black mb-4" style={{ color: "#00B4D8", fontSize: "2.5rem", fontFamily: "'Syne', sans-serif" }}>24 800 kr</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Parkeringsplasser", value: "12" },
              { label: "Bookinger i mai", value: "34" },
              { label: "Belegg", value: "78%" },
            ].map(s => (
              <div key={s.label} className="rounded-xl py-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                <p className="text-white font-bold text-lg">{s.value}</p>
                <p className="text-white/40 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bottom */}
      <section className="text-center pb-20 px-4">
        <button
          onClick={onGoToSignup}
          className="px-8 py-4 rounded-2xl text-lg font-bold text-white"
          style={{ background: "linear-gradient(135deg, #00B4D8, #1D4ED8)" }}
        >
          Start registrering
        </button>
        <p className="text-white/30 text-sm mt-3">
          Spørsmål? Kontakt oss på <a href="mailto:hei@ledi.no" className="underline">hei@ledi.no</a>
        </p>
      </section>
    </div>
  );
}

// ──────────────── SIGNUP FORM ────────────────
function BorettslagSignup({ onDone }: { onDone: (token: string, borettslagId: number, navn: string) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form1, setForm1] = useState({
    styreleiderNavn: "", styreleiderEpost: "", passord: "",
  });
  const [form2, setForm2] = useState({
    navn: "", orgnummer: "", kontaktEpost: "", bankkontonummer: "",
    adresse: "", postnummer: "", by: "", antallLeiligheter: "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/borettslag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form1,
          ...form2,
          antallLeiligheter: form2.antallLeiligheter ? Number(form2.antallLeiligheter) : undefined,
          kontaktEpost: form2.kontaktEpost || form1.styreleiderEpost,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Noe gikk galt");
      localStorage.setItem("ledi_token", data.token);
      onDone(data.token, data.borettslag.id, data.borettslag.navn);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/10 border border-white/20 focus:outline-none focus:border-[#00B4D8] placeholder:text-white/30";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "#0D1B2A" }}>
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="cursor-pointer"><LediLogo size={22} /></span>
            </Link>
            <span className="text-white/40 text-sm">/ Borettslag registrering</span>
          </div>
          <Link href="/">
            <span className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer">← Forsiden</span>
          </Link>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={s <= step
                  ? { background: "#00B4D8", color: "#fff" }
                  : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}
              >
                {s < step ? <CheckCircle2 size={14} /> : s}
              </div>
              <span className="text-xs" style={{ color: s <= step ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)" }}>
                {s === 1 ? "Styreleider" : "Borettslaget"}
              </span>
              {s < 2 && <ChevronRight size={14} className="text-white/20" />}
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
                Styrelederens konto
              </h2>
              <input className={input} placeholder="Fullt navn" value={form1.styreleiderNavn}
                onChange={e => setForm1(p => ({ ...p, styreleiderNavn: e.target.value }))} />
              <input className={input} placeholder="E-post" type="email" value={form1.styreleiderEpost}
                onChange={e => setForm1(p => ({ ...p, styreleiderEpost: e.target.value }))} />
              <input className={input} placeholder="Passord (min. 8 tegn)" type="password" value={form1.passord}
                onChange={e => setForm1(p => ({ ...p, passord: e.target.value }))} />
              <div
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: "rgba(0,180,216,0.07)", border: "1px solid rgba(0,180,216,0.15)" }}
              >
                <Shield size={14} style={{ color: "#00B4D8" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  BankID-verifisering kommer etter registrering
                </span>
              </div>
              <button
                onClick={() => {
                  if (!form1.styreleiderNavn || !form1.styreleiderEpost || !form1.passord) {
                    setError("Fyll ut alle felt"); return;
                  }
                  setError(""); setStep(2);
                }}
                className="w-full py-3 rounded-xl font-bold text-white text-sm"
                style={{ background: "linear-gradient(135deg, #00B4D8, #1D4ED8)" }}
              >
                Neste →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setStep(1)} className="text-white/40 hover:text-white transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-white font-bold text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Borettslagets info
                </h2>
              </div>
              <input className={input} placeholder="Borettslagets navn *" value={form2.navn}
                onChange={e => setForm2(p => ({ ...p, navn: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className={input} placeholder="Org.nummer (valgfritt)" value={form2.orgnummer}
                  onChange={e => setForm2(p => ({ ...p, orgnummer: e.target.value }))} />
                <input className={input} placeholder="Antall leiligheter" type="number" value={form2.antallLeiligheter}
                  onChange={e => setForm2(p => ({ ...p, antallLeiligheter: e.target.value }))} />
              </div>
              <input className={input} placeholder="Adresse *" value={form2.adresse}
                onChange={e => setForm2(p => ({ ...p, adresse: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input className={input} placeholder="Postnummer *" value={form2.postnummer}
                  onChange={e => setForm2(p => ({ ...p, postnummer: e.target.value }))} />
                <input className={input} placeholder="By *" value={form2.by}
                  onChange={e => setForm2(p => ({ ...p, by: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Bankkontonummer for utbetalinger</label>
                <input className={input} placeholder="xxxx.xx.xxxxx" value={form2.bankkontonummer}
                  onChange={e => setForm2(p => ({ ...p, bankkontonummer: e.target.value }))} />
              </div>
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading || !form2.navn || !form2.adresse || !form2.postnummer || !form2.by}
                className="w-full py-3 rounded-xl font-bold text-white text-sm disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #00B4D8, #1D4ED8)" }}
                data-testid="button-borettslag-create"
              >
                {loading ? "Oppretter borettslag..." : "Opprett borettslag"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────── SPACE ROW ────────────────
function PlassRad({
  idx, plass, onChange, onRemove,
}: {
  idx: number;
  plass: { tittel: string; type: string; prisPerMaaned: string; prisPerDag: string };
  onChange: (field: string, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div
      className="rounded-xl p-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <span className="text-white/30 text-xs font-mono w-5 shrink-0 pt-2.5 sm:pt-0">{idx + 1}</span>
      <input
        className="flex-1 min-w-0 px-2.5 py-2 rounded-lg text-sm text-white bg-white/10 border border-white/10 focus:outline-none focus:border-[#00B4D8] placeholder:text-white/30"
        placeholder="Navn (f.eks. P12)"
        value={plass.tittel}
        onChange={e => onChange("tittel", e.target.value)}
      />
      <select
        value={plass.type}
        onChange={e => onChange("type", e.target.value)}
        className="px-2.5 py-2 rounded-lg text-sm text-white bg-white/10 border border-white/10 focus:outline-none focus:border-[#00B4D8]"
      >
        {TYPER.map(t => <option key={t.key} value={t.key} style={{ background: "#0D1B2A" }}>{t.label}</option>)}
      </select>
      <input
        className="w-28 px-2.5 py-2 rounded-lg text-sm text-white bg-white/10 border border-white/10 focus:outline-none focus:border-[#00B4D8] placeholder:text-white/30"
        placeholder="kr/mnd"
        type="number"
        value={plass.prisPerMaaned}
        onChange={e => onChange("prisPerMaaned", e.target.value)}
      />
      <input
        className="w-24 px-2.5 py-2 rounded-lg text-sm text-white bg-white/10 border border-white/10 focus:outline-none focus:border-[#00B4D8] placeholder:text-white/30"
        placeholder="kr/dag"
        type="number"
        value={plass.prisPerDag}
        onChange={e => onChange("prisPerDag", e.target.value)}
      />
      <button onClick={onRemove} className="text-white/20 hover:text-red-400 transition-colors p-1 shrink-0">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ──────────────── DASHBOARD ────────────────
function BorettslagDashboard({ borettslagId, borettslagNavn, token }: {
  borettslagId: number; borettslagNavn: string; token: string;
}) {
  const [tab, setTab] = useState<"plasser" | "beboere" | "rapport">("plasser");
  const [kunBeboere, setKunBeboere] = useState(true);
  const [plasser, setPlasser] = useState([
    { tittel: "", type: "parking", prisPerMaaned: "", prisPerDag: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ opprettet: number } | null>(null);

  // Beboere state
  const [beboere, setBeboere] = useState<Array<{ id: number; epost: string; leilighetsnummer?: string | null }>>([]);
  const [nyEpost, setNyEpost] = useState("");
  const [nyLeil, setNyLeil] = useState("");
  const [beboereLoaded, setBeboereLoaded] = useState(false);

  // Rapport state
  const [rapport, setRapport] = useState<any>(null);
  const [rapportLoaded, setRapportLoaded] = useState(false);

  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const addRow = () => setPlasser(p => [...p, { tittel: "", type: "parking", prisPerMaaned: "", prisPerDag: "" }]);
  const removeRow = (i: number) => setPlasser(p => p.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: string) =>
    setPlasser(p => p.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  const addBulkRows = (n: number) => setPlasser(p => [
    ...p,
    ...Array.from({ length: n }, (_, i) => ({
      tittel: `Plass ${p.length + i + 1}`,
      type: "parking",
      prisPerMaaned: "1500",
      prisPerDag: "",
    })),
  ]);

  const handleSavePlasser = async () => {
    const filled = plasser.filter(p => p.tittel.trim());
    if (filled.length === 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/borettslag/${borettslagId}/plasser`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          plasser: filled.map(p => ({
            tittel: p.tittel,
            type: p.type,
            prisPerMaaned: p.prisPerMaaned ? Number(p.prisPerMaaned) : undefined,
            prisPerDag: p.prisPerDag ? Number(p.prisPerDag) : undefined,
          })),
          kunBeboere,
        }),
      });
      const data = await res.json();
      setSaveResult(data);
      setPlasser([{ tittel: "", type: "parking", prisPerMaaned: "", prisPerDag: "" }]);
    } finally {
      setSaving(false);
    }
  };

  const loadBeboere = async () => {
    if (beboereLoaded) return;
    const res = await fetch(`/api/borettslag/${borettslagId}/beboere`, { headers });
    const data = await res.json();
    setBeboere(data);
    setBeboereLoaded(true);
  };

  const loadRapport = async () => {
    if (rapportLoaded) return;
    const res = await fetch(`/api/borettslag/${borettslagId}/rapport`, { headers });
    const data = await res.json();
    setRapport(data);
    setRapportLoaded(true);
  };

  const handleTabChange = (t: "plasser" | "beboere" | "rapport") => {
    setTab(t);
    if (t === "beboere") void loadBeboere();
    if (t === "rapport") void loadRapport();
  };

  const handleAddBeboer = async () => {
    if (!nyEpost) return;
    const res = await fetch(`/api/borettslag/${borettslagId}/beboere`, {
      method: "POST",
      headers,
      body: JSON.stringify({ epost: nyEpost, leilighetsnummer: nyLeil || undefined }),
    });
    const data = await res.json();
    setBeboere(p => [...p, data]);
    setNyEpost(""); setNyLeil("");
  };

  const handleRemoveBeboer = async (id: number) => {
    await fetch(`/api/borettslag/${borettslagId}/beboere/${id}`, { method: "DELETE", headers });
    setBeboere(p => p.filter(b => b.id !== id));
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 pt-8 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={18} style={{ color: "#00B4D8" }} />
              <span className="text-white/50 text-sm">Styreleder · Borettslag</span>
            </div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              {borettslagNavn}
            </h1>
          </div>
          <Link href="/">
            <span
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer transition-all hover:bg-white/10"
              style={{ color: "#00B4D8" }}
            >
              <Globe size={14} /> Se markedsplassen
            </span>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b mb-6" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {(["plasser", "beboere", "rapport"] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className="relative px-5 py-3 text-sm font-semibold transition-all"
              style={{ color: tab === t ? "#00B4D8" : "rgba(255,255,255,0.45)" }}
            >
              {t === "plasser" ? "🏗️ Plasser" : t === "beboere" ? "👥 Beboere" : "📊 Rapport"}
              {tab === t && (
                <motion.div layoutId="bl-tab" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "#00B4D8" }} transition={{ type: "spring", stiffness: 400, damping: 35 }} />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── PLASSER TAB ── */}
          {tab === "plasser" && (
            <motion.div key="plasser" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {saveResult && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#10B981" }}>
                  <CheckCircle2 size={16} />
                  <span className="text-sm font-semibold">{saveResult.opprettet} plasser ble registrert og er nå synlige på Ledi!</span>
                </div>
              )}

              {/* Beboer rule toggle */}
              <div className="rounded-2xl p-4 mb-5 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div>
                  <p className="text-white font-semibold text-sm">Hvem kan booke?</p>
                  <p className="text-white/40 text-xs mt-0.5">Gjelder alle plassene du registrerer nå</p>
                </div>
                <div className="flex gap-2">
                  {[
                    { key: true, label: "🔒 Kun beboere", color: "#8B5CF6" },
                    { key: false, label: "🌍 Alle", color: "#00B4D8" },
                  ].map(opt => (
                    <button
                      key={String(opt.key)}
                      onClick={() => setKunBeboere(opt.key)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={kunBeboere === opt.key
                        ? { background: opt.color, color: "#fff" }
                        : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column headers */}
              <div className="hidden sm:grid grid-cols-[24px_1fr_140px_100px_80px_24px] gap-3 px-3 mb-2 text-xs font-semibold text-white/30 uppercase tracking-wide">
                <span>#</span>
                <span>Navn</span>
                <span>Type</span>
                <span>kr/mnd</span>
                <span>kr/dag</span>
                <span></span>
              </div>

              {/* Space rows */}
              <div className="flex flex-col gap-2 mb-3">
                {plasser.map((p, i) => (
                  <PlassRad key={i} idx={i} plass={p} onChange={(f, v) => updateRow(i, f, v)} onRemove={() => removeRow(i)} />
                ))}
              </div>

              {/* Add buttons */}
              <div className="flex flex-wrap gap-2 mb-5">
                <button
                  onClick={addRow}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}
                >
                  <Plus size={13} /> Legg til rad
                </button>
                {[5, 10, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => addBulkRows(n)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: "rgba(0,180,216,0.08)", color: "#00B4D8" }}
                  >
                    <Plus size={13} /> Legg til {n} plasser
                  </button>
                ))}
              </div>

              <button
                onClick={handleSavePlasser}
                disabled={saving || plasser.filter(p => p.tittel.trim()).length === 0}
                className="w-full py-3.5 rounded-2xl font-bold text-white text-sm disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #00B4D8, #1D4ED8)" }}
                data-testid="button-register-borettslag-spaces"
              >
                {saving ? "Registrerer..." : `Registrer ${plasser.filter(p => p.tittel.trim()).length} plasser på Ledi`}
              </button>
            </motion.div>
          )}

          {/* ── BEBOERE TAB ── */}
          {tab === "beboere" && (
            <motion.div key="beboere" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {/* Add resident form */}
              <div className="rounded-2xl p-4 mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-white font-semibold text-sm mb-3">Legg til beboer</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    placeholder="E-post"
                    value={nyEpost}
                    onChange={e => setNyEpost(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-sm text-white bg-white/10 border border-white/20 focus:outline-none focus:border-[#00B4D8] placeholder:text-white/30"
                  />
                  <input
                    placeholder="Leilighetsnr. (valgfritt)"
                    value={nyLeil}
                    onChange={e => setNyLeil(e.target.value)}
                    className="w-40 px-3 py-2 rounded-xl text-sm text-white bg-white/10 border border-white/20 focus:outline-none focus:border-[#00B4D8] placeholder:text-white/30"
                  />
                  <button
                    onClick={handleAddBeboer}
                    disabled={!nyEpost}
                    className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #00B4D8, #1D4ED8)" }}
                    data-testid="button-add-beboer"
                  >
                    Legg til
                  </button>
                </div>
              </div>

              {beboere.length === 0 ? (
                <div className="text-center py-10 text-white/30">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Ingen beboere lagt til ennå</p>
                  <p className="text-xs mt-1 text-white/20">Legg til beboere med e-post, så får de tilgang til plassene</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {beboere.map(b => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between px-4 py-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                    >
                      <div>
                        <p className="text-white text-sm font-medium">{b.epost}</p>
                        {b.leilighetsnummer && <p className="text-white/40 text-xs">Leil. {b.leilighetsnummer}</p>}
                      </div>
                      <button onClick={() => handleRemoveBeboer(b.id)} className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── RAPPORT TAB ── */}
          {tab === "rapport" && (
            <motion.div key="rapport" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {!rapport ? (
                <div className="text-center py-12 text-white/30">
                  <BarChart3 size={32} className="mx-auto mb-2 opacity-30" />
                  <p>Laster rapport...</p>
                </div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                      { label: "Antall plasser", value: rapport.antallPlasser, icon: <Building2 size={16} />, color: "#00B4D8" },
                      { label: "Totalinntekt", value: `${rapport.totalt.toLocaleString("nb-NO")} kr`, icon: <TrendingUp size={16} />, color: "#10B981" },
                      { label: "Siste måned", value: `${rapport.sisteManedInntekt.toLocaleString("nb-NO")} kr`, icon: <CreditCard size={16} />, color: "#F59E0B" },
                      { label: "Bookinger", value: rapport.maaneder.reduce((s: number, m: any) => s + m.bookinger, 0), icon: <CheckCircle2 size={16} />, color: "#8B5CF6" },
                    ].map(s => (
                      <div key={s.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <div className="mb-2" style={{ color: s.color }}>{s.icon}</div>
                        <p className="text-white font-bold text-lg leading-none">{s.value}</p>
                        <p className="text-white/40 text-xs mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Monthly breakdown */}
                  {rapport.maaneder.length > 0 ? (
                    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        <p className="text-white font-semibold text-sm">Månedlig oversikt</p>
                      </div>
                      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                        {rapport.maaneder.slice().reverse().map((m: any) => {
                          const [year, month] = m.maaned.split("-");
                          const maxInntekt = Math.max(...rapport.maaneder.map((x: any) => x.inntekt), 1);
                          const pct = (m.inntekt / maxInntekt) * 100;
                          return (
                            <div key={m.maaned} className="px-4 py-3 flex items-center gap-4">
                              <span className="text-white/60 text-sm w-28 shrink-0">{MONTHS_NO[month]} {year}</span>
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#00B4D8" }} />
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-white font-semibold text-sm">{m.inntekt.toLocaleString("nb-NO")} kr</p>
                                <p className="text-white/30 text-xs">{m.bookinger} bookinger</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-white/30">
                      <BarChart3 size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Ingen bookinger ennå</p>
                      <p className="text-xs mt-1 text-white/20">Inntekter vises her når beboere begynner å booke</p>
                    </div>
                  )}

                  <div className="mt-4 px-4 py-3 rounded-xl" style={{ background: "rgba(16,185,129,0.07)", border: "1px solid rgba(16,185,129,0.15)" }}>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      <span style={{ color: "#10B981" }}>ℹ️</span> Utbetalinger skjer den 1. i hver måned til kontonummer registrert på borettslaget. Ledi tar 8% av total leiesum.
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ──────────────── MAIN EXPORT ────────────────
export default function BorettslagPage() {
  useSEO({
    title: "Ledi for Borettslag – Lei ut parkeringsplasser og tjen til fellesutgiftene",
    description: "Borettslag og sameier kan leie ut ledige parkeringsplasser og garasjer via Ledi. Tjen penger til fellesutgiftene uten administrasjonsarbeid. Prøv gratis.",
    canonical: "https://ledi.no/borettslag",
  });

  const [view, setView] = useState<"landing" | "signup" | "dashboard">("landing");
  const [token, setToken] = useState("");
  const [borettslagId, setBorettslagId] = useState(0);
  const [borettslagNavn, setBorettslagNavn] = useState("");

  const handleDone = (tok: string, id: number, navn: string) => {
    setToken(tok);
    setBorettslagId(id);
    setBorettslagNavn(navn);
    setView("dashboard");
  };

  if (view === "signup") return <BorettslagSignup onDone={handleDone} />;
  if (view === "dashboard") return <BorettslagDashboard borettslagId={borettslagId} borettslagNavn={borettslagNavn} token={token} />;
  return <BorettslagLanding onGoToSignup={() => setView("signup")} />;
}
