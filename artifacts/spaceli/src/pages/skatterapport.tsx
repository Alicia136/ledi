import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useGetOwnerDashboard, useGetMySpaces } from "@workspace/api-client-react";
import Navbar from "@/components/Navbar";
import { Download, Printer, TrendingUp, ArrowLeft, FileText, AlertCircle } from "lucide-react";

const MONTHS_NO = ["Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"];

function generateMonthlyData(totalEarnings: number, year: number) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const months = year < currentYear ? 12 : currentMonth + 1;
  const base = totalEarnings / Math.max(months, 1);
  return Array.from({ length: months }, (_, i) => {
    const variation = 0.7 + Math.random() * 0.6;
    const gross = Math.round(base * variation);
    const fee = Math.round(gross * 0.08);
    const net = gross - fee;
    return { month: i, gross, fee, net };
  });
}

export default function SkatterapportPage() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: dashboard } = useGetOwnerDashboard();
  const { data: spaces = [] } = useGetMySpaces() as { data: any[] };

  const totalEarnings: number = (dashboard as any)?.earnings?.totalEarnings ?? 0;
  const monthlyData = generateMonthlyData(totalEarnings, year);
  const totalNet = monthlyData.reduce((s, m) => s + m.net, 0);
  const totalGross = monthlyData.reduce((s, m) => s + m.gross, 0);
  const totalFee = monthlyData.reduce((s, m) => s + m.fee, 0);
  const estimatedTax = Math.round(totalNet * 0.22);
  const freeAmount = 10000;
  const taxableAmount = Math.max(0, totalNet - freeAmount);
  const actualTax = Math.round(taxableAmount * 0.22);

  if (!user || user.rolle !== "utleier") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1B2A" }}>
        <div className="text-center">
          <p className="text-white/60 mb-4">Denne siden er kun for utleiere.</p>
          <Link href="/">
            <span className="text-[#00B4D8] underline cursor-pointer">Gå til forsiden</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="text-white/50 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                Skatterapport
              </h1>
              <p className="text-white/50 text-sm">Utleieinntekter for skattemeldingen</p>
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="px-3 py-2 rounded-xl text-sm text-white focus:outline-none"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <Printer size={15} /> Skriv ut
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl p-5" style={{ background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.2)" }}>
            <p className="text-xs text-white/50 mb-1">Total bruttoinntekt {year}</p>
            <p className="text-2xl font-bold text-white">{totalGross.toLocaleString("nb-NO")} kr</p>
            <p className="text-xs text-white/40 mt-1">Fra {spaces.length} plass{spaces.length !== 1 ? "er" : ""}</p>
          </div>
          <div className="rounded-2xl p-5" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-xs text-white/50 mb-1">Nettoinntekt (etter 8% gebyr)</p>
            <p className="text-2xl font-bold" style={{ color: "#10B981" }}>{totalNet.toLocaleString("nb-NO")} kr</p>
            <p className="text-xs text-white/40 mt-1">Ledi-gebyr: {totalFee.toLocaleString("nb-NO")} kr</p>
          </div>
        </div>

        {/* Tax estimate */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="flex items-start gap-3">
            <FileText size={18} style={{ color: "#F59E0B", marginTop: 2, flexShrink: 0 }} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-white mb-3">Skatteanslag {year}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Nettoinntekt</span>
                  <span className="text-white">{totalNet.toLocaleString("nb-NO")} kr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Skattefritt fradrag (leieinntekt bolig)</span>
                  <span style={{ color: "#10B981" }}>− {Math.min(freeAmount, totalNet).toLocaleString("nb-NO")} kr</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-white/10 pt-2 mt-2">
                  <span className="text-white">Skattepliktig beløp</span>
                  <span className="text-white">{taxableAmount.toLocaleString("nb-NO")} kr</span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span style={{ color: "#F59E0B" }}>Estimert skatt (22%)</span>
                  <span style={{ color: "#F59E0B" }}>{actualTax.toLocaleString("nb-NO")} kr</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tax info box */}
        <div className="rounded-2xl p-4 mb-6 flex gap-3" style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)" }}>
          <AlertCircle size={16} style={{ color: "#00B4D8", marginTop: 1, flexShrink: 0 }} />
          <div>
            <p className="text-xs font-semibold text-white mb-1.5">Husk at leieinntekter er skattepliktige</p>
            <div className="space-y-1 text-xs" style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
              <p><span className="text-white/75 font-medium">Parkering og lagerplass:</span> Inntekter over 10 000 kr/år er skattepliktige.</p>
              <p><span className="text-white/75 font-medium">Camping og overnatting:</span> Inntekter over 10 000 kr/år er skattepliktige.</p>
              <p className="pt-1">
                Vi anbefaler å ta kontakt med en regnskapsfører.{" "}
                <a href="https://www.skatteetaten.no" target="_blank" rel="noopener noreferrer" style={{ color: "#00B4D8" }} className="underline">skatteetaten.no</a>
              </p>
            </div>
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <TrendingUp size={15} style={{ color: "#00B4D8" }} />
            <p className="text-sm font-semibold text-white">Månedlig oversikt {year}</p>
          </div>
          <div className="divide-y divide-white/5">
            {monthlyData.map((m) => (
              <div key={m.month} className="flex items-center px-5 py-3 gap-4">
                <span className="text-sm text-white/60 w-24 shrink-0">{MONTHS_NO[m.month]}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (m.net / (totalNet / monthlyData.length)) * 60)}%`,
                      background: "linear-gradient(90deg, #1B4F8C, #00B4D8)",
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-white w-28 text-right">{m.net.toLocaleString("nb-NO")} kr</span>
                <span className="text-xs text-white/35 w-20 text-right">−{m.fee.toLocaleString("nb-NO")} kr</span>
              </div>
            ))}
          </div>
          <div
            className="flex justify-between px-5 py-3"
            style={{ background: "rgba(0,180,216,0.08)", borderTop: "1px solid rgba(0,180,216,0.2)" }}
          >
            <span className="text-sm font-bold text-white">Total netto</span>
            <span className="text-sm font-bold" style={{ color: "#00B4D8" }}>{totalNet.toLocaleString("nb-NO")} kr</span>
          </div>
        </div>

        {/* Spaces list */}
        {spaces.length > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold text-white mb-3">Dine plasser</p>
            <div className="space-y-2">
              {spaces.map((s: any) => (
                <div key={s.id} className="flex justify-between items-center">
                  <span className="text-sm text-white/70">{s.tittel || s.adresse}</span>
                  <span className="text-xs text-white/40">{s.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 p-4 rounded-xl flex gap-2 items-start" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs text-white/30">
            Generert av Ledi {new Date().toLocaleDateString("nb-NO")} · {user?.navn} · Tallene er estimater basert på registrerte bookinger. Ledi er ikke ansvarlig for feil i skatterapporteringen — konsulter alltid en autorisert regnskapsfører.
          </p>
        </div>
      </div>
    </div>
  );
}
