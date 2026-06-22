import { useState } from "react";
import { X, ChevronRight, ChevronLeft, TrendingUp, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { useCreateSpace, useAddSpaceBilde, useRequestUploadUrl, getGetMySpacesQueryKey, getGetStatsSummaryQueryKey, useGetSmartPrisDynamic } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useGetSmartPrisData } from "@workspace/api-client-react";

const TYPES = [
  { key: "parking",        label: "Parkeringsplass",   emoji: "🚗",  group: "parkering" },
  { key: "storage",        label: "Lagerplass",         emoji: "📦",  group: "parkering" },
  { key: "henger",         label: "Henger/Tilhenger",   emoji: "🚛",  group: "parkering" },
  { key: "ev",             label: "Elbilplass",         emoji: "⚡",  group: "parkering" },
  { key: "business",       label: "Bedrift",            emoji: "🏢",  group: "parkering" },
  { key: "camping",        label: "Campingplass",       emoji: "🏕️", group: "camping"   },
  { key: "bobil",          label: "Bobil-parkering",    emoji: "🚐",  group: "camping"   },
  { key: "bobil_strom",    label: "Bobil med strøm",    emoji: "⚡🚐",group: "camping"   },
  { key: "bobil_full",     label: "Bobil full service", emoji: "🚿🚐",group: "camping"   },
  { key: "gaard",          label: "Gårdsplass",         emoji: "🏠",  group: "camping"   },
  { key: "baatplass",      label: "Båtplass",           emoji: "⚓",  group: "camping"   },
  { key: "hot_desk",       label: "Hot desk",           emoji: "💼",  group: "kontor"    },
  { key: "cellekontor",    label: "Cellekontor",        emoji: "🚪",  group: "kontor"    },
  { key: "moterom",        label: "Møterom",            emoji: "👥",  group: "kontor"    },
  { key: "kreativt_studio",label: "Kreativt studio",    emoji: "🎨",  group: "kontor"    },
  { key: "verksted",       label: "Verksted",           emoji: "🔧",  group: "kontor"    },
  { key: "festsal",       label: "Festsal/selskapslokale", emoji: "🎉",  group: "selskap"   },
  { key: "laave",         label: "Låve",               emoji: "🏚️", group: "selskap"   },
  { key: "hytteanneks",   label: "Hytteanneks",         emoji: "🛖",  group: "selskap"   },
  { key: "takterrasse",   label: "Takterrasse",         emoji: "🌆",  group: "selskap"   },
];

const CAMPING_TYPES  = ["camping", "bobil", "bobil_strom", "bobil_full", "gaard", "baatplass"];
const OFFICE_TYPES   = ["hot_desk", "cellekontor", "moterom", "kreativt_studio", "verksted"];
const SELSKAP_TYPES  = ["festsal", "laave", "hytteanneks", "takterrasse"];

const FACILITIES = ["Innendørs", "Utendørs", "Port", "Belysning", "24/7", "Oppvarmet", "Overvåket", "Elbillader", "Faktura"];
const CAMPING_FACILITIES  = ["Strøm", "Vann", "Toalett", "Dusj", "WiFi", "Bålplass", "Hund ok", "Tømmestasjon"];
const OFFICE_FACILITIES   = ["WiFi", "Printer", "Kaffe og te", "Kjøkken", "Resepsjon", "Parkering inkludert", "24/7 tilgang", "Whiteboard", "Skjerm/projektor"];
const SELSKAP_FACILITIES  = ["Kjøkken", "Bar", "Scene", "Parkering", "Toalett", "Innendørs", "Utendørs", "Bålplass", "Strøm", "WiFi", "Dusj", "Overnatting"];

const MAKS_LENGDER = ["6m", "8m", "10m+"];
const STROM_AMP = ["10A", "16A", "32A"];

const DEMAND_BY_DISTRICT: Record<string, { level: string; color: string; days: number }> = {
  "Oslo Frogner":  { level: "Svært høy", color: "#10B981", days: 7 },
  "Oslo Sentrum":  { level: "Høy",       color: "#10B981", days: 10 },
  "Oslo Sagene":   { level: "Middels",   color: "#F59E0B", days: 18 },
  "Bergen":        { level: "Høy",       color: "#10B981", days: 12 },
  "Trondheim":     { level: "Middels",   color: "#F59E0B", days: 16 },
  "Stavanger":     { level: "Høy",       color: "#10B981", days: 11 },
  "Tromsø":        { level: "Middels",   color: "#F59E0B", days: 20 },
  "Distrikter":    { level: "Lav",       color: "#EF4444", days: 35 },
};

interface ImageUploadSectionProps {
  spaceId: number | null;
  uploadState: "idle" | "uploading" | "done" | "error";
  setUploadState: (s: "idle" | "uploading" | "done" | "error") => void;
  uploadedImageUrl: string | null;
  setUploadedImageUrl: (url: string | null) => void;
}

function ImageUploadSection({ spaceId, uploadState, setUploadState, uploadedImageUrl, setUploadedImageUrl }: ImageUploadSectionProps) {
  const requestUploadUrl = useRequestUploadUrl();
  const addSpaceBilde = useAddSpaceBilde();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !spaceId) return;

    setUploadState("uploading");
    try {
      // 1. Get presigned URL
      const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type }
      });

      // 2. Upload directly to GCS
      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });

      // 3. Save path to space
      const result = await addSpaceBilde.mutateAsync({
        id: spaceId,
        data: { objectPath }
      });

      setUploadedImageUrl(result.bildeSti ?? null);
      setUploadState("done");
    } catch {
      setUploadState("error");
    }
  };

  if (uploadState === "done" && uploadedImageUrl) {
    return (
      <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,180,216,0.3)" }}>
        <img src={uploadedImageUrl} alt="Plass" className="w-full h-40 object-cover" />
        <div className="px-3 py-2 flex items-center gap-2" style={{ background: "rgba(0,180,216,0.1)" }}>
          <CheckCircle2 size={14} style={{ color: "#00B4D8" }} />
          <span className="text-xs" style={{ color: "#00B4D8" }}>Bilde lastet opp!</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.15)" }}>
      <p className="text-sm font-semibold text-white mb-1">Legg til bilde (valgfritt)</p>
      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
        Plasser med bilder får opptil 3× flere bookinger
      </p>
      {uploadState === "uploading" ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#00B4D8", borderTopColor: "transparent" }} />
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Laster opp...</span>
        </div>
      ) : (
        <label className="flex items-center gap-2 cursor-pointer w-full py-2 px-3 rounded-xl text-sm font-medium" style={{ background: "rgba(0,180,216,0.15)", color: "#00B4D8", border: "1px solid rgba(0,180,216,0.3)" }}>
          <span>📷 Velg bilde</span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={!spaceId} />
        </label>
      )}
      {uploadState === "error" && (
        <p className="text-xs mt-2" style={{ color: "#F87171" }}>Noe gikk galt. Prøv igjen fra dashbordet ditt.</p>
      )}
    </div>
  );
}

