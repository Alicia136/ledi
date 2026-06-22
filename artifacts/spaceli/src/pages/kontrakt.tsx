import { useParams } from "wouter";
import { useGetBooking } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
}

function fmtKr(n: number | null | undefined) {
  if (n == null) return "–";
  return `${Math.round(n).toLocaleString("nb-NO")} kr`;
}

export default function KontraktPage() {
  const { id } = useParams<{ id: string }>();
  const bookingId = parseInt(id ?? "", 10);
  const { user } = useAuth();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: booking, isLoading } = useGetBooking(bookingId, { query: { enabled: !!bookingId && !!user } as any });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1B2A" }}>
        <p className="text-white/50">Logg inn for å se kontrakten.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1B2A" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#00B4D8", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1B2A" }}>
        <p className="text-white/50">Fant ikke bookingen.</p>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen" style={{ background: "#f4f6f9" }}>
      {/* Toolbar — hidden on print */}
      <div className="print:hidden flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
        <Link href="/mine-bookinger">
          <button className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} /> Tilbake
          </button>
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: "#0D1B2A" }}
        >
          <Printer size={15} /> Last ned / Skriv ut
        </button>
      </div>

      {/* Kontrakt */}
      <div className="max-w-2xl mx-auto px-6 py-10 print:py-0 print:px-0 print:max-w-full">
        <div className="bg-white rounded-2xl shadow-lg print:shadow-none print:rounded-none p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-gray-100">
            <div>
              <h1 className="text-3xl font-black text-gray-900" style={{ letterSpacing: "-0.5px" }}>
                Le<span style={{ color: "#00B4D8" }}>di</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">Norges markedsplass for ledige plasser</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Booking-nr.</p>
              <p className="text-lg font-black text-gray-900">#{booking.id}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-1">Leiekontrakt</h2>
          <p className="text-sm text-gray-500 mb-8">Utskriftsdato: {today}</p>

          {/* Partene */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-4 rounded-xl" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#0369a1" }}>Leietaker</p>
              <p className="text-sm font-semibold text-gray-800">{booking.leietakerNavn ?? "–"}</p>
              <p className="text-xs text-gray-500 mt-1">Bruker-ID: {booking.leietakerId}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#15803d" }}>Utleier</p>
              <p className="text-sm font-semibold text-gray-800">Registrert på Ledi</p>
              <p className="text-xs text-gray-500 mt-1">Plass-ID: {booking.plassId}</p>
            </div>
          </div>

          {/* Leieobjektet */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Leieobjektet</h3>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Tittel", booking.spaseTittel ?? "–"],
                  ["Adresse", booking.spaseAdresse ?? "–"],
                  ["Periodetype", booking.periodetype ?? "–"],
                  ["Fra", fmtDate(booking.startDato)],
                  ["Til", fmtDate(booking.sluttDato)],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-100">
                    <td className="py-2.5 text-gray-500 w-36">{k}</td>
                    <td className="py-2.5 font-semibold text-gray-800">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pris */}
          <div className="mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Prisbetingelser</h3>
            <div className="rounded-xl overflow-hidden border border-gray-100">
              {[
                ["Totalbeløp betalt av leietaker", fmtKr(booking.totalPris)],
                ["Serviceavgift Ledi (8 %)", fmtKr(booking.spaceliGebyr)],
                ["Utbetaling til utleier (etter 8 % gebyr)", fmtKr(booking.utleierBelop)],
              ].map(([k, v], i) => (
                <div
                  key={k}
                  className="flex justify-between px-4 py-3 text-sm"
                  style={{ background: i === 2 ? "#f0f9ff" : i % 2 === 0 ? "#fff" : "#f9fafb" }}
                >
                  <span className={i === 2 ? "font-bold text-gray-900" : "text-gray-600"}>{k}</span>
                  <span className={i === 2 ? "font-black text-blue-700" : "font-semibold text-gray-800"}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tilgangskode */}
          {booking.tilgangskode && (
            <div className="mb-6 p-4 rounded-xl text-center" style={{ background: "#0D1B2A" }}>
              <p className="text-xs text-white/50 mb-1">Tilgangskode</p>
              <p className="text-3xl font-black tracking-[0.4em]" style={{ color: "#00FFD0" }}>
                {booking.tilgangskode}
              </p>
            </div>
          )}

          {/* Vilkår */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400 leading-relaxed">
            <p className="font-semibold text-gray-600 mb-2">Vilkår og betingelser</p>
            <p>
              Denne kontrakten er inngått via Ledi sin digitale markedsplass og reguleres av Ledis{" "}
              <strong>Standard Leiekontrakt</strong> og gjeldende <strong>Vilkår for bruk</strong>, tilgjengelig på ledi.no/vilkar.
              Ledi opptrer som tilrettelegger mellom partene og er ikke ansvarlig for skade på person eller eiendom som følge av leieforholdet.
              Begge parter plikter å ha egnet forsikring for leieperioden. Tvister løses i henhold til Ledis tvisteløsningsrutiner på ledi.no/tvistmelding.
            </p>
            <div className="grid grid-cols-2 gap-8 mt-8">
              <div>
                <div className="border-b border-gray-300 h-8 mb-2" />
                <p>Leietakers signatur</p>
                <p className="text-gray-300">{today}</p>
              </div>
              <div>
                <div className="border-b border-gray-300 h-8 mb-2" />
                <p>Utleiers signatur</p>
                <p className="text-gray-300">{today}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-300">
            Ledi · ledi.no · hei@ledi.no
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
