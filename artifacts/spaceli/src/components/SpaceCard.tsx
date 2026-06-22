import { Star, MapPin, Bell, Tent, Truck, Anchor } from "lucide-react";
import { formatDistance, formatWalkTime } from "@/lib/haversine";

const TYPE_CONFIG: Record<string, { label: string; color: string; emoji: string; campingType?: boolean }> = {
  parking:     { label: "Parkering",    color: "#00B4D8", emoji: "🚗" },
  storage:     { label: "Lagerplass",   color: "#F59E0B", emoji: "📦" },
  business:    { label: "Bedrift",      color: "#10B981", emoji: "🏢" },
  ev:          { label: "Elbil",        color: "#10B981", emoji: "⚡" },
  camping:     { label: "Camping",      color: "#16A34A", emoji: "🏕️", campingType: true },
  bobil:       { label: "Bobil",        color: "#92400E", emoji: "🚐", campingType: true },
  bobil_strom: { label: "Bobil + Strøm",color: "#D97706", emoji: "⚡🚐", campingType: true },
  bobil_full:  { label: "Bobil Full",   color: "#0891B2", emoji: "🚿🚐", campingType: true },
  gaard:       { label: "Gårdsplass",   color: "#65A30D", emoji: "🏠", campingType: true },
  baatplass:       { label: "Båtplass",         color: "#1D4ED8", emoji: "⚓" },
  henger:          { label: "Henger/Tilhenger", color: "#B45309", emoji: "🚛" },
  festsal:         { label: "Festsal",           color: "#EC4899", emoji: "🎉" },
  laave:           { label: "Låve",              color: "#EC4899", emoji: "🏚️" },
  hytteanneks:     { label: "Hytteanneks",       color: "#EC4899", emoji: "🛖" },
  takterrasse:     { label: "Takterrasse",       color: "#EC4899", emoji: "🌆" },
  hot_desk:        { label: "Hot desk",          color: "#7C3AED", emoji: "💼" },
  cellekontor:     { label: "Cellekontor",        color: "#7C3AED", emoji: "🚪" },
  moterom:         { label: "Møterom",            color: "#7C3AED", emoji: "👥" },
  kreativt_studio: { label: "Kreativt studio",    color: "#7C3AED", emoji: "🎨" },
  verksted:        { label: "Verksted",            color: "#7C3AED", emoji: "🔧" },
};

const FACILITIES_MAP: Record<string, string> = {
  "Innendørs": "Innendørs",
  "Utendørs": "Utendørs",
  "Port": "Port",
  "Belysning": "Belysning",
  "24/7": "24/7",
  "Oppvarmet": "Oppvarmet",
  "Overvåket": "Overvåket",
  "Elbillader": "Elbil",
  "Faktura": "Faktura",
  "Havn": "Havn",
  "Ski": "Ski",
  "Strøm": "⚡ Strøm",
  "Vann": "💧 Vann",
  "Toalett": "🚽 Toalett",
  "Dusj": "🚿 Dusj",
  "WiFi": "📶 WiFi",
  "Printer": "🖨️ Printer",
  "Kaffe og te": "☕ Kaffe",
  "Kjøkken": "🍽️ Kjøkken",
  "Resepsjon": "🛎️ Resepsjon",
  "Parkering inkludert": "🅿️ Parkering",
  "24/7 tilgang": "🔑 24/7",
  "Whiteboard": "📋 Whiteboard",
  "Skjerm/projektor": "📺 Skjerm",
  "Bar": "🍹 Bar",
  "Scene": "🎤 Scene",
  "Overnatting": "🛏️ Overnatting",
  "Bålplass": "🔥 Bålplass",
  "Hund ok": "🐕 Hund ok",
  "Tømmestasjon": "🗑️ Tømmestasjon",
};

interface PriceGrid {
  natt?: number | null;
  time: number | null;
  dag: number | null;
  uke: number | null;
  maaned: number | null;
}

