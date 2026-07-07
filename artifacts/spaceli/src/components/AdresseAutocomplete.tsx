import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface KartverketAdresse {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  kommunenavn: string;
  representasjonspunkt?: { lat: number; lon: number };
}

interface Props {
  value: string;
  onChange: (adresse: string) => void;
  onSelect: (opts: { adresse: string; by: string; postnummer: string; lat?: number; lng?: number }) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
}

export default function AdresseAutocomplete({ value, onChange, onSelect, placeholder = "Adresse *", className, "data-testid": testId }: Props) {
  const [suggestions, setSuggestions] = useState<KartverketAdresse[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (val: string) => {
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://ws.geonorge.no/adresser/v1/sok?sok=${encodeURIComponent(val)}&treffPerSide=6&filtrer=adressetekst,postnummer,poststed,kommunenavn,representasjonspunkt`
        );
        const data = await res.json();
        const hits: KartverketAdresse[] = (data.adresser ?? []).slice(0, 6);
        setSuggestions(hits);
        setOpen(hits.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    }, 280);
  };

  const handleSelect = (hit: KartverketAdresse) => {
    const by = hit.poststed
      ? hit.poststed.charAt(0).toUpperCase() + hit.poststed.slice(1).toLowerCase()
      : hit.kommunenavn;
    onSelect({
      adresse: hit.adressetekst,
      by,
      postnummer: hit.postnummer,
      lat: hit.representasjonspunkt?.lat,
      lng: hit.representasjonspunkt?.lon,
    });
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          value={value}
          onChange={e => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={className}
          data-testid={testId}
          autoComplete="off"
        />
        {loading && (
          <div style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>
            <Loader2 size={14} color="rgba(255,255,255,0.4)" className="animate-spin" />
          </div>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 200,
          background: "#0D1B2A",
          border: "1px solid rgba(0,180,216,0.3)",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>
          {suggestions.map((hit, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(hit)}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10,
                width: "100%", padding: "10px 14px", background: "transparent",
                border: "none", cursor: "pointer", textAlign: "left",
                borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                transition: "background 0.1s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,180,216,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <MapPin size={14} color="#00B4D8" style={{ marginTop: 2, flexShrink: 0 }} />
              <div>
                <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                  {hit.adressetekst}
                </div>
                <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 1 }}>
                  {hit.postnummer} {hit.poststed}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
