import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useSpaceSocket, type SpaceStatus } from "@/lib/useSpaceSocket";

const CITIES = ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø", "Hele Norge"];

const CITY_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  "Oslo":       { center: [59.9139, 10.7522], zoom: 13 },
  "Bergen":     { center: [60.3913, 5.3221],  zoom: 13 },
  "Trondheim":  { center: [63.4305, 10.3951], zoom: 13 },
  "Stavanger":  { center: [58.9700, 5.7331],  zoom: 13 },
  "Tromsø":     { center: [69.6496, 18.9553], zoom: 13 },
  "Hele Norge": { center: [65.0, 14.0],       zoom: 5  },
};

const PINS = [
  { lat: 59.912, lng: 10.748, type: "parking",  label: "190 kr/t",      city: "Oslo",      spaceId: 1  },
  { lat: 59.928, lng: 10.718, type: "storage",  label: "1 600 kr/mnd",  city: "Oslo",      spaceId: 2  },
  { lat: 59.882, lng: 10.776, type: "business", label: "8 500 kr/mnd",  city: "Oslo",      spaceId: 3  },
  { lat: 59.903, lng: 10.712, type: "smart",    label: "3 200 kr/mnd",  city: "Oslo",      spaceId: 4  },
  { lat: 59.921, lng: 10.773, type: "henger",   label: "1 200 kr/mnd",  city: "Oslo",      spaceId: 20 },
  { lat: 59.938, lng: 10.741, type: "henger",   label: "800 kr/mnd",    city: "Oslo",      spaceId: 21 },
  { lat: 60.393, lng: 5.321,  type: "parking",  label: "220 kr/dag",    city: "Bergen",    spaceId: 5  },
  { lat: 63.430, lng: 10.395, type: "smart",    label: "1 400 kr/mnd",  city: "Trondheim", spaceId: 6  },
  { lat: 58.970, lng: 5.733,  type: "parking",  label: "190 kr/dag",    city: "Stavanger", spaceId: 7  },
  { lat: 69.650, lng: 18.957, type: "smart",    label: "2 000 kr/mnd",  city: "Tromsø",    spaceId: 8  },
];

const TYPE_COLORS: Record<string, string> = {
  parking:  "#00B4D8",
  storage:  "#F59E0B",
  business: "#10B981",
  smart:    "#8B5CF6",
  henger:   "#B45309",
};

const STATUS_COLORS: Partial<Record<SpaceStatus, string>> = {
  reserved: "#F59E0B",
  booked:   "#EF4444",
  closed:   "#6B7280",
};

const TYPE_LABELS: Record<string, string> = {
  parking:  "Parkering",
  storage:  "Lagerplass",
  business: "Business",
  smart:    "Smart Pris",
  henger:   "Henger",
};

function createPriceIcon(label: string, color: string, status?: SpaceStatus) {
  const bg = (status && STATUS_COLORS[status]) || color;
  return L.divIcon({
    className: "",
    html: `<div style="background:${bg};color:#fff;padding:4px 9px;border-radius:20px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:700;white-space:nowrap;box-shadow:0 2px 10px rgba(0,0,0,0.5);border:1.5px solid rgba(255,255,255,0.25);position:relative;cursor:pointer;">${label}<div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${bg};"></div></div>`,
    iconAnchor: [36, 34],
    iconSize: [90, 30],
  });
}

function MapController({ city }: { city: string }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const cfg = CITY_CENTERS[city] ?? CITY_CENTERS["Oslo"];
    const doFly = () => {
      try {
        map.flyTo(cfg.center, cfg.zoom, { duration: 1.2, easeLinearity: 0.4 });
      } catch {
        // map not ready yet — ignore
      }
    };
    const size = map.getSize();
    if (size && size.x > 0 && size.y > 0) {
      doFly();
    } else {
      map.whenReady(doFly);
    }
  }, [city, map]);
  return null;
}

interface Props {
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export default function LeafletMap({ selectedCity, onCityChange }: Props) {
  const { statusMap: spaceStatuses } = useSpaceSocket();

  const visiblePins =
    selectedCity === "Hele Norge"
      ? PINS
      : PINS.filter((p) => p.city === selectedCity);

  return (
    <div
      className="relative w-full h-full"
      style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      {/* City tabs */}
      <div className="absolute top-3 left-0 right-0 z-[1000] flex justify-center px-3 pointer-events-none">
        <div
          className="flex gap-1 p-1 rounded-xl overflow-x-auto pointer-events-auto"
          style={{ background: "rgba(13,27,42,0.92)", backdropFilter: "blur(12px)", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}
        >
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => onCityChange(city)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: selectedCity === city ? "#00B4D8" : "transparent",
                color: selectedCity === city ? "white" : "rgba(255,255,255,0.55)",
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Live badge */}
      <div
        className="absolute bottom-4 left-4 z-[1000] flex items-center gap-1.5 px-2.5 py-1.5 rounded-full pointer-events-none"
        style={{ background: "rgba(13,27,42,0.88)", backdropFilter: "blur(8px)" }}
      >
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-white/70">Live</span>
      </div>

      {/* Attribution */}
      <div
        className="absolute bottom-4 right-4 z-[1000] pointer-events-none"
        style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}
      >
        © OpenStreetMap · CartoDB
      </div>

      <MapContainer
        center={CITY_CENTERS["Oslo"].center}
        zoom={13}
        style={{ width: "100%", height: "100%", background: "#0D1B2A" }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />
        <MapController city={selectedCity} />
        {visiblePins.map((pin) => {
          const status = spaceStatuses[pin.spaceId];
          const color = TYPE_COLORS[pin.type] ?? "#00B4D8";
          const icon = createPriceIcon(pin.label, color, status);
          return (
            <Marker key={pin.spaceId} position={[pin.lat, pin.lng]} icon={icon}>
              <Popup
                closeButton={false}
                className="ledi-popup"
              >
                <div
                  style={{
                    background: "#0D1B2A",
                    color: "white",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    minWidth: "150px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{pin.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.55 }}>
                    {pin.city} · {TYPE_LABELS[pin.type] ?? pin.type}
                  </div>
                  {status && status !== "available" && (
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 6,
                        padding: "2px 8px",
                        borderRadius: 10,
                        display: "inline-block",
                        background: STATUS_COLORS[status] ? `${STATUS_COLORS[status]}22` : undefined,
                        color: STATUS_COLORS[status],
                      }}
                    >
                      {status === "reserved" ? "Betaling pågår" : status === "booked" ? "Opptatt" : "Stengt"}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style>{`
        .ledi-popup .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          padding: 0;
          border: none;
        }
        .ledi-popup .leaflet-popup-tip-container { display: none; }
        .ledi-popup .leaflet-popup-content { margin: 0; }
      `}</style>
    </div>
  );
}
