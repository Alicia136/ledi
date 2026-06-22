import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";
import { ArrowLeft, Copy, Check, Gift, Users, Star, Share2 } from "lucide-react";

function generateCode(user: { id: number; navn: string }): string {
  const base = user.navn.split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
  const num = (user.id * 7919) % 10000;
  return `${base}${num.toString().padStart(4, "0")}`;
}

const REWARDS = [
  { milestone: 1,  label: "Første venn",  reward: "200 kr i Ledi-kreditt",  icon: "🎁" },
  { milestone: 3,  label: "3 venner",      reward: "600 kr i Ledi-kreditt",  icon: "🏆" },
  { milestone: 5,  label: "5 venner",      reward: "1 000 kr + Ledi Pro",    icon: "⭐" },
  { milestone: 10, label: "10 venner",     reward: "2 000 kr + VIP-status",  icon: "👑" },
];

export default function ReferralPage() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D1B2A" }}>
        <div className="text-center">
          <p className="text-white/60 mb-4">Du må være logget inn for å se referral-programmet.</p>
          <Link href="/logg-inn">
            <span className="text-[#00B4D8] underline cursor-pointer">Logg inn</span>
          </Link>
        </div>
      </div>
    );
  }

  const code = generateCode(user);
  const shareUrl = `${window.location.origin}/?ref=${code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareNative = () => {
    if (navigator.share) {
      navigator.share({
        title: "Prøv Ledi – Finn ledig parkering og lagerplass",
        text: `Jeg bruker Ledi for å finne og leie ut parkeringsplasser og lagerrom. Bruk koden min ${code} og vi begge får 200 kr i kreditt! 🎉`,
        url: shareUrl,
      });
    } else {
      copyLink();
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <button className="text-white/50 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
              Inviter venner
            </h1>
            <p className="text-white/50 text-sm">Del Ledi — dere begge tjener 200 kr</p>
          </div>
        </div>

        {/* Hero */}
        <div
          className="rounded-2xl p-6 mb-6 text-center"
          style={{ background: "linear-gradient(135deg, rgba(27,79,140,0.4), rgba(0,180,216,0.2))", border: "1px solid rgba(0,180,216,0.25)" }}
        >
          <div className="text-5xl mb-3">🎁</div>
          <h2 className="text-xl font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>
            200 kr til deg + 200 kr til vennen din
          </h2>
          <p className="text-white/60 text-sm">
            Inviter venner til Ledi. Når de fullfører sin første booking, får dere begge 200 kr i Ledi-kreditt.
          </p>
        </div>

        {/* Your code */}
        <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}>
          <p className="text-xs text-white/50 mb-2 font-semibold tracking-widest uppercase">Din referralkode</p>
          <div className="flex items-center gap-3">
            <div
              className="flex-1 px-5 py-4 rounded-xl text-center"
              style={{ background: "rgba(0,180,216,0.08)", border: "2px dashed rgba(0,180,216,0.35)" }}
            >
              <span className="text-2xl font-bold tracking-widest" style={{ color: "#00B4D8", fontFamily: "'Syne', sans-serif" }}>
                {code}
              </span>
            </div>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-4 py-4 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: copied ? "rgba(16,185,129,0.2)" : "rgba(0,180,216,0.15)", border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(0,180,216,0.3)"}` }}
            >
              {copied ? <Check size={16} style={{ color: "#10B981" }} /> : <Copy size={16} />}
              {copied ? "Kopiert!" : "Kopier"}
            </button>
          </div>
        </div>

        {/* Share link */}
        <div className="rounded-2xl p-4 mb-6" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-xs text-white/50 mb-2">Del lenke</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate px-3 py-2 rounded-xl text-xs text-white/60" style={{ background: "rgba(255,255,255,0.05)" }}>
              {shareUrl}
            </div>
            <button
              onClick={copyLink}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white transition-all shrink-0"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              {copiedLink ? <Check size={14} style={{ color: "#10B981" }} /> : <Copy size={14} />}
            </button>
            <button
              onClick={shareNative}
              className="px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 shrink-0 transition-all"
              style={{ background: "linear-gradient(135deg, #1B4F8C, #00B4D8)" }}
            >
              <Share2 size={14} /> Del
            </button>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-white mb-3">Slik fungerer det</p>
          <div className="space-y-2">
            {[
              { step: "1", text: "Del koden eller lenken din med venner og familie" },
              { step: "2", text: "Vennen din registrerer seg med din kode" },
              { step: "3", text: "Etter første fullførte booking får dere begge 200 kr i kreditt" },
              { step: "4", text: "Kreditt brukes automatisk ved neste booking" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                  style={{ background: "#00B4D8" }}
                >
                  {step}
                </div>
                <p className="text-sm text-white/65 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone rewards */}
        <div>
          <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Star size={15} style={{ color: "#F59E0B" }} /> Milepæl-belønninger
          </p>
          <div className="grid grid-cols-2 gap-2">
            {REWARDS.map(r => (
              <div
                key={r.milestone}
                className="rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="text-2xl mb-1">{r.icon}</div>
                <p className="text-xs font-bold text-white">{r.label}</p>
                <p className="text-xs text-white/55 mt-0.5">{r.reward}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-white/30 text-center mt-8">
          Kreditt utbetales automatisk og utløper aldri. Maks 10 invitasjoner per bruker per år.
        </p>
      </div>
    </div>
  );
}
