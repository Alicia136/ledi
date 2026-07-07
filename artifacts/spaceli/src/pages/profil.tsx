import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useGetMe, useUpdateProfil, useGetOwnerDashboard } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { User, CreditCard, Shield, Save, CheckCircle, ChevronRight, MapPin } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "wouter";

export default function ProfilPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: me } = useGetMe({ query: { enabled: !!user } as any });
  const { data: dashboard } = useGetOwnerDashboard({ query: { enabled: user?.rolle === "utleier" } as any });
  const updateProfil = useUpdateProfil();

  const [kontonummer, setKontonummer] = useState("");
  const [vippsNummer, setVippsNummer] = useState("");
  const [personnummer, setPersonnummer] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me) {
      setKontonummer(me.kontonummer ?? "");
      setVippsNummer(me.vippsNummer ?? "");
      setPersonnummer(me.personnummer ?? "");
    }
  }, [me]);

  useEffect(() => {
    if (!user) setLocation("/logg-inn");
  }, [user, setLocation]);

  if (!user) return null;

  const handleSave = async () => {
    await updateProfil.mutateAsync({
      data: {
        kontonummer: kontonummer || null,
        vippsNummer: vippsNummer || null,
        personnummer: personnummer || null,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    color: "#fff",
    padding: "10px 14px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  } as React.CSSProperties;

  const labelStyle = {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    marginBottom: 6,
    display: "block",
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0D1B2A" }}>
      <Navbar />
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 16px 80px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg, #00B4D8, #0077B6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 16,
          }}>
            <User size={24} color="#fff" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", margin: 0, fontFamily: "'Syne', sans-serif" }}>
            Min profil
          </h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, marginTop: 4 }}>
            {user.epost}
          </p>
        </div>

        {/* Basic info */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 24, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <User size={16} color="#00B4D8" />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Kontoinfo</span>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>Navn</label>
              <div style={{ ...inputStyle, color: "rgba(255,255,255,0.4)", cursor: "not-allowed" }}>
                {user.navn}
              </div>
            </div>
            <div>
              <label style={labelStyle}>E-post</label>
              <div style={{ ...inputStyle, color: "rgba(255,255,255,0.4)", cursor: "not-allowed" }}>
                {user.epost}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Rolle</label>
              <div style={{ ...inputStyle, color: "rgba(255,255,255,0.4)", cursor: "not-allowed" }}>
                {user.rolle === "utleier" ? "Utleier" : user.rolle === "admin" ? "Administrator" : "Leietaker"}
              </div>
            </div>
          </div>
        </div>

        {/* Payout info */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 24, marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <CreditCard size={16} color="#00B4D8" />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Utbetalingsinfo</span>
          </div>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>Kontonummer</label>
              <input
                style={inputStyle}
                placeholder="1234.56.78901"
                value={kontonummer}
                onChange={e => setKontonummer(e.target.value)}
              />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
                Brukes for utbetaling av leieinntekter
              </p>
            </div>
            <div>
              <label style={labelStyle}>Vipps-nummer</label>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{
                  ...inputStyle,
                  width: "auto",
                  padding: "10px 14px",
                  color: "rgba(255,255,255,0.4)",
                  flexShrink: 0,
                  fontSize: 14,
                }}>+47</div>
                <input
                  style={{ ...inputStyle }}
                  placeholder="98765432"
                  value={vippsNummer}
                  onChange={e => setVippsNummer(e.target.value)}
                  type="tel"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16, padding: 24, marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Shield size={16} color="#00B4D8" />
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Identitet</span>
          </div>
          <div>
            <label style={labelStyle}>Personnummer</label>
            <input
              style={inputStyle}
              placeholder="DDMMÅÅ-XXXXX"
              value={personnummer}
              onChange={e => setPersonnummer(e.target.value)}
              type="password"
            />
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>
              Brukes kun for DAC7-skatterapportering (kryptert lagring)
            </p>
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={updateProfil.isPending}
          style={{
            width: "100%",
            background: saved ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #00B4D8, #0077B6)",
            border: saved ? "1px solid rgba(16,185,129,0.4)" : "none",
            borderRadius: 12,
            color: "#fff",
            fontWeight: 700,
            fontSize: 15,
            padding: "14px 24px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all 0.2s",
            marginBottom: 32,
          }}
        >
          {saved ? (
            <><CheckCircle size={16} color="#10B981" /> Lagret!</>
          ) : updateProfil.isPending ? (
            "Lagrer…"
          ) : (
            <><Save size={16} /> Lagre endringer</>
          )}
        </button>

        {/* Utleier: snarvei til dashboard */}
        {user.rolle === "utleier" && (
          <Link href="/dashboard">
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(0,180,216,0.07)",
              border: "1px solid rgba(0,180,216,0.2)",
              borderRadius: 16, padding: "16px 20px", cursor: "pointer",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,180,216,0.12)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,180,216,0.07)")}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <MapPin size={16} color="#00B4D8" />
                <div>
                  <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0 }}>Mine plasser og inntekter</p>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, margin: "2px 0 0" }}>
                    {dashboard?.totaltPlasser ?? 0} plasser · se alle bookinger og statistikk
                  </p>
                </div>
              </div>
              <ChevronRight size={16} color="rgba(0,180,216,0.6)" />
            </div>
          </Link>
        )}
      </div>
      <Footer />
    </div>
  );
}
