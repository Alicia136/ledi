import { useState } from "react";
import { useLocation } from "wouter";
import { Users, MapPin, Calendar, TrendingUp, CheckCircle, Trash2, Plus, RefreshCw, AlertCircle, FileText, Download, Send } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/lib/auth-context";
import { useGetAdminStats, useListAdminSpaces, useListAdminBookings, useApproveSpace, getListAdminSpacesQueryKey, useGetDac7Rapport, useSendDac7Aarsoppgaver } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const KATEGORI_OPTIONS = [
  { value: "konsert",  label: "🎵 Konsert" },
  { value: "fotball",  label: "⚽ Fotball" },
  { value: "festival", label: "🎸 Festival" },
  { value: "hockey",   label: "🏒 Hockey" },
  { value: "sport",    label: "🏆 Sport" },
  { value: "annet",    label: "🎪 Annet" },
];

const EMOJI_MAP: Record<string, string> = {
  konsert: "🎵", fotball: "⚽", festival: "🎸", hockey: "🏒", sport: "🏆", annet: "🎪",
};

interface Arrangement {
  id: number;
  navn: string;
  sted: string;
  by: string;
  dato: string;
  klokkeslett: string;
  kategori: string;
  emoji: string;
  antallBilletter: number;
  estimertParkeringssokere: number;
  kilde: string;
  aktiv: boolean;
}

