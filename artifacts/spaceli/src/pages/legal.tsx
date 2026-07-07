import { Link } from "wouter";
import Navbar from "@/components/Navbar";

type LegalType = "personvern" | "vilkar" | "leiekontrakt" | "salgsbetingelser";

interface LegalPageProps {
  type: LegalType;
}

const CONTENT: Record<LegalType, { title: string; sections: { heading: string; text: string }[] }> = {
  salgsbetingelser: {
    title: "Salgsbetingelser",
    sections: [
      {
        heading: "1. Selger",
        text: "Selskap: Ledi ENK · Organisasjonsnr: 937 869 320 · E-post: hei@ledi.no · Nettside: ledi.no\n\nTjeneste: Ledi er en norsk markedsplass for utleie og leie av parkerings- og lagerplass, campingplass, båtplass, hengerplass, elbilplass, kontor og festlokale.",
      },
      {
        heading: "2. Betaling",
        text: "Betalingsmetoder: Vipps (standard), bankkort via Stripe, faktura for bedriftskunder.\n\nGebyrmodell 8/8: Leietaker betaler listepris + 8%. Utleier mottar listepris − 8%. Ledi tjener 16% totalt. Alle priser vises i NOK. Ingen skjulte avgifter.\n\nUtbetaling til utleier skjer automatisk 24 timer etter bekreftet booking, forutsatt at bookingen ikke er avbestilt. Ved avbestilling innen 24 timer refunderes leietaker fullt ut og utleier mottar ingen utbetaling.\n\nVed booking som starter innen 24 timer: utbetaling skjer umiddelbart og avbestilling er ikke mulig.",
      },
      {
        heading: "3. Angrerett",
        text: "Standard 14-dagers angrerett gjelder IKKE for tidsbestemte leietjenester jf. angrerettloven § 22 bokstav l.\n\nLedis avbestillingsregler:\n• Avbestilling er mulig gratis inntil 24 timer etter bekreftet booking\n• Avbestilling er ikke mulig de siste 24 timene før bookingstart\n• Ved booking som starter innen 24 timer: avbestilling ikke mulig\n• Utleier avbestiller: 100 % refusjon til leietaker\n\nAbonnement kan sies opp når som helst.",
      },
      {
        heading: "4. Retur og refusjon",
        text: "Refusjon gis ved: Avbestilling mer enn 24 timer før start, utleier avbestiller, plass vesentlig annerledes enn beskrevet, teknisk feil fra Ledis side.\n\nRefusjon gis IKKE ved: Avbestilling 0–24 timer før start, leietaker møter ikke opp, brudd på brukervilkårene.\n\nSlik søker du refusjon: Send e-post til hei@ledi.no med booking-ID og beskrivelse. Vi svarer innen 2 virkedager. Godkjent refusjon tilbakeføres innen 5–10 virkedager.",
      },
      {
        heading: "5. Klagehåndtering",
        text: "Send klage til: hei@ledi.no · Svartid: innen 2 virkedager.\n\nEksterne klageinstanser:\n• Forbrukertilsynet: forbrukertilsynet.no\n• Forbrukerrådet: forbrukerradet.no\n• EU ODR: ec.europa.eu/consumers/odr",
      },
      {
        heading: "6. Lovvalg",
        text: "Norsk lov gjelder. Oslo tingrett er verneting.",
      },
    ],
  },
  vilkar: {
    title: "Brukervilkår",
    sections: [
      {
        heading: "1. Om Ledi",
        text: "Ledi (org.nr. 937 869 320) er en norsk digital formidlingsplattform for utleie av parkering, lagerplass, camping, båtplass, henger, elbil-lading, kontorplass og festlokale. Ledi er ikke part i leieavtalen mellom utleier og leietaker.",
      },
      {
        heading: "2. Forsikring – viktig",
        text: "Ledi tilbyr INGEN forsikring. Alle brukere må ha gyldig forsikring selv.\n\nKrav per kategori:\n• Parkering: bilforsikring (leietaker), husforsikring (utleier)\n• Lagerplass: innboforsikring (leietaker), husforsikring (utleier)\n• Camping: reiseforsikring (leietaker), eiendomsforsikring (utleier)\n• Båtplass: båtforsikring (leietaker), eiendomsforsikring (utleier)\n• Henger: tilhengerforsikring (leietaker), eiendomsforsikring (utleier)\n• Festlokale: ansvarsforsikring (utleier), reiseforsikring (leietaker)\n\nLedi er ikke ansvarlig for: skader på kjøretøy eller gods, tyveri eller hærverk, personskader på leid plass, skader fra vær eller naturhendelser.\n\nLedis maks ansvar er begrenset til bookingbeløpet.",
      },
      {
        heading: "3. Hvem kan bruke Ledi",
        text: "For å bruke Ledi må du: være minimum 18 år, ha gyldig norsk BankID, ha gyldig forsikring for din aktivitet, og oppgi korrekte opplysninger.",
      },
      {
        heading: "4. Utleiers ansvar",
        text: "Utleier bekrefter at han/hun: eier eller har rett til å leie ut plassen, har nødvendig tillatelse (inkl. eventuelle vedtektsregler for borettslag/sameie), har gyldig forsikring som dekker eiendommen ved utleie, gir korrekt beskrivelse av plassen, og sørger for at plassen er tilgjengelig i bookingperioden.",
      },
      {
        heading: "5. Leietakers ansvar",
        text: "Leietaker bekrefter at han/hun: har gyldig forsikring, bruker plassen til avtalt formål, behandler plassen med respekt, og melder fra om eventuelle skader umiddelbart.",
      },
      {
        heading: "6. Betaling og gebyrer",
        text: "Utleier betaler 8 % serviceavgift til Ledi. Leietaker betaler 8 % serviceavgift til Ledi. Ledi tjener totalt 16 %. Utbetaling til utleier skjer via Vipps.\n\nUtbetaling til utleier skjer automatisk 24 timer etter bekreftet booking. Ved avbestilling innen 24 timer refunderes leietaker fullt ut og utleier mottar ingen utbetaling.\n\nAvbestilling:\n• Inntil 24 timer etter bekreftet booking: 100 % refusjon\n• Etter 24 timer eller ved booking som starter innen 24 timer: ingen refusjon",
      },
      {
        heading: "7. Forbudt bruk",
        text: "Det er ikke tillatt å: leie ut plass uten gyldig forsikring, lagre farlige eller ulovlige gjenstander, omgå Ledis betalingsløsning, oppgi falsk informasjon, eller videreformidle bookinger uten samtykke.",
      },
      {
        heading: "8. Tvister",
        text: "Dialog er alltid første steg. Ledi kan bistå som megler mellom partene. Norsk lov gjelder. Oslo tingrett er verneting.",
      },
      {
        heading: "9. Kontakt",
        text: "hei@ledi.no · Svar innen 2 virkedager",
      },
    ],
  },
  personvern: {
    title: "Personvernerklæring",
    sections: [
      {
        heading: "1. Behandlingsansvarlig",
        text: "Ledi · Org.nr. 937 869 320 · hei@ledi.no · ledi.no",
      },
      {
        heading: "2. Hva vi samler inn",
        text: "Ved registrering: navn og e-post, telefonnummer, passord (kryptert), BankID-verifisering.\n\nVed utleie: adresse og koordinater til plass, Vipps-nummer for utbetaling, bilder av plassen.\n\nVed booking: betalingsinformasjon (via Vipps/Stripe), bookinghistorikk, posisjon (kun med tillatelse).\n\nAutomatisk: IP-adresse, nettleser og enhetstype.",
      },
      {
        heading: "3. Informasjonskapsler",
        text: "Nødvendige: session og CSRF — kan ikke deaktiveres da de er nødvendige for at tjenesten skal fungere.\n\nAnalytiske: kun med ditt samtykke via cookie-banneret. Vi bruker Plausible Analytics, som er personvernvennlig og ikke sender data til tredjepart.",
      },
      {
        heading: "4. Deling med tredjeparter",
        text: "Vi selger aldri data. Vi deler med:\n• Vipps: betalinger\n• Stripe: kortbetalinger\n• Google Maps: kartvisning\n• Firebase: push-varsler\n\nAll deling skjer under GDPR. Overføring til USA skjer under EU–US Data Privacy Framework.",
      },
      {
        heading: "5. Lagringstid",
        text: "Kontoopplysninger: aktiv periode + 3 år\nBookinghistorikk: 5 år (regnskapskrav)\nBetalingsdata: 5 år (regnskapskrav)\nLogger: 12 måneder",
      },
      {
        heading: "6. Dine rettigheter",
        text: "Du har rett til: innsyn i egne data, retting av feil, sletting av data, dataportabilitet, og innsigelse mot behandling.\n\nSend forespørsel til: personvern@ledi.no · Svar innen 30 dager.\n\nKlagerett til Datatilsynet: datatilsynet.no | 22 39 69 00",
      },
      {
        heading: "7. Sikkerhet",
        text: "Vi bruker HTTPS/TLS-kryptering, kryptert passordlagring, BankID-verifisering, og kortdata håndteres av Stripe/Vipps. Servere befinner seg i EU og er GDPR-compliant.",
      },
      {
        heading: "8. Kontakt",
        text: "personvern@ledi.no",
      },
    ],
  },
  leiekontrakt: {
    title: "Standard leiekontrakt",
    sections: [
      {
        heading: "1. Om kontrakten",
        text: "Denne kontrakten gjelder automatisk ved alle bookinger formidlet gjennom Ledi. Ledi er ikke part i avtalen — kun formidler. Org.nr. 937 869 320.",
      },
      {
        heading: "2. Leieobjektet",
        text: "Utleier bekrefter at han/hun: har rett til å leie ut plassen, har nødvendig tillatelse, og har gyldig forsikring som dekker eiendommen ved utleie.",
      },
      {
        heading: "3. Leieperiode og pris",
        text: "Leieperiode og pris fremgår av bookingbekreftelsen. Ledi tar 8 % fra begge parter. Utleier mottar 92 % av listepris.",
      },
      {
        heading: "4. Tilgang og bruk",
        text: "Tilgangskode sendes etter bekreftet betaling. Tilgangen er gyldig kun i bookingperioden. Følgende er ikke tillatt: lagring av farlige eller ulovlige gjenstander, fremleie uten samtykke fra utleier.",
      },
      {
        heading: "5. Ansvar og forsikring",
        text: "Begge parter er selv ansvarlige for gyldig forsikring for sin aktivitet.\n\nLedi er ikke ansvarlig for: skader, tyveri eller personskader, naturhendelser eller force majeure.",
      },
      {
        heading: "6. Avbestilling",
        text: "Mer enn 24 timer før start: 100 % refusjon.\n0–24 timer før start: ingen refusjon.\nUtleier avbestiller: 100 % refusjon til leietaker.",
      },
      {
        heading: "7. Tvister",
        text: "Dialog er første steg. Ledi kan bistå som megler. Norsk lov gjelder. Oslo tingrett er verneting.",
      },
      {
        heading: "8. Aksept",
        text: "Begge parter aksepterer vilkårene i denne kontrakten ved fullføring av booking. Digital aksept er juridisk bindende jf. avtaleloven.",
      },
      {
        heading: "9. Kontakt",
        text: "hei@ledi.no · ledi.no",
      },
    ],
  },
};

