import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Check, Smartphone, Mail, Lock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STEP_LABELS = ["E-post", "Passord", "Vipps-nummer"];

const variants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function BliUtleierPage() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const register = useRegister();

  const [step, setStep] = useState(1);
  const [epost, setEpost] = useState("");
  const [mobil, setMobil] = useState("");
  const [passord, setPassord] = useState("");
  const [vippsNummer, setVippsNummer] = useState("");
  const [sameAsMobil, setSameAsMobil] = useState(true);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!epost.includes("@")) { setError("Skriv inn en gyldig e-postadresse"); return; }
    setError("");
    if (mobil) setVippsNummer(mobil.replace(/\s/g, ""));
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (passord.length < 8) { setError("Passordet må være minst 8 tegn"); return; }
    setError("");
    setStep(3);
  };

  const handleStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVipps = sameAsMobil ? mobil.replace(/\s/g, "") : vippsNummer.replace(/\s/g, "");
    setError("");

    register.mutate(
      {
        data: {
          navn: epost.split("@")[0],
          epost,
          passord,
          rolle: "utleier",
          vippsNummer: finalVipps || null,
        },
      },
      {
        onSuccess: (data) => {
          setToken(data.token);
          setDone(true);
          setTimeout(() => setLocation("/dashboard"), 1800);
        },
        onError: () => {
          setError("E-posten er allerede registrert. Prøv å logg inn.");
        },
      }
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "#0D1B2A",
        fontFamily: "'DM Sans', sans-serif",
        backgroundImage: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,180,216,0.13) 0%, transparent 65%)",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="text-2xl font-bold cursor-pointer" style={{ fontFamily: "'Syne', sans-serif" }}>
              <span className="text-white">Led</span><span style={{ color: "#00B4D8" }}>i</span>
            </span>
          </Link>
          <Link href="/">
            <span className="text-xs text-white/35 hover:text-white/60 transition-colors cursor-pointer">
              ← Forsiden
            </span>
          </Link>
        </div>
        <Link href="/logg-inn">
          <span className="text-sm text-white/50 hover:text-white/80 transition-colors cursor-pointer">
            Har du konto? <span style={{ color: "#00B4D8" }}>Logg inn</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ background: "rgba(16,185,129,0.15)", border: "2px solid #10B981" }}
              >
                <Check size={36} style={{ color: "#10B981" }} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                Konto opprettet! 🎉
              </h2>
              <p className="text-white/50 text-sm">Sender deg til dashbordet...</p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
                  style={{ background: "rgba(0,180,216,0.12)", border: "1px solid rgba(0,180,216,0.25)", color: "#00B4D8" }}
                >
                  ⚡ Live på 2 minutter
                </div>
                <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                  Start å tjene penger
                </h1>
                <p className="text-white/50 text-sm">Ingen binding. Gratis å opprette konto.</p>
              </div>

              {/* Step 1 only: Social login alternatives */}
              {step === 1 && (
                <div className="space-y-2.5 mb-6">
                  {[
                    { icon: "🔐", label: "Fortsett med BankID", soon: true },
                    { icon: "📱", label: "Fortsett med Vipps", soon: true },
                    { icon: "G",  label: "Fortsett med Google", soon: true, google: true },
                  ].map(btn => (
                    <button
                      key={btn.label}
                      disabled
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all opacity-45 cursor-not-allowed"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
                    >
                      <span className={`text-base w-6 text-center font-${btn.google ? "bold" : "normal"}`} style={btn.google ? { color: "#4285F4", fontFamily: "sans-serif" } : {}}>
                        {btn.icon}
                      </span>
                      <span className="flex-1 text-left">{btn.label}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}>
                        Kommer snart
                      </span>
                    </button>
                  ))}

                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                    <span className="text-xs text-white/35">eller</span>
                    <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                  </div>
                </div>
              )}

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/40">Steg {step} av {STEP_LABELS.length}</p>
                  <p className="text-xs font-medium" style={{ color: "#00B4D8" }}>{STEP_LABELS[step - 1]}</p>
                </div>
                <div className="h-1 rounded-full w-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${(step / STEP_LABELS.length) * 100}%`, background: "linear-gradient(90deg, #1B4F8C, #00B4D8)" }}
                  />
                </div>
              </div>

              {/* Card */}
              <div
                className="rounded-2xl overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.form
                      key="step1"
                      variants={variants} initial="enter" animate="center" exit="exit"
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      onSubmit={handleStep1}
                      className="p-6 space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Mail size={15} style={{ color: "#00B4D8" }} />
                        <h2 className="text-base font-bold text-white">E-postadresse</h2>
                      </div>

                      <div>
                        <input
                          type="email"
                          value={epost}
                          onChange={e => { setEpost(e.target.value); setError(""); }}
                          required
                          autoFocus
                          placeholder="din@epost.no"
                          data-testid="input-email"
                          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white/50 block mb-1.5">Mobilnummer (for Vipps-utbetaling)</label>
                        <div className="flex gap-2">
                          <span
                            className="px-3 py-3 rounded-xl text-sm font-medium flex items-center"
                            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", minWidth: 54 }}
                          >
                            +47
                          </span>
                          <input
                            type="tel"
                            value={mobil}
                            onChange={e => setMobil(e.target.value.replace(/\D/g, "").slice(0, 8))}
                            placeholder="41234567"
                            data-testid="input-mobil"
                            className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                          />
                        </div>
                        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Valgfritt – kan legges til senere</p>
                      </div>

                      {error && <p className="text-xs text-red-400">{error}</p>}

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                      >
                        Kom i gang <ArrowRight size={16} />
                      </button>
                    </motion.form>
                  )}

                  {step === 2 && (
                    <motion.form
                      key="step2"
                      variants={variants} initial="enter" animate="center" exit="exit"
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      onSubmit={handleStep2}
                      className="p-6 space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Lock size={15} style={{ color: "#00B4D8" }} />
                        <h2 className="text-base font-bold text-white">Velg passord</h2>
                      </div>

                      <div>
                        <input
                          type="password"
                          value={passord}
                          onChange={e => { setPassord(e.target.value); setError(""); }}
                          required
                          autoFocus
                          minLength={8}
                          placeholder="Minst 8 tegn"
                          data-testid="input-password"
                          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
                          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                        />
                        {/* Password strength indicator */}
                        {passord.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {[1, 2, 3, 4].map(n => (
                              <div
                                key={n}
                                className="flex-1 h-1 rounded-full transition-all"
                                style={{
                                  background: passord.length >= n * 3
                                    ? passord.length >= 12 ? "#10B981"
                                      : passord.length >= 8 ? "#F59E0B"
                                      : "#EF4444"
                                    : "rgba(255,255,255,0.08)",
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {error && <p className="text-xs text-red-400">{error}</p>}

                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                        style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                      >
                        Neste <ArrowRight size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                      >
                        ← Tilbake
                      </button>
                    </motion.form>
                  )}

                  {step === 3 && (
                    <motion.form
                      key="step3"
                      variants={variants} initial="enter" animate="center" exit="exit"
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      onSubmit={handleStep3}
                      className="p-6 space-y-4"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Smartphone size={15} style={{ color: "#00B4D8" }} />
                        <h2 className="text-base font-bold text-white">📱 Hvor skal pengene?</h2>
                      </div>

                      <p className="text-sm text-white/50">Vipps-nummeret ditt brukes for å utbetale leieinntekter.</p>

                      {/* Same as mobile toggle */}
                      {mobil && (
                        <div className="space-y-2">
                          {[
                            { yes: true,  label: `Ja – bruk +47 ${mobil}` },
                            { yes: false, label: "Nei – annet nummer" },
                          ].map(opt => (
                            <label
                              key={String(opt.yes)}
                              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                              style={{
                                background: sameAsMobil === opt.yes ? "rgba(0,180,216,0.1)" : "rgba(255,255,255,0.04)",
                                border: `1px solid ${sameAsMobil === opt.yes ? "rgba(0,180,216,0.3)" : "rgba(255,255,255,0.1)"}`,
                              }}
                            >
                              <div
                                className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0"
                                style={{ borderColor: sameAsMobil === opt.yes ? "#00B4D8" : "rgba(255,255,255,0.3)" }}
                              >
                                {sameAsMobil === opt.yes && (
                                  <div className="w-2 h-2 rounded-full" style={{ background: "#00B4D8" }} />
                                )}
                              </div>
                              <input
                                type="radio"
                                className="sr-only"
                                checked={sameAsMobil === opt.yes}
                                onChange={() => setSameAsMobil(opt.yes)}
                              />
                              <span className="text-sm text-white/80">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {(!mobil || !sameAsMobil) && (
                        <div>
                          <label className="text-xs text-white/50 block mb-1.5">Vipps-nummer</label>
                          <div className="flex gap-2">
                            <span
                              className="px-3 py-3 rounded-xl text-sm font-medium flex items-center"
                              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", minWidth: 54 }}
                            >
                              +47
                            </span>
                            <input
                              type="tel"
                              value={vippsNummer}
                              onChange={e => setVippsNummer(e.target.value.replace(/\D/g, "").slice(0, 8))}
                              autoFocus={!mobil}
                              placeholder="41234567"
                              data-testid="input-vipps"
                              className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
                              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Kan oppdateres i dashbordet</p>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="rounded-xl p-3 space-y-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">E-post</span>
                          <span className="text-white/70 truncate max-w-[200px]">{epost}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Rolle</span>
                          <span style={{ color: "#00B4D8" }}>Utleier</span>
                        </div>
                      </div>

                      <div className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                        Ved å opprette konto aksepterer du{" "}
                        <Link href="/vilkar">
                          <span className="underline cursor-pointer" style={{ color: "#00B4D8" }}>vilkårene</span>
                        </Link>{" "}
                        og{" "}
                        <Link href="/personvern">
                          <span className="underline cursor-pointer" style={{ color: "#00B4D8" }}>personvernerklæringen</span>
                        </Link>
                        .
                      </div>

                      {error && <p className="text-xs text-red-400 text-center">{error}</p>}

                      <button
                        type="submit"
                        disabled={register.isPending}
                        className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
                        data-testid="button-submit-register"
                      >
                        {register.isPending ? "Oppretter konto..." : "Ferdig – legg ut min plass 🚀"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full py-2 text-sm text-white/40 hover:text-white/60 transition-colors"
                      >
                        ← Tilbake
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-5 mt-6">
                {[
                  { icon: <ShieldCheck size={13} />, text: "Kryptert og sikker" },
                  { icon: <Check size={13} />, text: "Gratis å opprette" },
                  { icon: <Check size={13} />, text: "Ingen binding" },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                    <span style={{ color: "#00B4D8" }}>{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
