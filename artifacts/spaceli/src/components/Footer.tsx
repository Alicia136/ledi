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
      className="border-t py-6 px-4 text-center"
      style={{ borderColor: "rgba(255,255,255,0.08)", background: "transparent" }}
    >
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs">
        <span style={{ color: "rgba(255,255,255,0.3)" }}>
          © 2026 Ledi · Org.nr. 937 869 320
        </span>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
        <a
          href="mailto:hei@ledi.no"
          className="transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
        >
          hei@ledi.no
        </a>
        <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
        {LEGAL_LINKS.map((l, i) => (
          <span key={l.href} className="inline-flex items-center gap-5">
            {i > 0 && <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>}
            <Link
              href={l.href}
              className="transition-colors"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
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
    </footer>
  );
}
