import { Link } from "wouter";

const LEGAL_LINKS = [
  { href: "/salgsbetingelser", label: "Salgsbetingelser" },
  { href: "/vilkar",           label: "Brukervilkår"     },
  { href: "/personvern",       label: "Personvern"       },
  { href: "/leiekontrakt",     label: "Leiekontrakt"     },
];

export default function Footer() {
  return (
    <footer
      className="border-t py-8 px-4 text-center"
      style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(0,0,0,0.2)" }}
    >
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Company info row — visible for Vipps / payment provider review */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
          <span className="font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
            Ledi ENK
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <span style={{ color: "rgba(255,255,255,0.55)" }}>
            Org.nr. 937 869 320
          </span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
          <a
            href="mailto:hei@ledi.no"
            className="transition-colors"
            style={{ color: "rgba(0,180,216,0.85)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#00B4D8")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(0,180,216,0.85)")}
          >
            hei@ledi.no
          </a>
        </div>

        {/* Legal links row */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
          <span style={{ color: "rgba(255,255,255,0.25)" }}>© 2026 Ledi ENK</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          {LEGAL_LINKS.map((l, i) => (
            <span key={l.href} className="inline-flex items-center gap-4">
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>}
              <Link
                href={l.href}
                className="transition-colors"
                style={{ color: "rgba(255,255,255,0.4)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
              >
                {l.label}
              </Link>
            </span>
          ))}
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <a
            href="https://ec.europa.eu/consumers/odr"
            target="_blank"
            rel="noreferrer"
            className="transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
          >
            Tvisteløsning (ODR)
          </a>
        </div>
      </div>
    </footer>
  );
}
