import { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, Navigation, Satellite, Wifi } from "lucide-react";
import { useSpaceSocket, type SpaceStatus, type ActivityEvent } from "@/lib/useSpaceSocket";

const CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø", "Hele Norge"];

const PINS = [
  { x: 52, y: 48, type: "parking",  label: "190 kr/t",    city: "Oslo",       spaceId: 1 },
  { x: 47, y: 44, type: "storage",  label: "1 600 kr/mnd",city: "Oslo",       spaceId: 2 },
  { x: 55, y: 52, type: "business", label: "8 500 kr/mnd",city: "Oslo",       spaceId: 3 },
  { x: 44, y: 50, type: "smart",    label: "3 200 kr/mnd",city: "Oslo",       spaceId: 4 },
  { x: 50, y: 46, type: "henger",   label: "1 200 kr/mnd",city: "Oslo",       spaceId: 20 },
  { x: 36, y: 58, type: "parking",  label: "220 kr/dag",  city: "Bergen",     spaceId: 5 },
  { x: 60, y: 34, type: "smart",    label: "1 400 kr/mnd",city: "Trondheim",  spaceId: 6 },
  { x: 35, y: 68, type: "parking",  label: "190 kr/dag",  city: "Stavanger",  spaceId: 7 },
  { x: 62, y: 18, type: "smart",    label: "2 000 kr/mnd",city: "Tromsø",     spaceId: 8 },
  { x: 53, y: 43, type: "henger",   label: "800 kr/mnd",  city: "Oslo",       spaceId: 21 },
];

const TYPE_COLORS: Record<string, string> = {
  parking:  "#00B4D8",
  storage:  "#F59E0B",
  business: "#10B981",
  smart:    "#8B5CF6",
  henger:   "#B45309",
  baatplass:"#1D4ED8",
  camping:  "#16A34A",
  ev:       "#10B981",
};

const STATUS_PIN_COLORS: Partial<Record<SpaceStatus, string>> = {
  reserved: "#F59E0B",
  booked:   "#EF4444",
  closed:   "#6B7280",
};

const STATUS_LABELS: Record<SpaceStatus, string> = {
  available: "Ledig",
  reserved:  "Betaling pågår",
  booked:    "Opptatt",
  closed:    "Stengt",
};

const STATUS_EMOJIS: Record<SpaceStatus, string> = {
  available: "🟢",
  reserved:  "🟡",
  booked:    "🔴",
  closed:    "⚫",
};

const ACTIVITY_LABELS: Record<ActivityEvent["action"], { text: string; color: string; emoji: string }> = {
  reserved: { text: "Betaling pågår",  color: "#F59E0B", emoji: "🟡" },
  booked:   { text: "Nettopp booket",  color: "#EF4444", emoji: "🔴" },
  released: { text: "Ledig igjen",     color: "#10B981", emoji: "🟢" },
};

interface Props {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

// Animated number that counts smoothly to its target
function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) return;
    const diff = value - prev.current;
    const steps = Math.min(Math.abs(diff), 8);
    const step = diff / steps;
    let current = prev.current;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      current += step;
      setDisplay(Math.round(current));
      if (i >= steps) {
        clearInterval(interval);
        setDisplay(value);
        prev.current = value;
      }
    }, 40);
    return () => clearInterval(interval);
  }, [value]);

  return <>{display.toLocaleString("nb-NO")}</>;
}

