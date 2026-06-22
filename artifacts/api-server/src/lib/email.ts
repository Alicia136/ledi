import { Resend } from "resend";
import { logger } from "./logger";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env["RESEND_API_KEY"];
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

const FROM = "Ledi <hei@ledi.no>";
const ADMIN_EMAIL = "hei@ledi.no";

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });
}

function fmtKr(n: number | null | undefined): string {
  if (n == null) return "–";
  return `${Math.round(n).toLocaleString("nb-NO")} kr`;
}

const base = (body: string) => `
<!DOCTYPE html>
<html lang="no">
<head><meta charset="UTF-8"/><style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 24px; }
  .card { background: #ffffff; border-radius: 12px; max-width: 560px; margin: 0 auto; padding: 32px; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
  .logo { font-size: 22px; font-weight: 800; color: #0D1B2A; margin-bottom: 24px; letter-spacing: -0.5px; }
  .logo span { color: #00B4D8; }
  h1 { font-size: 20px; color: #0D1B2A; margin: 0 0 8px; }
  p { color: #4a5568; font-size: 15px; line-height: 1.6; margin: 0 0 12px; }
  .info-box { background: #f0f9ff; border-left: 4px solid #00B4D8; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .info-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; border-bottom: 1px solid #e2e8f0; color: #4a5568; }
  .info-row:last-child { border: none; font-weight: 700; color: #0D1B2A; font-size: 15px; }
  .info-row.sub { color: #718096; font-size: 13px; }
  .code { font-size: 28px; font-weight: 800; color: #00B4D8; letter-spacing: 6px; text-align: center; margin: 16px 0; }
  .btn { display: inline-block; background: #00B4D8; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; margin: 16px 0; }
  .alert-box { background: #fff5f5; border-left: 4px solid #EF4444; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
  .footer { font-size: 12px; color: #a0aec0; text-align: center; margin-top: 32px; }
</style></head>
<body><div class="card">
  <div class="logo">Le<span>di</span></div>
  ${body}
  <div class="footer">Ledi · Norges markedsplass for ledige plasser<br/>Org.nr. 937 869 320 · hei@ledi.no · ledi.no</div>
</div></body></html>`;

export async function sendBookingConfirmedLeietaker(opts: {
  to: string;
  navn: string;
  tittel: string;
  adresse: string;
  startDato: string | null;
  sluttDato: string | null;
  periodetype: string;
  totalPris: number;
  listedPrice: number;
  spaceliGebyr: number;
  tilgangskode: string | null;
  bookingId: number;
}) {
  const client = getResend();
  if (!client) { logger.info("Resend ikke konfigurert — hopper over e-post"); return; }

  const html = base(`
    <h1>Booking bekreftet! 🎉</h1>
    <p>Hei ${opts.navn}, bookingen din er bekreftet. Her er detaljene:</p>
    <div class="info-box">
      <div class="info-row"><span>Plass</span><span>${opts.tittel}</span></div>
      <div class="info-row"><span>Adresse</span><span>${opts.adresse}</span></div>
      <div class="info-row"><span>Fra</span><span>${fmtDate(opts.startDato)}</span></div>
      <div class="info-row"><span>Til</span><span>${fmtDate(opts.sluttDato)}</span></div>
      <div class="info-row"><span>Periode</span><span>${opts.periodetype}</span></div>
    </div>
    <div class="info-box">
      <div class="info-row sub"><span>Leiepris</span><span>${fmtKr(opts.listedPrice)}</span></div>
      <div class="info-row sub"><span>Serviceavgift 8 %</span><span>${fmtKr(opts.spaceliGebyr)}</span></div>
      <div class="info-row"><span>Du betalte totalt</span><span>${fmtKr(opts.totalPris)}</span></div>
    </div>
    ${opts.tilgangskode ? `<p>Din tilgangskode:</p><div class="code">${opts.tilgangskode}</div>` : ""}
    <a class="btn" href="https://ledi.no/mine-bookinger">Se mine bookinger →</a>
    <p style="font-size:13px;color:#718096">Booking-nr: #${opts.bookingId}</p>
  `);

  await client.emails.send({ from: FROM, to: opts.to, subject: `Booking bekreftet – ${opts.tittel}`, html });
}