interface Space {
  id: number;
  tittel: string;
  type: string;
  adresse: string;
  by: string;
  prisModell: string;
  priser?: PriceGrid;
  snittRangering?: number | null;
  antallAnmeldelser?: number;
  fasiliteter?: string[];
  eierNavn?: string | null;
  erAktiv?: boolean;
  erNatteparkering?: boolean | null;
  nattPrisHelgTillegg?: number | null;
  helgeMode?: boolean | null;
  helgePris?: number | null;
  arrangementModus?: boolean | null;
  arrangementPris?: number | null;
  tilbyrAbonnement?: boolean;
  abonnementsPris?: number | null;
  minBindingstid?: number | null;
  antallVenter?: number;
  antallPlasser?: number | null;
  overnattingTillatt?: boolean;
  lavsesonPris?: number | null;
  hoysesonPris?: number | null;
  harUnloc?: boolean;
  harTelemetrics?: boolean;
  lediVerifisert?: boolean;
  bildeSti?: string | null;
}

interface Props {
  space: Space;
  onClick: (space: Space) => void;
  distanceM?: number;
}

function getBestPriceLabel(priser?: PriceGrid): string {
  if (!priser) return "–";
  if (priser.natt) return `${priser.natt} kr/natt`;
  if (priser.dag) return `${priser.dag} kr/dag`;
  if (priser.time) return `${priser.time} kr/t`;
  if (priser.uke) return `${priser.uke} kr/uke`;
  if (priser.maaned) return `${priser.maaned} kr/mnd`;
  return "–";
}

