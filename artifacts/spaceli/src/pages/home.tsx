import { useState, useMemo, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSEO } from "@/lib/useSEO";
import { Search, Star, Shield, MapPin, SlidersHorizontal, Bell, Zap, Clock, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import LeafletMap from "@/components/LeafletMap";
import LediLogo from "@/components/LediLogo";
import SpaceCard from "@/components/SpaceCard";
import BookingModal from "@/components/BookingModal";
import RegisterSpacePanel from "@/components/RegisterSpacePanel";
import AddressSearch, { type GeoResult } from "@/components/AddressSearch";
import AlarmModal from "@/components/AlarmModal";
import LaunchCountdown from "@/components/LaunchCountdown";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { useListSpaces, useGetStatsSummary } from "@workspace/api-client-react";
import { haversineMeters } from "@/lib/haversine";

const FILTER_TABS = [
  { key: "",            label: "Alle",             color: "#00B4D8" },
  { key: "parking",     label: "🅿️ Parkering",    color: "#00B4D8" },
  { key: "helg",        label: "🌅 Helg",          color: "#F59E0B" },
  { key: "arrangement", label: "🎪 Arrangement",   color: "#8B5CF6" },
  { key: "storage",     label: "📦 Lagerplass",    color: "#F59E0B" },
  { key: "camping",     label: "🏕️ Camping",       color: "#16A34A" },
  { key: "baatplass",   label: "🚤 Båtplass",      color: "#1D4ED8" },
  { key: "henger",      label: "🚛 Henger",        color: "#B45309" },
  { key: "ev",          label: "⚡ Elbil",         color: "#10B981" },
  { key: "natt",        label: "🌙 Natt",          color: "#1E3A5F" },
  { key: "kontor",      label: "🏢 Kontor",        color: "#7C3AED" },
  { key: "selskap",     label: "🎉 Selskap",       color: "#EC4899" },
];

const CAMPING_TYPES  = ["camping", "bobil", "bobil_strom", "bobil_full", "gaard", "baatplass"];
const OFFICE_TYPES   = ["hot_desk", "cellekontor", "moterom", "kreativt_studio", "verksted", "kontor"];
const SELSKAP_TYPES  = ["festsal", "laave", "hytteanneks", "takterrasse", "selskap"];

const FACILITY_FILTERS = [
  { key: "Strøm", label: "⚡ Strøm" },
  { key: "Vann", label: "💧 Vann" },
  { key: "Toalett", label: "🚽 Toalett" },
  { key: "Hund ok", label: "🐕 Hund" },
  { key: "Dusj", label: "🚿 Dusj" },
  { key: "Tømmestasjon", label: "🗑️ Tømmestasjon" },
];

const HENGER_LENGTHS = ["Alle", "6m", "8m", "10m", "10m+"];
const HENGER_UNDERLAG = ["Alle", "Asfalt", "Grus", "Gress"];

const CATEGORY_STATS = [
  { emoji: "🅿️", label: "Parkering"  },
  { emoji: "📦", label: "Lagerplass" },
  { emoji: "🏕️", label: "Camping"   },
  { emoji: "🚤", label: "Båtplass"  },
  { emoji: "🚛", label: "Henger"    },
  { emoji: "⚡", label: "Elbil"     },
  { emoji: "🏢", label: "Kontor"    },
  { emoji: "🎉", label: "Selskap"   },
];

const SORT_OPTIONS = [
  { key: "nyeste", label: "Billigst" },
  { key: "best", label: "Best" },
  { key: "naermest", label: "Nærmest" },
  { key: "smart", label: "Smart Pris" },
];

const KALKULATOR_TYPES = [
  { key: "garasje",  label: "Garasje",  emoji: "🏠" },
  { key: "bod",      label: "Bod",      emoji: "📦" },
  { key: "camping",  label: "Camping",  emoji: "🏕️" },
  { key: "baatplass",label: "Båtplass", emoji: "⚓" },
  { key: "henger",   label: "Henger",   emoji: "🚛" },
  { key: "kontor",   label: "Kontor",   emoji: "🏢" },
  { key: "festsal",  label: "Selskap",  emoji: "🎉" },
];

const KALKULATOR_BYER = [
  { navn: "Oslo Frogner",   garasje: [2800,4000], bod: [1200,2200], camping: [6000,12000], baatplass: [2000,4500], henger: [1500,3000], kontor: [4500,8000],  festsal: [8000,20000] },
  { navn: "Oslo Sentrum",   garasje: [2200,3500], bod: [900,1800],  camping: [5000,9000],  baatplass: [1800,3500], henger: [1200,2500], kontor: [3800,7000],  festsal: [7000,18000] },
  { navn: "Oslo Sagene",    garasje: [1600,2500], bod: [700,1400],  camping: [4000,7000],  baatplass: [1500,2800], henger: [1000,2000], kontor: [2800,5500],  festsal: [5000,12000] },
  { navn: "Bergen",         garasje: [1800,3000], bod: [700,1500],  camping: [3000,6000],  baatplass: [1500,3200], henger: [1000,2200], kontor: [2500,5000],  festsal: [4500,11000] },
  { navn: "Trondheim",      garasje: [1600,2800], bod: [600,1300],  camping: [2800,5500],  baatplass: [1200,2800], henger: [900,1900],  kontor: [2200,4500],  festsal: [4000,10000] },
  { navn: "Stavanger",      garasje: [1800,3200], bod: [700,1400],  camping: [3000,5500],  baatplass: [1500,3500], henger: [1000,2200], kontor: [2500,5000],  festsal: [4500,11000] },
  { navn: "Tromsø",         garasje: [1400,2400], bod: [500,1200],  camping: [2500,4500],  baatplass: [1200,2500], henger: [800,1800],  kontor: [1800,3500],  festsal: [3000,7000]  },
  { navn: "Kristiansand",   garasje: [1200,2200], bod: [500,1100],  camping: [2000,4000],  baatplass: [1200,2800], henger: [800,1600],  kontor: [1600,3200],  festsal: [2800,7000]  },
  { navn: "Drammen",        garasje: [1200,2000], bod: [500,1000],  camping: [2000,3800],  baatplass: [1000,2200], henger: [700,1500],  kontor: [1500,3000],  festsal: [2500,6000]  },
  { navn: "Fredrikstad",    garasje: [1000,1800], bod: [400,900],   camping: [1800,3500],  baatplass: [900,2000],  henger: [600,1400],  kontor: [1200,2500],  festsal: [2000,5000]  },
  { navn: "Sandnes",        garasje: [1400,2500], bod: [600,1200],  camping: [2500,4500],  baatplass: [1200,2800], henger: [800,1700],  kontor: [1800,3500],  festsal: [3000,7000]  },
  { navn: "Bodø",           garasje: [1100,2000], bod: [450,1000],  camping: [2000,4000],  baatplass: [1000,2200], henger: [700,1500],  kontor: [1400,2800],  festsal: [2200,5500]  },
  { navn: "Ålesund",        garasje: [1200,2200], bod: [500,1100],  camping: [2200,4200],  baatplass: [1200,2800], henger: [750,1600],  kontor: [1500,3000],  festsal: [2500,6000]  },
  { navn: "Distrikter",     garasje: [600,1200],  bod: [200,700],   camping: [1000,2500],  baatplass: [500,1500],  henger: [400,1000],  kontor: [800,1800],   festsal: [1500,4000]  },
] as const;

const PARKING_RADII = [200, 500, 1000, 2000, 5000];
const STORAGE_RADII = [500, 1000, 2000, 5000, 10000];

const TYPE_META: Record<string, { emoji: string; verb: string; label: string }> = {
  parking:    { emoji: "🅿️",  verb: "la ut parkeringsplass",  label: "Parkering"  },
  storage:    { emoji: "📦",  verb: "leier ut bod",            label: "Lagerplass" },
  camping:    { emoji: "🏕️", verb: "åpnet campingplass",      label: "Camping"    },
  bobil:      { emoji: "🚐",  verb: "har bobilplass ledig",   label: "Bobil"      },
  bobil_strom:{ emoji: "⚡🚐",verb: "tilbyr bobil m/strøm",   label: "Bobil+strøm"},
  bobil_full: { emoji: "🚿🚐",verb: "tilbyr full bobilservice",label: "Bobil full" },
  gaard:      { emoji: "🏠",  verb: "leier ut gårdsplass",    label: "Gårdsplass" },
  baatplass:  { emoji: "⚓",  verb: "leier ut båtplass",      label: "Båtplass"   },
  henger:     { emoji: "🚛",  verb: "har henger til leie",    label: "Henger"     },
  ev:         { emoji: "⚡",  verb: "tilbyr elbilplass",      label: "Elbil"      },
  business:   { emoji: "🏢",  verb: "leier ut bedriftsplass", label: "Bedrift"    },
  // Kontor-typer
  hot_desk:        { emoji: "💼",  verb: "leier ut hot desk",           label: "Hot desk"        },
  cellekontor:     { emoji: "🚪",  verb: "leier ut cellekontor",        label: "Cellekontor"     },
  moterom:         { emoji: "👥",  verb: "har møterom ledig",           label: "Møterom"         },
  kreativt_studio: { emoji: "🎨",  verb: "leier ut kreativt studio",    label: "Kreativt studio" },
  verksted:        { emoji: "🔧",  verb: "leier ut verksted",           label: "Verksted"        },
  // Selskap-typer
  festsal:         { emoji: "🎉",  verb: "leier ut festsal",            label: "Festsal"         },
  laave:           { emoji: "🏚️", verb: "leier ut låve",               label: "Låve"            },
  hytteanneks:     { emoji: "🛖",  verb: "leier ut hytteanneks",        label: "Hytteanneks"     },
  takterrasse:     { emoji: "🌆",  verb: "leier ut takterrasse",        label: "Takterrasse"     },
};

function distLabel(m: number): string {
  return m < 1000 ? `${Math.round(m)}m unna` : `${(m / 1000).toFixed(1).replace(".", ",")} km unna`;
}

function radiusLabel(m: number): string {
  return m < 1000 ? `${m}m` : `${m / 1000}km`;
}

function defaultRadius(filter: string): number {
  return filter === "storage" ? 2000 : 500;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpaceItem = any;

export default function Home() {
  useSEO({
    title: "Ledi – Finn ledig parkering, lagerplass og camping nær deg",
    description: "Book parkering, lagerplass, camping, båtplass og hengerplass direkte fra private utleiere i Norge. Book på 30 sekunder. Utleier utbetalt samme dag.",
    canonical: "https://ledi.no/",
  });

  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState("");
  const [activePeriod, setActivePeriod] = useState("");
  const [facilityFilters, setFacilityFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("nyeste");
  const [selectedCity, setSelectedCity] = useState("Hele Norge");
  const [selectedSpace, setSelectedSpace] = useState<SpaceItem | null>(null);
  const [showRegisterPanel, setShowRegisterPanel] = useState(false);
  const [prisModellValg, setPrisModellValg] = useState<"fri" | "smart">("fri");
  const [activeMainTab, setActiveMainTab] = useState<"finn" | "lei">("finn");
  const [addressResult, setAddressResult] = useState<GeoResult | null>(null);
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);
  const [radiusM, setRadiusM] = useState(500);
  const [hengerMaksLengde, setHengerMaksLengde] = useState("Alle");
  const [hengerUnderlag, setHengerUnderlag] = useState("Alle");
  const [hengerVendeplass, setHengerVendeplass] = useState(false);
  const [arrangementVenue, setArrangementVenue] = useState("");
  const [kalkulatorType, setKalkulatorType] = useState<"garasje"|"bod"|"camping"|"baatplass"|"henger"|"kontor"|"festsal">("garasje");
  const [kalkulatorBy, setKalkulatorBy] = useState("Oslo Sentrum");
  const [nabolagFulgt, setNabolagFulgt] = useState(false);

  const kalkulatorResult = useMemo(() => {
    const by = KALKULATOR_BYER.find(b => b.navn === kalkulatorBy) ?? KALKULATOR_BYER[1]!;
    const range = by[kalkulatorType];
    const monthly = Math.round(((range[0] + range[1]) / 2) * 0.92);
    const yearly = monthly * 12;
    const fiveYear = yearly * 5;
    return { monthly, yearly, fiveYear, byNavn: by.navn };
  }, [kalkulatorType, kalkulatorBy]);

  const isCampingFilter = CAMPING_TYPES.includes(activeFilter);
  const radii = activeFilter === "storage" ? STORAGE_RADII : isCampingFilter ? [1000, 5000, 20000, 50000, 100000] : PARKING_RADII;

  function toggleFacility(key: string) {
    setFacilityFilters(f => f.includes(key) ? f.filter(x => x !== key) : [...f, key]);
  }

  function handleAddressChange(result: GeoResult | null) {
    setAddressResult(result);
    if (result) {
      setRadiusM(defaultRadius(activeFilter));
      setSortBy("naermest");
    } else {
      setSortBy("nyeste");
    }
  }

  function handleFilterChange(key: string) {
    setActiveFilter(key);
    if (addressResult) setRadiusM(defaultRadius(key));
  }

  const params = {
    ...(activeFilter === "smart"
      ? { smartPris: true }
      : activeFilter === "natt"
      ? { natteparkering: true }
      : activeFilter === "helg"
      ? { helge: true }
      : activeFilter === "arrangement"
      ? { arrangement: true }
      : activeFilter
      ? { type: activeFilter }
      : {}),
    ...(selectedCity !== "Hele Norge" ? { city: selectedCity } : {}),
    limit: 100,
  };


  const { data: spacesData, isLoading } = useListSpaces(params);
  const { data: stats } = useGetStatsSummary();

  const allSpaces: SpaceItem[] = spacesData?.spaces ?? [];

  const spacesWithDistance = useMemo(() => {
    if (!addressResult) return allSpaces.map(s => ({ ...s, _distanceM: undefined as number | undefined }));
    return allSpaces.map(s => ({
      ...s,
      _distanceM: haversineMeters(addressResult.lat, addressResult.lng, s.breddegrad, s.lengdegrad),
    }));
  }, [allSpaces, addressResult]);

  const filteredSpaces = useMemo(() => {
    let list = spacesWithDistance;
    if (addressResult) {
      list = list.filter(s => s._distanceM !== undefined && s._distanceM <= radiusM);
    }
    if (facilityFilters.length > 0) {
      list = list.filter(s =>
        facilityFilters.every(f => (s.fasiliteter ?? []).includes(f))
      );
    }
    if (sortBy === "naermest" && addressResult) {
      list = [...list].sort((a, b) => (a._distanceM ?? Infinity) - (b._distanceM ?? Infinity));
    } else if (sortBy === "nyeste") {
      list = [...list].sort((a, b) => {
        const pa = Math.min(...[a.priser?.natt, a.priser?.time, a.priser?.dag, a.priser?.uke, a.priser?.maaned].filter(Boolean) as number[]) || Infinity;
        const pb = Math.min(...[b.priser?.natt, b.priser?.time, b.priser?.dag, b.priser?.uke, b.priser?.maaned].filter(Boolean) as number[]) || Infinity;
        return pa - pb;
      });
    } else if (sortBy === "best") {
      list = [...list].sort((a, b) => (b.snittRangering ?? 0) - (a.snittRangering ?? 0));
    }
    return list;
  }, [spacesWithDistance, addressResult, radiusM, sortBy, facilityFilters]);

  const expandRadius = radii.find(r => r > radiusM);

  const { t } = useLanguage();

  return (
    <>
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar onOpenRegisterPanel={() => setShowRegisterPanel(true)} />

      {/* Hero */}
      <section className="relative pt-16 pb-10 px-4">
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,180,216,0.18) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          {/* Launch badge */}
          <div className="flex items-center justify-center mb-4">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest"
              style={{
                background: "rgba(0,180,216,0.08)",
                border: "1px solid rgba(0,180,216,0.2)",
                color: "#00B4D8",
              }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00B4D8" }} />
              Norges nye markedsplass for ledig plass
            </span>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {t("hero_h1")}
          </h1>

          <p className="text-lg sm:text-xl text-white/60 mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {t("hero_sub")}
          </p>

          {/* Speed badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(0,180,216,0.12)", border: "1px solid rgba(0,180,216,0.25)", color: "#00B4D8" }}>
              <Zap size={11} /> Book på 30 sekunder
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#F59E0B" }}>
              <Clock size={11} /> Tilgang samme dag
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", color: "#10B981" }}>
              💸 Utleier utbetalt samme dag
            </span>
          </div>

          {/* Search bar */}
          <div
            className="flex flex-col sm:flex-row gap-2 p-2 rounded-2xl mb-2 max-w-2xl mx-auto"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <AddressSearch value={addressResult} onChange={handleAddressChange} />
            <Select
              value={activeFilter || "__all_types__"}
              onValueChange={v => handleFilterChange(v === "__all_types__" ? "" : v)}
            >
              <SelectTrigger
                className="h-auto rounded-xl border-0 px-3 py-2 text-sm focus:ring-0 focus:outline-none w-auto gap-1.5 shrink-0"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
                data-testid="select-type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className="rounded-xl text-sm max-h-72"
                style={{ background: "#132030", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
              >
                {[
                  { v: "__all_types__", l: "Alle typer" },
                  { v: "parking",       l: "🚗 Parkering" },
                  { v: "storage",       l: "📦 Lagerplass" },
                  { v: "business",      l: "🏢 Bedrift" },
                  { v: "camping",       l: "🏕️ Camping" },
                  { v: "bobil",         l: "🚐 Bobil" },
                  { v: "bobil_strom",   l: "⚡ Bobil m/strøm" },
                  { v: "bobil_full",    l: "🚿 Bobil full service" },
                  { v: "gaard",         l: "🏠 Gårdsplass" },
                  { v: "baatplass",     l: "🚤 Båtplass" },
                  { v: "henger",        l: "🚛 Henger/Tilhenger" },
                  { v: "ev",            l: "⚡ Elbil" },
                  { v: "hot_desk",      l: "💼 Hot desk" },
                  { v: "cellekontor",   l: "🚪 Cellekontor" },
                  { v: "moterom",       l: "👥 Møterom" },
                  { v: "kreativt_studio", l: "🎨 Kreativt studio" },
                  { v: "verksted",      l: "🔧 Verksted" },
                  { v: "festsal",       l: "🎉 Festsal/Selskapslokale" },
                  { v: "laave",         l: "🏚️ Låve" },
                  { v: "hytteanneks",   l: "🛖 Hytteanneks" },
                  { v: "takterrasse",   l: "🌆 Takterrasse" },
                ].map(({ v, l }) => (
                  <SelectItem
                    key={v} value={v}
                    className="text-white/80 focus:bg-white/10 focus:text-white cursor-pointer"
                  >
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={activePeriod || "__all_periods__"}
              onValueChange={v => setActivePeriod(v === "__all_periods__" ? "" : v)}
            >
              <SelectTrigger
                className="h-auto rounded-xl border-0 px-3 py-2 text-sm focus:ring-0 focus:outline-none w-auto gap-1.5 shrink-0"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)" }}
                data-testid="select-period"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className="rounded-xl text-sm"
                style={{ background: "#132030", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
              >
                {[
                  { v: "__all_periods__", l: "Alle perioder" },
                  { v: "natt",   l: "🌙 Natt" },
                  { v: "time",   l: "⏱️ Time" },
                  { v: "dag",    l: "☀️ Dag" },
                  { v: "uke",    l: "📅 Uke" },
                  { v: "maaned", l: "📆 Måned" },
                ].map(({ v, l }) => (
                  <SelectItem
                    key={v} value={v}
                    className="text-white/80 focus:bg-white/10 focus:text-white cursor-pointer"
                  >
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white flex items-center gap-2"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
              data-testid="button-hero-search"
            >
              <Search size={16} /> Søk
            </button>
          </div>

          {/* Live stats strip — real data only */}
          {(spacesData?.total ?? 0) > 0 && (
            <div className="flex items-center justify-center gap-6 mt-4 mb-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#10B981", boxShadow: "0 0 5px #10B981" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                  <span className="font-bold text-white">{(spacesData?.total ?? 0).toLocaleString("nb-NO")}</span> plasser tilgjengelig nå
                </span>
              </div>
            </div>
          )}

          {/* Radius slider — only shown when address is selected */}
          <AnimatePresence>
            {addressResult && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl mx-auto mb-3"
              >
                <div
                  className="flex flex-col sm:flex-row items-center gap-3 px-4 py-3 rounded-xl"
                  style={{ background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.2)" }}
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <SlidersHorizontal size={14} style={{ color: "#00B4D8" }} />
                    <span className="text-xs text-white/70">Radius:</span>
                    <span className="text-sm font-bold" style={{ color: "#00B4D8", minWidth: 44 }} data-testid="radius-label">
                      {radiusLabel(radiusM)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={radii.length - 1}
                    step={1}
                    value={radii.indexOf(radiusM) === -1 ? 0 : radii.indexOf(radiusM)}
                    onChange={e => setRadiusM(radii[parseInt(e.target.value)])}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: "#00B4D8" }}
                    data-testid="radius-slider"
                  />
                  <div className="flex gap-1.5">
                    {radii.map(r => (
                      <button
                        key={r}
                        onClick={() => setRadiusM(r)}
                        className="px-2 py-0.5 rounded-lg text-xs font-semibold transition-all"
                        style={
                          radiusM === r
                            ? { background: "#00B4D8", color: "#fff" }
                            : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }
                        }
                        data-testid={`radius-btn-${r}`}
                      >
                        {radiusLabel(r)}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Bli utleier CTA strip ── */}
          {!user && (
            <div className="max-w-2xl mx-auto mt-3 mb-4">
              <a
                href="/bli-utleier"
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl group transition-all hover:opacity-90"
                style={{ background: "rgba(0,180,216,0.07)", border: "1px solid rgba(0,180,216,0.2)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-base">💰</span>
                  <div>
                    <p className="text-sm font-semibold text-white leading-tight">Tjen penger på ledig plass</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Kom i gang på 2 minutter · Gratis</p>
                  </div>
                </div>
                <span
                  className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                >
                  Bli utleier →
                </span>
              </a>
            </div>
          )}

          {/* Filter tabs — wrapping grid */}
          <div className="flex flex-wrap justify-center gap-2 mb-2">
            {FILTER_TABS.map(tab => {
              const activeColor = (tab as { color?: string }).color ?? "#00B4D8";
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    handleFilterChange(tab.key);
                    setFacilityFilters([]);
                    setHengerMaksLengde("Alle");
                    setHengerUnderlag("Alle");
                    setHengerVendeplass(false);
                  }}
                  className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
                  style={
                    activeFilter === tab.key
                      ? { background: activeColor, color: "#fff" }
                      : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }
                  }
                  data-testid={`filter-tab-${tab.key || "all"}`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Arrangement venue selector */}
          {activeFilter === "arrangement" && (
            <div className="flex flex-wrap justify-center items-center gap-2 mb-2">
              <span className="text-xs text-white/50">Arena/venue:</span>
              {["Alle", "Telenor Arena", "Ullevaal Stadion", "Oslo Spektrum", "Intility Arena", "DNB Arena"].map(venue => (
                <button
                  key={venue}
                  onClick={() => setArrangementVenue(venue === "Alle" ? "" : venue)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={
                    (venue === "Alle" && arrangementVenue === "") || arrangementVenue === venue
                      ? { background: "#7C3AED", color: "#fff" }
                      : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >{venue}</button>
              ))}
            </div>
          )}

          {/* Helg info banner */}
          {activeFilter === "helg" && (
            <div className="flex justify-center mb-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(217,119,6,0.15)", color: "#FCD34D", border: "1px solid rgba(217,119,6,0.3)" }}>
                🌅 Kontorbygg og næringsparker – kun lørdag og søndag
              </div>
            </div>
          )}

          {/* Henger sub-filters */}
          {activeFilter === "henger" && (
            <div className="flex flex-wrap justify-center gap-3 mb-2">
              {/* Maks lengde */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50">Maks lengde:</span>
                {HENGER_LENGTHS.map(l => (
                  <button
                    key={l}
                    onClick={() => setHengerMaksLengde(l)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={
                      hengerMaksLengde === l
                        ? { background: "#B45309", color: "#fff" }
                        : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >{l}</button>
                ))}
              </div>
              {/* Underlag */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white/50">Underlag:</span>
                {HENGER_UNDERLAG.map(u => (
                  <button
                    key={u}
                    onClick={() => setHengerUnderlag(u)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={
                      hengerUnderlag === u
                        ? { background: "#B45309", color: "#fff" }
                        : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
                    }
                  >{u}</button>
                ))}
              </div>
              {/* Vendeplass */}
              <button
                onClick={() => setHengerVendeplass(v => !v)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                style={
                  hengerVendeplass
                    ? { background: "#B45309", color: "#fff" }
                    : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                🔄 Med vendeplass
              </button>
            </div>
          )}

          {/* Facility filters — shown when not on henger tab */}
          {activeFilter !== "henger" && (
            <div className="flex flex-wrap justify-center gap-2 mb-1">
              {FACILITY_FILTERS.map(flt => (
                <button
                  key={flt.key}
                  onClick={() => toggleFacility(flt.key)}
                  className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
                  style={
                    facilityFilters.includes(flt.key)
                      ? { background: "rgba(22,163,74,0.85)", color: "#fff" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.08)" }
                  }
                  data-testid={`facility-filter-${flt.key}`}
                >
                  {flt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* ── Launch Countdown ── */}
      <LaunchCountdown />

      {/* ── Tab bar ── */}
      <section className="max-w-7xl mx-auto px-4 mb-0">
        <div className="flex gap-0 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          {([
            { key: "finn", label: "🔍 Finn plass" },
            { key: "lei",  label: "💰 Lei ut plass" },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveMainTab(tab.key)}
              className="relative px-6 py-3.5 text-sm font-semibold transition-all"
              style={{
                color: activeMainTab === tab.key ? "#00B4D8" : "rgba(255,255,255,0.45)",
                background: "transparent",
              }}
              data-testid={`main-tab-${tab.key}`}
            >
              {tab.label}
              {activeMainTab === tab.key && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: "#00B4D8" }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </section>

      <AnimatePresence mode="wait">
        {activeMainTab === "finn" ? (
          <motion.div
            key="finn"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {/* Stats row — category breakdown */}
            <section className="max-w-5xl mx-auto px-4 mt-6 mb-8">
              <div className="grid grid-cols-4 gap-3">
                {CATEGORY_STATS.map(item => (
                  <button
                    key={item.label}
                    onClick={() => handleFilterChange(
                      item.label === "Parkering"  ? "parking"   :
                      item.label === "Lagerplass" ? "storage"   :
                      item.label === "Camping"    ? "camping"   :
                      item.label === "Båtplass"   ? "baatplass" :
                      item.label === "Henger"     ? "henger"    :
                      item.label === "Elbil"      ? "ev"        :
                      item.label === "Kontor"     ? "kontor"    :
                      item.label === "Selskap"    ? "selskap"   : ""
                    )}
                    className="rounded-2xl p-4 text-center transition-all hover:opacity-80"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    data-testid={`stat-${item.label.toLowerCase()}`}
                  >
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <div className="text-xs text-white/50 mt-1">{item.label}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* ── LEDI NABOLAG FEED ── */}
            {allSpaces.length > 0 && (
              <section className="max-w-5xl mx-auto px-4 mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3
                      className="text-base font-bold text-white"
                      style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                      🏘️ {addressResult ? "Plasser nær deg" : "Nyeste plasser"}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      {addressResult ? `Innen rekkevidde fra ${addressResult.label}` : "Sist lagt ut på Ledi"}
                    </p>
                  </div>
                  <button
                    onClick={() => setNabolagFulgt(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0"
                    style={{
                      background: nabolagFulgt ? "rgba(52,211,153,0.15)" : "rgba(0,180,216,0.1)",
                      border: `1px solid ${nabolagFulgt ? "rgba(52,211,153,0.4)" : "rgba(0,180,216,0.3)"}`,
                      color: nabolagFulgt ? "#34D399" : "#00B4D8",
                    }}
                  >
                    {nabolagFulgt ? (
                      <>✓ Varsler aktivert</>
                    ) : (
                      <>🔔 Følg nabolaget</>
                    )}
                  </button>
                </div>

                {nabolagFulgt && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl px-4 py-2.5 mb-3 flex items-center gap-2"
                    style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}
                  >
                    <span className="text-sm">🔔</span>
                    <p className="text-xs" style={{ color: "#34D399" }}>
                      Du får varsel når noen legger ut ny plass i nabolaget ditt.
                    </p>
                  </motion.div>
                )}

                <div
                  className="flex gap-3 overflow-x-auto pb-2"
                  style={{ scrollbarWidth: "none" }}
                >
                  {[...allSpaces]
                    .sort((a, b) => b.id - a.id)
                    .slice(0, 10)
                    .map(space => {
                      const meta = TYPE_META[space.type] ?? TYPE_META["parking"]!;
                      const distM = addressResult
                        ? haversineMeters(addressResult.lat, addressResult.lng, space.breddegrad, space.lengdegrad)
                        : null;
                      const locationLabel = distM !== null ? distLabel(distM) : space.by;
                      const isClose = distM !== null && distM <= 1000;
                      return (
                        <motion.button
                          key={space.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => setSelectedSpace(space)}
                          className="shrink-0 rounded-2xl p-4 text-left transition-all"
                          style={{
                            width: 220,
                            background: "rgba(255,255,255,0.05)",
                            border: isClose
                              ? "1px solid rgba(0,180,216,0.35)"
                              : "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">{meta.emoji}</span>
                            {isClose && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: "rgba(0,180,216,0.2)", color: "#00B4D8" }}
                              >
                                NÆRT DEG
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-white mb-0.5 truncate">
                            {space.tittel || meta.label}
                          </p>
                          <p className="text-xs mb-2 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                            {meta.label}
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px]" style={{ color: distM !== null ? "#00B4D8" : "rgba(255,255,255,0.35)" }}>
                              📍
                            </span>
                            <span
                              className="text-[11px] font-semibold truncate"
                              style={{ color: distM !== null ? "#00B4D8" : "rgba(255,255,255,0.4)" }}
                            >
                              {locationLabel}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                </div>
              </section>
            )}

            {/* Map + Cards */}
            <section className="max-w-7xl mx-auto px-4 pb-16">
              <div className="flex flex-col lg:flex-row gap-4" style={{ minHeight: 600 }}>
                {/* Left: Map (60%) */}
                <div className="lg:w-3/5 h-[400px] lg:h-auto">
                  <LeafletMap selectedCity={selectedCity} onCityChange={setSelectedCity} />
                </div>

                {/* Right: Cards (40%) */}
                <div className="lg:w-2/5 flex flex-col">
                  {addressResult && (
                    <div className="mb-2 px-1">
                      <p className="text-xs text-white/60" data-testid="result-count-label">
                        Viser <span className="text-white font-semibold">{filteredSpaces.length} plasser</span> innen{" "}
                        <span style={{ color: "#00B4D8" }}>{radiusLabel(radiusM)}</span> fra{" "}
                        <span className="text-white">{addressResult.label}</span>
                      </p>
                    </div>
                  )}

                  {/* Sort */}
                  <div
                    className="flex gap-2 p-2 rounded-xl mb-3 shrink-0"
                    style={{ background: "#F0F4F8" }}
                  >
                    {SORT_OPTIONS.map(s => (
                      <button
                        key={s.key}
                        onClick={() => setSortBy(s.key)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={
                          sortBy === s.key
                            ? { background: "#0D1B2A", color: "#fff" }
                            : { color: "#6B7280" }
                        }
                        data-testid={`sort-${s.key}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1" style={{ maxHeight: "calc(100vh - 320px)" }}>
                    {isLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="rounded-2xl h-64 animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                      ))
                    ) : filteredSpaces.length === 0 && addressResult ? (
                      <NoResultsPanel
                        address={addressResult.label}
                        radiusM={radiusM}
                        expandRadius={expandRadius}
                        onExpand={r => setRadiusM(r)}
                      />
                    ) : filteredSpaces.length === 0 ? (
                      <div className="text-center py-10 text-white/40">
                        <MapPin size={32} className="mx-auto mb-3 opacity-40" />
                        <p className="mb-4">Ingen plasser funnet</p>
                        <button
                          onClick={() => setAlarmModalOpen(true)}
                          className="flex items-center gap-2 mx-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                          style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.2), rgba(29,78,216,0.2))", border: "1px solid rgba(0,180,216,0.3)" }}
                          data-testid="button-set-alarm-empty"
                        >
                          <Bell size={14} />
                          Sett opp <LediLogo size={13} /> Alarm — få varsel når noe dukker opp
                        </button>
                      </div>
                    ) : (
                      filteredSpaces.map(space => (
                        <motion.div
                          key={space.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <SpaceCard space={space} onClick={setSelectedSpace} distanceM={space._distanceM} />
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="lei"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <section className="max-w-3xl mx-auto px-4 mt-6 pb-16">

              {/* ── EARNINGS CALCULATOR ── */}
              <div
                className="rounded-2xl p-5 mb-5"
                style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.1), rgba(13,27,42,0.6))", border: "1px solid rgba(0,180,216,0.3)" }}
              >
                <p className="flex items-center gap-1.5 text-sm font-bold mb-3"
                  style={{ fontFamily: "'Syne', sans-serif" }}>
                  <LediLogo size={15} />
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>plass-raske cash</span>
                </p>
                <h2
                  className="text-lg font-bold text-white mb-1"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  💰 Hva kan du tjene på Ledi?
                </h2>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                  Estimat basert på reelle markedspriser
                </p>

                {/* Type selector */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {KALKULATOR_TYPES.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setKalkulatorType(t.key as typeof kalkulatorType)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: kalkulatorType === t.key ? "rgba(0,180,216,0.2)" : "rgba(255,255,255,0.07)",
                        border: `1.5px solid ${kalkulatorType === t.key ? "#00B4D8" : "rgba(255,255,255,0.12)"}`,
                        color: kalkulatorType === t.key ? "#00B4D8" : "rgba(255,255,255,0.6)",
                      }}
                    >
                      <span>{t.emoji}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* City dropdown */}
                <select
                  value={kalkulatorBy}
                  onChange={e => setKalkulatorBy(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-medium mb-4 focus:outline-none"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(0,180,216,0.3)",
                    color: "#fff",
                    colorScheme: "dark",
                  }}
                >
                  {KALKULATOR_BYER.map(b => (
                    <option key={b.navn} value={b.navn}>{b.navn}</option>
                  ))}
                </select>

                {/* Result card */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(0,180,216,0.25)" }}
                >
                  <div className="px-4 pt-4 pb-3" style={{ background: "rgba(0,180,216,0.07)" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Per måned</span>
                      <span className="text-xl font-bold" style={{ color: "#00B4D8", fontFamily: "'Syne', sans-serif" }}>
                        {kalkulatorResult.monthly.toLocaleString("nb-NO")} kr
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Per år</span>
                      <span className="text-lg font-bold text-white">
                        {kalkulatorResult.yearly.toLocaleString("nb-NO")} kr
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>Over 5 år</span>
                      <span className="text-lg font-bold" style={{ color: "#A78BFA" }}>
                        {kalkulatorResult.fiveYear.toLocaleString("nb-NO")} kr
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: "rgba(0,0,0,0.2)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      Basert på markedsdata fra {kalkulatorResult.byNavn}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>etter 8% gebyr</span>
                  </div>
                </div>

                {/* Utbetaling på dagen — key selling point */}
                <div
                  className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}
                >
                  <span className="text-xl shrink-0">💸</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#10B981" }}>Utbetalt samme dag — alltid</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Du mottar pengene samme dag bookingen starter. Ingen ventetid, ingen forsinkelser.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowRegisterPanel(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #0077A8, #00B4D8)", color: "#fff" }}
                >
                  Start å tjene penger
                  <span>→</span>
                </button>
              </div>

              <div
                className="rounded-2xl p-6"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <h2
                  className="text-base font-bold text-white text-center mb-5"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Hvordan vil du leie ut?
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  {/* Fri prissetting */}
                  <button
                    onClick={() => { setPrisModellValg("fri"); setShowRegisterPanel(true); }}
                    className="p-5 rounded-2xl border-2 text-left transition-all"
                    style={{ borderColor: "#00B4D8", background: "rgba(0,180,216,0.08)" }}
                    data-testid="hero-pris-fri"
                  >
                    <div className="text-3xl mb-3">🎯</div>
                    <div className="text-sm font-bold text-white mb-1">Sett egen pris</div>
                    <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                      Du bestemmer prisen selv
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      {[
                        { e: "🅿️", t: "Parkering",  p: "150–250 kr/t" },
                        { e: "📦", t: "Lagerplass", p: "500–1 500 kr/mnd" },
                        { e: "🏕️", t: "Camping",   p: "150–400 kr/natt" },
                        { e: "🚤", t: "Båtplass",  p: "800–2 500 kr/mnd" },
                        { e: "🚛", t: "Henger",    p: "600–2 000 kr/mnd" },
                        { e: "⚡", t: "Elbil",     p: "2 000–4 000 kr/mnd" },
                        { e: "🏢", t: "Kontor",    p: "2 000–7 000 kr/mnd" },
                        { e: "🎉", t: "Selskap",   p: "2 000–15 000 kr/dag" },
                      ].map(r => (
                        <div key={r.t} className="flex items-center justify-between gap-2 text-[11px]">
                          <span style={{ color: "rgba(255,255,255,0.5)" }}>{r.e} {r.t}</span>
                          <span className="font-semibold" style={{ color: "#00B4D8" }}>{r.p}</span>
                        </div>
                      ))}
                    </div>
                  </button>

                  {/* Smart Pris */}
                  <button
                    onClick={() => { setPrisModellValg("smart"); setShowRegisterPanel(true); }}
                    className="p-5 rounded-2xl border-2 text-left transition-all"
                    style={{ borderColor: "#8B5CF6", background: "rgba(139,92,246,0.08)" }}
                    data-testid="hero-pris-smart"
                  >
                    <div className="text-3xl mb-3">🤖</div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">Smart Pris</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: "#8B5CF6", color: "#fff" }}
                      >
                        2.0
                      </span>
                    </div>
                    <div className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                      Vi foreslår optimal pris basert på område
                    </div>
                    <div
                      className="text-xs font-semibold px-2 py-1 rounded-lg inline-block"
                      style={{ background: "rgba(139,92,246,0.15)", color: "#A78BFA" }}
                    >
                      Typisk 1 800 – 3 500 kr/mnd
                    </div>
                  </button>
                </div>

                {/* Three benefits */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: "✅", text: "Gratis å starte – ingen binding" },
                    { icon: "📱", text: "Vipps-utbetaling umiddelbart" },
                    { icon: "🇳🇴", text: "Hele Norge – alle 8 kategorier" },
                  ].map(b => (
                    <div
                      key={b.text}
                      className="flex flex-col items-center gap-1 py-2 rounded-xl text-center"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <span className="text-base">{b.icon}</span>
                      <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{b.text}</span>
                    </div>
                  ))}
                </div>

                {/* Fee transparency box */}
                <div
                  className="rounded-[14px] px-5 py-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <p className="text-sm font-semibold text-white mb-2">💡 Slik deler vi rettferdig</p>
                  <div className="space-y-1">
                    {[
                      "Utleier betaler 8% til Ledi",
                      "Leietaker betaler 8% til Ledi",
                      "Begge vet hva de betaler – alltid",
                    ].map(line => (
                      <p key={line} className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booking modal */}
      <AnimatePresence>
        {selectedSpace && (
          <motion.div key="modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BookingModal space={selectedSpace} onClose={() => setSelectedSpace(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Register panel */}
      <AnimatePresence>
        {showRegisterPanel && (
          <motion.div key="panel" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30 }}>
            <RegisterSpacePanel onClose={() => setShowRegisterPanel(false)} initialPrisModell={prisModellValg} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>

    <AlarmModal open={alarmModalOpen} onClose={() => setAlarmModalOpen(false)} />
    </>
  );
}

interface NoResultsProps {
  address: string;
  radiusM: number;
  expandRadius: number | undefined;
  onExpand: (r: number) => void;
}

function NoResultsPanel({ address, radiusM, expandRadius, onExpand }: NoResultsProps) {
  function radiusLabel(m: number): string {
    return m < 1000 ? `${m}m` : `${m / 1000}km`;
  }
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
      data-testid="no-results-panel"
    >
      <div className="text-3xl mb-3">🔍</div>
      <p className="text-white font-semibold mb-1">Ingen ledige plasser funnet</p>
      <p className="text-white/50 text-sm mb-5">
        Ingen plasser innen <strong>{radiusLabel(radiusM)}</strong> fra{" "}
        <strong>{address}</strong>. Prøv å utvide søkeområdet.
      </p>
      <div className="flex flex-col gap-2">
        {expandRadius && (
          <button
            onClick={() => onExpand(expandRadius)}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
            data-testid="button-expand-radius"
          >
            Utvid til {radiusLabel(expandRadius)}
          </button>
        )}
        <button
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
          data-testid="button-notify-me"
        >
          <Bell size={14} />
          Varsle meg når noe blir ledig her
        </button>
      </div>
    </div>
  );
}
