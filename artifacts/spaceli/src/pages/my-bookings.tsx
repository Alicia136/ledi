import { useLocation } from "wouter";
import { Calendar, MapPin, X, LockOpen, DoorOpen, Loader2, KeyRound, FileText, Star, Mail, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import ReviewModal from "@/components/ReviewModal";
import { useResendVerification } from "@workspace/api-client-react";
import {
  useListBookings, useCancelBooking, getListBookingsQueryKey,
  useListSubscriptions, useCancelSubscription, getListSubscriptionsQueryKey,
  useListWaitlist, useLeaveWaitlist, getListWaitlistQueryKey,
  useUnlocOpen, useTelemetricsOpen,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

function CancelCountdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState(() => new Date(deadline).getTime() - Date.now());
  useEffect(() => {
    const id = setInterval(() => setRemaining(new Date(deadline).getTime() - Date.now()), 1000);
    return () => clearInterval(id);
  }, [deadline]);
  if (remaining <= 0) return null;
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  const fmt = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-1.5 text-xs mb-3 px-3 py-2 rounded-xl" style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)", color: "rgba(255,255,255,0.6)" }}>
      <Clock size={12} style={{ color: "#00B4D8" }} />
      <span>Gratis avbestilling i: </span>
      <span className="font-bold tabular-nums" style={{ color: "#00B4D8" }}>{fmt(h)}:{fmt(m)}:{fmt(s)}</span>
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  confirmed: { label: "Bekreftet", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  pending: { label: "Venter", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  cancelled: { label: "Kansellert", color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  completed: { label: "Fullført", color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

const PERIOD_LABELS: Record<string, string> = {
  time: "Time",
  dag: "Dag",
  uke: "Uke",
  maaned: "Måned",
};

export default function MyBookings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [unlocStatus, setUnlocStatus] = useState<Record<number, { loading: boolean; melding?: string; error?: string }>>({});
  const [telematicsStatus, setTelematicsStatus] = useState<Record<number, { loading: boolean; melding?: string; error?: string }>>({});
  const [reviewModal, setReviewModal] = useState<{ bookingId: number; plassId: number; plassTittel: string } | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const resendVerification = useResendVerification();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookings, isLoading } = useListBookings({ role: "leietaker" }, { query: { enabled: !!user } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subscriptions, isLoading: subsLoading } = useListSubscriptions({ role: "leietaker" }, { query: { enabled: !!user } as any });
  const cancelBooking = useCancelBooking();
  const cancelSubscription = useCancelSubscription();
  const leaveWaitlist = useLeaveWaitlist();
  const unlocOpen = useUnlocOpen();
  const telemetricsOpen = useTelemetricsOpen();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: waitlistEntries, isLoading: wlLoading } = useListWaitlist({ role: "leietaker" }, { query: { enabled: !!user } as any });

  if (!user) {
    setLocation("/logg-inn");
    return null;
  }

  const handleUnlocOpen = (bookingId: number) => {
    setUnlocStatus(prev => ({ ...prev, [bookingId]: { loading: true } }));
    unlocOpen.mutate(
      { data: { bookingId } },
      {
        onSuccess: (data) => {
          setUnlocStatus(prev => ({ ...prev, [bookingId]: { loading: false, melding: data.melding } }));
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Kunne ikke åpne låsen";
          setUnlocStatus(prev => ({ ...prev, [bookingId]: { loading: false, error: msg } }));
        },
      }
    );
  };

  const handleTelemetricsOpen = (bookingId: number) => {
    setTelematicsStatus(prev => ({ ...prev, [bookingId]: { loading: true } }));
    telemetricsOpen.mutate(
      { data: { bookingId } },
      {
        onSuccess: (data) => {
          setTelematicsStatus(prev => ({ ...prev, [bookingId]: { loading: false, melding: data.melding } }));
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Kunne ikke åpne porten";
          setTelematicsStatus(prev => ({ ...prev, [bookingId]: { loading: false, error: msg } }));
        },
      }
    );
  };

  const handleCancel = (id: number) => {
    if (!confirm("Er du sikker på at du vil avbestille denne bookingen?")) return;
    cancelBooking.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey() });
        },
      }
    );
  };

  const handleCancelSub = (id: number) => {
    if (!confirm("Er du sikker på at du vil si opp abonnementet? 1 måneds oppsigelsestid gjelder.")) return;
    cancelSubscription.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
        },
      }
    );
  };

  const handleLeaveWaitlist = (id: number) => {
    if (!confirm("Meld deg av ventelisten?")) return;
    leaveWaitlist.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWaitlistQueryKey() });
        },
      }
    );
  };

  return (
    <>
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
          Mine bookinger
        </h1>

        {/* Email verification banner */}
        {user && !user.emailVerifisert && (
          <div
            className="mb-6 rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}
          >
            <Mail size={16} className="mt-0.5 shrink-0" style={{ color: "#F59E0B" }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" style={{ color: "#F59E0B" }}>Bekreft e-postadressen din</p>
              <p className="text-xs text-white/50 mt-0.5">Vi har sendt en bekreftelseslenke til {user.epost}. Sjekk innboksen din.</p>
            </div>
            {verificationSent ? (
              <span className="text-xs text-white/40 shrink-0">Sendt ✓</span>
            ) : (
              <button
                onClick={() => resendVerification.mutate(undefined, { onSuccess: () => setVerificationSent(true) })}
                disabled={resendVerification.isPending}
                className="text-xs font-semibold shrink-0 disabled:opacity-50"
                style={{ color: "#F59E0B" }}
              >
                {resendVerification.isPending ? "Sender..." : "Send ny"}
              </button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        ) : (bookings ?? []).length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Calendar size={40} className="mx-auto mb-4 text-white/20" />
            <p className="text-white/40 mb-4">Du har ingen bookinger ennå</p>
            <a href="/" className="text-sm font-semibold" style={{ color: "#00B4D8" }}>
              Finn en plass
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {(bookings ?? []).map((booking) => {
              const statusConfig = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
              const startDate = booking.startDato ? new Date(booking.startDato).toLocaleDateString("nb-NO") : "–";
              const endDate = booking.sluttDato ? new Date(booking.sluttDato).toLocaleDateString("nb-NO") : "–";

              return (
                <div
                  key={booking.id}
                  className="rounded-2xl p-5"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  data-testid={`booking-card-${booking.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white mb-0.5">{booking.spaseTittel ?? "Plass"}</h3>
                      <p className="text-xs text-white/50 flex items-center gap-1">
                        <MapPin size={11} /> {booking.spaseAdresse ?? "–"}
                      </p>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ color: statusConfig.color, background: statusConfig.bg }}
                      data-testid={`status-booking-${booking.id}`}
                    >
                      {statusConfig.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-white/40 mb-0.5">Fra</p>
                      <p className="text-xs font-semibold text-white">{startDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-0.5">Til</p>
                      <p className="text-xs font-semibold text-white">{endDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-0.5">Periode</p>
                      <p className="text-xs font-semibold text-white">{PERIOD_LABELS[booking.periodetype] ?? booking.periodetype}</p>
                    </div>
                  </div>

                  <div
                    className="flex items-center justify-between p-3 rounded-xl mb-3"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div className="text-xs text-white/50">Totalt betalt</div>
                    <div className="text-sm font-bold text-white" data-testid={`price-booking-${booking.id}`}>
                      {Math.round(booking.totalPris ?? 0).toLocaleString("nb-NO")} kr
                    </div>
                  </div>

                  {booking.status === "confirmed" && (() => {
                    const bk = booking as {
                      tilgangskode?: string | null;
                      spaseHarUnloc?: boolean;
                      spaseHarTelemetrics?: boolean;
                    };
                    const kode = bk.tilgangskode;
                    const hasAnyAccess = kode || bk.spaseHarUnloc || bk.spaseHarTelemetrics;
                    if (!hasAnyAccess) return null;

                    const unlocSt = unlocStatus[booking.id];
                    const tlmSt = telematicsStatus[booking.id];

                    return (
                      <div
                        className="mb-3 rounded-2xl p-3"
                        style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)" }}
                      >
                        {/* Digital access code */}
                        {kode && (
                          <div className="mb-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: "#00B4D8" }}>
                              <KeyRound size={10} /> Digital tilgangskode
                            </p>
                            <div
                              className="flex items-center justify-between px-4 py-3 rounded-xl"
                              style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,180,216,0.3)" }}
                            >
                              <span
                                className="font-black tracking-[0.3em] text-2xl select-all"
                                style={{ color: "#00FFD0", fontFamily: "'DM Mono', 'Courier New', monospace", textShadow: "0 0 20px rgba(0,255,208,0.4)" }}
                              >
                                {kode}
                              </span>
                              <span className="text-[10px] text-white/30">Vis ved innsjekk</span>
                            </div>
                          </div>
                        )}

                        {/* Unloc smart lock button */}
                        {bk.spaseHarUnloc && (
                          <div className="mb-2">
                            <button
                              onClick={() => handleUnlocOpen(booking.id)}
                              disabled={unlocSt?.loading}
                              className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                              style={{ background: "linear-gradient(135deg, #0F766E, #00B4D8)", color: "#fff" }}
                              data-testid={`button-unloc-open-${booking.id}`}
                            >
                              {unlocSt?.loading
                                ? <><Loader2 size={13} className="animate-spin" /> Åpner lås...</>
                                : <><LockOpen size={13} /> Åpne smartlåsen (Unloc)</>}
                            </button>
                            {unlocSt?.melding && (
                              <div className="mt-1.5 p-2.5 rounded-xl text-xs" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}>
                                ✅ {unlocSt.melding}
                              </div>
                            )}
                            {unlocSt?.error && (
                              <div className="mt-1.5 p-2.5 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                ⚠️ {unlocSt.error}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Telemetrics gate button */}
                        {bk.spaseHarTelemetrics && (
                          <div>
                            <button
                              onClick={() => handleTelemetricsOpen(booking.id)}
                              disabled={tlmSt?.loading}
                              className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70"
                              style={{ background: "linear-gradient(135deg, #5B21B6, #7C3AED)", color: "#fff" }}
                              data-testid={`button-telemetrics-open-${booking.id}`}
                            >
                              {tlmSt?.loading
                                ? <><Loader2 size={13} className="animate-spin" /> Åpner port...</>
                                : <><DoorOpen size={13} /> Åpne garasjeporten (Telemetrics)</>}
                            </button>
                            {tlmSt?.melding && (
                              <div className="mt-1.5 p-2.5 rounded-xl text-xs" style={{ background: "rgba(124,58,237,0.1)", color: "#A78BFA", border: "1px solid rgba(124,58,237,0.2)" }}>
                                🚗 {tlmSt.melding}
                              </div>
                            )}
                            {tlmSt?.error && (
                              <div className="mt-1.5 p-2.5 rounded-xl text-xs" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                                ⚠️ {tlmSt.error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {booking.status === "confirmed" && (() => {
                    const bkExt = booking as { payoutStatus?: string | null; utbetalingTidspunkt?: string | null };
                    const deadline = bkExt.utbetalingTidspunkt ? new Date(bkExt.utbetalingTidspunkt) : null;
                    const canCancel = bkExt.payoutStatus !== "utbetalt" && deadline && deadline > new Date();
                    const paidOut = bkExt.payoutStatus === "utbetalt";
                    return (
                      <>
                        {canCancel && deadline && (
                          <CancelCountdown deadline={bkExt.utbetalingTidspunkt!} />
                        )}
                        {!canCancel && !paidOut && (
                          <div className="flex items-center gap-1.5 text-xs mb-3 px-3 py-2 rounded-xl" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)", color: "rgba(255,255,255,0.45)" }}>
                            <X size={12} style={{ color: "#EF4444" }} />
                            Avbestilling er ikke lenger mulig
                          </div>
                        )}
                        <div className="flex gap-2">
                          <a
                            href={`/kontrakt/${booking.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
                            style={{ color: "#00B4D8", background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.2)" }}
                          >
                            <FileText size={13} /> Last ned kontrakt
                          </a>
                          {canCancel && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancelBooking.isPending}
                              className="flex-1 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                              style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                              data-testid={`button-cancel-${booking.id}`}
                            >
                              <X size={13} /> Avbestill gratis
                            </button>
                          )}
                        </div>
                      </>
                    );
                  })()}

                  {booking.status === "completed" && (booking as { plassId?: number }).plassId && (
                    <button
                      onClick={() => setReviewModal({
                        bookingId: booking.id,
                        plassId: (booking as { plassId: number }).plassId,
                        plassTittel: booking.spaseTittel ?? "Plass",
                      })}
                      className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-80"
                      style={{ color: "#F59E0B", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
                    >
                      <Star size={13} /> Gi anmeldelse
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {/* Waitlist section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Min venteliste
          </h2>
          {wlLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
              ))}
            </div>
          ) : (waitlistEntries ?? []).filter(e => e.status === "venter" || e.status === "varslet").length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-white/40 text-sm">Ingen aktive ventelisteoppføringer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(waitlistEntries ?? []).filter(e => e.status === "venter" || e.status === "varslet").map(entry => {
                const isVarslet = entry.status === "varslet";
                const periodeLabel: Record<string, string> = { time: "Time", dag: "Dag", uke: "Uke", maaned: "Måned" };
                const regDate = entry.registrertDato ? new Date(entry.registrertDato).toLocaleDateString("nb-NO") : "–";
                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl p-4"
                    style={{ background: "rgba(245,158,11,0.05)", border: `1px solid ${isVarslet ? "rgba(245,158,11,0.5)" : "rgba(245,158,11,0.15)"}` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-white">{entry.spaseTittel ?? "Plass"}</h3>
                        <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {entry.spaseAdresse ?? "–"}{entry.spaseBy ? `, ${entry.spaseBy}` : ""}
                        </p>
                      </div>
                      {isVarslet ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0" style={{ color: "#F59E0B", background: "rgba(245,158,11,0.15)" }}>
                          🔔 Ledig nå!
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 text-white/40" style={{ background: "rgba(255,255,255,0.06)" }}>
                          Pos. {entry.posisjon}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-3 text-xs text-white/50">
                      <span>📅 {periodeLabel[entry.periodeType] ?? entry.periodeType}</span>
                      <span>Ønsket: {entry.oensketDato}</span>
                      {entry.maksPris && <span>Maks: {entry.maksPris.toLocaleString("nb-NO")} kr</span>}
                      <span>Meldt på: {regDate}</span>
                    </div>
                    <button
                      onClick={() => handleLeaveWaitlist(entry.id)}
                      disabled={leaveWaitlist.isPending}
                      className="text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
                      style={{ color: "#EF4444" }}
                    >
                      <X size={12} /> Meld deg av ventelisten
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscriptions section */}
        <div className="mt-10">
          <h2 className="text-xl font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Mine abonnementer
          </h2>
          {subsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
              ))}
            </div>
          ) : (subscriptions ?? []).length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <p className="text-white/40 text-sm">Ingen aktive abonnementer</p>
              <a href="/" className="text-sm font-semibold mt-2 inline-block" style={{ color: "#7C3AED" }}>
                Finn en fast plass
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {(subscriptions ?? []).map(sub => {
                const isAktiv = sub.status === "aktiv";
                const statusColor = isAktiv ? "#10B981" : "#EF4444";
                const statusBg = isAktiv ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)";
                const statusLabel = isAktiv ? "Aktiv" : "Avsluttet";
                const startDate = sub.startDato ? new Date(sub.startDato).toLocaleDateString("nb-NO") : "–";
                const nesteBetaling = sub.nesteBetaling ? new Date(sub.nesteBetaling).toLocaleDateString("nb-NO") : "–";

                return (
                  <div
                    key={sub.id}
                    className="rounded-2xl p-5"
                    style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)" }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-white/40 uppercase tracking-wide">📅 Fast plass</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{sub.spaseTittel ?? "Plass"}</h3>
                        <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {sub.spaseAdresse ?? "–"}{sub.spaseBy ? `, ${sub.spaseBy}` : ""}
                        </p>
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold shrink-0"
                        style={{ color: statusColor, background: statusBg }}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-white/40 mb-0.5">Startdato</p>
                        <p className="text-xs font-semibold text-white">{startDate}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-0.5">Bindingstid</p>
                        <p className="text-xs font-semibold text-white">{sub.bindingstid} mnd</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/40 mb-0.5">Neste betaling</p>
                        <p className="text-xs font-semibold text-white">{nesteBetaling}</p>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between p-3 rounded-xl mb-3"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div className="text-xs text-white/50">Månedlig leie</div>
                      <div className="text-sm font-bold" style={{ color: "#A78BFA" }}>
                        {Math.round(sub.maanedsPris).toLocaleString("nb-NO")} kr/mnd
                      </div>
                    </div>

                    {isAktiv && (
                      <button
                        onClick={() => handleCancelSub(sub.id)}
                        disabled={cancelSubscription.isPending}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ color: "#EF4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
                      >
                        <X size={13} /> Si opp abonnement
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>

    {reviewModal && (
      <ReviewModal
        bookingId={reviewModal.bookingId}
        plassId={reviewModal.plassId}
        plassTittel={reviewModal.plassTittel}
        onClose={() => setReviewModal(null)}
      />
    )}
    </>
  );
}
