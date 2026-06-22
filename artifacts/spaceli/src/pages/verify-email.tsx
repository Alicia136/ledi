import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useVerifyEmail } from "@workspace/api-client-react";

export default function VerifyEmailPage() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { isLoading, isError, isSuccess } = useVerifyEmail(
    { token: token ?? "" },
    { query: { enabled: !!token, retry: false } as any }
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "#0D1B2A",
        fontFamily: "'DM Sans', sans-serif",
        backgroundImage: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,180,216,0.12) 0%, transparent 70%)",
      }}
    >
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Link href="/">
            <span className="text-3xl font-bold cursor-pointer" style={{ fontFamily: "'Syne', sans-serif" }}>
              <span className="text-white">Led</span>
              <span style={{ color: "#00B4D8" }}>i</span>
            </span>
          </Link>
        </div>

        <div
          className="rounded-2xl p-10"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {!token || isLoading ? (
            <>
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-4 animate-spin" style={{ borderColor: "#00B4D8", borderTopColor: "transparent" }} />
              <p className="text-white/60">Bekrefter e-postadressen din...</p>
            </>
          ) : isSuccess ? (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                E-post bekreftet!
              </h2>
              <p className="text-white/60 mb-6">
                E-postadressen din er bekreftet. Du kan nå bruke alle funksjonene på Ledi.
              </p>
              <Link href="/">
                <button
                  className="w-full py-3 rounded-xl font-bold text-sm text-white"
                  style={{ background: "linear-gradient(135deg, #00B4D8, #0077A8)" }}
                >
                  Gå til forsiden
                </button>
              </Link>
            </>
          ) : isError ? (
            <>
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                Ugyldig lenke
              </h2>
              <p className="text-white/60 mb-6">
                Bekreftelseslenken er ugyldig eller utløpt. Logg inn for å be om en ny lenke.
              </p>
              <Link href="/logg-inn">
                <button
                  className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{ background: "rgba(0,180,216,0.15)", color: "#00B4D8", border: "1px solid rgba(0,180,216,0.3)" }}
                >
                  Logg inn
                </button>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