const VENUE_PRESETS: { gruppe: string; steder: { navn: string; sted: string; by: string; lat: number; lng: number }[] }[] = [
  {
    gruppe: "Oslo",
    steder: [
      { navn: "Telenor Arena",      sted: "Telenor Arena",      by: "Oslo",  lat: 59.9173, lng: 10.6177 },
      { navn: "Ullevaal Stadion",   sted: "Ullevaal Stadion",   by: "Oslo",  lat: 59.9435, lng: 10.7287 },
      { navn: "Oslo Spektrum",      sted: "Oslo Spektrum",      by: "Oslo",  lat: 59.9077, lng: 10.7512 },
      { navn: "Intility Arena",     sted: "Intility Arena",     by: "Oslo",  lat: 59.9075, lng: 10.8087 },
      { navn: "Ekebergsletta",      sted: "Ekebergsletta",      by: "Oslo",  lat: 59.8948, lng: 10.7631 },
      { navn: "Bislett Stadion",    sted: "Bislett Stadion",    by: "Oslo",  lat: 59.9254, lng: 10.7283 },
      { navn: "Valle Hovin",        sted: "Valle Hovin",        by: "Oslo",  lat: 59.9176, lng: 10.7967 },
      { navn: "Rockefeller",        sted: "Rockefeller Music Hall", by: "Oslo", lat: 59.9155, lng: 10.7467 },
      { navn: "Sentrum Scene",      sted: "Sentrum Scene",      by: "Oslo",  lat: 59.9147, lng: 10.7388 },
      { navn: "Oslo City Hall",     sted: "Oslo Rådhus",        by: "Oslo",  lat: 59.9110, lng: 10.7340 },
    ],
  },
  {
    gruppe: "Bergen",
    steder: [
      { navn: "Koengen",            sted: "Koengen",            by: "Bergen", lat: 60.3925, lng: 5.3284  },
      { navn: "Brann Stadion",      sted: "Brann Stadion",      by: "Bergen", lat: 60.3618, lng: 5.3447  },
      { navn: "Grieghallen",        sted: "Grieghallen",        by: "Bergen", lat: 60.3891, lng: 5.3267  },
      { navn: "USF Verftet",        sted: "USF Verftet",        by: "Bergen", lat: 60.4018, lng: 5.3102  },
      { navn: "Bergenhus Festning", sted: "Bergenhus Festning", by: "Bergen", lat: 60.3992, lng: 5.3109  },
    ],
  },
  {
    gruppe: "Trondheim",
    steder: [
      { navn: "Nidarosdomen",       sted: "Nidarosdomen",       by: "Trondheim", lat: 63.4268, lng: 10.3970 },
      { navn: "Lerkendal Stadion",  sted: "Lerkendal Stadion",  by: "Trondheim", lat: 63.4125, lng: 10.4022 },
      { navn: "Spektrum Trondheim", sted: "Trondheim Spektrum", by: "Trondheim", lat: 63.4347, lng: 10.4008 },
      { navn: "Olavshallen",        sted: "Olavshallen",        by: "Trondheim", lat: 63.4305, lng: 10.3950 },
      { navn: "Byscenen",           sted: "Byscenen Trondheim", by: "Trondheim", lat: 63.4362, lng: 10.3980 },
    ],
  },
  {
    gruppe: "Stavanger",
    steder: [
      { navn: "DNB Arena",          sted: "DNB Arena",          by: "Stavanger", lat: 58.9700, lng: 5.7331  },
      { navn: "Stavanger Forum",    sted: "Stavanger Forum",    by: "Stavanger", lat: 58.9617, lng: 5.7197  },
      { navn: "Siddishallen",       sted: "Siddishallen",       by: "Stavanger", lat: 58.9712, lng: 5.7341  },
      { navn: "Konserthus Stavanger", sted: "Stavanger Konserthus", by: "Stavanger", lat: 58.9697, lng: 5.7286 },
    ],
  },
  {
    gruppe: "Tromsø",
    steder: [
      { navn: "Alfheim Stadion",    sted: "Alfheim Stadion",    by: "Tromsø",    lat: 69.6577, lng: 18.9432 },
      { navn: "Tromsø Kulturhus",   sted: "Tromsø Kulturhus",   by: "Tromsø",    lat: 69.6528, lng: 18.9549 },
      { navn: "Arctic Race Arena",  sted: "Sentrum Tromsø",     by: "Tromsø",    lat: 69.6492, lng: 18.9550 },
    ],
  },
  {
    gruppe: "Andre byer",
    steder: [
      { navn: "Color Line Stadion", sted: "Color Line Stadion", by: "Ålesund",       lat: 62.4724, lng: 6.2249  },
      { navn: "Fredrikstad Stadion",sted: "Fredrikstad Stadion",by: "Fredrikstad",   lat: 59.1930, lng: 10.9350 },
      { navn: "Åråsen Stadion",     sted: "Åråsen Stadion",     by: "Lillestrøm",    lat: 59.9558, lng: 11.0558 },
      { navn: "Kristiansand Spektrum", sted: "Kristiansand Spektrum", by: "Kristiansand", lat: 58.1484, lng: 7.9934 },
      { navn: "Drammen Stadion",    sted: "Marienlyst Stadion", by: "Drammen",       lat: 59.7487, lng: 10.2081 },
      { navn: "Hamar OL-Amfi",      sted: "Hamar OL-Amfi",      by: "Hamar",         lat: 60.8097, lng: 11.0784 },
      { navn: "Bodø Aspmyra",       sted: "Aspmyra Stadion",    by: "Bodø",          lat: 67.2826, lng: 14.3756 },
      { navn: "Sandnes Ulf Arena",  sted: "Øster Hus Arena",    by: "Sandnes",       lat: 58.8527, lng: 5.7353  },
    ],
  },
];

