import { useState, useMemo, useEffect } from "react";
import { X, Star, Shield, Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight, Loader2, Bell, Timer } from "lucide-react";
import { useCreateBooking, useGetAvailableTimes, useCreateSubscription, useJoinWaitlist, useConfirmBooking, useVippsInitiate } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getListBookingsQueryKey } from "@workspace/api-client-react";

// ── Date helpers ─────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return d.toISOString().split("T")[0];
}
function toTimeStr(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:00`;
}
function combineDT(dateStr: string, timeStr: string) {
  return new Date(`${dateStr}T${timeStr}:00`);
}
function addHours(d: Date, h: number) {
  const r = new Date(d); r.setHours(r.getHours() + h); return r;
}
function addDays(d: Date, n: number) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function addWeeks(d: Date, n: number) { return addDays(d, n * 7); }
function addMonths(d: Date, n: number) {
  const r = new Date(d); r.setMonth(r.getMonth() + n); return r;
}
function fmtDate(d: Date) {
  return d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}
function fmtDateTime(d: Date) {
  return `${fmtDate(d)} kl ${d.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })}`;
}
function diffHours(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 3_600_000);
}
function diffDays(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { key: "natt",   label: "Natt",    suffix: "/natt" },
  { key: "time",   label: "Time",    suffix: "/t"    },
  { key: "dag",    label: "Dag",     suffix: "/dag"  },
  { key: "uke",    label: "Uke",     suffix: "/uke"  },
  { key: "maaned", label: "Måned",   suffix: "/mnd"  },
];

const CAMPING_TYPES = ["camping", "bobil", "bobil_strom", "bobil_full", "gaard", "baatplass"];

const TYPE_EMOJIS: Record<string, string> = {
  parking: "🚗", storage: "📦", business: "🏢", ev: "⚡",
  camping: "🏕️", bobil: "🚐", bobil_strom: "⚡🚐", bobil_full: "🚿🚐", gaard: "🏠", baatplass: "⚓",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Space {
  id: number;
  tittel: string;
  type: string;
  adresse: string;
  by: string;
  prisModell: string;
  priser?: { time?: number | null; dag?: number | null; uke?: number | null; maaned?: number | null };
  snittRangering?: number | null;
  eierNavn?: string | null;
  fasiliteter?: string[];
  tilbyrAbonnement?: boolean;
  abonnementsPris?: number | null;
  minBindingstid?: number | null;
  antallVenter?: number;
}

interface Props {
  space: Space;
  onClose: () => void;
}

// ── Live hour availability strip ───────────────────────────────────────────────

function LiveHourStrip({
  spaceId, date, startTime, endTime, onSelectHour,
}: {
  spaceId: number;
  date: string;
  startTime: string;
  endTime: string;
  onSelectHour: (hour: number) => void;
}) {
  const { data, isLoading } = useGetAvailableTimes(
    spaceId,
    { date },
    { query: { enabled: !!date } as any }
  );

  const startH = parseInt(startTime.split(":")[0], 10);
  const endH   = parseInt(endTime.split(":")[0], 10);

  const schedFrom = data?.scheduleFrom ? parseInt(data.scheduleFrom.split(":")[0], 10) : 8;
  const schedTo   = data?.scheduleTo   ? parseInt(data.scheduleTo.split(":")[0], 10)   : 20;
  const hours = Array.from({ length: Math.max(0, schedTo - schedFrom) }, (_, i) => schedFrom + i);

  const available: number[]  = data?.availableHours ?? [];
  const occupied: number[]   = data?.occupiedHours ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-xs py-3">
        <Loader2 size={14} className="animate-spin" /> Laster tilgjengelighet…
      </div>
    );
  }

  if (data?.isBlocked) {
    return (
      <div className="px-3 py-2 rounded-xl text-xs text-red-500 text-center"
        style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
        Denne datoen er blokkert av utleier
      </div>
    );
  }

  if (!data?.scheduleActive || hours.length === 0) {
    return (
      <div className="px-3 py-2 rounded-xl text-xs text-gray-400 text-center"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
        Ikke tilgjengelig denne dagen
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-0.5 flex-wrap">
        {hours.map(h => {
          const isOcc  = occupied.includes(h);
          const isFree = available.includes(h);
          const isSelected = h >= startH && h < endH;

          let bg = "#E5E7EB";
          let label = "#9CA3AF";
          if (isFree)  { bg = "rgba(16,185,129,0.15)";  label = "#10B981"; }
          if (isOcc)   { bg = "rgba(239,68,68,0.15)";   label = "#EF4444"; }
          if (isSelected && isFree) { bg = "rgba(0,180,216,0.3)"; label = "#00B4D8"; }

          return (
            <button
              key={h}
              disabled={isOcc}
              onClick={() => isFree && !isOcc && onSelectHour(h)}
              title={isOcc ? "Opptatt" : isFree ? "Klikk for å velge" : "Ikke tilgjengelig"}
              className="flex flex-col items-center rounded transition-all"
              style={{ width: 28, padding: "3px 0", background: bg, cursor: isOcc ? "not-allowed" : "pointer" }}
            >
              <span className="text-[9px] font-bold" style={{ color: label }}>
                {String(h).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-1.5">
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "rgba(16,185,129,0.4)" }} /> Ledig
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "rgba(239,68,68,0.4)" }} /> Opptatt
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "#E5E7EB" }} /> Ikke tilgjengelig
        </span>
      </div>
    </div>
  );
}

// ── Day calendar (week view) ──────────────────────────────────────────────────

function DayCalendar({
  startDate, endDate, onSelectStart, onSelectEnd,
}: { startDate: string; endDate: string; onSelectStart: (d: string) => void; onSelectEnd: (d: string) => void }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = new Date();
  const monday = addDays(today, -((today.getDay() + 6) % 7) + weekOffset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const DOW = ["Ma", "Ti", "On", "To", "Fr", "Lø", "Sø"];

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setWeekOffset(o => o - 1)} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft size={14} className="text-gray-500" />
        </button>
        <span className="text-xs text-gray-500">
          {fmtDate(monday)} – {fmtDate(days[6])}
        </span>
        <button onClick={() => setWeekOffset(o => o + 1)} className="p-1 rounded hover:bg-gray-100">
          <ChevronRight size={14} className="text-gray-500" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const ds = toDateStr(d);
          const isPast = d < today && toDateStr(d) !== toDateStr(today);
          const isStart = ds === startDate;
          const isEnd   = ds === endDate;
          const inRange = ds > startDate && ds < endDate;
          const isWeekend = i >= 5;

          let bg = isWeekend ? "rgba(239,68,68,0.08)" : isPast ? "#F3F4F6" : "rgba(16,185,129,0.1)";
          let color = isWeekend ? "#EF4444" : isPast ? "#D1D5DB" : "#10B981";
          if (isStart || isEnd) { bg = "#00B4D8"; color = "#fff"; }
          else if (inRange) { bg = "rgba(0,180,216,0.15)"; color = "#0077A8"; }

          return (
            <button
              key={ds}
              disabled={isPast || isWeekend}
              onClick={() => {
                if (!startDate || (startDate && endDate)) {
                  onSelectStart(ds); onSelectEnd("");
                } else {
                  if (ds <= startDate) { onSelectStart(ds); onSelectEnd(""); }
                  else onSelectEnd(ds);
                }
              }}
              className="flex flex-col items-center py-1.5 rounded-lg transition-all"
              style={{ background: bg, opacity: isPast || isWeekend ? 0.5 : 1 }}
            >
              <span className="text-[10px]" style={{ color: isStart || isEnd ? "#ffffffaa" : "#9CA3AF" }}>
                {DOW[i]}
              </span>
              <span className="text-xs font-bold" style={{ color }}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2">
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "rgba(16,185,129,0.4)" }} /> Ledig
        </span>
        <span className="flex items-center gap-1 text-[10px] text-gray-400">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ background: "rgba(239,68,68,0.4)" }} /> Helg/utilgjengelig
        </span>
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function BookingModal({ space, onClose }: Props) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createBooking = useCreateBooking();
  const confirmBooking = useConfirmBooking();
  const vippsInitiate = useVippsInitiate();
  const createSubscription = useCreateSubscription();
  const joinWaitlist = useJoinWaitlist();
  const [vippsPolling, setVippsPolling] = useState(false);
  const [booked, setBooked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);

  // Reservation state (after "Book nå", before "Bekreft og betal")
  const [reservedBooking, setReservedBooking] = useState<{
    id: number;
    lockedUntil: string | null;
    totalPris: number;
    startDato: string;
    sluttDato: string;
  } | null>(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);

  // Countdown for the 10-min lock
  useEffect(() => {
    if (!reservedBooking?.lockedUntil) return;
    const target = new Date(reservedBooking.lockedUntil).getTime();
    const tick = () => {
      const left = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setLockSecondsLeft(left);
      if (left === 0) {
        setReservedBooking(null); // lock expired — go back to form
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [reservedBooking?.lockedUntil]);
  const [activeMode, setActiveMode] = useState<"booking" | "abonnement" | "venteliste">("booking");
  const [abStartDate, setAbStartDate] = useState(() => toDateStr(new Date()));
  const [abBindingstid, setAbBindingstid] = useState(space.minBindingstid ?? 1);
  const [wlPeriodeType, setWlPeriodeType] = useState("dag");
  const [wlDato, setWlDato] = useState(() => toDateStr(new Date()));
  const [wlMaksPris, setWlMaksPris] = useState("");
  const hasFastPlass = !!space.tilbyrAbonnement && !!space.abonnementsPris;

  // Default values
  const nowPlusOne = addHours(new Date(), 1);
  nowPlusOne.setMinutes(0, 0, 0);
  const defaultStart = toDateStr(new Date());
  const defaultStartTime = toTimeStr(nowPlusOne);
  const defaultEndTime = toTimeStr(addHours(nowPlusOne, 1));
  const defaultEnd = toDateStr(addDays(new Date(), 1));

  const isCamping = CAMPING_TYPES.includes(space.type);

  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const p = space.priser as Record<string, number | null> | undefined;
    if (p?.natt) return "natt";
    if (p?.dag) return "dag";
    if (p?.time) return "time";
    if (p?.uke) return "uke";
    return "maaned";
  });

  // Night booking
  const [nattStart, setNattStart] = useState(defaultStart);
  const [nattEnd, setNattEnd] = useState(toDateStr(addDays(new Date(), 2)));
  const [antallVoksne, setAntallVoksne] = useState(2);
  const [antallBarn, setAntallBarn] = useState(0);
  const [kjoretoy, setKjoretoy] = useState("");

  // Time booking
  const [startDate, setStartDate] = useState(defaultStart);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endDate, setEndDate]     = useState(defaultStart);
  const [endTime, setEndTime]     = useState(defaultEndTime);

  // Day booking
  const [dayStart, setDayStart] = useState(defaultStart);
  const [dayEnd,   setDayEnd]   = useState(defaultEnd);

  // Week booking
  const [weekStart, setWeekStart]       = useState(defaultStart);
  const [antallUker, setAntallUker]     = useState(1);

  // Month booking
  const [monthStart, setMonthStart]         = useState(defaultStart);
  const [antallMaaneder, setAntallMaaneder] = useState(1);

  const prices = space.priser as Record<string, number | null> | undefined;

  const availablePeriods = PERIOD_OPTIONS.filter(p => {
    const v = prices?.[p.key];
    return v != null && v > 0;
  });

  // ── Derived booking data ────────────────────────────────────────────────────

  const booking = useMemo(() => {
    const unitPrice = prices?.[selectedPeriod] ?? 0;

    if (selectedPeriod === "natt") {
      const sd = new Date(nattStart); sd.setHours(14, 0, 0, 0);
      const ed = new Date(nattEnd);   ed.setHours(11, 0, 0, 0);
      const netter = Math.max(1, Math.round((ed.getTime() - sd.getTime()) / 86_400_000));
      const valid = netter >= 1 && ed > sd;
      const totalBase = unitPrice * netter;
      const fee = Math.round(totalBase * 0.08);
      return {
        startDt: sd, endDt: ed, units: netter, unitLabel: "natt", unitSuffix: netter === 1 ? "natt" : "netter",
        unitPrice, totalBase, fee, total: totalBase + fee, valid,
        error: !valid ? "Utsjekk må være etter innsjekk" : null,
      };
    }

    if (selectedPeriod === "time") {
      const sd = combineDT(startDate, startTime);
      const ed = combineDT(endDate, endTime);
      const hours = diffHours(sd, ed);
      const valid = hours >= 1;
      const totalBase = unitPrice * Math.max(1, hours);
      const fee = Math.round(totalBase * 0.08);
      return {
        startDt: sd, endDt: ed, units: hours, unitLabel: "time", unitSuffix: "t",
        unitPrice, totalBase, fee, total: totalBase + fee, valid,
        error: !valid ? (hours <= 0 ? "Slutttid må være etter starttid" : "Minimum 1 time") : null,
      };
    }

    if (selectedPeriod === "dag") {
      const sd = new Date(dayStart);
      const ed = new Date(dayEnd);
      sd.setHours(8, 0, 0, 0); ed.setHours(8, 0, 0, 0);
      const days = diffDays(sd, ed);
      const valid = days >= 1;
      const totalBase = unitPrice * Math.max(1, days);
      const fee = Math.round(totalBase * 0.08);
      return {
        startDt: sd, endDt: ed, units: days, unitLabel: "dag", unitSuffix: "dager",
        unitPrice, totalBase, fee, total: totalBase + fee, valid,
        error: !valid ? "Sluttdato må være etter startdato" : null,
      };
    }

    if (selectedPeriod === "uke") {
      const sd = new Date(weekStart); sd.setHours(8, 0, 0, 0);
      const ed = addWeeks(sd, antallUker);
      const totalBase = unitPrice * antallUker;
      const fee = Math.round(totalBase * 0.08);
      return {
        startDt: sd, endDt: ed, units: antallUker, unitLabel: "uke", unitSuffix: antallUker === 1 ? "uke" : "uker",
        unitPrice, totalBase, fee, total: totalBase + fee, valid: true, error: null,
      };
    }

    // maaned
    const sd = new Date(monthStart); sd.setHours(8, 0, 0, 0);
    const ed = addMonths(sd, antallMaaneder);
    const totalBase = unitPrice * antallMaaneder;
    const fee = Math.round(totalBase * 0.08);
    return {
      startDt: sd, endDt: ed, units: antallMaaneder, unitLabel: "måned", unitSuffix: antallMaaneder === 1 ? "måned" : "måneder",
      unitPrice, totalBase, fee, total: totalBase + fee, valid: true, error: null,
    };
  }, [selectedPeriod, nattStart, nattEnd, startDate, startTime, endDate, endTime, dayStart, dayEnd, weekStart, antallUker, monthStart, antallMaaneder, prices]);

  const utleierMottar = Math.round(booking.totalBase * 0.92);

  const handleSubscribe = () => {
    if (!user) { setLocation("/logg-inn"); return; }
    createSubscription.mutate(
      { data: { plassId: space.id, startDato: abStartDate, bindingstid: abBindingstid } },
      { onSuccess: () => { setSubscribed(true); } }
    );
  };

  const handleJoinWaitlist = () => {
    if (!user) { setLocation("/logg-inn"); return; }
    joinWaitlist.mutate(
      { data: {
        plassId: space.id,
        periodeType: wlPeriodeType,
        oensketDato: wlDato,
        maksPris: wlMaksPris ? parseInt(wlMaksPris, 10) : null,
      }},
      { onSuccess: () => { setWaitlisted(true); } }
    );
  };

  // ── Handle book — creates 10-min reservation ────────────────────────────────

  const handleBook = () => {
    if (!user) { setLocation("/logg-inn"); return; }
    if (!booking.valid) return;

    createBooking.mutate(
      { data: { plassId: space.id, startDato: booking.startDt.toISOString(), sluttDato: booking.endDt.toISOString(), periodetype: selectedPeriod } },
      {
        onSuccess: (data) => {
          // If the booking came back as "confirmed" (auto-approval) go straight to success
          if ((data as any).status === "confirmed") {
            setBooked(true);
            queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
          } else {
            // Status is "reserved" — show the confirm screen
            setReservedBooking({
              id: (data as any).id,
              lockedUntil: (data as any).lockedUntil ?? null,
              totalPris: (data as any).totalPris,
              startDato: (data as any).startDato,
              sluttDato: (data as any).sluttDato,
            });
          }
        },
      }
    );
  };

  // ── Handle confirm — fallback/mock Vipps confirmation ──────────────────────

  const handleConfirm = () => {
    if (!reservedBooking) return;
    confirmBooking.mutate(
      { id: reservedBooking.id },
      {
        onSuccess: () => {
          setReservedBooking(null);
          setBooked(true);
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        },
        onError: (err: any) => {
          if (err?.response?.data?.code === "EXPIRED") {
            setReservedBooking(null);
          }
        },
      }
    );
  };

  // ── Handle Vipps pay — initiates real Vipps payment or falls back to mock ──

  const handleVippsPay = () => {
    if (!reservedBooking) return;
    vippsInitiate.mutate(
      { data: { bookingId: reservedBooking.id } },
      {
        onSuccess: (result) => {
          if (result.mock) {
            handleConfirm();
          } else if (result.redirectUrl) {
            window.open(result.redirectUrl, "_blank");
            setVippsPolling(true);
            const pollInterval = setInterval(async () => {
              try {
                const res = await fetch(`/api/bookings/${reservedBooking.id}`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem("ledi_token")}` },
                });
                if (res.ok) {
                  const b = await res.json();
                  if (b.status === "confirmed") {
                    clearInterval(pollInterval);
                    setVippsPolling(false);
                    setReservedBooking(null);
                    setBooked(true);
                    queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
                  }
                }
              } catch {
                // continue polling
              }
            }, 3000);
            setTimeout(() => {
              clearInterval(pollInterval);
              setVippsPolling(false);
            }, 10 * 60 * 1000);
          }
        },
      }
    );
  };

  // ── Input section per period ─────────────────────────────────────────────────

  function renderInputs() {
    const inputCls = "flex-1 px-3 py-2 rounded-xl text-sm text-gray-800 border border-gray-200 focus:outline-none focus:border-[#00B4D8]";

    if (selectedPeriod === "natt") {
      const sd = new Date(nattStart);
      const ed = new Date(nattEnd);
      const netter = Math.max(0, Math.round((ed.getTime() - sd.getTime()) / 86_400_000));
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Innsjekk</label>
              <input type="date" className={inputCls} value={nattStart} min={toDateStr(new Date())}
                onChange={e => { setNattStart(e.target.value); if (e.target.value >= nattEnd) setNattEnd(toDateStr(addDays(new Date(e.target.value), 1))); }} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Utsjekk</label>
              <input type="date" className={inputCls} value={nattEnd} min={toDateStr(addDays(new Date(nattStart), 1))}
                onChange={e => setNattEnd(e.target.value)} />
            </div>
          </div>
          {netter > 0 && (
            <div className="px-3 py-2 rounded-xl text-xs text-center font-semibold" style={{ background: "rgba(22,163,74,0.1)", color: "#16A34A" }}>
              🌙 {netter} {netter === 1 ? "natt" : "netter"} — innsjekk kl 14:00, utsjekk kl 11:00
            </div>
          )}
          {isCamping && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Voksne</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                    <button onClick={() => setAntallVoksne(v => Math.max(1, v - 1))} className="text-gray-400 font-bold">−</button>
                    <span className="flex-1 text-center text-sm font-semibold">{antallVoksne}</span>
                    <button onClick={() => setAntallVoksne(v => v + 1)} className="text-gray-400 font-bold">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Barn</label>
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2">
                    <button onClick={() => setAntallBarn(v => Math.max(0, v - 1))} className="text-gray-400 font-bold">−</button>
                    <span className="flex-1 text-center text-sm font-semibold">{antallBarn}</span>
                    <button onClick={() => setAntallBarn(v => v + 1)} className="text-gray-400 font-bold">+</button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Kjøretøy (valgfritt)</label>
                <select
                  value={kjoretoy}
                  onChange={e => setKjoretoy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 border border-gray-200 focus:outline-none focus:border-[#00B4D8]"
                >
                  <option value="">Velg type...</option>
                  <option value="telt">⛺ Telt</option>
                  <option value="vogn">🚗 Campingvogn</option>
                  <option value="bobil">🚐 Bobil</option>
                  <option value="bil">🚙 Bil</option>
                </select>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (selectedPeriod === "time") {
      const handleHourClick = (h: number) => {
        const newStart = `${String(h).padStart(2, "0")}:00`;
        const newEnd   = `${String(h + 1).padStart(2, "0")}:00`;
        setStartTime(newStart);
        setEndTime(newEnd);
        setEndDate(startDate);
      };

      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Fra dato</label>
              <input type="date" className={inputCls} value={startDate} min={toDateStr(new Date())}
                onChange={e => { setStartDate(e.target.value); setEndDate(e.target.value); }} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Fra kl</label>
              <input type="time" step="3600" className={inputCls} value={startTime}
                onChange={e => setStartTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Til dato</label>
              <input type="date" className={inputCls} value={endDate} min={startDate}
                onChange={e => setEndDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Til kl</label>
              <input type="time" step="3600" className={inputCls} value={endTime}
                onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2 tracking-wide">
              Tilgjengelighet — klikk en time for å velge
            </p>
            <LiveHourStrip
              spaceId={space.id}
              date={startDate}
              startTime={startTime}
              endTime={endTime}
              onSelectHour={handleHourClick}
            />
          </div>
        </div>
      );
    }

    if (selectedPeriod === "dag") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Fra dato</label>
              <input type="date" className={inputCls} value={dayStart} min={toDateStr(new Date())}
                onChange={e => { setDayStart(e.target.value); if (e.target.value >= dayEnd) setDayEnd(toDateStr(addDays(new Date(e.target.value), 1))); }} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Til dato</label>
              <input type="date" className={inputCls} value={dayEnd} min={toDateStr(addDays(new Date(dayStart), 1))}
                onChange={e => setDayEnd(e.target.value)} />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase mb-2 tracking-wide">Velg datoer i kalender</p>
            <DayCalendar startDate={dayStart} endDate={dayEnd}
              onSelectStart={d => { setDayStart(d); setDayEnd(""); }}
              onSelectEnd={d => setDayEnd(d)} />
          </div>
        </div>
      );
    }

    if (selectedPeriod === "uke") {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Fra dato</label>
              <input type="date" className={inputCls} value={weekStart} min={toDateStr(new Date())}
                onChange={e => setWeekStart(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Antall uker</label>
              <select className={inputCls} value={antallUker} onChange={e => setAntallUker(Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? "uke" : "uker"}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.2)" }}>
            <span className="text-gray-600">Slutter: </span>
            <span className="font-semibold text-gray-800">{fmtDate(booking.endDt)}</span>
          </div>
        </div>
      );
    }

    // maaned
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Fra dato</label>
            <input type="date" className={inputCls} value={monthStart} min={toDateStr(new Date())}
              onChange={e => setMonthStart(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Antall måneder</label>
            <select className={inputCls} value={antallMaaneder} onChange={e => setAntallMaaneder(Number(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} {n === 1 ? "måned" : "måneder"}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="px-3 py-2 rounded-xl text-sm" style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.2)" }}>
          <span className="text-gray-600">Slutter: </span>
          <span className="font-semibold text-gray-800">{fmtDate(booking.endDt)}</span>
        </div>
        <div className="px-3 py-2 rounded-xl text-sm" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
          <span className="text-gray-500">Pris per måned: </span>
          <span className="font-bold text-gray-900">{booking.unitPrice.toLocaleString("nb-NO")} kr/mnd</span>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "#fff", maxHeight: "90vh" }}
        data-testid="booking-modal"
      >
        {/* Hero */}
        <div className="relative h-28 flex items-center justify-center text-5xl shrink-0"
          style={{ background: "linear-gradient(135deg, #0D1B2A, #1B4F8C)" }}>
          {TYPE_EMOJIS[space.type] ?? "🚗"}
          <button
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30"
            onClick={onClose} data-testid="button-close-modal"
          >
            <X size={16} />
          </button>
          {space.prisModell === "smart" && (
            <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ background: "#8B5CF6" }}>
              🤖 Smart Pris
            </span>
          )}
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1">
          <div className="p-4">
            {booked ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Booking bekreftet!</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">{space.tittel}</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {fmtDateTime(booking.startDt)} → {fmtDateTime(booking.endDt)}
                </p>
                <button
                  onClick={() => { onClose(); setLocation("/mine-bookinger"); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                >
                  Se mine bookinger
                </button>
              </div>
            ) : reservedBooking ? (
              /* ── 10-MINUTE LOCK SCREEN ── */
              <div className="py-6 px-2">
                {/* Countdown ring */}
                <div className="flex flex-col items-center mb-6">
                  <div
                    className="w-20 h-20 rounded-full flex flex-col items-center justify-center mb-3 shadow-lg"
                    style={{
                      background: lockSecondsLeft > 120
                        ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))"
                        : "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))",
                      border: `3px solid ${lockSecondsLeft > 120 ? "#F59E0B" : "#EF4444"}`,
                    }}
                  >
                    <Timer size={18} style={{ color: lockSecondsLeft > 120 ? "#F59E0B" : "#EF4444" }} className="mb-0.5" />
                    <span className="text-lg font-bold text-gray-900">
                      {String(Math.floor(lockSecondsLeft / 60)).padStart(2, "0")}:{String(lockSecondsLeft % 60).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-0.5">🟡 Plassen er reservert til deg!</h3>
                  <p className="text-sm text-gray-500 text-center">
                    Du har {Math.ceil(lockSecondsLeft / 60)} minutt{Math.ceil(lockSecondsLeft / 60) !== 1 ? "ter" : ""} til å bekrefte
                  </p>
                </div>

                {/* Booking summary */}
                <div className="rounded-xl p-4 mb-5" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <p className="text-sm font-semibold text-gray-800 mb-2">{space.tittel}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock size={11} className="text-[#00B4D8] shrink-0" />
                    <span>{new Date(reservedBooking.startDato).toLocaleString("nb-NO", { dateStyle: "short", timeStyle: "short" })}</span>
                    <span className="text-gray-400">→</span>
                    <span>{new Date(reservedBooking.sluttDato).toLocaleString("nb-NO", { dateStyle: "short", timeStyle: "short" })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2" style={{ borderTop: "1px solid #E2E8F0" }}>
                    <span className="text-sm text-gray-600">Totalt å betale</span>
                    <span className="text-lg font-bold text-gray-900">{reservedBooking.totalPris.toLocaleString("nb-NO")} kr</span>
                  </div>
                </div>

                {/* Vipps payment button */}
                {vippsPolling ? (
                  <div className="w-full py-4 rounded-xl flex flex-col items-center gap-2 mb-3" style={{ background: "rgba(255,91,0,0.06)", border: "1px solid rgba(255,91,0,0.2)" }}>
                    <Loader2 size={20} className="animate-spin" style={{ color: "#FF5B00" }} />
                    <p className="text-sm font-semibold text-gray-700">Venter på Vipps-betaling…</p>
                    <p className="text-xs text-gray-400">Fullfør betalingen i Vipps-appen</p>
                    <button onClick={() => setVippsPolling(false)} className="text-xs text-gray-400 hover:text-gray-600 mt-1">Avbryt</button>
                  </div>
                ) : (
                  <button
                    onClick={handleVippsPay}
                    disabled={vippsInitiate.isPending || confirmBooking.isPending || lockSecondsLeft === 0}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-white mb-3 flex items-center justify-center gap-2 transition-all shadow-lg"
                    style={{
                      background: lockSecondsLeft > 0
                        ? "linear-gradient(135deg, #FF5B00, #FF8C00)"
                        : "#D1D5DB",
                      cursor: lockSecondsLeft > 0 ? "pointer" : "not-allowed",
                    }}
                    data-testid="button-confirm-payment"
                  >
                    {vippsInitiate.isPending || confirmBooking.isPending ? (
                      <><Loader2 size={15} className="animate-spin" /> Kobler til Vipps…</>
                    ) : (
                      <>
                        <span className="text-lg leading-none">🅥</span>
                        Betal med Vipps · {reservedBooking.totalPris.toLocaleString("nb-NO")} kr
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => { setReservedBooking(null); setVippsPolling(false); }}
                  className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Avbryt reservasjon
                </button>

                {confirmBooking.isError && (
                  <div className="mt-3 px-3 py-2 rounded-xl text-xs text-red-600 text-center"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <AlertCircle size={12} className="inline mr-1" />
                    Bekreftelse feilet. Prøv igjen eller kontakt support.
                  </div>
                )}
              </div>
            ) : subscribed ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fast plass aktivert!</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">{space.tittel}</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">Plassen er nå alltid reservert til deg.</p>
                <div className="px-4 py-3 rounded-xl mb-4" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <p className="text-xs text-gray-500 mb-1">Månedlig betaling</p>
                  <p className="text-2xl font-bold" style={{ color: "#7C3AED" }}>
                    {(space.abonnementsPris ?? 0).toLocaleString("nb-NO")} kr/mnd
                  </p>
                </div>
                <button
                  onClick={() => { onClose(); setLocation("/mine-bookinger"); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #5B21B6, #7C3AED)" }}
                >
                  Se mine abonnementer
                </button>
              </div>
            ) : waitlisted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">🔔</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Du er på ventelisten!</h3>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-semibold">{space.tittel}</span>
                </p>
                <p className="text-sm text-gray-500 mb-4">Vi varsler deg straks plassen er ledig — du har 30 min eksklusiv booking-rett.</p>
                <div
                  className="px-4 py-3 rounded-xl mb-4"
                  style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
                >
                  <p className="text-xs text-gray-500 mb-1">Du er nå registrert</p>
                  <p className="text-lg font-bold" style={{ color: "#F59E0B" }}>
                    Venteliste aktiv 🔔
                  </p>
                </div>
                <button
                  onClick={() => { onClose(); setLocation("/mine-bookinger"); }}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)" }}
                >
                  Se min venteliste
                </button>
              </div>
            ) : (
              <>
                {/* Title */}
                <h2 className="text-lg font-bold text-gray-900 mb-0.5" data-testid="text-modal-title">{space.tittel}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <span>{space.adresse}, {space.by}</span>
                  {space.snittRangering && (
                    <span className="flex items-center gap-0.5 text-amber-500 font-semibold">
                      <Star size={12} fill="currentColor" /> {space.snittRangering.toFixed(1)}
                    </span>
                  )}
                </div>

                {/* Mode toggle — always shown */}
                <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
                  <button
                    onClick={() => setActiveMode("booking")}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={activeMode === "booking"
                      ? { background: "#00B4D8", color: "#fff", boxShadow: "0 1px 4px rgba(0,180,216,0.4)" }
                      : { color: "#64748B" }}
                  >
                    Enkeltbooking
                  </button>
                  {hasFastPlass && (
                    <button
                      onClick={() => setActiveMode("abonnement")}
                      className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={activeMode === "abonnement"
                        ? { background: "#7C3AED", color: "#fff", boxShadow: "0 1px 4px rgba(124,58,237,0.4)" }
                        : { color: "#64748B" }}
                      data-testid="tab-abonnement"
                    >
                      📅 Fast plass
                    </button>
                  )}
                  <button
                    onClick={() => setActiveMode("venteliste")}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={activeMode === "venteliste"
                      ? { background: "#F59E0B", color: "#fff", boxShadow: "0 1px 4px rgba(245,158,11,0.4)" }
                      : { color: "#64748B" }}
                    data-testid="tab-venteliste"
                  >
                    🔔 Venteliste
                  </button>
                </div>

                {/* Period tabs — booking mode only */}
                {activeMode === "booking" && availablePeriods.length > 0 && (
                  <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
                    {availablePeriods.map(p => (
                      <button
                        key={p.key}
                        onClick={() => setSelectedPeriod(p.key)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={
                          selectedPeriod === p.key
                            ? { background: "#00B4D8", color: "#fff", boxShadow: "0 1px 4px rgba(0,180,216,0.4)" }
                            : { color: "#64748B" }
                        }
                        data-testid={`period-tab-${p.key}`}
                      >
                        {p.label}
                        <span className="block text-[10px] opacity-70">{prices?.[p.key]?.toLocaleString("nb-NO")} kr{p.suffix}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Period-specific inputs — booking mode only */}
                {activeMode === "booking" && (
                  <div className="mb-4">
                    {renderInputs()}
                  </div>
                )}

                {/* Subscription UI — abonnement mode only */}
                {activeMode === "abonnement" && (
                  <div className="space-y-4 mb-4">
                    <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                      <p className="text-sm font-bold mb-0.5" style={{ color: "#7C3AED" }}>📅 Fast plass — alltid reservert</p>
                      <p className="text-xs text-gray-500">Plassen er eksklusivt din. Ingen konkurranse om plassen.</p>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Oppstartsdato</label>
                      <input
                        type="date"
                        value={abStartDate}
                        min={toDateStr(new Date())}
                        onChange={e => setAbStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 border border-gray-200 focus:outline-none"
                        style={{ borderColor: "#C4B5FD" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Bindingstid</label>
                      <select
                        value={abBindingstid}
                        onChange={e => setAbBindingstid(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 border border-gray-200 focus:outline-none"
                        style={{ borderColor: "#C4B5FD" }}
                      >
                        {[1, 3, 6, 12].filter(m => m >= (space.minBindingstid ?? 1)).map(m => (
                          <option key={m} value={m}>{m} {m === 1 ? "måned" : "måneder"}</option>
                        ))}
                      </select>
                      {(space.minBindingstid ?? 1) > 1 && (
                        <p className="text-xs text-gray-400 mt-1">Min. bindingstid: {space.minBindingstid} måneder</p>
                      )}
                    </div>
                    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
                      <div className="px-3 pt-2.5 pb-1.5" style={{ background: "#F8FAFC" }}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Prisdetaljer</p>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-gray-500">Leiepris</span>
                          <span className="font-semibold text-gray-800">{(space.abonnementsPris ?? 0).toLocaleString("nb-NO")} kr/mnd</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1"><Shield size={11} /> Serviceavgift 8%</span>
                          <span className="text-gray-700">+{Math.round((space.abonnementsPris ?? 0) * 0.08).toLocaleString("nb-NO")} kr/mnd</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center px-3 py-2.5" style={{ background: "#EFF6FF", borderTop: "1px solid #DBEAFE" }}>
                        <span className="font-bold text-gray-800 text-sm">Du betaler totalt</span>
                        <span className="font-bold text-gray-900 text-base">{Math.round((space.abonnementsPris ?? 0) * 1.08).toLocaleString("nb-NO")} kr/mnd</span>
                      </div>
                      <div className="flex justify-between text-xs px-3 py-1.5" style={{ background: "#F9FAFB", borderTop: "1px solid #F3F4F6" }}>
                        <span className="text-gray-400">Deretter automatisk månedlig</span>
                        <span className="font-medium" style={{ color: "#7C3AED" }}>{(space.abonnementsPris ?? 0).toLocaleString("nb-NO")} kr/mnd</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs text-gray-500" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid #E2E8F0" }}>
                      <Calendar size={12} className="mt-0.5 shrink-0 text-gray-400" />
                      <span>1 måneds oppsigelsestid. Du kan si opp fra Min side.</span>
                    </div>
                  </div>
                )}

                {/* Venteliste UI — venteliste mode only */}
                {activeMode === "venteliste" && (
                  <div className="space-y-4 mb-4">
                    <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <p className="text-sm font-bold mb-0.5" style={{ color: "#F59E0B" }}>🔔 Venteliste — få varsling først</p>
                      <p className="text-xs text-gray-500">Meld deg på og få beskjed straks plassen er ledig. Du har 30 minutters eksklusiv booking-rett.</p>
                    </div>
                    {(space.antallVenter ?? 0) > 0 && (
                      <p className="text-xs text-center text-gray-400">
                        <span className="font-semibold text-amber-500">{space.antallVenter} andre</span> venter allerede på denne plassen
                      </p>
                    )}
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Ønsket periode</label>
                      <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: "#F1F5F9" }}>
                        {[
                          { key: "time", label: "Time" },
                          { key: "dag", label: "Dag" },
                          { key: "uke", label: "Uke" },
                          { key: "maaned", label: "Mnd" },
                        ].map(p => (
                          <button
                            key={p.key}
                            onClick={() => setWlPeriodeType(p.key)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={wlPeriodeType === p.key
                              ? { background: "#F59E0B", color: "#fff" }
                              : { color: "#64748B" }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Ønsket dato</label>
                      <input
                        type="date"
                        value={wlDato}
                        min={toDateStr(new Date())}
                        onChange={e => setWlDato(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl text-sm text-gray-800 border focus:outline-none"
                        style={{ borderColor: "#FCD34D" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1 tracking-wide">Maks pris (valgfritt)</label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="Ingen grense"
                          value={wlMaksPris}
                          onChange={e => setWlMaksPris(e.target.value)}
                          className="w-full px-3 py-2 pr-8 rounded-xl text-sm text-gray-800 border focus:outline-none"
                          style={{ borderColor: "#FCD34D" }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">kr</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs text-gray-500" style={{ background: "rgba(0,0,0,0.03)", border: "1px solid #E2E8F0" }}>
                      <Bell size={11} className="mt-0.5 shrink-0 text-amber-400" />
                      <span>Du varsles umiddelbart. 30 minutters eksklusiv booking-rett før neste på listen får tilbud.</span>
                    </div>
                  </div>
                )}

                {/* Validation error — booking mode only */}
                {activeMode === "booking" && booking.error && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 mb-3"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                    <AlertCircle size={14} />
                    {booking.error}
                  </div>
                )}

                {/* Price breakdown — booking mode only */}
                {activeMode === "booking" && (
                  <div className="rounded-xl mb-4 overflow-hidden" style={{ border: "1px solid #E2E8F0" }}>
                    <div className="px-3 pt-2.5 pb-1.5" style={{ background: "#F8FAFC" }}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Prisdetaljer</p>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-500">
                          Leiepris{booking.units > 1 ? ` (${booking.units} ${booking.unitSuffix})` : ""}
                        </span>
                        <span className="font-semibold text-gray-800">{booking.totalBase.toLocaleString("nb-NO")} kr</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-1">
                          <Shield size={11} /> Serviceavgift 8%
                        </span>
                        <span className="text-gray-700">+{booking.fee.toLocaleString("nb-NO")} kr</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-3 py-2.5" style={{ background: "#EFF6FF", borderTop: "1px solid #DBEAFE" }}>
                      <span className="font-bold text-gray-800 text-sm">Du betaler totalt</span>
                      <span className="font-bold text-gray-900 text-base">{booking.total.toLocaleString("nb-NO")} kr</span>
                    </div>
                    <div className="flex justify-between text-xs px-3 py-1.5" style={{ background: "#F0FDF4", borderTop: "1px solid #DCFCE7" }}>
                      <span className="text-gray-400">Utleier mottar</span>
                      <span className="text-green-600 font-medium">{utleierMottar.toLocaleString("nb-NO")} kr</span>
                    </div>
                  </div>
                )}

                {/* Dates summary — booking mode only */}
                {activeMode === "booking" && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-gray-600 mb-4"
                    style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)" }}>
                    <Clock size={12} className="text-[#00B4D8] shrink-0" />
                    <span>{fmtDateTime(booking.startDt)}</span>
                    <span className="text-gray-400">→</span>
                    <span>{fmtDateTime(booking.endDt)}</span>
                  </div>
                )}

                {/* CTA */}
                {activeMode === "booking" ? (
                  <button
                    onClick={handleBook}
                    disabled={!booking.valid || createBooking.isPending}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                    style={{
                      background: booking.valid ? "linear-gradient(135deg, #1B4F8C, #00B4D8)" : "#D1D5DB",
                      cursor: booking.valid ? "pointer" : "not-allowed",
                    }}
                    data-testid="button-confirm-booking"
                  >
                    {createBooking.isPending ? "Behandler…" : !user ? "Logg inn for å booke" : `Book nå · ${booking.total.toLocaleString("nb-NO")} kr`}
                  </button>
                ) : activeMode === "abonnement" ? (
                  <button
                    onClick={handleSubscribe}
                    disabled={createSubscription.isPending || !abStartDate}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                    style={{ background: "linear-gradient(135deg, #5B21B6, #7C3AED)" }}
                    data-testid="button-confirm-subscription"
                  >
                    {createSubscription.isPending ? "Aktiverer…" : !user ? "Logg inn for å abonnere" : `Aktiver Fast plass · ${Math.round((space.abonnementsPris ?? 0) * 1.08).toLocaleString("nb-NO")} kr`}
                  </button>
                ) : (
                  <button
                    onClick={handleJoinWaitlist}
                    disabled={joinWaitlist.isPending || !wlDato}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                    style={{
                      background: joinWaitlist.isPending || !wlDato ? "#D1D5DB" : "linear-gradient(135deg, #D97706, #F59E0B)",
                      cursor: joinWaitlist.isPending || !wlDato ? "not-allowed" : "pointer",
                    }}
                    data-testid="button-join-waitlist"
                  >
                    {joinWaitlist.isPending ? "Melder på…" : !user ? "Logg inn for å stå på venteliste" : "🔔 Meld meg på venteliste"}
                  </button>
                )}

                {/* Owner info */}
                {space.eierNavn && (
                  <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
                    <Calendar size={11} /> Utleier: {space.eierNavn}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
