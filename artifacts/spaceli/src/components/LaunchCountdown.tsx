import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Users, CheckCircle, Loader2 } from "lucide-react";

const LANSERINGSDATO = new Date("2026-06-23T08:00:00+02:00");

function getTimeLeft() {
  const diff = LANSERINGSDATO.getTime() - Date.now();
  if (diff <= 0) return { dager: 0, timer: 0, minutter: 0, sekunder: 0, ferdig: true };
  const dager = Math.floor(diff / (1000 * 60 * 60 * 24));
  const timer = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutter = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const sekunder = Math.floor((diff % (1000 * 60)) / 1000);
  return { dager, timer, minutter, sekunder, ferdig: false };
}

function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative flex items-center justify-center rounded-2xl text-3xl sm:text-4xl font-bold tabular-nums"
        style={{
          width: 72,
          height: 72,
          background: "rgba(0,180,216,0.10)",
          border: "1px solid rgba(0,180,216,0.25)",
          color: "#fff",
          fontFamily: "'Syne', sans-serif",
          boxShadow: "0 4px 24px rgba(0,180,216,0.08)",
        }}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: -18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 18, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1.5 text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>
        {label}
      </span>
    </div>
  );
}

export default function LaunchCountdown() {
  const [tidLeft, setTidLeft] = useState(getTimeLeft);
  const [epost, setEpost] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "allerede" | "feil">("idle");
  const [antall, setAntall] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Countdown tick
  useEffect(() => {
    const id = setInterval(() => setTidLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch waitlist count
  async function fetchAntall() {
    try {
      const res = await fetch("/api/lanseringsliste/antall");
      if (res.ok) {
        const data = await res.json() as { antall: number };
        setAntall(data.antall);
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    void fetchAntall();
    const id = setInterval(fetchAntall, 30_000);
    return () => clearInterval(id);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!epost.trim() || !epost.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/lanseringsliste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epost: epost.trim() }),
      });
      const data = await res.json() as { ok?: boolean; antall?: number; error?: string };
      if (res.status === 201) {
        setStatus("ok");
        if (data.antall !== undefined) setAntall(data.antall);
      } else if (res.status === 409) {
        setStatus("allerede");
        if (data.antall !== undefined) setAntall(data.antall);
      } else {
        setStatus("feil");
      }
    } catch {
      setStatus("feil");
    }
  }

  if (tidLeft.ferdig) return null;

  return (
    <section className="relative py-10 px-4 overflow-hidden">
      {/* Subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,180,216,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-2xl mx-auto relative z-10 text-center">
        {/* Label */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
            style={{
              background: "rgba(0,180,216,0.10)",
              border: "1px solid rgba(0,180,216,0.25)",
              color: "#00B4D8",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#00B4D8" }} />
            Lanseres 23. juni 2026
          </span>
        </div>

        {/* Countdown digits */}
        <div className="flex items-end justify-center gap-3 sm:gap-5 mb-8">
          <CountUnit value={tidLeft.dager} label="dager" />
          <span className="text-3xl font-bold pb-7" style={{ color: "rgba(0,180,216,0.5)" }}>:</span>
          <CountUnit value={tidLeft.timer} label="timer" />
          <span className="text-3xl font-bold pb-7" style={{ color: "rgba(0,180,216,0.5)" }}>:</span>
          <CountUnit value={tidLeft.minutter} label="min" />
          <span className="text-3xl font-bold pb-7" style={{ color: "rgba(0,180,216,0.5)" }}>:</span>
          <CountUnit value={tidLeft.sekunder} label="sek" />
        </div>

        {/* Email form */}
        <AnimatePresence mode="wait">
          {status === "ok" ? (
            <motion.div
              key="ok"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2 py-4"
            >
              <CheckCircle size={28} style={{ color: "#10B981" }} />
              <p className="text-white font-semibold">Du er på lista!</p>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                Vi varsler deg på e-post når Ledi åpner.
              </p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
            >
              <input
                ref={inputRef}
                type="email"
                value={epost}
                onChange={e => setEpost(e.target.value)}
                placeholder="din@epost.no"
                disabled={status === "loading"}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border:
                    status === "feil"
                      ? "1px solid rgba(239,68,68,0.6)"
                      : status === "allerede"
                        ? "1px solid rgba(245,158,11,0.5)"
                        : "1px solid rgba(255,255,255,0.12)",
                }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shrink-0"
                style={{
                  background: "linear-gradient(135deg, #1B4F8C, #00B4D8)",
                  opacity: status === "loading" ? 0.7 : 1,
                }}
              >
                {status === "loading" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Bell size={15} />
                )}
                Varsle meg
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Messages under form */}
        <AnimatePresence>
          {status === "allerede" && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs mt-2"
              style={{ color: "#F59E0B" }}
            >
              Denne e-posten er allerede registrert.
            </motion.p>
          )}
          {status === "feil" && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs mt-2"
              style={{ color: "#EF4444" }}
            >
              Noe gikk galt. Prøv igjen.
            </motion.p>
          )}
        </AnimatePresence>

        {/* Live count */}
        {antall !== null && antall > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-1.5 mt-4"
          >
            <Users size={13} style={{ color: "rgba(255,255,255,0.35)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
              <span className="font-bold text-white/70">{antall.toLocaleString("nb-NO")}</span> er allerede på lista
            </span>
          </motion.div>
        )}
      </div>
    </section>
  );
}
