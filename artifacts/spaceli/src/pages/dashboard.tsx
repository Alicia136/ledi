import { Link, useLocation } from "wouter";
import { TrendingUp, Calendar, MapPin, Plus, Clock, Ban, Trash2, Save, Users, Pencil, CheckCircle2, X, Wifi, ShieldAlert, User } from "lucide-react";
import InnsiktPanel from "@/components/InnsiktPanel";
import KalenderSyncPanel from "@/components/KalenderSyncPanel";
import ArrangementVarselPanel from "@/components/ArrangementVarselPanel";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import RegisterSpacePanel from "@/components/RegisterSpacePanel";
import { useAuth } from "@/lib/auth-context";
import {
  useGetOwnerDashboard, useGetMySpaces,
  useGetSpaceSchedule, useUpdateSpaceSchedule,
  useGetBlockedDates, useAddBlockedDate, useDeleteBlockedDate,
  useUpdateSpace, useGetSmartPrisData, useUpdateProfil,
  getGetMySpacesQueryKey,
} from "@workspace/api-client-react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetSpaceScheduleQueryKey,
  getGetBlockedDatesQueryKey,
} from "@workspace/api-client-react";

const SMART_BYDELER = [
  "Oslo Frogner", "Oslo Sentrum", "Oslo Sagene",
  "Bergen", "Trondheim", "Stavanger", "Tromsø", "Distrikter",
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Bekreftet", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  pending:   { label: "Venter",    color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  cancelled: { label: "Kansellert",color: "#EF4444", bg: "rgba(239,68,68,0.1)"   },
  completed: { label: "Fullført",  color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

const DAYS_NO = ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"];
const DAYS_SHORT = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

// ── Live Status Card ──────────────────────────────────────────────────────────

function LiveStatusCard({
  ls, accent, emoji, label,
}: {
  ls: { spaceId: number; tittel: string; status: string; booking?: { leietakerNavn: string | null; sluttDato: string; totalPris: number } | null };
  accent: string;
  emoji: string;
  label: string;
}) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const sluttDato = ls.booking?.sluttDato ? new Date(ls.booking.sluttDato) : null;
  const diffMs = sluttDato ? sluttDato.getTime() - now.getTime() : 0;
  const hoursLeft = Math.floor(diffMs / 3_600_000);
  const minsLeft = Math.floor((diffMs % 3_600_000) / 60_000);

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: `rgba(${accent === "#EF4444" ? "239,68,68" : accent === "#F59E0B" ? "245,158,11" : "16,185,129"}, 0.06)`,
        border: `1px solid ${accent}40`,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-white truncate">{ls.tittel}</p>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ml-2"
          style={{ background: `${accent}20`, color: accent }}
        >
          {emoji} {label}
        </span>
      </div>

      {ls.booking ? (
        <div className="space-y-1">
          {ls.booking.leietakerNavn && (
            <p className="text-xs text-white/60">
              Leietaker: <span className="text-white/80 font-medium">{ls.booking.leietakerNavn}</span>
            </p>
          )}
          {sluttDato && diffMs > 0 && (
            <p className="text-xs text-white/60">
              Tid igjen:{" "}
              <span className="font-semibold" style={{ color: accent }}>
                {hoursLeft > 0 ? `${hoursLeft}t ` : ""}{minsLeft}min
              </span>
              {" "}<span className="text-white/40">(til {sluttDato.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })})</span>
            </p>
          )}
          <p className="text-xs text-white/50">
            Inntekt: {Math.round(ls.booking.totalPris * 0.92).toLocaleString("nb-NO")} kr
          </p>
        </div>
      ) : (
        <p className="text-xs text-white/40">Ingen aktive bookinger akkurat nå</p>
      )}
    </div>
  );
}

// ── Availability Panel ────────────────────────────────────────────────────────