export async function sendBookingConfirmedUtleier(opts: {
  to: string;
  navn: string;
  tittel: string;
  leietakerNavn: string;
  startDato: string | null;
  sluttDato: string | null;
  listedPrice: number;
  spaceliGebyr: number;
  utleierBelop: number;
  bookingId: number;
}) {
  const client = getResend();
  if (!client) return;

  const html = base(`
    <h1>Ny booking på plassen din 📬</h1>
    <p>Hei ${opts.navn}, du har mottatt en ny bekreftet booking.</p>
    <div class="info-box">
      <div class="info-row"><span>Plass</span><span>${opts.tittel}</span></div>
      <div class="info-row"><span>Leietaker</span><span>${opts.leietakerNavn}</span></div>
      <div class="info-row"><span>Fra</span><span>${fmtDate(opts.startDato)}</span></div>
      <div class="info-row"><span>Til</span><span>${fmtDate(opts.sluttDato)}</span></div>
    </div>
    <div class="info-box">
      <div class="info-row sub"><span>Din listepris</span><span>${fmtKr(opts.listedPrice)}</span></div>
      <div class="info-row sub"><span>Ledi-avgift 8 %</span><span>− ${fmtKr(opts.spaceliGebyr / 2)}</span></div>
      <div class="info-row"><span>Du mottar via Vipps</span><span>${fmtKr(opts.utleierBelop)}</span></div>
    </div>
    <a class="btn" href="https://ledi.no/dashboard">Se dashboard →</a>
    <p style="font-size:13px;color:#718096">Booking-nr: #${opts.bookingId}</p>
  `);

  await client.emails.send({ from: FROM, to: opts.to, subject: `Ny booking – ${opts.tittel}`, html });
}

export async function sendBookingCancelledLeietaker(opts: {
  to: string;
  navn: string;
  tittel: string;
  startDato: string | null;
  bookingId: number;
}) {
  const client = getResend();
  if (!client) return;

  const html = base(`
    <h1>Booking kansellert</h1>
    <p>Hei ${opts.navn}, bookingen din er kansellert.</p>
    <div class="info-box">
      <div class="info-row"><span>Plass</span><span>${opts.tittel}</span></div>
      <div class="info-row"><span>Dato</span><span>${fmtDate(opts.startDato)}</span></div>
    </div>
    <p>Eventuel refusjon behandles i henhold til våre <a href="https://ledi.no/vilkar">vilkår</a>.</p>
    <a class="btn" href="https://ledi.no/mine-bookinger">Se mine bookinger →</a>
  `);

  await client.emails.send({ from: FROM, to: opts.to, subject: `Booking kansellert – ${opts.tittel}`, html });
}

export async function sendPayoutFailedAlert(opts: {
  bookingId: number;
  utleierVipps: string;
  amountKr: number;
  feilCount: number;
  errorDetails?: string;
}) {
  const client = getResend();
  if (!client) {
    logger.error({ bookingId: opts.bookingId }, "KRITISK: Vipps payout feilet 3 ganger — Resend ikke konfigurert, klarer ikke varsle admin");
    return;
  }

  const html = base(`
    <h1 style="color:#EF4444;">⚠️ Vipps Payout feilet – manuell handling kreves</h1>
    <p>En utbetaling til utleier har feilet <strong>${opts.feilCount} ganger</strong> og er nå stoppet. Manuell behandling er nødvendig.</p>
    <div class="alert-box">
      <div class="info-row"><span>Booking-nr</span><span>#${opts.bookingId}</span></div>
      <div class="info-row"><span>Beløp</span><span>${fmtKr(opts.amountKr)}</span></div>
      <div class="info-row"><span>Utleiers Vipps-nr</span><span>${opts.utleierVipps}</span></div>
      <div class="info-row"><span>Antall forsøk</span><span>${opts.feilCount}</span></div>
      ${opts.errorDetails ? `<div class="info-row"><span>Feildetaljer</span><span>${opts.errorDetails}</span></div>` : ""}
    </div>
    <p><strong>Nødvendige tiltak:</strong></p>
    <ol style="color:#4a5568;font-size:15px;line-height:1.8">
      <li>Sjekk Vipps Payout-status i admin-panelet</li>
      <li>Verifiser at utleierens Vipps-nummer er korrekt</li>
      <li>Bruk «Retry payout»-knappen i admin, eller utfør manuell overføring</li>
      <li>Kontakt utleier og informer om forsinkelsen</li>
    </ol>
    <a class="btn" href="https://ledi.no/admin">Gå til admin-panelet →</a>
  `);

  await client.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🚨 Vipps Payout feilet – Booking #${opts.bookingId} – manuell handling kreves`,
    html,
  });

  logger.error({ bookingId: opts.bookingId, feilCount: opts.feilCount }, "Admin varslet om payout-feil via e-post");
}

