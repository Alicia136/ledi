import { useState } from "react";
import { Link } from "wouter";
import { useForgotPassword } from "@workspace/api-client-react";

export default function ForgotPasswordPage() {
  const [epost, setEpost] = useState("");
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgot.mutate(
      { data: { epost } },
      { onSuccess: () => setSent(true) }
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
          <p className="text-white/50 text-sm mt-2">Tilbakestill passordet ditt</p>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
                Sjekk innboksen din
              </h2>
              <p className="text-white/60 text-sm mb-6">
                Hvis e-postadressen er registrert, har vi sendt deg en lenke for å tilbakestille passordet. Lenken er gyldig i 1 time.
              </p>
              <Link href="/logg-inn">
                <button
                  className="w-full py-3 rounded-xl font-semibold text-sm"
                  style={{ background: "rgba(0,180,216,0.15)", color: "#00B4D8", border: "1px solid rgba(0,180,216,0.3)" }}
                >
                  Tilbake til innlogging
                </button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>
                Glemt passordet?
              </h2>
              <p className="text-white/50 text-sm mb-6">
                Skriv inn e-postadressen din, så sender vi deg en lenke for å velge nytt passord.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-white/50 mb-1.5">E-postadresse</label>
                  <input
                    type="email"
                    value={epost}
                    onChange={(e) => setEpost(e.target.value)}
                    required
                    placeholder="deg@eksempel.no"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgot.isPending}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-opacity disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #00B4D8, #0077A8)" }}
                >
                  {forgot.isPending ? "Sender..." : "Send tilbakestillingslenke"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/40 text-sm mt-6">
          Husker du passordet?{" "}
          <Link href="/logg-inn">
            <span className="font-semibold cursor-pointer" style={{ color: "#00B4D8" }}>Logg inn</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
