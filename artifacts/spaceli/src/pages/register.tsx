import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const [navn, setNavn] = useState("");
  const [epost, setEpost] = useState("");
  const [passord, setPassord] = useState("");
  const [rolle, setRolle] = useState("leietaker");
  const [personnummer, setPersonnummer] = useState("");
  const [error, setError] = useState("");
  const [harForsikring, setHarForsikring] = useState(false);
  const [harAkseptertVilkar, setHarAkseptertVilkar] = useState(false);
  const register = useRegister();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    register.mutate(
      { data: { navn, epost, passord, rolle, personnummer: personnummer || null } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          setLocation(rolle === "utleier" ? "/dashboard" : "/");
        },
        onError: () => {
          setError("Noe gikk galt. E-posten kan allerede være i bruk.");
        },
      }
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "#0D1B2A",
        fontFamily: "'DM Sans', sans-serif",
        backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,180,216,0.12) 0%, transparent 70%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-bold cursor-pointer" style={{ fontFamily: "'Syne', sans-serif" }}>
              <span className="text-white">Led</span>
              <span style={{ color: "#00B4D8" }}>i</span>
            </span>
          </Link>
          <p className="text-white/50 text-sm mt-2">Tjen penger på ledig plass.</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
            Opprett konto
          </h1>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {[
              { key: "leietaker", label: "Leie plass", sub: "Finn og book plasser" },
              { key: "utleier", label: "Leie ut plass", sub: "Tjen penger på plassen din" },
            ].map(r => (
              <button
                key={r.key}
                onClick={() => setRolle(r.key)}
                className="p-3 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: rolle === r.key ? "#00B4D8" : "rgba(255,255,255,0.1)",
                  background: rolle === r.key ? "rgba(0,180,216,0.1)" : "rgba(255,255,255,0.05)",
                }}
                data-testid={`button-rolle-${r.key}`}
              >
                <div className="text-sm font-bold text-white">{r.label}</div>
                <div className="text-xs text-white/50">{r.sub}</div>
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl text-sm text-red-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Fullt navn</label>
              <input
                type="text"
                value={navn}
                onChange={e => setNavn(e.target.value)}
                required
                placeholder="Ola Nordmann"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00B4D8] transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                data-testid="input-navn"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1.5">E-post</label>
              <input
                type="email"
                value={epost}
                onChange={e => setEpost(e.target.value)}
                required
                placeholder="din@epost.no"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00B4D8] transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                data-testid="input-email"
              />
            </div>
            <div>
              <label className="block text-xs text-white/60 mb-1.5">Passord</label>
              <input
                type="password"
                value={passord}
                onChange={e => setPassord(e.target.value)}
                required
                placeholder="Minst 8 tegn"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00B4D8] transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                data-testid="input-password"
              />
            </div>

            {/* Personnummer – kun for utleiere (DAC7) */}
            {rolle === "utleier" && (
              <div>
                <label className="block text-xs text-white/60 mb-1.5">
                  Personnummer eller org.nr. <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={personnummer}
                  onChange={e => setPersonnummer(e.target.value)}
                  required={rolle === "utleier"}
                  placeholder="11 siffer (privat) eller 9 siffer (bedrift)"
                  className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00B4D8] transition-colors"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  data-testid="input-personnummer"
                />
                <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Kreves for DAC7-rapportering til Skatteetaten. Lagres kryptert og deles kun med skattemyndighetene.
                </p>
              </div>
            )}

            {/* Checkbox helper */}
            {[
              {
                checked: harForsikring,
                toggle: () => setHarForsikring(v => !v),
                testId: "checkbox-forsikring",
                label: "Jeg bekrefter at jeg har gyldig forsikring for min aktivitet på Ledi (f.eks. bilforsikring, innboforsikring eller tilsvarende). Jeg forstår at Ledi ikke tilbyr noen form for forsikring eller ansvarsgaranti.",
              },
              {
                checked: harAkseptertVilkar,
                toggle: () => setHarAkseptertVilkar(v => !v),
                testId: "checkbox-vilkar",
                label: null,
              },
            ].map(({ checked, toggle, testId, label }) => (
              <div
                key={testId}
                className="rounded-2xl p-4 cursor-pointer select-none"
                style={{
                  background: checked ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${checked ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.12)"}`,
                  transition: "all 0.2s",
                }}
                onClick={toggle}
                data-testid={testId}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-all"
                    style={{
                      background: checked ? "#10B981" : "rgba(255,255,255,0.08)",
                      border: `2px solid ${checked ? "#10B981" : "rgba(255,255,255,0.25)"}`,
                    }}
                  >
                    {checked && (
                      <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                        <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-white/80 leading-snug" style={{ lineHeight: 1.6 }}>
                    {label ?? (
                      <>
                        Jeg har lest og aksepterer{" "}
                        <a
                          href="/vilkar"
                          target="_blank"
                          onClick={e => e.stopPropagation()}
                          className="underline"
                          style={{ color: "#00B4D8" }}
                        >
                          brukervilkårene
                        </a>
                        {" "}og{" "}
                        <a
                          href="/personvern"
                          target="_blank"
                          onClick={e => e.stopPropagation()}
                          className="underline"
                          style={{ color: "#00B4D8" }}
                        >
                          personvernerklæringen
                        </a>
                        .
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={register.isPending || !harForsikring || !harAkseptertVilkar}
              className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
              data-testid="button-submit-register"
            >
              {register.isPending
                ? "Oppretter konto..."
                : !harForsikring || !harAkseptertVilkar
                  ? "Kryss av begge feltene for å fortsette"
                  : "Opprett konto gratis"}
            </button>
          </form>

          <div className="mt-6 border-t border-white/10 pt-5 text-center">
            <p className="text-sm text-white/50">
              Har du allerede konto?{" "}
              <Link href="/logg-inn">
                <span className="font-semibold cursor-pointer" style={{ color: "#00B4D8" }}>Logg inn</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
