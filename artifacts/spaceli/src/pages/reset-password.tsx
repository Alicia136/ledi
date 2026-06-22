import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useResetPassword } from "@workspace/api-client-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState("");
  const [passord, setPassord] = useState("");
  const [bekreft, setBekreft] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const reset = useResetPassword();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) setToken(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (passord.length < 8) { setError("Passordet må være minst 8 tegn."); return; }
    if (passord !== bekreft) { setError("Passordene stemmer ikke overens."); return; }
    if (!token) { setError("Ugyldig tilbakestillingslenke."); return; }

    reset.mutate(
      { data: { token, nyttPassord: passord } },
      {
        onSuccess: () => { setSuccess(true); setTimeout(() => setLocation("/logg-inn"), 3000); },
        onError: () => setError("Lenken er ugyldig eller utløpt. Be om en ny."),
      }
    );
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
        <div className="text-center">
          <p className="text-white/60 mb-4">Ugyldig tilbakestillingslenke.</p>
          <Link href="/glemt-passord">
            <button className="px-6 py-3 rounded-xl text-sm font-semibold" style={{ background: "rgba(0,180,216,0.15)", color: "#00B4D8" }}>
              Be om ny lenke
            </button>
          </Link>
        </div>
      </div>
    );
  }

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
          <p className="text-white/50 text-sm mt-2">Velg nytt passord</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {success ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                Passordet er oppdatert!
              </h2>
              <p className="text-white/60 text-sm">Du sendes til innlogging om et øyeblikk...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
                Nytt passord
              </h2>
              {error && (
                <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Nytt passord</label>
                  <input
                    type="password"
                    value={passord}
                    onChange={(e) => setPassord(e.target.value)}
                    required
                    placeholder="Minst 8 tegn"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">Bekreft passord</label>
                  <input
                    type="password"
                    value={bekreft}
                    onChange={(e) => setBekreft(e.target.value)}
                    required
                    placeholder="Gjenta passordet"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={reset.isPending}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #00B4D8, #0077A8)" }}
                >
                  {reset.isPending ? "Lagrer..." : "Lagre nytt passord"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
