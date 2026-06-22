import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, X, Loader2 } from "lucide-react";

export interface GeoResult {
  lat: number;
  lng: number;
  label: string;
}

interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  value: GeoResult | null;
  onChange: (result: GeoResult | null) => void;
}

function shortLabel(displayName: string): string {
  const parts = displayName.split(",").map(s => s.trim());
  return parts.slice(0, 2).join(", ");
}

export default function AddressSearch({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&countrycodes=no&limit=6&addressdetails=0`;
      const res = await fetch(url, { headers: { "Accept-Language": "nb" } });
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { if (query) search(query); else setSuggestions([]); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pick(s: Suggestion) {
    const label = shortLabel(s.display_name);
    onChange({ lat: parseFloat(s.lat), lng: parseFloat(s.lon), label });
    setQuery("");
    setSuggestions([]);
    setOpen(false);
  }

  function clear() {
    onChange(null);
    setQuery("");
    setSuggestions([]);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  if (value) {
    return (
      <div
        className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl"
        style={{ background: "rgba(0,180,216,0.15)", border: "1px solid rgba(0,180,216,0.4)" }}
      >
        <MapPin size={14} style={{ color: "#00B4D8", flexShrink: 0 }} />
        <span className="text-sm text-white truncate flex-1" data-testid="address-selected-label">
          {value.label}
        </span>
        <button
          onClick={clear}
          className="text-white/40 hover:text-white transition-colors shrink-0"
          data-testid="button-clear-address"
          aria-label="Fjern adresse"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.08)" }}>
        {loading ? (
          <Loader2 size={14} className="text-white/40 animate-spin shrink-0" />
        ) : (
          <MapPin size={14} className="text-white/40 shrink-0" />
        )}
        <input
          ref={inputRef}
          type="text"
          placeholder="Adresse eller sted, f.eks. Aker Brygge"
          value={query}
          onChange={e => { setQuery(e.target.value); if (!e.target.value) setSuggestions([]); }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          className="bg-transparent text-white placeholder:text-white/40 text-sm focus:outline-none w-full"
          data-testid="input-address-search"
          autoComplete="off"
        />
        {query && (
          <button onClick={() => { setQuery(""); setSuggestions([]); }} className="text-white/30 hover:text-white/60 shrink-0">
            <X size={12} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1 rounded-xl overflow-hidden z-50 shadow-2xl"
          style={{ background: "#0D2035", border: "1px solid rgba(0,180,216,0.3)" }}
        >
          {suggestions.map(s => (
            <button
              key={s.place_id}
              onMouseDown={() => pick(s)}
              className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
              data-testid={`suggestion-${s.place_id}`}
            >
              <MapPin size={13} className="mt-0.5 shrink-0" style={{ color: "#00B4D8" }} />
              <span className="text-sm text-white/90 leading-snug">{shortLabel(s.display_name)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
