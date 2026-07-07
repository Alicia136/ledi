import { Link } from "wouter";
import { Home, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#0D1B2A" }}>
      <Navbar />
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", minHeight: "80vh", padding: "0 16px",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: 120, fontWeight: 900, lineHeight: 1,
          fontFamily: "'Syne', sans-serif",
          background: "linear-gradient(135deg, #00B4D8 0%, rgba(0,180,216,0.2) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          marginBottom: 8,
        }}>
          404
        </div>
        <h1 style={{
          fontSize: 24, fontWeight: 800, color: "#fff",
          fontFamily: "'Syne', sans-serif", margin: "0 0 12px",
        }}>
          Siden finnes ikke
        </h1>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 15, maxWidth: 360, margin: "0 0 36px", lineHeight: 1.6 }}>
          Lenken du fulgte er feil eller siden er fjernet. Prøv å søke etter en plass på forsiden.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/">
            <button style={{
              background: "linear-gradient(135deg, #00B4D8, #0077B6)",
              border: "none", borderRadius: 12, color: "#fff",
              fontWeight: 700, fontSize: 15, padding: "12px 24px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}>
              <Home size={16} /> Tilbake til forsiden
            </button>
          </Link>
          <button
            onClick={() => window.history.back()}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 12, color: "rgba(255,255,255,0.7)",
              fontWeight: 600, fontSize: 15, padding: "12px 24px",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <ArrowLeft size={16} /> Gå tilbake
          </button>
        </div>
      </div>
    </div>
  );
}