const TITLES: Record<LegalType, string> = {
  salgsbetingelser: "Salgsbetingelser – Ledi",
  vilkar:           "Brukervilkår – Ledi",
  personvern:       "Personvernerklæring – Ledi",
  leiekontrakt:     "Standard Leiekontrakt – Ledi",
};

export default function LegalPage({ type }: LegalPageProps) {
  const content = CONTENT[type];

  return (
    <div className="min-h-screen" style={{ background: "#0D1B2A", fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors"
          style={{ color: "rgba(255,255,255,0.4)" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#00B4D8")}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
        >
          ← Tilbake til ledi.no
        </Link>

        <h1
          className="text-3xl font-bold text-white mb-8"
          style={{ fontFamily: "'Syne', sans-serif" }}
        >
          {TITLES[type]}
        </h1>

        <div className="space-y-8">
          {content.sections.map((section, i) => (
            <div key={i}>
              <h2 className="text-lg font-semibold mb-3" style={{ color: "#00B4D8" }}>
                {section.heading}
              </h2>
              <p className="text-white/70 leading-relaxed whitespace-pre-line">{section.text}</p>
            </div>
          ))}
        </div>

        {/* Metadata */}
        <div
          className="mt-12 p-4 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs text-white/40">
            Sist oppdatert: 23. juni 2026 · Ledi · Org.nr. 937 869 320 · hei@ledi.no
          </p>
        </div>

        {/* Legal navigation */}
        <div className="mt-6 flex flex-wrap gap-3">
          {(["salgsbetingelser", "vilkar", "personvern", "leiekontrakt"] as LegalType[])
            .filter(t => t !== type)
            .map(t => (
              <Link
                key={t}
                href={`/${t}`}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors"
                style={{ background: "rgba(0,180,216,0.08)", border: "1px solid rgba(0,180,216,0.2)", color: "#00B4D8" }}
              >
                {TITLES[t].replace(" – Ledi", "")}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