function AvailabilityPanel({ spaceId }: { spaceId: number }) {
  const qc = useQueryClient();

  const { data: schedule = [] } = useGetSpaceSchedule(spaceId);
  const { data: blockedDates = [] } = useGetBlockedDates(spaceId);
  const updateSchedule = useUpdateSpaceSchedule();
  const addBlocked    = useAddBlockedDate();
  const deleteBlocked = useDeleteBlockedDate();

  // Local editable copy of schedule
  const [localSchedule, setLocalSchedule] = useState<
    { dagINummer: number; fraTid: string; tilTid: string; erTilgjengelig: boolean }[]
  >([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockGrunn, setNewBlockGrunn] = useState("");

  // Sync remote schedule into local state (once)
  if (!scheduleLoaded && schedule.length > 0) {
    setLocalSchedule(
      Array.from({ length: 7 }, (_, i) => {
        const row = schedule.find((r: any) => r.dagINummer === i);
        return {
          dagINummer: i,
          fraTid: row?.fraTid ?? "08:00",
          tilTid: row?.tilTid ?? "16:00",
          erTilgjengelig: row != null ? row.erTilgjengelig : i < 5,
        };
      })
    );
    setScheduleLoaded(true);
  }

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    updateSchedule.mutate(
      { id: spaceId, data: localSchedule },
      {
        onSettled: () => setSavingSchedule(false),
        onSuccess: () => qc.invalidateQueries({ queryKey: getGetSpaceScheduleQueryKey(spaceId) }),
      }
    );
  };

  const handleAddBlocked = () => {
    if (!newBlockDate) return;
    addBlocked.mutate(
      { id: spaceId, data: { dato: newBlockDate, grunn: newBlockGrunn || null } },
      {
        onSuccess: () => {
          setNewBlockDate("");
          setNewBlockGrunn("");
          qc.invalidateQueries({ queryKey: getGetBlockedDatesQueryKey(spaceId) });
        },
      }
    );
  };

  const handleDeleteBlocked = (dateId: number) => {
    deleteBlocked.mutate(
      { id: spaceId, dateId },
      { onSuccess: () => qc.invalidateQueries({ queryKey: getGetBlockedDatesQueryKey(spaceId) }) }
    );
  };

  const inputCls = "px-2 py-1 rounded-lg text-xs border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#00B4D8]";

  return (
    <div className="space-y-6">
      {/* Weekly schedule */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock size={14} className="text-[#00B4D8]" /> Ukentlig timeplan
          </h3>
          <button
            onClick={handleSaveSchedule}
            disabled={savingSchedule}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
          >
            <Save size={12} />
            {savingSchedule ? "Lagrer…" : "Lagre"}
          </button>
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 7 }, (_, i) => {
            const row = localSchedule.find(r => r.dagINummer === i) ?? {
              dagINummer: i, fraTid: "08:00", tilTid: "16:00", erTilgjengelig: i < 5,
            };
            const update = (patch: Partial<typeof row>) =>
              setLocalSchedule(prev => prev.map(r => r.dagINummer === i ? { ...r, ...patch } : r));

            return (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                style={{
                  background: row.erTilgjengelig ? "rgba(0,180,216,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${row.erTilgjengelig ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {/* Toggle */}
                <button
                  onClick={() => update({ erTilgjengelig: !row.erTilgjengelig })}
                  className="w-8 h-4 rounded-full transition-all shrink-0 relative"
                  style={{ background: row.erTilgjengelig ? "#00B4D8" : "rgba(255,255,255,0.15)" }}
                >
                  <span
                    className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                    style={{ left: row.erTilgjengelig ? "calc(100% - 14px)" : "2px" }}
                  />
                </button>

                {/* Day name */}
                <span className={`text-xs font-semibold w-16 shrink-0 ${row.erTilgjengelig ? "text-white" : "text-white/30"}`}>
                  {DAYS_NO[i]}
                </span>

                {/* Time inputs */}
                {row.erTilgjengelig ? (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input
                      type="time" value={row.fraTid} className={inputCls}
                      onChange={e => update({ fraTid: e.target.value })}
                    />
                    <span className="text-white/30 text-xs">–</span>
                    <input
                      type="time" value={row.tilTid} className={inputCls}
                      onChange={e => update({ tilTid: e.target.value })}
                    />
                  </div>
                ) : (
                  <span className="text-xs text-white/20 flex-1">Ikke tilgjengelig</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked dates */}
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Ban size={14} className="text-red-400" /> Blokkerte datoer
        </h3>

        {/* Add new */}
        <div className="flex gap-2 mb-3">
          <input
            type="date" value={newBlockDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => setNewBlockDate(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 text-white focus:outline-none focus:border-[#00B4D8]"
          />
          <input
            type="text" placeholder="Grunn (valgfritt)" value={newBlockGrunn}
            onChange={e => setNewBlockGrunn(e.target.value)}
            className="flex-1 px-2 py-1.5 rounded-lg text-xs border border-white/10 bg-white/5 text-white placeholder-white/30 focus:outline-none focus:border-[#00B4D8]"
          />
          <button
            onClick={handleAddBlocked}
            disabled={!newBlockDate || addBlocked.isPending}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
            style={{ background: newBlockDate ? "rgba(239,68,68,0.7)" : "rgba(255,255,255,0.1)" }}
          >
            + Blokker
          </button>
        </div>

        {/* List */}
        {(blockedDates as any[]).length === 0 ? (
          <p className="text-xs text-white/30 text-center py-3">Ingen blokkerte datoer</p>
        ) : (
          <div className="space-y-1.5">
            {(blockedDates as any[]).map((bd: any) => (
              <div
                key={bd.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <div>
                  <span className="text-xs font-semibold text-red-300">{bd.dato}</span>
                  {bd.grunn && <span className="text-xs text-white/40 ml-2">— {bd.grunn}</span>}
                </div>
                <button
                  onClick={() => handleDeleteBlocked(bd.id)}
                  className="p-1 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showPanel, setShowPanel] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"oversikt" | "tilgjengelighet">("oversikt");
  const [editingPris, setEditingPris] = useState(false);
  const [editPrisModell, setEditPrisModell] = useState<"fri" | "smart">("fri");
  const [editSmartBydel, setEditSmartBydel] = useState("");
  const [editPriser, setEditPriser] = useState({ time: "", dag: "", uke: "", maaned: "" });
  const [showProfilPanel, setShowProfilPanel] = useState(false);
  const [profilPersonnummer, setProfilPersonnummer] = useState("");
  const [profilKontonummer, setProfilKontonummer] = useState("");
  const [profilSaved, setProfilSaved] = useState(false);

  const qcDash = useQueryClient();
  const updateSpace = useUpdateSpace();
  const updateProfil = useUpdateProfil();
  const { data: smartPrisData } = useGetSmartPrisData();

  const { data: dashboard, isLoading } = useGetOwnerDashboard();
  const { data: mySpaces } = useGetMySpaces();

  function startEditPris(space: { id: number; prisModell: string; smartPrisBydel?: string | null; priser?: { time?: number | null; dag?: number | null; uke?: number | null; maaned?: number | null } | null }) {
    const pm = (space.prisModell === "smart" ? "smart" : "fri") as "fri" | "smart";
    setEditPrisModell(pm);
    setEditSmartBydel(space.smartPrisBydel ?? "");
    setEditPriser({
      time:   String(space.priser?.time ?? ""),
      dag:    String(space.priser?.dag ?? ""),
      uke:    String(space.priser?.uke ?? ""),
      maaned: String(space.priser?.maaned ?? ""),
    });
    setEditingPris(true);
  }

  function saveEditPris(spaceId: number) {
    const data: Record<string, unknown> = { prisModell: editPrisModell };
    if (editPrisModell === "smart") {
      data.smartPrisBydel = editSmartBydel || null;
    } else {
      data.priser = {
        time:   editPriser.time   ? Number(editPriser.time)   : null,
        dag:    editPriser.dag    ? Number(editPriser.dag)    : null,
        uke:    editPriser.uke    ? Number(editPriser.uke)    : null,
        maaned: editPriser.maaned ? Number(editPriser.maaned) : null,
      };
    }
    updateSpace.mutate(
      { id: spaceId, data: data as Parameters<typeof updateSpace.mutate>[0]["data"] },
      {
        onSuccess: () => {
          setEditingPris(false);
          qcDash.invalidateQueries({ queryKey: getGetMySpacesQueryKey() });
        },
      }
    );
  }

  if (!user) {
    setLocation("/logg-inn");
    return null;
  }

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar onOpenRegisterPanel={() => setShowPanel(true)} />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Hei, {user.navn.split(" ")[0]} 👋
            </h1>
            <p className="text-white/50 text-sm">Her er en oversikt over utleievirksomheten din</p>
          </div>
          <button
            onClick={() => setShowPanel(true)}
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
            data-testid="button-add-space"
          >
            <Plus size={16} /> Legg til plass
          </button>
        </div>

        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
            {[
              { label: "Total inntekt",     value: `${Math.round(dashboard?.totalInntekt ?? 0).toLocaleString("nb-NO")} kr`,  icon: <TrendingUp size={18} />, color: "#10B981" },
              { label: "Denne måneden",     value: `${Math.round(dashboard?.maanedsInntekt ?? 0).toLocaleString("nb-NO")} kr`, icon: <TrendingUp size={18} />, color: "#00B4D8" },
              { label: "Aktive bookinger",  value: dashboard?.aktiveBookinger ?? 0,                                              icon: <Calendar size={18} />,   color: "#F59E0B" },
              { label: "Mine plasser",      value: dashboard?.totaltPlasser ?? 0,                                                icon: <MapPin size={18} />,     color: "#8B5CF6" },
              { label: "Faste abonnenter",  value: dashboard?.aktiveAbonnenter ?? 0,                                             icon: <Users size={18} />,      color: "#7C3AED" },
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                data-testid={`dashboard-stat-${i}`}
              >
                <div className="flex items-center gap-2 mb-2" style={{ color: stat.color }}>
                  {stat.icon}
                </div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-white/50">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Quick links ── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { href: "/skatterapport", emoji: "📊", label: "Skatterapport", desc: "Last ned årsoppgave" },
            { href: "/referral",      emoji: "🎁", label: "Inviter venner", desc: "200 kr per venn" },
            { href: "/tvistmelding",  emoji: "⚖️", label: "Tvistemelding",  desc: "Meld inn en tvist" },
          ].map(({ href, emoji, label, desc }) => (
            <Link key={href} href={href}>
              <div
                className="rounded-2xl p-4 cursor-pointer transition-all hover:opacity-80"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <div className="text-xl mb-1">{emoji}</div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-white/45 mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Live Status ── */}
        {((dashboard as any)?.liveStatus ?? []).length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                Live Status
              </h2>
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}
              >
                <Wifi size={9} className="animate-pulse" /> Sanntid
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {((dashboard as any)?.liveStatus ?? []).map((ls: any) => {
                const isBooked   = ls.status === "booked";
                const isReserved = ls.status === "reserved";

                const accent = isBooked ? "#EF4444" : isReserved ? "#F59E0B" : "#10B981";
                const emoji  = isBooked ? "🔴" : isReserved ? "🟡" : "🟢";
                const label  = isBooked ? "Opptatt nå" : isReserved ? "Reservert nå" : "Ledig nå";

                return (
                  <LiveStatusCard
                    key={ls.spaceId}
                    ls={ls}
                    accent={accent}
                    emoji={emoji}
                    label={label}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Recent bookings */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Siste bookinger
          </h2>
          {(dashboard?.sisteBookinger ?? []).length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-white/40">Ingen bookinger ennå</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(dashboard?.sisteBookinger ?? []).map((booking) => {
                const statusConfig = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
                return (
                  <div
                    key={booking.id}
                    className="rounded-2xl p-4 flex items-center justify-between"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                    data-testid={`booking-row-${booking.id}`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{booking.spaseTittel ?? "Plass"}</p>
                      <p className="text-xs text-white/50">{booking.leietakerNavn ?? "Leietaker"} · {booking.periodetype}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{Math.round(booking.utleierBelop ?? 0)} kr</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ color: statusConfig.color, background: statusConfig.bg }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Skatteinfo for utleiere ── */}
        <div
          className="mb-5 rounded-2xl p-4 flex items-start gap-3"
          style={{ background: "rgba(0,180,216,0.05)", border: "1px solid rgba(0,180,216,0.18)" }}
        >
          <span className="text-base shrink-0 mt-0.5">📋</span>
          <div>
            <p className="text-sm font-semibold text-white mb-1.5">Husk at leieinntekter er skattepliktige</p>
            <div className="space-y-0.5 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
              <p><span className="text-white/70 font-medium">Parkering og lagerplass:</span> Inntekter over 10 000 kr/år er skattepliktige.</p>
              <p><span className="text-white/70 font-medium">Camping og overnatting:</span> Inntekter over 10 000 kr/år er skattepliktige.</p>
            </div>
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>
              Vi anbefaler å ta kontakt med en regnskapsfører.{" "}
              <a href="https://www.skatteetaten.no" target="_blank" rel="noopener noreferrer" style={{ color: "#00B4D8" }} className="underline">skatteetaten.no</a>
            </p>
          </div>
        </div>

        {/* ── DAC7 / Skatteinfo advarsel ── */}
        {!user.personnummer && (
          <div
            className="mb-6 rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            <ShieldAlert size={18} className="mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "#F59E0B" }}>Skatteinfo mangler</p>
              <p className="text-xs text-white/60 mt-0.5">
                Som markedsplass er Ledi pålagt å rapportere utleieinntekter til Skatteetaten (DAC7).
                Legg inn personnummer/org.nr. og kontonummer for å oppfylle dette kravet.
              </p>
            </div>
            <button
              onClick={() => { setShowProfilPanel(v => !v); setProfilPersonnummer(user.personnummer ?? ""); setProfilKontonummer(user.kontonummer ?? ""); }}
              className="text-xs px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all hover:opacity-80"
              style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.4)" }}
            >
              Fyll inn
            </button>
          </div>
        )}

        {/* ── Profil & Skatteinfo panel ── */}
        {showProfilPanel && (
          <div
            className="mb-8 rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <User size={16} style={{ color: "#00B4D8" }} />
                <h2 className="text-base font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>Profil & Skatteinfo</h2>
              </div>
              <button onClick={() => setShowProfilPanel(false)} className="text-white/40 hover:text-white/70"><X size={16} /></button>
            </div>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 block mb-1.5">Personnummer eller org.nr.</label>
                  <input
                    type="text"
                    value={profilPersonnummer}
                    onChange={e => setProfilPersonnummer(e.target.value)}
                    placeholder="11 siffer (fødselsnr.) eller org.nr."
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                  <p className="text-[11px] text-white/35 mt-1">Brukes til DAC7-rapportering til Skatteetaten</p>
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1.5">Kontonummer (for utbetaling)</label>
                  <input
                    type="text"
                    value={profilKontonummer}
                    onChange={e => setProfilKontonummer(e.target.value)}
                    placeholder="11 siffer — XXXX.XX.XXXXX"
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)" }}
                  />
                  <p className="text-[11px] text-white/35 mt-1">Norsk bankkontonummer for utbetaling av leieinntekter</p>
                </div>
              </div>

              <div
                className="rounded-xl p-3 text-xs text-white/50"
                style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)" }}
              >
                <span style={{ color: "#00B4D8" }} className="font-semibold">DAC7-informasjon: </span>
                EU-direktivet DAC7 (implementert i Norge fra 2023) krever at digitale markedsplasser rapporterer selgeres inntekter til skattemyndighetene hvert år. Rapporten sendes til Skatteetaten innen 31. januar for foregående år. Opplysningene brukes kun til dette formålet.
              </div>

              {profilSaved && (
                <div className="flex items-center gap-2 text-sm" style={{ color: "#10B981" }}>
                  <CheckCircle2 size={15} /> Lagret!
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    updateProfil.mutate(
                      { data: { personnummer: profilPersonnummer || null, kontonummer: profilKontonummer || null } },
                      {
                        onSuccess: () => {
                          setProfilSaved(true);
                          setTimeout(() => setProfilSaved(false), 3000);
                        },
                      }
                    );
                  }}
                  disabled={updateProfil.isPending}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50 transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                >
                  <Save size={14} />
                  {updateProfil.isPending ? "Lagrer..." : "Lagre"}
                </button>
                <button
                  onClick={() => setShowProfilPanel(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Arrangementer nær deg */}
        <ArrangementVarselPanel />

        {/* Kalender-synkronisering */}
        <KalenderSyncPanel />

        {/* Innsikt */}
        <InnsiktPanel
          bookinger={dashboard?.sisteBookinger ?? []}
          totalInntekt={dashboard?.totalInntekt ?? 0}
          maanedsInntekt={dashboard?.maanedsInntekt ?? 0}
          userName={user.navn}
        />

        {/* My spaces + availability */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Mine plasser
          </h2>
          {(mySpaces ?? []).length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-white/40 mb-4">Du har ingen plasser ennå</p>
              <button
                onClick={() => setShowPanel(true)}
                className="px-6 py-2.5 rounded-xl font-bold text-white"
                style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                data-testid="button-add-first-space"
              >
                Registrer din første plass
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Space selector */}
              <div className="grid sm:grid-cols-2 gap-3">
                {(mySpaces ?? []).map((space) => (
                  <button
                    key={space.id}
                    onClick={() => {
                      setSelectedSpaceId(space.id === selectedSpaceId ? null : space.id);
                      setActiveTab("oversikt");
                    }}
                    className="rounded-2xl p-4 text-left transition-all"
                    style={{
                      background: selectedSpaceId === space.id ? "rgba(0,180,216,0.1)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${selectedSpaceId === space.id ? "rgba(0,180,216,0.4)" : "rgba(255,255,255,0.08)"}`,
                    }}
                    data-testid={`my-space-${space.id}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-sm font-semibold text-white">{space.tittel}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={
                          space.erGodkjent
                            ? { color: "#10B981", background: "rgba(16,185,129,0.1)" }
                            : { color: "#F59E0B", background: "rgba(245,158,11,0.1)" }
                        }
                      >
                        {space.erGodkjent ? "Aktiv" : "Venter"}
                      </span>
                    </div>
                    <p className="text-xs text-white/50">{space.adresse}, {space.by}</p>
                    {selectedSpaceId === space.id && (
                      <p className="text-xs text-[#00B4D8] mt-1.5">Valgt — se tilgjengelighet nedenfor</p>
                    )}
                  </button>
                ))}
              </div>

              {/* Availability management for selected space */}
              <AnimatePresence>
                {selectedSpaceId != null && (
                  <motion.div
                    key={selectedSpaceId}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {/* Tabs */}
                    <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      {(["oversikt", "tilgjengelighet"] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
                          style={
                            activeTab === tab
                              ? { background: "#00B4D8", color: "#fff" }
                              : { color: "rgba(255,255,255,0.5)" }
                          }
                        >
                          {tab === "oversikt" ? "Oversikt" : "Tilgjengelighet"}
                        </button>
                      ))}
                    </div>

                    {activeTab === "tilgjengelighet" && (
                      <AvailabilityPanel spaceId={selectedSpaceId} />
                    )}

                    {activeTab === "oversikt" && (
                      <div className="space-y-3">
                        {(mySpaces ?? [])
                          .filter(s => s.id === selectedSpaceId)
                          .map(space => (
                          <div key={space.id} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-white/50">Type</span>
                              <span className="text-white capitalize">{space.type}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-white/50">Adresse</span>
                              <span className="text-white">{space.adresse}, {space.by}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-white/50">Status</span>
                              <span style={{ color: space.erGodkjent ? "#10B981" : "#F59E0B" }}>
                                {space.erGodkjent ? "Aktiv og synlig" : "Venter på godkjenning"}
                              </span>
                            </div>

                            {/* ── Pricing section ── */}
                            <div
                              className="rounded-xl p-3 mt-1"
                              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-white">Prismodell</span>
                                {!editingPris ? (
                                  <button
                                    onClick={() => startEditPris(space)}
                                    className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all hover:bg-white/10"
                                    style={{ color: "#00B4D8" }}
                                    data-testid="button-edit-pris"
                                  >
                                    <Pencil size={11} /> Endre
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => setEditingPris(false)}
                                    className="text-white/40 hover:text-white"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>

                              {!editingPris ? (
                                /* Read view */
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white">
                                      {space.prisModell === "smart" ? "🤖 Smart Pris" : "🎯 Fri prissetting"}
                                    </span>
                                    {space.prisModell === "smart" && space.smartPrisBydel && (
                                      <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "rgba(139,92,246,0.2)", color: "#A78BFA" }}>
                                        {space.smartPrisBydel}
                                      </span>
                                    )}
                                  </div>
                                  {(space.priser?.maaned || space.priser?.dag || space.priser?.time) && (
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {space.priser.time && (
                                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(0,180,216,0.1)", color: "#00B4D8" }}>
                                          {space.priser.time.toLocaleString("nb-NO")} kr/t
                                        </span>
                                      )}
                                      {space.priser.dag && (
                                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(0,180,216,0.1)", color: "#00B4D8" }}>
                                          {space.priser.dag.toLocaleString("nb-NO")} kr/dag
                                        </span>
                                      )}
                                      {space.priser.uke && (
                                        <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: "rgba(0,180,216,0.1)", color: "#00B4D8" }}>
                                          {space.priser.uke.toLocaleString("nb-NO")} kr/uke
                                        </span>
                                      )}
                                      {space.priser.maaned && (
                                        <span className="text-xs px-2 py-0.5 rounded-lg font-semibold" style={{ background: "rgba(0,180,216,0.15)", color: "#00B4D8" }}>
                                          {space.priser.maaned.toLocaleString("nb-NO")} kr/mnd
                                          {space.prisModell === "smart" && " 🤖"}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                /* Edit view */
                                <div className="space-y-3">
                                  {/* Model toggle */}
                                  <div className="grid grid-cols-2 gap-2">
                                    {(["fri", "smart"] as const).map(m => (
                                      <button
                                        key={m}
                                        onClick={() => setEditPrisModell(m)}
                                        className="py-2 px-3 rounded-xl border text-xs font-bold text-left transition-all"
                                        style={{
                                          borderColor: editPrisModell === m ? (m === "smart" ? "#8B5CF6" : "#00B4D8") : "rgba(255,255,255,0.1)",
                                          background: editPrisModell === m ? (m === "smart" ? "rgba(139,92,246,0.15)" : "rgba(0,180,216,0.12)") : "rgba(255,255,255,0.04)",
                                          color: editPrisModell === m ? "#fff" : "rgba(255,255,255,0.5)",
                                        }}
                                        data-testid={`button-edit-modell-${m}`}
                                      >
                                        {m === "smart" ? "🤖 Smart Pris" : "🎯 Fri prissetting"}
                                      </button>
                                    ))}
                                  </div>

                                  {editPrisModell === "smart" ? (
                                    <div>
                                      <label className="text-xs text-white/50 block mb-1">Bydel</label>
                                      <select
                                        value={editSmartBydel}
                                        onChange={e => setEditSmartBydel(e.target.value)}
                                        className="w-full px-2.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none"
                                        style={{ colorScheme: "dark" }}
                                        data-testid="select-edit-smart-bydel"
                                      >
                                        <option value="">Velg bydel...</option>
                                        {SMART_BYDELER.map(b => <option key={b} value={b}>{b}</option>)}
                                      </select>
                                      {editSmartBydel && (() => {
                                        const d = smartPrisData?.find(x => x.navn === editSmartBydel);
                                        if (!d) return null;
                                        const anbefalt = Math.round((d.parkeringMin + d.parkeringMax) / 2);
                                        return (
                                          <div className="mt-2 px-2.5 py-2 rounded-lg text-xs" style={{ background: "rgba(139,92,246,0.1)", color: "#A78BFA" }}>
                                            Anbefalt pris: <strong>{anbefalt.toLocaleString("nb-NO")} kr/mnd</strong>
                                            <span className="text-white/40 ml-2">({Math.round(anbefalt * 0.92).toLocaleString("nb-NO")} kr etter gebyr)</span>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {([
                                        { key: "time" as const, label: "Per time", unit: "kr/t" },
                                        { key: "dag" as const, label: "Per dag", unit: "kr/dag" },
                                        { key: "uke" as const, label: "Per uke", unit: "kr/uke" },
                                        { key: "maaned" as const, label: "Per måned", unit: "kr/mnd" },
                                      ]).map(f => (
                                        <div key={f.key} className="flex items-center gap-2">
                                          <span className="text-xs text-white/50 w-20 shrink-0">{f.label}</span>
                                          <div className="flex-1 flex items-center rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                                            <input
                                              type="number"
                                              value={editPriser[f.key]}
                                              onChange={e => setEditPriser(p => ({ ...p, [f.key]: e.target.value }))}
                                              placeholder="–"
                                              className="flex-1 px-2.5 py-1.5 bg-transparent text-white placeholder:text-white/20 text-xs focus:outline-none"
                                              data-testid={`input-edit-price-${f.key}`}
                                            />
                                            <span className="px-2 text-[10px] text-white/30">{f.unit}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <button
                                    onClick={() => saveEditPris(space.id)}
                                    disabled={updateSpace.isPending || (editPrisModell === "smart" && !editSmartBydel)}
                                    className="w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 disabled:opacity-50 transition-all hover:opacity-90"
                                    style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                                    data-testid="button-save-pris"
                                  >
                                    <CheckCircle2 size={13} />
                                    {updateSpace.isPending ? "Lagrer..." : "Lagre ny pris"}
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="pt-1">
                              <button
                                onClick={() => setActiveTab("tilgjengelighet")}
                                className="w-full py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2"
                                style={{ background: "rgba(0,180,216,0.15)", border: "1px solid rgba(0,180,216,0.3)" }}
                              >
                                <Clock size={12} /> Administrer tilgjengelighet
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPanel && (
          <motion.div key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30 }}>
            <RegisterSpacePanel onClose={() => setShowPanel(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
