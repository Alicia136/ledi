import { useState } from "react";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import { ArrowLeft, AlertTriangle, CheckCircle2, Mail, FileText, Shield } from "lucide-react";

const REASONS = [
  "Plassen var ikke som beskrevet i annonsen",
  "Jeg fikk ikke tilgang til plassen",
  "Utleier møtte ikke opp / svarte ikke",
  "Plassen var opptatt/blokkert ved ankomst",
  "Skade på kjøretøy eller eiendom under leie",
  "Urettmessig fakturering eller gebyr",
  "Leietaker skadet min plass",
  "Leietaker oversteg leieperioden",
  "Annet",
];

export default function TvistmeldingPage() {
  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Tvistemelding #${bookingId} – ${reason}`);
    const body = encodeURIComponent(
      `Booking ID: ${bookingId}\nÅrsak: ${reason}\n\nBeskrivelse:\n${description}\n\nKontaktepost: ${email}`
    );
    window.location.href = `mailto:hei@ledi.no?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const inputCls =
    "w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors";
  const inputStyle = { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)" };

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <button className="text-white/50 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Tvistemelding
            </h1>
            <p className="text-white/50 text-sm">Meld inn en tvist eller klage på en booking</p>
          </div>
        </div>

        {/* Process steps */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: FileText, title: "1. Meld inn", desc: "Fyll ut skjemaet under" },
            { icon: Shield,   title: "2. Behandling", desc: "Vi svarer innen 2 arbeidsdager" },
            { icon: CheckCircle2, title: "3. Løsning", desc: "Vi hjelper med avklaring" },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-4 text-center"
              style={{ background: "rgba(0,180,216,0.06)", border: "1px solid rgba(0,180,216,0.15)" }}
            >
              <Icon size={20} style={{ color: "#00B4D8", margin: "0 auto 8px" }} />
              <p className="text-xs font-bold text-white">{title}</p>
              <p className="text-xs text-white/50 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Important disclaimer */}
        <div className="rounded-2xl p-4 mb-6 flex gap-3" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <AlertTriangle size={16} style={{ color: "#EF4444", marginTop: 2, flexShrink: 0 }} />
          <div>
            <p className="text-xs font-semibold text-white mb-1">Viktig å vite</p>
            <p className="text-xs text-white/55 leading-relaxed">
              Ledi er en formidlingsplattform og ikke part i leieavtalen. Vi kan bidra til å formidle kontakt mellom partene, men kan ikke pålegge utleier eller leietaker å betale erstatning. Tap, skader og ulykker er et ansvar mellom utleier og leietaker basert på dine egne forsikringer.
            </p>
          </div>
        </div>

        {sent ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}
          >
            <CheckCircle2 size={40} style={{ color: "#10B981", margin: "0 auto 16px" }} />
            <h3 className="text-lg font-bold text-white mb-2">Tvistemelding sendt!</h3>
            <p className="text-white/60 text-sm mb-4">
              Vi har mottatt din melding og vil svare på{" "}
              <span style={{ color: "#00B4D8" }}>hei@ledi.no</span> innen 2 arbeidsdager.
            </p>
            <Link href="/">
              <button
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
              >
                Tilbake til forsiden
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Booking ID (fra bookingbekreftelsen)</label>
              <input
                type="text"
                value={bookingId}
                onChange={e => setBookingId(e.target.value)}
                required
                placeholder="F.eks. 12345"
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Din e-post</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="din@epost.no"
                className={inputCls}
                style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Årsak til tvist</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
                className={inputCls}
                style={inputStyle}
              >
                <option value="">Velg årsak…</option>
                {REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/60 mb-1.5">Detaljert beskrivelse</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
                rows={5}
                placeholder="Beskriv hva som skjedde, tidspunkt, og hva du ønsker som utfall…"
                className={inputCls}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>

            <button
              type="submit"
              disabled={!bookingId || !reason || !description || !email}
              className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
            >
              <Mail size={16} />
              Send tvistemelding
            </button>

            <p className="text-xs text-white/35 text-center">
              Meldingen sendes til <span style={{ color: "#00B4D8" }}>hei@ledi.no</span> via din e-postklient
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
