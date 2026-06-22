import { useState } from "react";
import { useLocation } from "wouter";
import {
  Building2, TrendingUp, Users, FileText, BarChart3, Key,
  Upload, Download, Plus, CheckCircle2, AlertCircle, Eye,
  MoreHorizontal, Layers, Zap, ChevronRight, Clock, RefreshCw,
  ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { useGetOwnerDashboard, useListSpaces, useListBookings } from "@workspace/api-client-react";

type Tab = "oversikt" | "plasser" | "faktura" | "rapporter" | "team" | "api";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "oversikt", label: "Oversikt", icon: BarChart3 },
  { id: "plasser", label: "Plasser", icon: Building2 },
  { id: "faktura", label: "Faktura", icon: FileText },
  { id: "rapporter", label: "Rapporter", icon: Download },
  { id: "team", label: "Team", icon: Users },
  { id: "api", label: "API", icon: Key },
];

const MOCK_INVOICES: { id: string; kunde: string; beløp: number; status: string; forfall: string; utstedt: string }[] = [];

const MOCK_TEAM: { id: number; navn: string; epost: string; rolle: string; status: string; sist: string }[] = [];

const MOCK_REPORTS: { id: number; navn: string; type: string; størrelse: string; dato: string }[] = [];

const ROLE_COLOR: Record<string, string> = { Admin: "#EF4444", Manager: "#7C3AED", Viewer: "#64748B" };
const INV_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  betalt: { label: "Betalt", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  sendt: { label: "Sendt", color: "#00B4D8", bg: "rgba(0,180,216,0.1)" },
  forfalt: { label: "Forfalt", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
};

function ComingSoonOverlay({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl" style={{ background: "rgba(13,27,42,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="text-center">
        <Zap size={28} className="mx-auto mb-2" style={{ color: "#00B4D8" }} />
        <p className="font-bold text-white text-sm">{label}</p>
        <p className="text-xs text-white/50 mt-1">Kommer snart</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon: Icon, color, trend }: { label: string; value: string; sub?: string; icon: React.ElementType; color: string; trend?: number }) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{value}</span>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-semibold ${trend >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("oversikt");
  const [csvDrag, setCsvDrag] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  if (!user) {
    setLocation("/logg-inn");
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: dashboard } = useGetOwnerDashboard({ query: { enabled: !!user } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: spacesResp } = useListSpaces({ eierId: user.id } as any, { query: { enabled: !!user } as any });
  const spaces = spacesResp?.spaces ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookings } = useListBookings({ role: "utleier" }, { query: { enabled: !!user } as any });

  const totalInntekt = dashboard?.totalInntekt ?? 0;
  const aktiveBookinger = dashboard?.aktiveBookinger ?? 0;
  const totaltPlasser = dashboard?.totaltPlasser ?? 0;
  const belegg = dashboard?.beleggsprosent ?? 0;

  const mockApiKey = "ledi_live_sk_xxxxxxxxxxxxxxxxxxxxxxxx";

  return (
    <div style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif", minHeight: "100vh" }}>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(0,180,216,0.1)", color: "#00B4D8", border: "1px solid rgba(0,180,216,0.2)" }}>
                Ledi Business
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: "rgba(124,58,237,0.1)", color: "#7C3AED", border: "1px solid rgba(124,58,237,0.2)" }}>
                Pro
              </span>
            </div>
            <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Business-oversikt
            </h1>
            <p className="text-sm text-white/40 mt-0.5">Hei, {user.navn} — her er status for alle dine plasser</p>
          </div>
          <button
            onClick={() => setLocation("/dashboard")}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white transition-colors"
            style={{ border: "1px solid rgba(255,255,255,0.1)" }}
          >
            Standard dashboard
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
              style={activeTab === tab.id
                ? { background: "linear-gradient(135deg, #1B4F8C, #00B4D8)", color: "#fff" }
                : { color: "rgba(255,255,255,0.5)" }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── OVERSIKT tab ─── */}
        {activeTab === "oversikt" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total inntekt" value={`${Math.round(totalInntekt / 1000)}k kr`} sub="Alle plasser, all tid" icon={TrendingUp} color="#00B4D8" trend={12} />
              <StatCard label="Aktive bookinger" value={String(aktiveBookinger)} sub="Pågår nå" icon={CheckCircle2} color="#10B981" trend={5} />
              <StatCard label="Antall plasser" value={String(totaltPlasser)} sub={`${(spaces ?? []).filter(s => s.erAktiv).length} aktive`} icon={Building2} color="#7C3AED" />
              <StatCard label="Beleggsprosent" value={`${Math.round(belegg)}%`} sub="Siste 30 dager" icon={BarChart3} color="#F59E0B" trend={-3} />
            </div>

            {/* Space comparison table */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="px-5 py-4 flex items-center justify-between border-b border-white/10">
                <h3 className="font-bold text-white text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Dine plasser</h3>
                <button
                  onClick={() => setActiveTab("plasser")}
                  className="text-xs font-semibold flex items-center gap-1"
                  style={{ color: "#00B4D8" }}
                >
                  Se alle <ChevronRight size={12} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-white/10">
                      <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Plass</th>
                      <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide text-right">Belegg</th>
                      <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide text-right">Inntekt</th>
                      <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(spaces ?? []).slice(0, 5).map((space, i) => {
                      const mockBelegg = 65 + (i * 7) % 30;
                      const mockInntekt = 2400 + (i * 1337) % 8000;
                      return (
                        <tr key={space.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-semibold text-white text-sm">{space.tittel}</p>
                            <p className="text-xs text-white/40">{space.adresse}, {space.by}</p>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${mockBelegg}%`, background: mockBelegg > 70 ? "#10B981" : mockBelegg > 40 ? "#F59E0B" : "#EF4444" }} />
                              </div>
                              <span className="text-xs font-semibold text-white/70 w-9 text-right">{mockBelegg}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="text-sm font-bold text-white">{mockInntekt.toLocaleString("nb-NO")} kr</span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${space.erAktiv ? "text-emerald-400" : "text-white/40"}`} style={{ background: space.erAktiv ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)" }}>
                              {space.erAktiv ? "Aktiv" : "Inaktiv"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(spaces ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-sm text-white/30">
                          Ingen plasser registrert ennå
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent bookings */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="font-bold text-white text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Siste bookinger</h3>
              </div>
              <div className="divide-y divide-white/10">
                {(bookings ?? []).slice(0, 4).map(b => (
                  <div key={b.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{b.spaseTittel ?? "Plass"}</p>
                      <p className="text-xs text-white/40">{b.leietakerNavn ?? "Leietaker"} · {b.startDato ? new Date(b.startDato).toLocaleDateString("nb-NO") : "–"}</p>
                    </div>
                    <span className="text-sm font-bold" style={{ color: "#00B4D8" }}>{Math.round((b.totalPris ?? 0) * 1.08).toLocaleString("nb-NO")} kr</span>
                  </div>
                ))}
                {(bookings ?? []).length === 0 && (
                  <div className="px-5 py-8 text-center text-sm text-white/30">Ingen bookinger ennå</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── PLASSER tab ─── */}
        {activeTab === "plasser" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                onClick={() => setLocation("/dashboard")}
              >
                <Plus size={13} /> Legg til plass
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white/70 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                onClick={() => setActiveTab("plasser")}
              >
                <Upload size={13} /> Bulk-last opp CSV
              </button>
              <div className="flex-1" />
              <span className="text-xs text-white/40">{(spaces ?? []).length} plasser totalt</span>
            </div>

            {/* CSV drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setCsvDrag(true); }}
              onDragLeave={() => setCsvDrag(false)}
              onDrop={e => { e.preventDefault(); setCsvDrag(false); }}
              className="rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
              style={{
                border: `2px dashed ${csvDrag ? "#00B4D8" : "rgba(255,255,255,0.12)"}`,
                background: csvDrag ? "rgba(0,180,216,0.05)" : "rgba(255,255,255,0.02)",
              }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,180,216,0.1)" }}>
                <Upload size={22} style={{ color: "#00B4D8" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white mb-1">Dra og slipp CSV-fil her</p>
                <p className="text-xs text-white/40">Eller klikk for å velge fil · Maks 10 MB · Mal: tittel, adresse, by, type, pris</p>
              </div>
              <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "rgba(0,180,216,0.15)", border: "1px solid rgba(0,180,216,0.3)" }}>
                Last ned CSV-mal
              </button>
            </div>

            {/* Space list */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">
                        <input type="checkbox" className="mr-2 accent-[#00B4D8]" />
                        Plass
                      </th>
                      <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">Type</th>
                      <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide text-right">Dagspris</th>
                      <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide text-right">Status</th>
                      <th className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide text-right">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(spaces ?? []).map(space => (
                      <tr key={space.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3">
                          <input type="checkbox" className="mr-3 accent-[#00B4D8]" />
                          <span className="font-semibold text-white">{space.tittel}</span>
                          <p className="text-xs text-white/40 mt-0.5 ml-6">{space.adresse}, {space.by}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs text-white/60 capitalize">{space.type}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-sm text-white/70">
                          {space.priser?.dag ? `${space.priser.dag.toLocaleString("nb-NO")} kr/dag` : "–"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${space.erAktiv ? "text-emerald-400" : "text-white/40"}`} style={{ background: space.erAktiv ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)" }}>
                            {space.erAktiv ? "Aktiv" : "Inaktiv"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                            <MoreHorizontal size={14} className="text-white/40" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(spaces ?? []).length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-white/30">
                          Ingen plasser registrert ennå
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {(spaces ?? []).length > 0 && (
                <div className="px-5 py-3 border-t border-white/10 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-white/40">Valgte: 0 plasser</span>
                  <button className="text-xs font-semibold text-white/50 hover:text-white transition-colors">Aktiver valgte</button>
                  <button className="text-xs font-semibold text-white/50 hover:text-white transition-colors">Deaktiver valgte</button>
                  <button className="text-xs font-semibold text-red-400/70 hover:text-red-400 transition-colors">Slett valgte</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── FAKTURA tab ─── */}
        {activeTab === "faktura" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}>
                <p className="text-xs text-emerald-400/70 mb-1">Betalt denne måneden</p>
                <p className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>83 750 kr</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)" }}>
                <p className="text-xs mb-1" style={{ color: "#00B4D8" }}>Utestående</p>
                <p className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>41 000 kr</p>
              </div>
              <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                <p className="text-xs text-red-400/70 mb-1">Forfalt</p>
                <p className="text-2xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>21 600 kr</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Fakturaer</h3>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}>
                <Plus size={12} /> Ny faktura
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left">
                      {["Faktura-nr", "Kunde", "Beløp", "Utstedt", "Forfall", "Status", ""].map(h => (
                        <th key={h} className="px-5 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INVOICES.map(inv => {
                      const s = INV_STATUS[inv.status];
                      return (
                        <tr key={inv.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-white/60">{inv.id}</td>
                          <td className="px-5 py-3 font-semibold text-white">{inv.kunde}</td>
                          <td className="px-5 py-3 font-bold text-white">{inv.beløp.toLocaleString("nb-NO")} kr</td>
                          <td className="px-5 py-3 text-xs text-white/50">{new Date(inv.utstedt).toLocaleDateString("nb-NO")}</td>
                          <td className="px-5 py-3 text-xs text-white/50">{new Date(inv.forfall).toLocaleDateString("nb-NO")}</td>
                          <td className="px-5 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ color: s.color, background: s.bg }}>{s.label}</span>
                          </td>
                          <td className="px-5 py-3">
                            <button className="text-xs font-semibold flex items-center gap-1 hover:opacity-80" style={{ color: "#00B4D8" }}>
                              <Download size={11} /> PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              className="rounded-xl p-3 flex items-center gap-3 text-xs"
              style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)" }}
            >
              <CheckCircle2 size={14} style={{ color: "#00B4D8" }} />
              <span className="text-white/60">Fiken-integrasjon er aktiv — fakturaer synkroniseres automatisk til regnskapet.</span>
            </div>
          </div>
        )}

        {/* ─── RAPPORTER tab ─── */}
        {activeTab === "rapporter" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                className="rounded-2xl p-5 flex items-center gap-4 text-left hover:bg-white/8 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(0,180,216,0.1)" }}>
                  <BarChart3 size={18} style={{ color: "#00B4D8" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Generer inntektsrapport</p>
                  <p className="text-xs text-white/40 mt-0.5">Velg periode og last ned PDF</p>
                </div>
                <ChevronRight size={14} className="text-white/30" />
              </button>
              <button
                className="rounded-2xl p-5 flex items-center gap-4 text-left hover:bg-white/8 transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(245,158,11,0.1)" }}>
                  <FileText size={18} style={{ color: "#F59E0B" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">Skattebilag</p>
                  <p className="text-xs text-white/40 mt-0.5">Klar for regnskapseksport</p>
                </div>
                <ChevronRight size={14} className="text-white/30" />
              </button>
            </div>

            <h3 className="text-sm font-bold text-white">Tidligere rapporter</h3>
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {MOCK_REPORTS.map((r, i) => (
                <div key={r.id} className={`flex items-center gap-4 px-5 py-4 ${i < MOCK_REPORTS.length - 1 ? "border-b border-white/10" : ""} hover:bg-white/5 transition-colors`}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: r.type === "PDF" ? "rgba(239,68,68,0.1)" : r.type === "Excel" ? "rgba(16,185,129,0.1)" : "rgba(0,180,216,0.1)" }}>
                    <FileText size={15} style={{ color: r.type === "PDF" ? "#EF4444" : r.type === "Excel" ? "#10B981" : "#00B4D8" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{r.navn}</p>
                    <p className="text-xs text-white/40">{r.type} · {r.størrelse} · {new Date(r.dato).toLocaleDateString("nb-NO")}</p>
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white transition-colors" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <Download size={12} /> Last ned
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── TEAM tab ─── */}
        {activeTab === "team" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/50">{MOCK_TEAM.length} teammedlemmer</p>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}>
                <Plus size={13} /> Inviter ny bruker
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {MOCK_TEAM.map((member, i) => (
                <div key={member.id} className={`flex items-center gap-4 px-5 py-4 ${i < MOCK_TEAM.length - 1 ? "border-b border-white/10" : ""}`}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white" style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}>
                    {member.navn.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{member.navn}</p>
                    <p className="text-xs text-white/40">{member.epost} · Sist aktiv: {member.sist}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      style={{ color: ROLE_COLOR[member.rolle] ?? "#64748B", background: `${ROLE_COLOR[member.rolle] ?? "#64748B"}15` }}
                    >
                      {member.rolle}
                    </span>
                    {member.status === "invitert" && (
                      <span className="text-xs text-white/30 italic">Invitasjon sendt</span>
                    )}
                    <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                      <MoreHorizontal size={14} className="text-white/40" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <h4 className="text-xs font-bold text-white mb-3">Roller og tilganger</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { role: "Admin", color: "#EF4444", desc: "Full tilgang til alt, inkl. faktura og team" },
                  { role: "Manager", color: "#7C3AED", desc: "Se og redigere plasser og bookinger" },
                  { role: "Viewer", color: "#64748B", desc: "Kun se statistikk og rapporter" },
                ].map(r => (
                  <div key={r.role} className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: r.color }} />
                    <div>
                      <p className="text-xs font-bold" style={{ color: r.color }}>{r.role}</p>
                      <p className="text-xs text-white/40">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── API tab ─── */}
        {activeTab === "api" && (
          <div className="space-y-5">
            {/* API key */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">API-nøkkel (live)</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Aktiv</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2.5 rounded-xl font-mono text-xs text-white/60 overflow-hidden" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {showApiKey ? mockApiKey : mockApiKey.replace(/sk_[a-z_]+$/, "sk_••••••••••••••••••••••••")}
                </div>
                <button onClick={() => setShowApiKey(v => !v)} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                  <Eye size={14} className="text-white/50" />
                </button>
                <button className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                  <RefreshCw size={14} className="text-white/50" />
                </button>
              </div>
              <p className="text-xs text-white/30 mt-2">Del aldri API-nøkkelen din. Roter nøkkelen om den kompromitteres.</p>
            </div>

            {/* Endpoints */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <h3 className="text-sm font-bold text-white mb-4">Tilgjengelige endepunkter</h3>
              <div className="space-y-2">
                {[
                  { method: "GET", path: "/api/spaces", desc: "List alle dine plasser" },
                  { method: "POST", path: "/api/spaces", desc: "Opprett ny plass" },
                  { method: "GET", path: "/api/bookings", desc: "Hent alle bookinger" },
                  { method: "GET", path: "/api/spaces/:id/availability", desc: "Sjekk tilgjengelighet" },
                  { method: "POST", path: "/api/webhooks", desc: "Registrer webhook-URL" },
                ].map(ep => (
                  <div key={ep.path} className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: "rgba(0,0,0,0.2)" }}>
                    <span
                      className="font-mono text-xs font-bold px-2 py-0.5 rounded shrink-0"
                      style={{
                        color: ep.method === "GET" ? "#00B4D8" : "#10B981",
                        background: ep.method === "GET" ? "rgba(0,180,216,0.1)" : "rgba(16,185,129,0.1)",
                      }}
                    >
                      {ep.method}
                    </span>
                    <code className="font-mono text-xs text-white/70 flex-1">{ep.path}</code>
                    <span className="text-xs text-white/40 hidden sm:block">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Webhooks */}
            <div className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Webhooks</h3>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: "rgba(0,180,216,0.15)", border: "1px solid rgba(0,180,216,0.3)" }}>
                  <Plus size={12} /> Legg til webhook
                </button>
              </div>
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: "rgba(0,0,0,0.2)" }}>
                <AlertCircle size={14} className="text-white/30 shrink-0" />
                <p className="text-xs text-white/40">Ingen webhooks konfigurert ennå. Legg til en URL for å motta varsler ved nye bookinger, kanselleringer og utbetalinger.</p>
              </div>
            </div>

            <a href="https://ledi.no/api" target="_blank" rel="noopener noreferrer">
              <div className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors" style={{ border: "1px dashed rgba(255,255,255,0.1)" }}>
                <Key size={16} style={{ color: "#00B4D8" }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">Åpen API-dokumentasjon</p>
                  <p className="text-xs text-white/40">ledi.no/api · Fullstendig OpenAPI-spec tilgjengelig</p>
                </div>
                <ChevronRight size={14} className="text-white/30" />
              </div>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
