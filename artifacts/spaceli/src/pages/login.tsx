import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { setToken } = useAuth();
  const [epost, setEpost] = useState("");
  const [passord, setPassord] = useState("");
  const [error, setError] = useState("");
  const login = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    login.mutate(
      { data: { epost, passord } },
      {
        onSuccess: (data) => {
          setToken(data.token);
          setLocation("/");
        },
        onError: () => {
          setError("Feil e-post eller passord. Prøv igjen.");
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
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-3xl font-bold cursor-pointer" style={{ fontFamily: "'Syne', sans-serif" }}>
              <span className="text-white">Led</span>
              <span style={{ color: "#00B4D8" }}>i</span>
            </span>
          </Link>
          <p className="text-white/50 text-sm mt-2">Finn ledig plass nær deg.</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          <h1 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: "'Syne', sans-serif" }}>
            Logg inn
          </h1>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl text-sm text-red-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00B4D8] transition-colors"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                data-testid="input-password"
              />
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-60 transition-opacity"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
              data-testid="button-submit-login"
            >
              {login.isPending ? "Logger inn..." : "Logg inn"}
            </button>
          </form>

          <div className="mt-3 text-center">
            <Link href="/glemt-passord">
              <span className="text-xs cursor-pointer" style={{ color: "#00B4D8" }}>Glemt passordet?</span>
            </Link>
          </div>

          <div className="mt-5 border-t border-white/10 pt-5 text-center">
            <p className="text-sm text-white/50">
              Har du ikke konto?{" "}
              <Link href="/registrer">
                <span className="font-semibold cursor-pointer" style={{ color: "#00B4D8" }}>
                  Registrer deg gratis
                </span>
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