export default function MapPlaceholder({ selectedCity, onCityChange }: Props) {
  const [zoom, setZoom] = useState(1);
  const { statusMap, connected, cityStats, recentActivity } = useSpaceSocket();

  const visiblePins = selectedCity === "Hele Norge"
    ? PINS
    : PINS.filter(p => p.city === selectedCity);

  const ledigCount = cityStats[selectedCity] ?? cityStats["Hele Norge"] ?? 0;

  // Flash "changed" class on count when it ticks
  const [countFlash, setCountFlash] = useState(false);
  const prevCount = useRef(ledigCount);
  useEffect(() => {
    if (ledigCount === prevCount.current) return;
    prevCount.current = ledigCount;
    setCountFlash(true);
    const t = setTimeout(() => setCountFlash(false), 400);
    return () => clearTimeout(t);
  }, [ledigCount]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ background: "#0A1628", minHeight: 400 }}>
      {/* Map grid */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00B4D8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Norway outline hint */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <svg width="200" height="300" viewBox="0 0 200 300" fill="none">
          <path d="M80,20 Q110,15 130,40 Q150,60 140,100 Q160,120 155,160 Q170,200 160,240 Q150,280 120,290 Q90,300 70,270 Q40,240 50,200 Q30,160 40,120 Q20,80 40,50 Q60,20 80,20Z" fill="#00B4D8" />
        </svg>
      </div>

      {/* ── LIVE COUNTER — hero banner ─────────────────────────────────────────── */}
      <div
        className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-2xl flex items-center gap-2 whitespace-nowrap"
        style={{
          background: "rgba(0,0,0,0.72)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0,180,216,0.3)",
          boxShadow: "0 0 24px rgba(0,180,216,0.12)",
        }}
      >
        <span
          className="text-base font-black transition-all duration-300"
          style={{
            color: countFlash ? "#00FFD0" : "#00B4D8",
            fontFamily: "'Syne', sans-serif",
            fontSize: 18,
            textShadow: countFlash ? "0 0 12px #00B4D8" : "none",
          }}
        >
          <AnimatedCount value={ledigCount} />
        </span>
        <span className="text-xs text-white/60">
          ledige plasser i <span className="text-white font-semibold">{selectedCity}</span> akkurat nå
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "#10B981", boxShadow: "0 0 6px #10B981" }}
        />
      </div>

      {/* ── Sanntid indicator ─────────────────────────────────────────────────── */}
      <div
        className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold z-10"
        style={{
          background: connected ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)",
          border: `1px solid ${connected ? "rgba(16,185,129,0.4)" : "rgba(107,114,128,0.3)"}`,
          color: connected ? "#10B981" : "#9CA3AF",
        }}
      >
        <Wifi size={10} className={connected ? "animate-pulse" : ""} />
        {connected ? "Sanntid" : "Kobler til…"}
      </div>

      {/* ── Pins ──────────────────────────────────────────────────────────────── */}
      {visiblePins.map((pin, i) => {
        const liveStatus = statusMap[pin.spaceId] ?? "available";
        const pinColor = STATUS_PIN_COLORS[liveStatus] ?? TYPE_COLORS[pin.type] ?? "#00B4D8";
        const isActive = liveStatus !== "available";

        return (
          <div
            key={i}
            className="absolute flex flex-col items-center cursor-pointer group"
            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%, -100%)", zIndex: isActive ? 15 : 10 }}
          >
            {/* Tooltip on hover */}
            <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-20">
              <div
                className="px-2 py-1 rounded-lg text-xs font-bold text-white whitespace-nowrap shadow-xl"
                style={{ background: "#0D1B2A", border: `1px solid ${pinColor}` }}
              >
                {STATUS_EMOJIS[liveStatus]} {STATUS_LABELS[liveStatus]}
              </div>
              <div className="w-1.5 h-1.5 rotate-45 -mt-1" style={{ background: "#0D1B2A", border: `1px solid ${pinColor}` }} />
            </div>

            {/* Glow ring when active */}
            {isActive && (
              <div
                className="absolute rounded-lg animate-ping"
                style={{
                  inset: -4,
                  background: `${pinColor}25`,
                  border: `1px solid ${pinColor}60`,
                }}
              />
            )}

            {/* Pin label */}
            <div
              className="px-2 py-1 rounded-lg text-xs font-bold text-white shadow-lg group-hover:scale-110 transition-all duration-300"
              style={{
                background: pinColor,
                boxShadow: isActive ? `0 0 16px ${pinColor}80, 0 2px 8px rgba(0,0,0,0.4)` : "0 2px 8px rgba(0,0,0,0.3)",
                transform: isActive ? "scale(1.08)" : undefined,
              }}
            >
              {pin.type === "smart" && "🤖 "}{pin.label}
            </div>

            {/* Pin dot */}
            <div
              className={`w-2 h-2 rounded-full mt-0.5 ${liveStatus === "reserved" ? "animate-bounce" : ""}`}
              style={{ background: pinColor, boxShadow: isActive ? `0 0 6px ${pinColor}` : undefined }}
            />
            {liveStatus === "reserved" && (
              <div className="w-2 h-2 rounded-full -mt-2 absolute" style={{ background: pinColor }} />
            )}
          </div>
        );
      })}

      {/* ── City filter ───────────────────────────────────────────────────────── */}
      <div className="absolute bottom-16 left-3 flex flex-wrap gap-1.5 z-10">
        {CITIES.map(c => (
          <button
            key={c}
            onClick={() => onCityChange(c)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
            style={{
              background: selectedCity === c ? "#00B4D8" : "rgba(255,255,255,0.08)",
              color:      selectedCity === c ? "white"   : "rgba(255,255,255,0.5)",
              border:     `1px solid ${selectedCity === c ? "#00B4D8" : "rgba(255,255,255,0.1)"}`,
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Zoom controls ─────────────────────────────────────────────────────── */}
      <div className="absolute right-3 bottom-16 flex flex-col gap-1 z-10">
        {[
          { icon: <ZoomIn size={14} />, fn: () => setZoom(z => Math.min(z + 0.2, 2))   },
          { icon: <ZoomOut size={14}/>, fn: () => setZoom(z => Math.max(z - 0.2, 0.5)) },
          { icon: <Navigation size={14} />, fn: () => {} },
          { icon: <Satellite size={14} />,  fn: () => {} },
        ].map((ctrl, i) => (
          <button
            key={i}
            onClick={ctrl.fn}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {ctrl.icon}
          </button>
        ))}
      </div>

      {/* ── Status legend ─────────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-3 left-3 p-2 rounded-xl z-10"
        style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex flex-col gap-0.5">
          {(["available", "reserved", "booked", "closed"] as SpaceStatus[]).map(s => (
            <div key={s} className="flex items-center gap-1.5 text-[10px] text-white/60">
              <span>{STATUS_EMOJIS[s]}</span>
              <span>{STATUS_LABELS[s]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Live activity feed ────────────────────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1 items-end" style={{ maxWidth: 220 }}>
        {recentActivity.length === 0 ? (
          <div
            className="px-2.5 py-1.5 rounded-xl text-[10px] text-white/30"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            Venter på aktivitet…
          </div>
        ) : (
          recentActivity.map((ev) => {
            const cfg = ACTIVITY_LABELS[ev.action];
            return (
              <div
                key={ev.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold"
                style={{
                  background: "rgba(0,0,0,0.72)",
                  border: `1px solid ${cfg.color}30`,
                  color: "rgba(255,255,255,0.7)",
                  backdropFilter: "blur(8px)",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <span>{cfg.emoji}</span>
                <span className="truncate max-w-[120px]" style={{ color: cfg.color }}>{ev.by}</span>
                <span className="text-white/40">·</span>
                <span>{cfg.text}</span>
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