export async function sendAarsoppgaveUtleier(opts: {
  to: string;
  navn: string;
  year: number;
  totalInntekt: number;
  lediAvgift: number;
  antallBookinger: number;
}) {
  const client = getResend();
  if (!client) { logger.info("Resend ikke konfigurert — hopper over årsoppgave"); return; }

  const skattepliktig = Math.max(0, opts.totalInntekt - 10_000);

  const html = base(`
    <h1>Årsoppgave ${opts.year} – Ledi</h1>
    <p>Hei ${opts.navn},</p>
    <p>Her er din årsoppgave fra Ledi for inntektsåret <strong>${opts.year}</strong>. Behold denne e-posten til skattemeldingen.</p>
    <div class="info-box">
      <div class="info-row"><span>Totale leieinntekter ${opts.year}</span><span>${fmtKr(opts.totalInntekt)}</span></div>
      <div class="info-row sub"><span>Ledi-avgift (8 %) trukket</span><span>– ${fmtKr(opts.lediAvgift)}</span></div>
      <div class="info-row sub"><span>Antall bookinger</span><span>${opts.antallBookinger}</span></div>
      <div class="info-row"><span>Estimert skattepliktig beløp</span><span>${fmtKr(skattepliktig)}</span></div>
    </div>
    <p style="font-size:13px;color:#718096">
      Inntekter over 10 000 kr/år er skattepliktige (parkering, lagring og camping).
      Skattesatsen er 22 % for kapitalinntekter. Disse tallene er estimater – vi anbefaler å
      kontakte en regnskapsfører. Ledi rapporterer inntektene dine til Skatteetaten i henhold til DAC7-direktivet.
    </p>
    <a class="btn" href="https://ledi.no/skatterapport">Se full skatterapport →</a>
  `);

  await client.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Årsoppgave ${opts.year} – dine leieinntekter på Ledi`,
    html,
  });

  logger.info({ to: opts.to, year: opts.year }, "Årsoppgave sendt til utleier");
}

export async function sendPasswordResetEmail(opts: {
  to: string;
  navn: string;
  resetUrl: string;
}) {
  const client = getResend();
  if (!client) { logger.info("Resend ikke konfigurert — hopper over passord-reset e-post"); return; }

  const html = base(`
    <h1>Tilbakestill passordet ditt</h1>
    <p>Hei ${opts.navn},</p>
    <p>Vi mottok en forespørsel om å tilbakestille passordet på Ledi-kontoen din. Klikk knappen nedenfor for å velge et nytt passord:</p>
    <a class="btn" href="${opts.resetUrl}">Tilbakestill passord →</a>
    <p style="font-size:13px;color:#718096;margin-top:16px">Lenken er gyldig i 1 time. Hvis du ikke ba om dette, kan du ignorere denne e-posten — passordet ditt er trygt.</p>
  `);

  await client.emails.send({ from: FROM, to: opts.to, subject: "Tilbakestill passordet ditt – Ledi", html });
}

export async function sendEmailVerificationEmail(opts: {
  to: string;
  navn: string;
  verifyUrl: string;
}) {
  const client = getResend();
  if (!client) { logger.info("Resend ikke konfigurert — hopper over e-postverifisering"); return; }

  const html = base(`
    <h1>Bekreft e-postadressen din 📬</h1>
    <p>Hei ${opts.navn}, velkommen til Ledi!</p>
    <p>Klikk knappen nedenfor for å bekrefte e-postadressen din og aktivere kontoen fullt ut:</p>
    <a class="btn" href="${opts.verifyUrl}">Bekreft e-post →</a>
    <p style="font-size:13px;color:#718096;margin-top:16px">Lenken er gyldig i 24 timer. Hvis du ikke opprettet denne kontoen, kan du ignorere denne e-posten.</p>
  `);

  await client.emails.send({ from: FROM, to: opts.to, subject: "Bekreft e-postadressen din – Ledi", html });
}