function ArrangementerPanel() {
  const [events, setEvents] = useState<Arrangement[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState({
    navn: "", sted: "", by: "", dato: "", klokkeslett: "20:00",
    kategori: "konsert", breddegrad: "", lengdegrad: "",
    antallBilletter: "5000", estimertParkeringssokere: "1000",
  });

  const token = localStorage.getItem("ledi_token");

  const loadEvents = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/arrangementer/admin/alle", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(await r.json());
    } finally {
      setLoading(false);
    }
  };

  const handleVenuePreset = (preset: { navn: string; sted: string; by: string; lat: number; lng: number }) => {
    setForm(f => ({
      ...f,
      sted: preset.sted,
      by: preset.by,
      breddegrad: String(preset.lat),
      lengdegrad: String(preset.lng),
    }));
  };

  const handleCreate = async () => {
    if (!form.navn || !form.sted || !form.by || !form.dato || !form.breddegrad || !form.lengdegrad) return;
    setSaving(true);
    try {
      await fetch("/api/arrangementer/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          emoji: EMOJI_MAP[form.kategori] ?? "🎪",
          breddegrad: Number(form.breddegrad),
          lengdegrad: Number(form.lengdegrad),
          antallBilletter: Number(form.antallBilletter),
          estimertParkeringssokere: Number(form.estimertParkeringssokere),
        }),
      });
      setShowForm(false);
      setForm({ navn: "", sted: "", by: "", dato: "", klokkeslett: "20:00", kategori: "konsert", breddegrad: "", lengdegrad: "", antallBilletter: "5000", estimertParkeringssokere: "1000" });
      await loadEvents();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
    try {
      await fetch(`/api/arrangementer/admin/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvents(prev => prev?.filter(e => e.id !== id) ?? null);
    } finally {
      setDeleteId(null);
    }
  };

  const handleSyncPredictHQ = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const r = await fetch("/api/arrangementer/admin/sync-predicthq", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await r.json();
      if (r.ok) {
        setSyncResult(`✅ Hentet ${data.total} arrangementer — ${data.inserted} nye lagt til`);
        await loadEvents();
      } else if (data.instruksjon) {
        setSyncResult(`⚠️ ${data.instruksjon}`);
      } else {
        setSyncResult(`❌ ${data.error}`);
      }
    } finally {
      setSyncing(false);
    }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    borderRadius: 10,
    padding: "8px 12px",
    fontSize: 13,
    outline: "none",
    width: "100%",
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
          🎪 Arrangementer
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleSyncPredictHQ}
            disabled={syncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-60 transition-all"
            style={{ background: "rgba(139,92,246,0.25)", border: "1px solid rgba(139,92,246,0.4)" }}
          >
            <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Synkroniserer..." : "Synk PredictHQ"}
          </button>
          <button
            onClick={() => { setShowForm(s => !s); if (!events) loadEvents(); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
            style={{ background: "#00B4D8" }}
          >
            <Plus size={13} /> Nytt arrangement
          </button>
          {!events && (
            <button
              onClick={loadEvents}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              Vis alle
            </button>
          )}
        </div>
      </div>

      {/* PredictHQ status */}
      {syncResult && (
        <div
          className="rounded-xl p-3 mb-4 text-sm flex items-start gap-2"
          style={{
            background: syncResult.startsWith("✅") ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
            border: `1px solid ${syncResult.startsWith("✅") ? "rgba(16,185,129,0.25)" : "rgba(245,158,11,0.25)"}`,
            color: syncResult.startsWith("✅") ? "#34D399" : "#FCD34D",
          }}
        >
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{syncResult}</span>
          {syncResult.includes("predicthq.com") && (
            <a
              href="https://predicthq.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 underline text-xs"
            >
              Registrer deg →
            </a>
          )}
        </div>
      )}

      {/* PredictHQ info box when no token */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}
      >
        <p className="text-xs font-semibold text-purple-300 mb-1">🤖 Automatisk import med PredictHQ</p>
        <p className="text-xs text-white/50 leading-relaxed">
          PredictHQ samler arrangementer fra Ticketmaster, sport og festivaler i Norge automatisk.
          Gratis plan: 1000 arrangementer/dag.{" "}
          <a href="https://predicthq.com" target="_blank" rel="noopener noreferrer" className="underline text-purple-300">
            Registrer deg gratis
          </a>{" "}
          → hent API-nøkkel → legg til <code className="bg-white/10 px-1 rounded">PREDICTHQ_TOKEN</code> i Secrets → trykk "Synk PredictHQ".
        </p>
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-2xl p-5 mb-5"
          style={{ background: "rgba(0,180,216,0.07)", border: "1px solid rgba(0,180,216,0.2)" }}
        >
          <p className="text-sm font-semibold text-white mb-4">Legg til arrangement manuelt</p>

          {/* Venue presets */}
          <div className="mb-4">
            <p className="text-xs text-white/50 mb-2">Hurtigvalg arena:</p>
            <div className="space-y-2">
              {VENUE_PRESETS.map(gruppe => (
                <div key={gruppe.gruppe}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "#00B4D8" }}>{gruppe.gruppe}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {gruppe.steder.map(p => (
                      <button
                        key={p.navn}
                        onClick={() => handleVenuePreset(p)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
                      >
                        {p.navn}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-white/50 block mb-1">Navn på arrangement *</label>
              <input style={inputStyle} placeholder="f.eks. Beyoncé – Oslo" value={form.navn} onChange={e => setForm(f => ({ ...f, navn: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Arena / sted *</label>
              <input style={inputStyle} placeholder="Telenor Arena" value={form.sted} onChange={e => setForm(f => ({ ...f, sted: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">By *</label>
              <input style={inputStyle} placeholder="Oslo" value={form.by} onChange={e => setForm(f => ({ ...f, by: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Dato *</label>
              <input type="date" style={inputStyle} value={form.dato} onChange={e => setForm(f => ({ ...f, dato: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Klokkeslett</label>
              <input type="time" style={inputStyle} value={form.klokkeslett} onChange={e => setForm(f => ({ ...f, klokkeslett: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Kategori</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={form.kategori} onChange={e => setForm(f => ({ ...f, kategori: e.target.value }))}>
                {KATEGORI_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Antall billetter</label>
              <input type="number" style={inputStyle} value={form.antallBilletter} onChange={e => setForm(f => ({ ...f, antallBilletter: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Breddegrad *</label>
              <input type="number" step="0.0001" style={inputStyle} placeholder="59.9139" value={form.breddegrad} onChange={e => setForm(f => ({ ...f, breddegrad: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Lengdegrad *</label>
              <input type="number" step="0.0001" style={inputStyle} placeholder="10.7522" value={form.lengdegrad} onChange={e => setForm(f => ({ ...f, lengdegrad: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Estimert antall parkeringssøkere</label>
              <input type="number" style={inputStyle} value={form.estimertParkeringssokere} onChange={e => setForm(f => ({ ...f, estimertParkeringssokere: e.target.value }))} />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving || !form.navn || !form.dato || !form.breddegrad}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
            >
              {saving ? "Lagrer..." : "Legg til arrangement"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-white/50">Avbryt</button>
          </div>
        </div>
      )}

      {/* Events list */}
      {loading && <div className="text-white/40 text-sm py-4 text-center">Laster arrangementer...</div>}
      {events && (
        <div className="space-y-2">
          {events.length === 0 && (
            <div className="rounded-2xl p-6 text-center text-white/40 text-sm"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Ingen arrangementer. Legg til manuelt eller synk fra PredictHQ.
            </div>
          )}
          {events.map(ev => (
            <div
              key={ev.id}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${ev.aktiv ? "rgba(255,255,255,0.08)" : "rgba(239,68,68,0.15)"}`,
              }}
            >
              <span className="text-2xl shrink-0">{ev.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{ev.navn}</p>
                <p className="text-xs text-white/40">{ev.sted}, {ev.by} · {ev.dato} kl {ev.klokkeslett}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(0,180,216,0.1)", color: "#00B4D8" }}>
                    {ev.kategori}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}>
                    {ev.kilde}
                  </span>
                  <span className="text-xs text-white/30">
                    ~{ev.estimertParkeringssokere.toLocaleString("nb")} søker parkering
                  </span>
                </div>
              </div>
              <a
                href={`/arrangement/${ev.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs text-cyan-400 underline mr-2 hidden sm:block"
              >
                Vis side
              </a>
              <button
                onClick={() => handleDelete(ev.id)}
                disabled={deleteId === ev.id}
                className="shrink-0 p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const isAdmin = !!user && user.rolle === "admin";

  const currentYear = new Date().getFullYear();
  const [dac7Year, setDac7Year] = useState(currentYear - 1);
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [sendLoading, setSendLoading] = useState(false);

  const { data: stats, isLoading: statsLoading } = useGetAdminStats({ query: { enabled: isAdmin } as any });
  const { data: pendingSpaces } = useListAdminSpaces({ status: "pending" }, { query: { enabled: isAdmin } as any });
  const { data: allBookings } = useListAdminBookings({ query: { enabled: isAdmin } as any });
  const { data: dac7, refetch: refetchDac7 } = useGetDac7Rapport(dac7Year, { query: { enabled: isAdmin } as any });
  const sendAarsoppgaver = useSendDac7Aarsoppgaver();
  const approveSpace = useApproveSpace();

  const token = typeof window !== "undefined" ? localStorage.getItem("ledi_token") : "";

  const handleSendAarsoppgaver = async () => {
    setSendLoading(true);
    setSendStatus(null);
    sendAarsoppgaver.mutate({ year: dac7Year }, {
      onSuccess: (data) => {
        setSendStatus(`✅ ${data.antallSendt} årsoppgaver sendt til utleiere for ${dac7Year}`);
        void refetchDac7();
      },
      onError: () => setSendStatus("❌ Feil ved sending – prøv igjen"),
      onSettled: () => setSendLoading(false),
    });
  };

  const handleDownloadXml = () => {
    const url = `/api/admin/dac7/${dac7Year}/xml`;
    const a = document.createElement("a");
    a.href = url;
    a.setAttribute("download", `ledi-dac7-${dac7Year}.xml`);
    // Add auth header via fetch + blob
    void fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        a.href = blobUrl;
        a.click();
        URL.revokeObjectURL(blobUrl);
      });
  };

  if (!user || user.rolle !== "admin") {
    setLocation("/");
    return null;
  }

  const handleApprove = (id: number) => {
    approveSpace.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAdminSpacesQueryKey() });
      }
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: "'Syne', sans-serif" }}>
          Admin Panel
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Brukere",            value: stats?.totaltBrukere ?? "–",   icon: <Users size={18} />,    color: "#00B4D8" },
            { label: "Plasser totalt",      value: stats?.totaltPlasser ?? "–",   icon: <MapPin size={18} />,   color: "#8B5CF6" },
            { label: "Bookinger",           value: stats?.totaltBookinger ?? "–", icon: <Calendar size={18} />, color: "#10B981" },
            { label: "Ledi inntekt",        value: stats ? `${Math.round(stats.totalInntekt).toLocaleString("nb-NO")} kr` : "–", icon: <TrendingUp size={18} />, color: "#F59E0B" },
            { label: "Venter godkjenning", value: stats?.ventendePlasser ?? "–", icon: <CheckCircle size={18} />, color: "#EF4444" },
            { label: "Aktive bookinger",    value: stats?.aktiveBookinger ?? "–", icon: <Calendar size={18} />, color: "#10B981" },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
              data-testid={`admin-stat-${i}`}>
              <div style={{ color: stat.color }} className="mb-2">{stat.icon}</div>
              <div className="text-xl font-bold text-white">{statsLoading ? "..." : stat.value}</div>
              <div className="text-xs text-white/50">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Financial overview */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            💰 Finansoversikt
          </h2>
          {statsLoading ? (
            <div className="text-white/40 text-sm">Laster...</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Cash flow breakdown */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <p className="text-xs font-semibold mb-3" style={{ color: "rgba(245,158,11,0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Kontantstrøm</p>
                <div className="space-y-2.5">
                  {[
                    { label: "Innbetalt fra leietakere", value: stats?.totaltInnbetaltFraLeietakere ?? 0, color: "#10B981" },
                    { label: "Utbetalt til utleiere",    value: stats?.totaltUtbetaltTilUtleiere   ?? 0, color: "#00B4D8" },
                    { label: "Ledi sin totale inntekt",  value: stats?.totalInntekt                ?? 0, color: "#F59E0B" },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between items-center text-sm">
                      <span style={{ color: "rgba(255,255,255,0.6)" }}>{row.label}</span>
                      <span className="font-bold" style={{ color: row.color }}>
                        {Math.round(row.value).toLocaleString("nb-NO")} kr
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 grid grid-cols-2 gap-2" style={{ borderTop: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="text-base font-bold text-white">{stats?.totaltBookinger ?? 0}</div>
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>transaksjoner</div>
                  </div>
                  <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="text-base font-bold text-white">
                      {stats?.totaltBookinger
                        ? `${Math.round((stats.totalInntekt ?? 0) / stats.totaltBookinger).toLocaleString("nb-NO")} kr`
                        : "0 kr"}
                    </div>
                    <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>snitt per booking</div>
                  </div>
                </div>
              </div>

              {/* Payout status */}
              <div className="rounded-2xl p-5" style={{ background: "rgba(239,68,68,0.06)", border: `1px solid ${(stats?.ventendePayout ?? 0) > 0 ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}` }}>
                <p className="text-xs font-semibold mb-3" style={{ color: (stats?.ventendePayout ?? 0) > 0 ? "#EF4444" : "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Ventende utbetalinger {(stats?.ventendePayout ?? 0) > 0 ? "⚠️" : "✅"}
                </p>
                {(stats?.ventendePayout ?? 0) > 0 ? (
                  <>
                    <div className="text-3xl font-black mb-1" style={{ color: "#EF4444", fontFamily: "'Syne', sans-serif" }}>
                      {Math.round(stats!.ventendePayout!).toLocaleString("nb-NO")} kr
                    </div>
                    <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Disse utbetalingene er bekreftet mottatt fra leietaker, men ikke sendt til utleier ennå.
                    </p>
                    <p className="text-xs font-semibold" style={{ color: "#EF4444" }}>
                      Sjekk Vipps Payout-status og bruk «Retry payout» for eventuelle feilede forsøk.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-3xl font-black mb-1" style={{ color: "#10B981", fontFamily: "'Syne', sans-serif" }}>0 kr</div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                      Ingen ventende utbetalinger. Alle utleiere er utbetalt via Vipps.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* DAC7 – Skatterapportering */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} style={{ color: "#00B4D8" }} />
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              DAC7 – Skatterapportering
            </h2>
          </div>

          {/* Year selector + actions */}
          <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(0,180,216,0.05)", border: "1px solid rgba(0,180,216,0.18)" }}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-xs text-white/60">Inntektsår:</label>
                <select
                  value={dac7Year}
                  onChange={e => setDac7Year(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl text-sm text-white border"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - 1 - i).map(y => (
                    <option key={y} value={y} style={{ background: "#0D1B2A" }}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleDownloadXml}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-80"
                style={{ background: "rgba(0,180,216,0.2)", border: "1px solid rgba(0,180,216,0.4)" }}
              >
                <Download size={13} /> Last ned XML
              </button>
              <button
                onClick={handleSendAarsoppgaver}
                disabled={sendLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)" }}
              >
                <Send size={13} /> Send årsoppgaver per e-post
              </button>
            </div>

            {sendStatus && (
              <p className="text-xs mb-3 px-3 py-2 rounded-xl"
                style={{ background: sendStatus.startsWith("✅") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: sendStatus.startsWith("✅") ? "#10B981" : "#EF4444" }}>
                {sendStatus}
              </p>
            )}

            {dac7?.sentAt && (
              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                ✅ Årsoppgave {dac7.year} sendt: {new Date(dac7.sentAt).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Utleiere med inntekt", value: dac7?.selgere?.length ?? 0, color: "#00B4D8" },
                { label: "Totalt innbetalt", value: dac7 ? `${Math.round(dac7.totaltInnbetalt).toLocaleString("nb-NO")} kr` : "–", color: "#10B981" },
                { label: "Ledi-avgift totalt", value: dac7 ? `${Math.round(dac7.totaltAvgift).toLocaleString("nb-NO")} kr` : "–", color: "#F59E0B" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-[11px] text-white/40 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Selger-tabell */}
            {(dac7?.selgere?.length ?? 0) > 0 ? (
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                      <th className="px-3 py-2 text-left text-white/50 font-semibold">Navn</th>
                      <th className="px-3 py-2 text-left text-white/50 font-semibold hidden sm:table-cell">Personnummer</th>
                      <th className="px-3 py-2 text-right text-white/50 font-semibold">Inntekt</th>
                      <th className="px-3 py-2 text-right text-white/50 font-semibold">Bookinger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dac7!.selgere.map((s, i) => (
                      <tr key={s.userId} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td className="px-3 py-2">
                          <div className="text-white font-medium">{s.navn}</div>
                          <div className="text-white/35">{s.epost}</div>
                        </td>
                        <td className="px-3 py-2 hidden sm:table-cell">
                          {s.personnummer ? (
                            <span className="font-mono text-white/70">{s.personnummer}</span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1">
                              <AlertCircle size={11} /> Mangler
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-white">{s.totalInntekt.toLocaleString("nb-NO")} kr</td>
                        <td className="px-3 py-2 text-right text-white/60">{s.antallBookinger}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-white/40 text-center py-4">Ingen bekreftede bookinger for {dac7Year}</p>
            )}
          </div>

          {/* Info */}
          <div className="rounded-xl p-3 flex gap-2 text-xs" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <AlertCircle size={13} style={{ color: "#00B4D8", flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: "rgba(255,255,255,0.45)" }}>
              DAC7-direktivet (implementert i Norge fra 2023) krever at Ledi rapporterer utleieinntekter til Skatteetaten innen 31. januar for foregående år.
              XML-filen sendes via Altinn. Årsoppgaven sendes automatisk til alle utleiere 1. februar hvert år.
            </p>
          </div>
        </div>

        {/* Arrangement management */}
        <ArrangementerPanel />

        {/* Pending spaces */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Ventende plasser ({(pendingSpaces ?? []).length})
          </h2>
          {(pendingSpaces ?? []).length === 0 ? (
            <div className="rounded-2xl p-6 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-white/40">Ingen plasser venter godkjenning</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(pendingSpaces ?? []).map((space) => (
                <div key={space.id} className="rounded-2xl p-4 flex items-center justify-between"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  data-testid={`pending-space-${space.id}`}>
                  <div>
                    <p className="text-sm font-semibold text-white">{space.tittel}</p>
                    <p className="text-xs text-white/50">{space.adresse}, {space.by} · {space.type}</p>
                  </div>
                  <button
                    onClick={() => handleApprove(space.id)}
                    disabled={approveSpace.isPending}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                    style={{ background: "#10B981" }}
                    data-testid={`button-approve-${space.id}`}
                  >
                    Godkjenn
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All bookings */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
            Alle bookinger
          </h2>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Plass</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Periode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Pris</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/60">Status</th>
                </tr>
              </thead>
              <tbody>
                {(allBookings ?? []).slice(0, 20).map((booking, i) => (
                  <tr key={booking.id}
                    style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}
                    data-testid={`admin-booking-row-${booking.id}`}>
                    <td className="px-4 py-3 text-white/70">#{booking.id}</td>
                    <td className="px-4 py-3 text-white">Plass #{booking.plassId}</td>
                    <td className="px-4 py-3 text-white/70">{booking.periodetype}</td>
                    <td className="px-4 py-3 text-white font-semibold">{Math.round(booking.totalPris ?? 0)} kr</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={
                          booking.status === "confirmed" ? { color: "#10B981", background: "rgba(16,185,129,0.1)" }
                          : booking.status === "cancelled" ? { color: "#EF4444", background: "rgba(239,68,68,0.1)" }
                          : { color: "#F59E0B", background: "rgba(245,158,11,0.1)" }
                        }>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(allBookings ?? []).length === 0 && (
              <div className="p-6 text-center text-white/40">Ingen bookinger</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
