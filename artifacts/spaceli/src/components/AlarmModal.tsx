import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, MapPin, Tag, Banknote, Clock } from "lucide-react";
import { useCreateAlarm } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";

const BYDELER = [
  "Frogner", "Sentrum", "Grünerløkka", "Sagene", "Majorstuen",
  "Tøyen", "Aker Brygge", "Nydalen", "Nordberg", "Røa",
  "Bergen", "Trondheim", "Stavanger", "Tromsø", "Hele Norge",
];

const TYPER = [
  { key: "", label: "Alle typer" },
  { key: "parking", label: "🚗 Parkering" },
  { key: "storage", label: "📦 Lagerplass" },
  { key: "ev", label: "⚡ Elbil" },
  { key: "camping", label: "🏕️ Camping" },
  { key: "baatplass", label: "⚓ Båtplass" },
  { key: "henger", label: "🚛 Henger" },
];

const PERIODER = [
  { key: "", label: "Alle perioder" },
  { key: "time", label: "Per time" },
  { key: "dag", label: "Per dag" },
  { key: "uke", label: "Per uke" },
  { key: "maaned", label: "Per måned" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  defaultBydel?: string;
}

export default function AlarmModal({ open, onClose, defaultBydel }: Props) {
  const { user } = useAuth();
  const [bydel, setBydel] = useState(defaultBydel ?? "");
  const [type, setType] = useState("");
  const [maxPris, setMaxPris] = useState("");
  const [periode, setPeriode] = useState("");
  const [success, setSuccess] = useState(false);

  const createAlarm = useCreateAlarm();

  const handleSubmit = () => {
    if (!bydel) return;
    createAlarm.mutate(
      {
        data: {
          bydel,
          type: type || null,
          maxPris: maxPris ? Number(maxPris) : null,
          periode: periode || null,
        },
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            onClose();
          }, 2200);
        },
      }
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            className="fixed z-50 inset-0 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto"
              style={{ background: "#0D1B2A", border: "1px solid rgba(0,180,216,0.2)" }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4 rounded-t-2xl"
                style={{ background: "linear-gradient(135deg, rgba(0,180,216,0.12), rgba(13,27,42,0))" }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #00B4D8, #1D4ED8)" }}
                  >
                    <Bell size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base">Sett opp Ledi Alarm</h2>
                    <p className="text-white/50 text-xs">Få varsel når en plass dukker opp</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {success ? (
                <div className="px-5 py-10 text-center">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-white font-bold text-lg">Alarm satt opp!</p>
                  <p className="text-white/50 text-sm mt-1">Vi varsler deg med en gang noe dukker opp i {bydel}.</p>
                </div>
              ) : (
                <div className="px-5 pb-5 pt-4 flex flex-col gap-4">
                  {!user && (
                    <div
                      className="px-3 py-2.5 rounded-xl text-xs text-center"
                      style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.2)" }}
                    >
                      Du må logge inn for å sette opp alarmer
                    </div>
                  )}

                  {/* Bydel */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                      <MapPin size={11} /> Område *
                    </label>
                    <select
                      value={bydel}
                      onChange={e => setBydel(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/10 border border-white/20 focus:outline-none focus:border-[#00B4D8]"
                    >
                      <option value="">Velg bydel / by...</option>
                      {BYDELER.map(b => (
                        <option key={b} value={b} style={{ background: "#0D1B2A" }}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                      <Tag size={11} /> Type plass
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {TYPER.map(t => (
                        <button
                          key={t.key}
                          onClick={() => setType(t.key)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={
                            type === t.key
                              ? { background: "#00B4D8", color: "#fff" }
                              : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                          }
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Periode */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                      <Clock size={11} /> Periode
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {PERIODER.map(p => (
                        <button
                          key={p.key}
                          onClick={() => setPeriode(p.key)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                          style={
                            periode === p.key
                              ? { background: "#00B4D8", color: "#fff" }
                              : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                          }
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Max pris */}
                  <div>
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-white/60 mb-1.5 uppercase tracking-wide">
                      <Banknote size={11} /> Maks pris (kr)
                    </label>
                    <input
                      type="number"
                      placeholder="f.eks. 2500"
                      value={maxPris}
                      onChange={e => setMaxPris(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white bg-white/10 border border-white/20 focus:outline-none focus:border-[#00B4D8] placeholder:text-white/30"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!bydel || !user || createAlarm.isPending}
                    className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #00B4D8, #1D4ED8)" }}
                    data-testid="button-create-alarm"
                  >
                    <Bell size={15} />
                    {createAlarm.isPending ? "Setter opp alarm..." : "Aktiver Ledi Alarm"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