export default function SpaceCard({ space, onClick, distanceM }: Props) {
  const config = TYPE_CONFIG[space.type] ?? TYPE_CONFIG.parking;
  const isSmartPris = space.prisModell === "smart";
  const isLedig = space.erAktiv !== false;
  const hasFastPlass = !!space.tilbyrAbonnement && !!space.abonnementsPris;
  const isCamping = !!config.campingType;
  const hasUnloc = !!space.harUnloc;
  const hasTelemetrics = !!space.harTelemetrics;
  const isLediVerifisert = !!space.lediVerifisert;

  const priceEntries = [
    { label: "Natt",  value: space.priser?.natt,   key: "natt",   hoursPerUnit: 24  },
    { label: "Time",  value: space.priser?.time,   key: "time",   hoursPerUnit: 1   },
    { label: "Dag",   value: space.priser?.dag,    key: "dag",    hoursPerUnit: 24  },
    { label: "Uke",   value: space.priser?.uke,    key: "uke",    hoursPerUnit: 168 },
    { label: "Mnd",   value: space.priser?.maaned, key: "maaned", hoursPerUnit: 720 },
  ].filter(e => e.value != null);

  const bestIdx = priceEntries.length > 0
    ? priceEntries.reduce((best, curr, idx) => {
        const bestRatio = (priceEntries[best].value ?? 0) / priceEntries[best].hoursPerUnit;
        const currRatio = (curr.value ?? 0) / curr.hoursPerUnit;
        return currRatio < bestRatio ? idx : best;
      }, 0)
    : -1;

  // Card accent color for camping types
  const cardBg = isCamping
    ? `${config.color}15`
    : `${config.color}20`;

  return (
    <div
      className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.01] transition-all duration-200 border border-white/10"
      style={{ background: "#fff", borderRadius: 16 }}
      onClick={() => onClick(space)}
      data-testid={`card-space-${space.id}`}
    >
      {/* Image area */}
      <div
        className="h-28 flex items-center justify-center text-5xl relative overflow-hidden"
        style={{ background: cardBg }}
      >
        {space.bildeSti ? (
          <img
            src={space.bildeSti}
            alt={space.tittel}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <span>{config.emoji}</span>
        )}

        {/* Camping icon overlay */}
        {isCamping && (
          <div className="absolute bottom-2 right-2 opacity-20 text-2xl">
            {space.type === "baatplass" ? <Anchor size={24} style={{ color: config.color }} /> :
             space.type.startsWith("bobil") ? <Truck size={24} style={{ color: config.color }} /> :
             <Tent size={24} style={{ color: config.color }} />}
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap max-w-[70%]">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
            style={{ background: config.color }}
            data-testid={`badge-type-${space.id}`}
          >
            {config.label}
          </span>
          {isSmartPris && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: "#8B5CF6" }}
            >
              🤖 Smart Pris
            </span>
          )}
          {hasFastPlass && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: "#7C3AED" }}
            >
              📅 Fast plass
            </span>
          )}
          {hasUnloc && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: "#0F766E" }}
            >
              🔓 Smartlås
            </span>
          )}
          {hasTelemetrics && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: "#7C3AED" }}
            >
              🚪 Portkontroll
            </span>
          )}
          {space.erNatteparkering && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: "#1E3A5F" }}
            >
              🌙 Natteparkering
            </span>
          )}
          {space.helgeMode && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: "#D97706" }}
            >
              🌅 Helgeparkering
            </span>
          )}
          {space.arrangementModus && (
            <span
              className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
              style={{ background: "#7C3AED" }}
            >
              🎪 Arrangementsplass
            </span>
          )}
        </div>

        {/* Ledi Verifisert badge — bottom-left of image */}
        {isLediVerifisert && (
          <div
            className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-lg"
            style={{
              background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
              border: "1px solid rgba(255,255,255,0.25)",
              boxShadow: "0 2px 8px rgba(29,78,216,0.5)",
            }}
            data-testid={`badge-ledi-verifisert-${space.id}`}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="6" fill="white" fillOpacity="0.25" />
              <path d="M3 6l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ledi Verifisert
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: isLedig ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
              color: isLedig ? "#10B981" : "#EF4444",
              border: `1px solid ${isLedig ? "#10B981" : "#EF4444"}`,
            }}
          >
            {isLedig ? "Ledig" : "Opptatt"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight" data-testid={`text-space-title-${space.id}`}>
            {space.tittel}
          </h3>
          {space.snittRangering ? (
            <span className="flex items-center gap-0.5 text-xs text-amber-500 font-semibold shrink-0">
              <Star size={11} fill="currentColor" />
              {space.snittRangering.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2 flex-wrap">
          <MapPin size={11} />
          <span data-testid={`text-space-address-${space.id}`}>{space.adresse}, {space.by}</span>
          {distanceM !== undefined && (
            <span
              className="ml-auto shrink-0 px-1.5 py-0.5 rounded-md font-semibold"
              style={{ background: "rgba(0,180,216,0.12)", color: "#00B4D8", fontSize: 10 }}
              data-testid={`badge-distance-${space.id}`}
            >
              {formatDistance(distanceM)} – {formatWalkTime(distanceM)} gange
            </span>
          )}
        </div>

        {/* Natteparkering-specific info */}
        {space.erNatteparkering && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-md font-medium"
              style={{ background: "rgba(30,58,95,0.18)", color: "#60A5FA" }}>
              🕙 22:00 – 08:00
            </span>
            {space.nattPrisHelgTillegg && (
              <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>
                +{space.nattPrisHelgTillegg}% helg
              </span>
            )}
          </div>
        )}

        {/* Camping-specific info */}
        {isCamping && (space.antallPlasser || space.overnattingTillatt) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {space.antallPlasser && (
              <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: `${config.color}18`, color: config.color }}>
                {space.antallPlasser} plasser
              </span>
            )}
            {space.overnattingTillatt && (
              <span className="text-xs px-2 py-0.5 rounded-md font-medium"
                style={{ background: "rgba(22,163,74,0.12)", color: "#16A34A" }}>
                🌙 Overnatting ok
              </span>
            )}
          </div>
        )}

        {/* Seasonal pricing for camping */}
        {isCamping && (space.lavsesonPris || space.hoysesonPris) && (
          <div className="flex gap-2 mb-2">
            {space.lavsesonPris && (
              <span className="text-xs px-2 py-0.5 rounded-md"
                style={{ background: "rgba(148,163,184,0.15)", color: "#64748B" }}>
                Lavsesong: {space.lavsesonPris} kr/natt
              </span>
            )}
            {space.hoysesonPris && (
              <span className="text-xs px-2 py-0.5 rounded-md font-semibold"
                style={{ background: `${config.color}18`, color: config.color }}>
                Høysesong: {space.hoysesonPris} kr/natt
              </span>
            )}
          </div>
        )}

        {/* Facility chips */}
        {space.fasiliteter && space.fasiliteter.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {space.fasiliteter.slice(0, 4).map(f => (
              <span
                key={f}
                className="px-1.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600"
              >
                {FACILITIES_MAP[f] ?? f}
              </span>
            ))}
            {space.fasiliteter.length > 4 && (
              <span className="px-1.5 py-0.5 rounded-md text-xs bg-gray-100 text-gray-500">
                +{space.fasiliteter.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Price grid */}
        {priceEntries.length > 0 ? (
          <div className={`grid gap-1 mb-3 ${priceEntries.length >= 4 ? "grid-cols-4" : priceEntries.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {priceEntries.slice(0, 4).map((entry, idx) => (
              <div
                key={entry.key}
                className="rounded-lg p-1.5 text-center"
                style={
                  isSmartPris && idx === priceEntries.length - 1
                    ? { background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)" }
                    : idx === bestIdx
                    ? { background: "rgba(0,180,216,0.15)", border: "1px solid rgba(0,180,216,0.4)" }
                    : { background: "#F8FAFC", border: "1px solid #E2E8F0" }
                }
              >
                <div
                  className="text-xs font-bold"
                  style={
                    isSmartPris && idx === priceEntries.length - 1
                      ? { color: "#8B5CF6" }
                      : idx === bestIdx
                      ? { color: "#00B4D8" }
                      : { color: "#374151" }
                  }
                  data-testid={`text-price-${entry.key}-${space.id}`}
                >
                  {entry.value} kr
                </div>
                <div className="text-[10px] text-gray-400">{entry.label}</div>
                {isSmartPris && idx === priceEntries.length - 1 && (
                  <div className="text-[10px] font-semibold" style={{ color: "#8B5CF6" }}>🤖</div>
                )}
                {idx === bestIdx && !(isSmartPris && idx === priceEntries.length - 1) && (
                  <div className="text-[10px] font-semibold" style={{ color: "#00B4D8" }}>BEST</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-3 text-xs text-gray-400">Kontakt for pris</div>
        )}

        {/* Subscription row */}
        {hasFastPlass && (
          <div
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg mb-2"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}
          >
            <span className="text-xs text-gray-500">Fast plass fra</span>
            <span className="text-xs font-bold" style={{ color: "#7C3AED" }}>
              {(space.abonnementsPris!).toLocaleString("nb-NO")} kr/mnd
            </span>
          </div>
        )}

        {/* Waitlist count */}
        {(space.antallVenter ?? 0) > 0 && (
          <div
            className="flex items-center gap-1.5 mb-2 px-2.5 py-1.5 rounded-lg"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <Bell size={11} style={{ color: "#F59E0B" }} />
            <span className="text-xs font-semibold" style={{ color: "#F59E0B" }}>
              {space.antallVenter} venter på denne plassen
            </span>
          </div>
        )}

        {/* Owner + Book button */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-gray-500">
            {space.eierNavn && <span>Utleier: {space.eierNavn}</span>}
          </div>
          <button
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white"
            style={{ background: isCamping ? config.color : "#0D1B2A" }}
            data-testid={`button-book-${space.id}`}
          >
            {isCamping ? "Velg datoer" : "Book nå"}
          </button>
        </div>
      </div>
    </div>
  );
}