interface Props {
  onClose: () => void;
  initialPrisModell?: "fri" | "smart";
}

export default function RegisterSpacePanel({ onClose, initialPrisModell }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [type, setType] = useState("parking");
  const [tittel, setTittel] = useState("");
  const [adresse, setAdresse] = useState("");
  const [by, setBy] = useState("");
  const [postnummer, setPostnummer] = useState("");
  const [fasiliteter, setFasiliteter] = useState<string[]>([]);
  const [prisModell, setPrisModell] = useState<"fri" | "smart">(initialPrisModell ?? "fri");
  const [smartBydel, setSmartBydel] = useState("");
  const [friPrisBydel, setFriPrisBydel] = useState("");
  const [priser, setPriser] = useState({ natt: "", time: "", dag: "", uke: "", maaned: "" });
  // Camping-specific state
  const [antallPlasser, setAntallPlasser] = useState("");
  const [maksLengde, setMaksLengde] = useState("");
  const [stromAmp, setStromAmp] = useState("");
  const [overnattingTillatt, setOvernattingTillatt] = useState(false);
  const [lavsesonPris, setLavsesonPris] = useState("");
  const [hoysesonPris, setHoysesonPris] = useState("");
  const [harUnloc, setHarUnloc] = useState(false);
  const [unlocLockId, setUnlocLockId] = useState("");
  const [harTelemetrics, setHarTelemetrics] = useState(false);
  const [telemetricsPortId, setTelemetricsPortId] = useState("");
  const [erNatteparkering, setErNatteparkering] = useState(false);
  const [nattPrisHelgTillegg, setNattPrisHelgTillegg] = useState(20);
  const [helgeMode, setHelgeMode] = useState(false);
  const [helgePris, setHelgePris] = useState("");
  const [arrangementModus, setArrangementModus] = useState(false);
  const [arrangementPris, setArrangementPris] = useState("");

  const isCamping  = CAMPING_TYPES.includes(type);
  const isOffice   = OFFICE_TYPES.includes(type);
  const isSelskap  = SELSKAP_TYPES.includes(type);
  const [smartEgenPris, setSmartEgenPris] = useState(false);
  const [tilbyrAbonnement, setTilbyrAbonnement] = useState(false);
  const [abonnementsPris, setAbonnementsPris] = useState("");
  const [minBindingstid, setMinBindingstid] = useState(1);
  const [success, setSuccess] = useState(false);
  const [newSpaceId, setNewSpaceId] = useState<number | null>(null);
  const [harForsikring, setHarForsikring] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const { data: smartPrisData } = useGetSmartPrisData();
  const { data: dynamicData, isLoading: dynamicLoading } = useGetSmartPrisDynamic(
    { bydel: smartBydel, type },
    { query: { enabled: !!smartBydel } as any }
  );
  const createSpace = useCreateSpace();

  const toggleFacility = (f: string) => {
    setFasiliteter(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const getEstimat = () => {
    if (prisModell === "fri") {
      const p = Number(priser.maaned || priser.dag ? (priser.maaned || String(Number(priser.dag || "0") * 30)) : 0);
      return Math.round(p * 0.92);
    }
    const d = smartPrisData?.find(x => x.navn === smartBydel);
    if (!d) return 0;
    const mid = Math.round((d.parkeringMin + d.parkeringMax) / 2);
    return Math.round(mid * 0.92);
  };

  const getSmartAnbefalt = () => {
    const d = smartPrisData?.find(x => x.navn === smartBydel);
    if (!d) return null;
    return Math.round((d.parkeringMin + d.parkeringMax) / 2);
  };

  const getMarkedPriser = (bydel: string) => {
    return smartPrisData?.find(x => x.navn === bydel) ?? null;
  };

  const getMktHint = (bydel: string, field: "time" | "dag" | "uke" | "maaned" | "natt") => {
    const d = bydel ? smartPrisData?.find(x => x.navn === bydel) : null;
    const base = d
      ? { min: d.parkeringMin, max: d.parkeringMax }
      : { min: 2000, max: 3500 };
    switch (field) {
      case "maaned": return base;
      case "uke":    return { min: Math.round(base.min / 4.3), max: Math.round(base.max / 4.3) };
      case "dag":    return { min: Math.round(base.min / 22),  max: Math.round(base.max / 22) };
      case "time":   return { min: Math.round(base.min / 180), max: Math.round(base.max / 180) };
      case "natt":   return { min: Math.round(base.min / 22),  max: Math.round(base.max / 22) };
    }
  };

  const getEarningsBreakdown = () => {
    const mnd  = Number(priser.maaned);
    const uke  = Number(priser.uke);
    const dag  = Number(priser.dag);
    const natt = Number(priser.natt);
    const time = Number(priser.time);
    let brutto = 0;
    if (mnd  > 0) brutto = mnd;
    else if (uke  > 0) brutto = Math.round(uke  * 4.3);
    else if (dag  > 0) brutto = Math.round(dag  * 20);
    else if (natt > 0) brutto = Math.round(natt * 20);
    else if (time > 0) brutto = Math.round(time * 160);
    if (brutto === 0) return null;
    const fee   = Math.round(brutto * 0.08);
    const netto = brutto - fee;
    return { brutto, fee, netto, yearly: netto * 12 };
  };

  const handleSubmit = async () => {
    createSpace.mutate({
      data: {
        tittel: tittel || `${TYPES.find(t => t.key === type)?.label} – ${by}`,
        type,
        adresse,
        by,
        postnummer,
        breddegrad: 59.9139,
        lengdegrad: 10.7522,
        fasiliteter,
        prisModell,
        smartPrisBydel: prisModell === "smart" ? smartBydel : null,
        tilbyrAbonnement,
        abonnementsPris: tilbyrAbonnement && abonnementsPris ? Number(abonnementsPris) : null,
        minBindingstid: tilbyrAbonnement ? minBindingstid : null,
        antallPlasser: antallPlasser ? Number(antallPlasser) : null,
        maksLengde: maksLengde || null,
        stromAmp: stromAmp || null,
        overnattingTillatt,
        lavsesonPris: lavsesonPris ? Number(lavsesonPris) : null,
        hoysesonPris: hoysesonPris ? Number(hoysesonPris) : null,
        harUnloc,
        unlocLockId: harUnloc && unlocLockId ? unlocLockId : undefined,
        harTelemetrics,
        telemetricsPortId: harTelemetrics && telemetricsPortId ? telemetricsPortId : undefined,
        helgeMode,
        helgePris: helgeMode && helgePris ? Number(helgePris) : undefined,
        arrangementModus,
        arrangementPris: arrangementModus && arrangementPris ? Number(arrangementPris) : undefined,
        priser: {
          natt:   priser.natt   ? Number(priser.natt)   : null,
          time:   priser.time   ? Number(priser.time)   : null,
          dag:    priser.dag    ? Number(priser.dag)    : null,
          uke:    priser.uke    ? Number(priser.uke)    : null,
          maaned: priser.maaned ? Number(priser.maaned) : null,
        },
      }
    }, {
      onSuccess: (data) => {
        setSuccess(true);
        if (data && typeof data === "object" && "id" in data) {
          setNewSpaceId((data as { id: number }).id);
        }
        queryClient.invalidateQueries({ queryKey: getGetMySpacesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
      }
    });
  };

  const hasFriPrice = priser.time || priser.dag || priser.uke || priser.maaned || priser.natt;
  const PRICE_MINS = isSelskap
    ? { natt: 0, time: 500, dag: 2000, uke: 0, maaned: 0 } as const
    : isOffice
    ? { natt: 0, time: 100, dag: 200, uke: 800, maaned: 2000 } as const
    : { natt: 150, time: 50, dag: 200, uke: 800, maaned: 500 } as const;
  const hasPriceError = (Object.entries(PRICE_MINS) as [keyof typeof PRICE_MINS, number][]).some(
    ([key, min]) => Number(priser[key]) > 0 && Number(priser[key]) < min
  );
  const friMarked = friPrisBydel ? getMarkedPriser(friPrisBydel) : null;
  const smartAnbefalt = getSmartAnbefalt();
  const smartDemand = DEMAND_BY_DISTRICT[smartBydel];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-[440px] h-full overflow-y-auto"
        style={{ background: "#0D1B2A", boxShadow: "-4px 0 40px rgba(0,0,0,0.5)" }}
        data-testid="register-space-panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Lei ut din plass
            </h2>
            <p className="text-xs text-white/50">Steg {success ? 3 : step} av 3</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white" data-testid="button-close-panel">
            <X size={20} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-5 py-3">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className="h-1 flex-1 rounded-full transition-all"
              style={{ background: s <= (success ? 3 : step) ? "#00B4D8" : "rgba(255,255,255,0.1)" }}
            />
          ))}
        </div>

        <div className="p-5">
          {success ? (
            /* Step 3: Success */
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                Plassen er registrert!
              </h3>
              <p className="text-white/60 text-sm mb-4">
                Din plass vil bli gjennomgått og publisert innen kort tid.
              </p>
              {(() => {
                const e = getEarningsBreakdown();
                if (!e) return (
                  <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(0,180,216,0.1)", border: "1px solid rgba(0,180,216,0.25)" }}>
                    <p className="text-white/60 text-sm text-center">Din plass vil bli publisert snart!</p>
                  </div>
                );
                return (
                  <div className="rounded-2xl overflow-hidden mb-4" style={{ border: "1px solid rgba(0,180,216,0.3)" }}>
                    <div className="px-4 pt-3 pb-2" style={{ background: "rgba(0,180,216,0.08)" }}>
                      <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>ESTIMERT MÅNEDSINNTEKT</p>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>Din listepris</span>
                        <span className="font-semibold text-white">{e.brutto.toLocaleString("nb-NO")} kr/mnd</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: "rgba(255,255,255,0.6)" }}>Ledi sin andel 8%</span>
                        <span style={{ color: "#F87171" }}>−{e.fee.toLocaleString("nb-NO")} kr</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3" style={{ background: "rgba(0,180,216,0.18)", borderTop: "1px solid rgba(0,180,216,0.2)" }}>
                      <span className="font-bold text-white text-sm">Du mottar</span>
                      <span className="text-xl font-bold" style={{ color: "#00B4D8" }}>{e.netto.toLocaleString("nb-NO")} kr/mnd</span>
                    </div>
                    <div className="flex justify-between text-xs px-4 py-2" style={{ background: "rgba(0,0,0,0.15)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}>Per år</span>
                      <span className="font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>{e.yearly.toLocaleString("nb-NO")} kr</span>
                    </div>
                  </div>
                );
              })()}
              {/* Image upload section */}
              <ImageUploadSection spaceId={newSpaceId} uploadState={uploadState} setUploadState={setUploadState} uploadedImageUrl={uploadedImageUrl} setUploadedImageUrl={setUploadedImageUrl} />

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-white mt-2"
                style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
              >
                Flott!
              </button>
            </div>

          ) : step === 1 ? (
            /* Step 1: Info */
            <>
              <h3 className="text-white font-semibold mb-4">Om plassen din</h3>
              <div className="grid grid-cols-2 gap-2 mb-5">
                {TYPES.map(t => (
                  <button
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className="p-3 rounded-xl border-2 flex items-center gap-2 transition-all"
                    style={{
                      borderColor: type === t.key ? "#00B4D8" : "rgba(255,255,255,0.1)",
                      background: type === t.key ? "rgba(0,180,216,0.1)" : "rgba(255,255,255,0.05)",
                    }}
                    data-testid={`button-type-${t.key}`}
                  >
                    <span>{t.emoji}</span>
                    <span className="text-sm text-white font-medium">{t.label}</span>
                  </button>
                ))}
              </div>

              <input
                value={tittel}
                onChange={e => setTittel(e.target.value)}
                placeholder="Tittel (valgfritt)"
                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 mb-3 text-sm focus:outline-none focus:border-[#00B4D8]"
                data-testid="input-space-title"
              />
              <input
                value={adresse}
                onChange={e => setAdresse(e.target.value)}
                placeholder="Adresse *"
                className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 mb-3 text-sm focus:outline-none focus:border-[#00B4D8]"
                data-testid="input-space-address"
              />
              <div className="grid grid-cols-2 gap-2 mb-5">
                <input
                  value={by}
                  onChange={e => setBy(e.target.value)}
                  placeholder="By *"
                  className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#00B4D8]"
                  data-testid="input-space-city"
                />
                <input
                  value={postnummer}
                  onChange={e => setPostnummer(e.target.value)}
                  placeholder="Postnummer *"
                  className="px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#00B4D8]"
                  data-testid="input-space-postnummer"
                />
              </div>

              {/* Camping-specific fields */}
              {isCamping && (
                <div
                  className="rounded-2xl p-4 mb-4"
                  style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)" }}
                >
                  <p className="text-sm font-bold text-white mb-3">🏕️ Camping-detaljer</p>
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-xs text-white/50 block mb-1">Antall plasser</label>
                      <input
                        type="number"
                        value={antallPlasser}
                        onChange={e => setAntallPlasser(e.target.value)}
                        placeholder="f.eks. 10"
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#00B4D8]"
                        data-testid="input-antall-plasser"
                      />
                    </div>
                    {(type === "bobil" || type === "bobil_strom" || type === "bobil_full") && (
                      <>
                        <div>
                          <label className="text-xs text-white/50 block mb-1">Maks kjøretøylengde</label>
                          <div className="flex gap-2">
                            {MAKS_LENGDER.map(l => (
                              <button key={l} onClick={() => setMaksLengde(l === maksLengde ? "" : l)}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                                style={{
                                  background: maksLengde === l ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.08)",
                                  border: `1px solid ${maksLengde === l ? "#00B4D8" : "rgba(255,255,255,0.15)"}`,
                                  color: maksLengde === l ? "#00B4D8" : "rgba(255,255,255,0.6)",
                                }}
                              >{l}</button>
                            ))}
                          </div>
                        </div>
                        {(type === "bobil_strom" || type === "bobil_full") && (
                          <div>
                            <label className="text-xs text-white/50 block mb-1">Strøm — ampere</label>
                            <div className="flex gap-2">
                              {STROM_AMP.map(a => (
                                <button key={a} onClick={() => setStromAmp(a === stromAmp ? "" : a)}
                                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                                  style={{
                                    background: stromAmp === a ? "rgba(250,204,21,0.2)" : "rgba(255,255,255,0.08)",
                                    border: `1px solid ${stromAmp === a ? "#FACC15" : "rgba(255,255,255,0.15)"}`,
                                    color: stromAmp === a ? "#FACC15" : "rgba(255,255,255,0.6)",
                                  }}
                                >{a}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setOvernattingTillatt(v => !v)}
                        className="flex items-center gap-2 text-sm transition-all"
                        style={{ color: overnattingTillatt ? "#00B4D8" : "rgba(255,255,255,0.5)" }}
                      >
                        <span className="w-5 h-5 rounded-md flex items-center justify-center"
                          style={{ background: overnattingTillatt ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.1)", border: `1px solid ${overnattingTillatt ? "#00B4D8" : "rgba(255,255,255,0.2)"}` }}>
                          {overnattingTillatt && "✓"}
                        </span>
                        🌙 Overnatting tillatt
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Selskap-specific fields */}
              {isSelskap && (
                <div
                  className="rounded-2xl p-4 mb-4"
                  style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.25)" }}
                >
                  <p className="text-sm font-bold text-white mb-3">🎉 Selskapslokale</p>
                  <div className="mb-3">
                    <label className="text-xs text-white/50 block mb-1">Maks antall gjester</label>
                    <select
                      value={antallPlasser}
                      onChange={e => setAntallPlasser(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-[#EC4899]"
                      style={{ colorScheme: "dark" }}
                      data-testid="select-antall-gjester"
                    >
                      <option value="">Velg kapasitet</option>
                      <option value="10">Opptil 10 gjester</option>
                      <option value="25">Opptil 25 gjester</option>
                      <option value="50">Opptil 50 gjester</option>
                      <option value="100">Opptil 100 gjester</option>
                      <option value="150">Opptil 150 gjester</option>
                      <option value="200">200+ gjester</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Office-specific fields */}
              {isOffice && (
                <div
                  className="rounded-2xl p-4 mb-4"
                  style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)" }}
                >
                  <p className="text-sm font-bold text-white mb-3">🏢 Kontordetaljer</p>
                  <div>
                    <label className="text-xs text-white/50 block mb-1">
                      {type === "moterom" ? "Kapasitet (antall personer)" : "Antall tilgjengelige plasser"}
                    </label>
                    <input
                      type="number"
                      value={antallPlasser}
                      onChange={e => setAntallPlasser(e.target.value)}
                      placeholder={type === "moterom" ? "f.eks. 8" : "f.eks. 5"}
                      className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#00B4D8]"
                      data-testid="input-antall-plasser-kontor"
                    />
                  </div>
                </div>
              )}

              <p className="text-white/60 text-sm font-semibold mb-2">Fasiliteter</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {(isSelskap ? SELSKAP_FACILITIES : isOffice ? OFFICE_FACILITIES : isCamping ? CAMPING_FACILITIES : FACILITIES).map(f => (
                  <button
                    key={f}
                    onClick={() => toggleFacility(f)}
                    className="px-3 py-1.5 rounded-xl text-sm transition-all"
                    style={{
                      background: fasiliteter.includes(f) ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.08)",
                      border: `1px solid ${fasiliteter.includes(f) ? "#00B4D8" : "rgba(255,255,255,0.15)"}`,
                      color: fasiliteter.includes(f) ? "#00B4D8" : "rgba(255,255,255,0.6)",
                    }}
                    data-testid={`button-facility-${f}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {isCamping && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {FACILITIES.filter(f => !CAMPING_FACILITIES.includes(f)).map(f => (
                    <button
                      key={f}
                      onClick={() => toggleFacility(f)}
                      className="px-3 py-1.5 rounded-xl text-xs transition-all"
                      style={{
                        background: fasiliteter.includes(f) ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${fasiliteter.includes(f) ? "#00B4D8" : "rgba(255,255,255,0.1)"}`,
                        color: fasiliteter.includes(f) ? "#00B4D8" : "rgba(255,255,255,0.4)",
                      }}
                    >{f}</button>
                  ))}
                </div>
              )}

              {/* Unloc smart lock toggle */}
              <div
                className="rounded-2xl p-4 mb-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <button
                  onClick={() => setHarUnloc(p => !p)}
                  className="flex items-center gap-3 w-full text-left"
                >
                  <div
                    className="w-10 h-6 rounded-full transition-all flex-shrink-0 relative"
                    style={{ background: harUnloc ? "#00B4D8" : "rgba(255,255,255,0.15)" }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: harUnloc ? "calc(100% - 20px)" : "4px" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      🔓 Koble til Unloc-lås
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(0,180,216,0.2)", color: "#00B4D8" }}
                      >
                        Anbefalt
                      </span>
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Leietaker åpner låsen direkte i appen — ingen nøkler
                    </p>
                  </div>
                </button>

                {harUnloc && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/50 mb-1.5">Unloc lås-ID <span className="text-white/25">(fra Unloc-appen)</span></p>
                    <input
                      type="text"
                      value={unlocLockId}
                      onChange={e => setUnlocLockId(e.target.value)}
                      placeholder="f.eks. LOCK-A3F8B2"
                      className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(0,180,216,0.3)" }}
                    />
                    <div
                      className="mt-2 rounded-xl p-2.5 text-xs"
                      style={{ background: "rgba(0,180,216,0.08)", color: "rgba(255,255,255,0.5)" }}
                    >
                      ✅ Booking bekreftes → 🔓 Ledi gir tilgang → 📱 Leietaker trykker Åpne → 🚪 Låsen åpner automatisk
                    </div>
                  </div>
                )}
              </div>

              {/* Telemetrics port/gate toggle */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <button
                  onClick={() => setHarTelemetrics(p => !p)}
                  className="flex items-center gap-3 w-full text-left"
                >
                  <div
                    className="w-10 h-6 rounded-full transition-all flex-shrink-0 relative"
                    style={{ background: harTelemetrics ? "#7C3AED" : "rgba(255,255,255,0.15)" }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: harTelemetrics ? "calc(100% - 20px)" : "4px" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      🚪 Koble til Telemetrics port-styring
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Leietaker åpner garasjeporten direkte i appen — ingen brikker
                    </p>
                  </div>
                </button>

                {harTelemetrics && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/50 mb-1.5">Telemetrics port-ID <span className="text-white/25">(fra Telemetrics-appen)</span></p>
                    <input
                      type="text"
                      value={telemetricsPortId}
                      onChange={e => setTelemetricsPortId(e.target.value)}
                      placeholder="f.eks. TLM-G4-0081"
                      className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-white/25 outline-none"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(124,58,237,0.3)" }}
                    />
                    <div
                      className="mt-2 rounded-xl p-2.5 text-xs"
                      style={{ background: "rgba(124,58,237,0.08)", color: "rgba(255,255,255,0.5)" }}
                    >
                      ✅ Betaling bekreftet → 🔑 Kode genereres → 📱 Leietaker trykker Åpne port → 🚗 Porten åpner
                    </div>
                  </div>
                )}
              </div>

              {/* Natteparkering toggle */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: "rgba(30,58,95,0.25)", border: "1px solid rgba(96,165,250,0.2)" }}
              >
                <button
                  onClick={() => setErNatteparkering(p => !p)}
                  className="flex items-center gap-3 w-full text-left"
                >
                  <div
                    className="w-10 h-6 rounded-full transition-all flex-shrink-0 relative"
                    style={{ background: erNatteparkering ? "#1E3A5F" : "rgba(255,255,255,0.15)", border: erNatteparkering ? "1px solid rgba(96,165,250,0.5)" : "none" }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: erNatteparkering ? "calc(100% - 20px)" : "4px" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                      🌙 Kun natteparkering
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: "rgba(96,165,250,0.15)", color: "#60A5FA" }}
                      >
                        22:00 – 08:00
                      </span>
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      Perfekt for restaurantgjester, konserter og natteliv
                    </p>
                  </div>
                </button>

                {erNatteparkering && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                    <div
                      className="rounded-xl p-2.5 text-xs"
                      style={{ background: "rgba(96,165,250,0.08)", color: "rgba(255,255,255,0.5)" }}
                    >
                      🌙 Hverdagsnetter · 💜 Fredags- og lørdagnetter prises automatisk høyere
                    </div>
                    <div>
                      <p className="text-xs text-white/50 mb-1.5">
                        Helgetillegg (fredags- og lørdagnatt)
                        <span className="ml-1 font-bold text-purple-300">+{nattPrisHelgTillegg}%</span>
                      </p>
                      <input
                        type="range"
                        min={10}
                        max={50}
                        step={5}
                        value={nattPrisHelgTillegg}
                        onChange={e => setNattPrisHelgTillegg(Number(e.target.value))}
                        className="w-full accent-purple-400"
                      />
                      <div className="flex justify-between text-xs text-white/25 mt-0.5">
                        <span>+10%</span><span>+50%</span>
                      </div>
                    </div>
                    {priser.natt && (
                      <div className="flex gap-2 text-xs">
                        <div className="flex-1 rounded-xl p-2 text-center"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <div className="text-white/40 mb-0.5">Hverdag</div>
                          <div className="text-white font-bold">{priser.natt} kr</div>
                        </div>
                        <div className="flex-1 rounded-xl p-2 text-center"
                          style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}>
                          <div className="text-purple-300 mb-0.5">Helg 🎉</div>
                          <div className="text-white font-bold">{Math.round(Number(priser.natt) * (1 + nattPrisHelgTillegg / 100))} kr</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Helgeparkering toggle */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: "rgba(217,119,6,0.12)", border: "1px solid rgba(217,119,6,0.25)" }}
              >
                <button
                  onClick={() => setHelgeMode(p => !p)}
                  className="flex items-center gap-3 w-full text-left"
                >
                  <div
                    className="w-10 h-6 rounded-full transition-all flex-shrink-0 relative"
                    style={{ background: helgeMode ? "#D97706" : "rgba(255,255,255,0.15)", border: helgeMode ? "1px solid rgba(251,191,36,0.5)" : "none" }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: helgeMode ? "calc(100% - 20px)" : "4px" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">🌅 Kun helgeparkering</p>
                    <p className="text-xs text-white/40 mt-0.5">Kun tilgjengelig lørdag og søndag – perfekt for kontorbygg og næringsparker</p>
                  </div>
                </button>
                {helgeMode && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/50 mb-2">Helgepris (valgfritt – la stå tomt for samme pris)</p>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="F.eks. 100"
                        value={helgePris}
                        onChange={e => setHelgePris(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 outline-none placeholder-white/20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40">kr/time</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Arrangementsmodus toggle */}
              <div
                className="rounded-2xl p-4 mb-4"
                style={{ background: "rgba(139,92,246,0.10)", border: "1px solid rgba(139,92,246,0.25)" }}
              >
                <button
                  onClick={() => setArrangementModus(p => !p)}
                  className="flex items-center gap-3 w-full text-left"
                >
                  <div
                    className="w-10 h-6 rounded-full transition-all flex-shrink-0 relative"
                    style={{ background: arrangementModus ? "#7C3AED" : "rgba(255,255,255,0.15)", border: arrangementModus ? "1px solid rgba(167,139,250,0.5)" : "none" }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: arrangementModus ? "calc(100% - 20px)" : "4px" }}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">🎪 Åpne ved arrangementer</p>
                    <p className="text-xs text-white/40 mt-0.5">Ledi varsler deg når det er arrangement nær plassen – du velger om du vil åpne</p>
                  </div>
                </button>
                {arrangementModus && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/50 mb-2">Arrangementspris per time</p>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="F.eks. 250"
                        value={arrangementPris}
                        onChange={e => setArrangementPris(e.target.value)}
                        className="w-full rounded-xl px-4 py-2.5 text-sm text-white bg-white/5 border border-white/10 outline-none placeholder-white/20"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40">kr/time</span>
                    </div>
                    <p className="text-xs text-white/30 mt-2">💡 Smart Pris foreslår automatisk høyere pris ved høy etterspørsel</p>
                  </div>
                )}
              </div>

              {/* Borettslag warning */}
              <div className="rounded-2xl p-3.5 mb-3" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.22)" }}>
                <div className="flex items-start gap-2.5">
                  <span className="text-base shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <p className="text-xs font-semibold text-white mb-0.5">Bor du i borettslag eller sameie?</p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Sjekk at utleie er tillatt i dine vedtekter. Mange borettslag krever styrets godkjenning. Ledi er ikke ansvarlig for brudd på vedtekter eller naboloven.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!adresse || !by || !postnummer}
                className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                data-testid="button-next-step-1"
              >
                Neste <ChevronRight size={16} />
              </button>
            </>

          ) : (
            /* Step 2: Pricing */
            <>
              {/* Pricing model toggle — large prominent cards */}
              <h3 className="text-white font-semibold mb-3">Velg prismodell</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPrisModell("fri")}
                  className="p-4 rounded-2xl border-2 text-left transition-all relative"
                  style={{
                    borderColor: prisModell === "fri" ? "#00B4D8" : "rgba(255,255,255,0.1)",
                    background: prisModell === "fri"
                      ? "linear-gradient(135deg, rgba(0,180,216,0.15), rgba(0,119,168,0.1))"
                      : "rgba(255,255,255,0.04)",
                  }}
                  data-testid="button-pris-fri"
                >
                  {prisModell === "fri" && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 size={16} style={{ color: "#00B4D8" }} />
                    </div>
                  )}
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-sm font-bold text-white mb-1">Fri prissetting</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Du setter prisen selv
                  </div>
                </button>
                <button
                  onClick={() => setPrisModell("smart")}
                  className="p-4 rounded-2xl border-2 text-left transition-all relative"
                  style={{
                    borderColor: prisModell === "smart" ? "#8B5CF6" : "rgba(255,255,255,0.1)",
                    background: prisModell === "smart"
                      ? "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.1))"
                      : "rgba(255,255,255,0.04)",
                  }}
                  data-testid="button-pris-smart"
                >
                  {prisModell === "smart" && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 size={16} style={{ color: "#8B5CF6" }} />
                    </div>
                  )}
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="text-sm font-bold text-white mb-1">Smart Pris</div>
                  <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Vi foreslår optimal pris
                  </div>
                </button>
              </div>

              {/* ── FRI PRISSETTING ── */}
              {prisModell === "fri" && (() => {
                const priceFields = [
                  ...(isCamping ? [{ key: "natt" as const, label: "Per natt", unit: "kr/natt", min: 150 }] : []),
                  { key: "time"   as const, label: "Per time",  unit: "kr/time", min: 50  },
                  { key: "dag"    as const, label: "Per dag",   unit: "kr/dag",  min: 200 },
                  { key: "uke"    as const, label: "Per uke",   unit: "kr/uke",  min: 800 },
                  { key: "maaned" as const, label: "Per måned", unit: "kr/mnd",  min: 500 },
                ];
                const earnings = getEarningsBreakdown();
                return (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-white mb-0.5">Sett dine priser</p>
                    <p className="text-xs text-white/40 mb-4">
                      Fyll kun de periodene du tilbyr — tomme felter vises ikke til leietaker
                    </p>
                    <div className="space-y-3">
                      {priceFields.map(field => {
                        const val = Number(priser[field.key]);
                        const tooLow = val > 0 && val < field.min;
                        const hint = getMktHint(friPrisBydel, field.key);
                        return (
                          <div key={field.key}>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-white/60 w-24 shrink-0">{field.label}</span>
                              <div
                                className="flex-1 flex items-center rounded-xl overflow-hidden"
                                style={{
                                  background: "rgba(255,255,255,0.08)",
                                  border: `1px solid ${tooLow ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.15)"}`,
                                }}
                              >
                                <input
                                  type="number"
                                  value={priser[field.key]}
                                  onChange={e => setPriser(p => ({ ...p, [field.key]: e.target.value }))}
                                  placeholder="–"
                                  className="flex-1 px-3 py-2.5 bg-transparent text-white placeholder:text-white/25 text-sm focus:outline-none"
                                  data-testid={`input-price-${field.key}`}
                                />
                                <span className="px-3 text-xs text-white/30 shrink-0">{field.unit}</span>
                              </div>
                            </div>
                            {tooLow && (
                              <p className="text-xs mt-1 ml-[108px]" style={{ color: "#EF4444" }}>
                                Minimum {field.min.toLocaleString("nb-NO")} kr
                              </p>
                            )}
                            <p className="text-[11px] mt-0.5 ml-[108px] text-white/25">
                              Andre tar ca. {hint.min.toLocaleString("nb-NO")}–{hint.max.toLocaleString("nb-NO")} {field.unit}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Optional bydel for localised market hints */}
                    <div className="mt-4">
                      <label className="text-xs text-white/40 block mb-1.5">
                        Oppdater markedshint for ditt område (valgfritt)
                      </label>
                      <select
                        value={friPrisBydel}
                        onChange={e => setFriPrisBydel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-white text-sm focus:outline-none focus:border-[#00B4D8]"
                        style={{ colorScheme: "dark" }}
                        data-testid="select-fri-bydel"
                      >
                        <option value="">Velg bydel...</option>
                        {smartPrisData?.map(d => (
                          <option key={d.navn} value={d.navn}>{d.navn}</option>
                        ))}
                      </select>
                    </div>

                    {/* Seasonal pricing (camping only) */}
                    {isCamping && (
                      <div
                        className="rounded-2xl p-4 mt-4"
                        style={{ background: "rgba(22,163,74,0.07)", border: "1px solid rgba(22,163,74,0.2)" }}
                      >
                        <p className="text-sm font-semibold text-white mb-3">🌤️ Sesongpriser (valgfritt)</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-white/50 block mb-1">Lavsesong (kr/natt)</label>
                            <input
                              type="number"
                              value={lavsesonPris}
                              onChange={e => setLavsesonPris(e.target.value)}
                              placeholder="–"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#00B4D8]"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-white/50 block mb-1">Høysesong (kr/natt)</label>
                            <input
                              type="number"
                              value={hoysesonPris}
                              onChange={e => setHoysesonPris(e.target.value)}
                              placeholder="–"
                              className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-[#00B4D8]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Live earnings breakdown */}
                    {earnings && (
                      <div className="rounded-2xl overflow-hidden mt-4" style={{ border: "1px solid rgba(0,180,216,0.3)" }}>
                        <div className="px-4 pt-3 pb-2" style={{ background: "rgba(0,180,216,0.08)" }}>
                          <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>LIVE BEREGNING</p>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-white/60">Din listepris</span>
                            <span className="font-semibold text-white">{earnings.brutto.toLocaleString("nb-NO")} kr/mnd</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/60">Ledi sin andel 8%</span>
                            <span style={{ color: "#F87171" }}>−{earnings.fee.toLocaleString("nb-NO")} kr</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center px-4 py-3" style={{ background: "rgba(0,180,216,0.18)", borderTop: "1px solid rgba(0,180,216,0.2)" }}>
                          <span className="font-bold text-white text-sm">Du mottar</span>
                          <span className="text-base font-bold" style={{ color: "#00B4D8" }}>{earnings.netto.toLocaleString("nb-NO")} kr/mnd</span>
                        </div>
                        <div className="flex justify-between text-xs px-4 py-2" style={{ background: "rgba(0,0,0,0.15)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <span className="text-white/40">Per år</span>
                          <span className="font-semibold text-white/60">{earnings.yearly.toLocaleString("nb-NO")} kr</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ── SMART PRIS ── */}
              {prisModell === "smart" && (
                <div className="mb-4">

                  {/* Egne priser — vises ØVERST, alltid synlig */}
                  <div
                    className="rounded-2xl p-4 mb-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(0,180,216,0.12), rgba(0,119,168,0.08))",
                      border: "2px solid rgba(0,180,216,0.4)",
                    }}
                  >
                    <p className="text-sm font-bold text-white mb-0.5">
                      🎯 Legg til egne priser i tillegg
                    </p>
                    <p className="text-xs mb-3" style={{ color: "rgba(0,180,216,0.8)" }}>
                      Valgfritt — vises ved siden av Smart Pris. Tomme felter ignoreres.
                    </p>
                    <div className="space-y-2.5">
                      {([
                        ...(isCamping ? [{ key: "natt" as const, label: "Per natt", unit: "kr/natt" }] : []),
                        { key: "time"   as const, label: "Per time",  unit: "kr/time" },
                        { key: "dag"    as const, label: "Per dag",   unit: "kr/dag"  },
                        { key: "uke"    as const, label: "Per uke",   unit: "kr/uke"  },
                        { key: "maaned" as const, label: "Per måned", unit: "kr/mnd"  },
                      ]).map(field => (
                        <div key={field.key} className="flex items-center gap-3">
                          <span className="text-sm text-white/70 w-24 shrink-0">{field.label}</span>
                          <div
                            className="flex-1 flex items-center rounded-xl overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(0,180,216,0.3)" }}
                          >
                            <input
                              type="number"
                              value={priser[field.key]}
                              onChange={e => setPriser(p => ({ ...p, [field.key]: e.target.value }))}
                              placeholder="–"
                              className="flex-1 px-3 py-2.5 bg-transparent text-white placeholder:text-white/30 text-sm focus:outline-none"
                              data-testid={`input-smart-price-${field.key}`}
                            />
                            <span className="px-3 text-xs shrink-0" style={{ color: "rgba(0,180,216,0.7)" }}>{field.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <label className="text-xs text-white/50 block mb-1.5">Velg din bydel for Smart Pris</label>
                  <select
                    value={smartBydel}
                    onChange={e => setSmartBydel(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white mb-4 text-sm focus:outline-none focus:border-[#8B5CF6]"
                    style={{ colorScheme: "dark" }}
                    data-testid="select-smart-bydel"
                  >
                    <option value="">Velg bydel...</option>
                    {smartPrisData?.map(d => (
                      <option key={d.navn} value={d.navn}>{d.navn}</option>
                    ))}
                  </select>
                  {/* Smart Pris 2.0 dynamic price override */}
                  {smartBydel && dynamicData && !dynamicLoading && (
                    <div
                      className="rounded-2xl p-4 mb-4"
                      style={{
                        background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(109,40,217,0.1))",
                        border: "2px solid rgba(139,92,246,0.5)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">🤖 Smart Pris 2.0</span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: "#8B5CF6", color: "#fff" }}
                          >
                            LIVE
                          </span>
                        </div>
                        <span
                          className="text-sm font-bold"
                          style={{ color: dynamicData.justering.startsWith("+") ? "#34D399" : dynamicData.justering === "0%" ? "#A78BFA" : "#F87171" }}
                        >
                          {dynamicData.justering}
                        </span>
                      </div>
                      <p className="text-2xl font-bold mb-1" style={{ color: "#A78BFA", fontFamily: "'Syne', sans-serif" }}>
                        {dynamicData.adjustedPris.toLocaleString("nb-NO")} kr/mnd
                      </p>
                      <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                        Basispris {dynamicData.basePris.toLocaleString("nb-NO")} kr · justert i sanntid
                      </p>
                      <div className="space-y-2">
                        {dynamicData.faktorer.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 rounded-xl px-3 py-2"
                            style={{
                              background: f.type === "positiv"
                                ? "rgba(52,211,153,0.08)"
                                : f.type === "negativ"
                                ? "rgba(248,113,113,0.08)"
                                : "rgba(255,255,255,0.05)",
                              border: `1px solid ${f.type === "positiv" ? "rgba(52,211,153,0.2)" : f.type === "negativ" ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.08)"}`,
                            }}
                          >
                            <span className="text-base shrink-0">{f.ikon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-white">{f.tittel}</span>
                                <span
                                  className="text-xs font-bold shrink-0"
                                  style={{ color: f.type === "positiv" ? "#34D399" : f.type === "negativ" ? "#F87171" : "rgba(255,255,255,0.5)" }}
                                >
                                  {f.effekt}
                                </span>
                              </div>
                              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{f.beskrivelse}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {smartBydel && dynamicLoading && (
                    <div className="rounded-2xl p-4 mb-4 flex items-center gap-3" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin shrink-0" />
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Henter sanntidsdata – vær, arrangementer, etterspørsel…</span>
                    </div>
                  )}

                  {smartBydel && smartAnbefalt && (() => {
                    const d = smartPrisData?.find(x => x.navn === smartBydel)!;
                    return (
                      <div
                        className="rounded-2xl p-4 mb-4"
                        style={{
                          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.08))",
                          border: "1px solid rgba(139,92,246,0.35)",
                        }}
                      >
                        <p className="text-xs text-white/50 mb-1">Anbefalt Smart Pris</p>
                        <p
                          className="text-3xl font-bold mb-1"
                          style={{ color: "#A78BFA", fontFamily: "'Syne', sans-serif" }}
                        >
                          {smartAnbefalt.toLocaleString("nb-NO")} kr/mnd
                        </p>
                        <p className="text-xs text-white/40 mb-4">
                          Du mottar ca. {Math.round(smartAnbefalt * 0.92).toLocaleString("nb-NO")} kr/mnd etter 8% gebyr
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
                            <p className="text-[10px] text-white/40 mb-0.5">Prisintervall</p>
                            <p className="text-xs font-bold text-white">
                              {d.parkeringMin.toLocaleString("nb-NO")}–{d.parkeringMax.toLocaleString("nb-NO")}
                            </p>
                            <p className="text-[10px] text-white/40">kr/mnd</p>
                          </div>
                          <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
                            <p className="text-[10px] text-white/40 mb-0.5">Etterspørsel</p>
                            <p className="text-xs font-bold" style={{ color: smartDemand?.color ?? "#A78BFA" }}>
                              {smartDemand?.level ?? "–"}
                            </p>
                          </div>
                          <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)" }}>
                            <p className="text-[10px] text-white/40 mb-0.5">Typisk booking</p>
                            <p className="text-xs font-bold text-white">{smartDemand?.days ?? "–"} dager</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              )}

              {/* Subscription section */}
              <div className="mt-5 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="text-white font-semibold text-sm mb-3">📅 Abonnementsleie</p>
                <button
                  type="button"
                  onClick={() => setTilbyrAbonnement(v => !v)}
                  className="w-full p-3 rounded-xl border-2 text-left flex items-center justify-between transition-all mb-3"
                  style={{
                    borderColor: tilbyrAbonnement ? "#7C3AED" : "rgba(255,255,255,0.1)",
                    background: tilbyrAbonnement ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.05)",
                  }}
                  data-testid="button-toggle-subscription"
                >
                  <div>
                    <div className="text-sm font-bold text-white">Tilby Fast plass</div>
                    <div className="text-xs text-white/50">Fast månedspris – plass alltid reservert</div>
                  </div>
                  <div
                    className="w-10 h-5 rounded-full transition-all relative shrink-0"
                    style={{ background: tilbyrAbonnement ? "#7C3AED" : "rgba(255,255,255,0.15)" }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ left: tilbyrAbonnement ? "calc(100% - 18px)" : "2px" }}
                    />
                  </div>
                </button>
                {tilbyrAbonnement && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/60 block mb-1">Månedspris abonnement (kr)</label>
                      <input
                        type="number"
                        value={abonnementsPris}
                        onChange={e => setAbonnementsPris(e.target.value)}
                        placeholder="F.eks. 1800"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border text-white placeholder:text-white/40 text-sm focus:outline-none"
                        style={{ borderColor: "rgba(124,58,237,0.4)" }}
                        data-testid="input-abonnements-pris"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/60 block mb-1">Minimum bindingstid</label>
                      <select
                        value={minBindingstid}
                        onChange={e => setMinBindingstid(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-xl bg-white/10 border text-white text-sm focus:outline-none"
                        style={{ borderColor: "rgba(124,58,237,0.4)", colorScheme: "dark" }}
                        data-testid="select-min-bindingstid"
                      >
                        <option value={1}>1 måned</option>
                        <option value={3}>3 måneder</option>
                        <option value={6}>6 måneder</option>
                        <option value={12}>12 måneder</option>
                      </select>
                    </div>
                    {Number(abonnementsPris) > 0 && (
                      <div className="rounded-xl p-3" style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)" }}>
                        <p className="text-xs text-white/60">Din månedsinntekt (abonnement)</p>
                        <p className="text-xl font-bold" style={{ color: "#A78BFA" }}>
                          {Math.round(Number(abonnementsPris) * 0.92).toLocaleString("nb-NO")} kr/mnd
                        </p>
                        <p className="text-xs text-white/40">etter 8% gebyr</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Insurance confirmation */}
              <div
                className="mt-5 p-4 rounded-2xl cursor-pointer select-none"
                style={{
                  background: harForsikring ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.06)",
                  border: `1px solid ${harForsikring ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.2)"}`,
                  transition: "all 0.2s",
                }}
                onClick={() => setHarForsikring(v => !v)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all"
                    style={{
                      background: harForsikring ? "#10B981" : "rgba(255,255,255,0.08)",
                      border: `2px solid ${harForsikring ? "#10B981" : "rgba(255,255,255,0.2)"}`,
                    }}
                  >
                    {harForsikring && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white leading-snug">
                      Jeg bekrefter at jeg har gyldig forsikring for utleie av denne plassen
                    </p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
                      Ledi har ingen egen forsikring. Jeg bekrefter at jeg som utleier har gyldig forsikring som dekker eiendommen mot skader, tyveri og ulykker i forbindelse med utleie. Jeg forstår at alt ansvar ved hendelser på utleid plass ligger hos utleier og leietaker — ikke Ledi.{" "}
                      <a href="/vilkar" target="_blank" onClick={e => e.stopPropagation()} className="underline" style={{ color: "#00B4D8" }}>
                        Les brukervilkår
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom navigation */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl font-bold text-white/70 border border-white/20 flex items-center justify-center gap-2"
                  data-testid="button-prev-step"
                >
                  <ChevronLeft size={16} /> Tilbake
                </button>
                {prisModell === "fri" ? (
                  <button
                    onClick={handleSubmit}
                    disabled={createSpace.isPending || !hasFriPrice || hasPriceError || !harForsikring}
                    className="flex-[2] py-3 rounded-xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                    data-testid="button-submit-space"
                  >
                    <CheckCircle2 size={16} />
                    {createSpace.isPending ? "Registrerer..." : "Registrer plass"}
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={createSpace.isPending || !smartBydel || !harForsikring}
                    className="flex-[2] py-3 rounded-xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #8B5CF6)" }}
                    data-testid="button-submit-space"
                  >
                    <CheckCircle2 size={16} />
                    {createSpace.isPending ? "Registrerer..." : !smartBydel ? "Velg bydel først" : !harForsikring ? "Bekreft forsikring først" : "Godta Smart Pris"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
