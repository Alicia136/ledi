import { useParams, Link } from "wouter";
import Navbar from "@/components/Navbar";
import { useListSpaces } from "@workspace/api-client-react";
import SpaceCard from "@/components/SpaceCard";
import { MapPin, Search } from "lucide-react";

const BYDEL_META: Record<string, { title: string; desc: string; emoji: string; region: string }> = {
  oslo:       { title: "Parkering og lagerplass i Oslo",       desc: "Finn ledig parkering, lager og campingplass i Oslo. Book direkte fra private utleiere.",              emoji: "🏙️", region: "Oslo" },
  bergen:     { title: "Parkering og lagerplass i Bergen",     desc: "Lei parkering og lager i Bergen by. Rimelige priser fra private utleiere.",                           emoji: "🌊", region: "Bergen" },
  trondheim:  { title: "Parkering og lagerplass i Trondheim",  desc: "Book parkeringsplass og lagerplass i Trondheim. Studentvennlige priser.",                             emoji: "🏔️", region: "Trondheim" },
  stavanger:  { title: "Parkering og lagerplass i Stavanger",  desc: "Finn parkering og lagerplass i Stavanger og omegn. Direkte fra private utleiere.",                    emoji: "⚓", region: "Stavanger" },
  tromso:     { title: "Parkering og lagerplass i Tromsø",     desc: "Lei parkering og lagerplass i Tromsø. Dekker hele Tromsøya og fastlandet.",                           emoji: "🌌", region: "Tromsø" },
  fredrikstad:{ title: "Parkering og lagerplass i Fredrikstad",desc: "Finn ledige parkeringsplasser og lagerrom i Fredrikstad.",                                           emoji: "🏰", region: "Fredrikstad" },
  baerum:     { title: "Parkering og lagerplass i Bærum",      desc: "Lei parkering og lagerplass i Bærum – Sandvika, Lysaker, Høvik og omegn.",                           emoji: "🌳", region: "Bærum" },
  kristiansand:{ title: "Parkering og lagerplass i Kristiansand", desc: "Book ledig parkering og lagerplass i Kristiansand direkte fra private utleiere.",                  emoji: "☀️", region: "Kristiansand" },
  drammen:    { title: "Parkering og lagerplass i Drammen",    desc: "Finn parkeringsplass og lagerplass i Drammen sentrum og omegn.",                                      emoji: "🌉", region: "Drammen" },
  asker:      { title: "Parkering og lagerplass i Asker",      desc: "Lei ledig parkeringsplass eller lagerplass i Asker. Enkelt og rimelig.",                              emoji: "🌿", region: "Asker" },
};

const POPULAR_CITIES = ["oslo", "bergen", "trondheim", "stavanger", "tromso"];

export default function BydelPage() {
  const params = useParams<{ by: string }>();
  const by = params.by?.toLowerCase() ?? "";
  const meta = BYDEL_META[by];

  const { data: listData } = useListSpaces();
  const spaces = meta
    ? (listData?.spaces ?? []).filter((s: any) =>
        s.by?.toLowerCase().includes(meta.region.toLowerCase()) ||
        s.adresse?.toLowerCase().includes(meta.region.toLowerCase())
      )
    : [];

  if (!meta) {
    return (
      <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <h1 className="text-2xl font-bold text-white mb-2">Fant ikke denne bydelen</h1>
          <p className="text-white/50 mb-6">Prøv en av de populære byene under</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {POPULAR_CITIES.map(c => (
              <Link key={c} href={`/finn/${c}`}>
                <button
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
                  style={{ background: "rgba(0,180,216,0.15)", border: "1px solid rgba(0,180,216,0.3)" }}
                >
                  {BYDEL_META[c]?.region ?? c}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* SEO hero */}
        <div className="mb-10">
          <div className="text-4xl mb-3">{meta.emoji}</div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
            {meta.title}
          </h1>
          <p className="text-white/55 text-base max-w-xl">{meta.desc}</p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: "Tilgjengelige plasser", value: spaces.length > 0 ? `${spaces.length}+` : "Snart" },
            { label: "Gjennomsnittspris", value: "Fra 150 kr/dag" },
            { label: "Booking tar", value: "Under 30 sek" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: "rgba(0,180,216,0.07)", border: "1px solid rgba(0,180,216,0.15)" }}>
              <p className="text-lg font-bold text-white">{value}</p>
              <p className="text-xs text-white/50 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Spaces */}
        {spaces.length > 0 ? (
          <>
            <p className="text-sm text-white/50 mb-4 flex items-center gap-1.5">
              <MapPin size={13} style={{ color: "#00B4D8" }} />
              {spaces.length} ledige plasser i {meta.region}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {spaces.slice(0, 9).map((space: any) => (
                <SpaceCard key={space.id} space={space} onClick={() => {}} />
              ))}
            </div>
          </>
        ) : (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Search size={32} style={{ color: "rgba(255,255,255,0.2)", margin: "0 auto 12px" }} />
            <p className="text-white/60 mb-2">Ingen plasser registrert i {meta.region} ennå</p>
            <p className="text-sm text-white/40 mb-5">Bli den første utleieren i denne byen!</p>
            <Link href="/dashboard">
              <button
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
              >
                Lei ut din plass her
              </button>
            </Link>
          </div>
        )}

        {/* Other cities */}
        <div className="mt-12">
          <p className="text-sm font-semibold text-white mb-3">Se også i andre byer</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(BYDEL_META)
              .filter(([k]) => k !== by)
              .slice(0, 6)
              .map(([k, v]) => (
                <Link key={k} href={`/finn/${k}`}>
                  <button
                    className="px-4 py-2 rounded-xl text-sm text-white/70 transition-all hover:text-white"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {v.emoji} {v.region}
                  </button>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
