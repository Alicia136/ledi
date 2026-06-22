import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, MessageCircle } from "lucide-react";

const SCENARIOS = [
  { icon: "🔑", label: "Tilgangskoden fungerer ikke" },
  { icon: "🔒", label: "Porten er låst" },
  { icon: "🚗", label: "Plassen er opptatt av andre" },
  { icon: "🚨", label: "Sikkerhetsbekymring" },
];

const WHATSAPP_NUMBER = "4799999999"; // Bytt til ekte nummer
const PHONE_NUMBER = "+47 999 99 999"; // Bytt til ekte nummer
const PHONE_HREF = "tel:+4799999999";

export default function EmergencyHelp() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const now = new Date();
  const hour = now.getHours();
  const isOpen = hour >= 7 && hour < 23;

  function waLink(scenario: string) {
    const msg = encodeURIComponent(
      `Hei Ledi support! Jeg trenger hjelp nå.\n\nProblem: ${scenario}\n\nBooking-referanse: (fyll inn)`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-white text-sm shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #DC2626, #EF4444)",
          boxShadow: "0 4px 24px rgba(220,38,38,0.5)",
        }}
        aria-label="Trenger hjelp nå"
        data-testid="emergency-help-button"
      >
        <span className="text-base">🆘</span>
        <span>Trenger hjelp nå</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setOpen(false); setSelected(null); }}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
            />

            {/* Panel */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-6 sm:top-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-[360px] rounded-t-3xl sm:rounded-3xl overflow-hidden"
              style={{ background: "#0D1B2A", border: "1px solid rgba(220,38,38,0.4)" }}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4" style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.15) 0%, rgba(239,68,68,0.08) 100%)" }}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🆘</span>
                      <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
                        Trenger hjelp nå?
                      </h2>
                    </div>
                    <p className="text-sm text-white/50">Velg hva som er galt – vi kobler deg rett til support.</p>
                  </div>
                  <button
                    onClick={() => { setOpen(false); setSelected(null); }}
                    className="p-1.5 rounded-xl hover:bg-white/10 transition-colors text-white/40 hover:text-white flex-shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Status badge */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{
                    background: isOpen ? "rgba(16,185,129,0.12)" : "rgba(107,114,128,0.12)",
                    border: `1px solid ${isOpen ? "rgba(16,185,129,0.3)" : "rgba(107,114,128,0.3)"}`,
                    color: isOpen ? "#10B981" : "#9CA3AF",
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: isOpen ? "#10B981" : "#9CA3AF", boxShadow: isOpen ? "0 0 6px #10B981" : "none" }} />
                  {isOpen ? "Åpent nå · Svar innen 30 min" : "Stengt – åpner kl. 07:00"}
                  <span className="text-white/30 ml-1">07:00–23:00</span>
                </div>
              </div>

              {/* Scenario picker */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Hva er problemet?</p>
                <div className="space-y-2">
                  {SCENARIOS.map(s => (
                    <button
                      key={s.label}
                      onClick={() => setSelected(s.label)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm text-left transition-all"
                      style={{
                        background: selected === s.label ? "rgba(220,38,38,0.12)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${selected === s.label ? "rgba(220,38,38,0.4)" : "rgba(255,255,255,0.08)"}`,
                        color: selected === s.label ? "#FCA5A5" : "rgba(255,255,255,0.7)",
                      }}
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="font-medium">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-5 pb-6 space-y-2">
                <a
                  href={selected ? waLink(selected) : `https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-97"
                  style={{ background: "linear-gradient(135deg, #15803D, #22C55E)", boxShadow: "0 4px 16px rgba(34,197,94,0.3)" }}
                >
                  <MessageCircle size={17} />
                  Kontakt via WhatsApp
                </a>
                <a
                  href={PHONE_HREF}
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl font-bold text-sm transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }}
                >
                  <Phone size={17} />
                  Ring {PHONE_NUMBER}
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
