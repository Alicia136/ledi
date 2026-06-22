import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, spacesTable, bookingsTable, dac7RapporterTable } from "@workspace/db";
import { requireAdmin } from "../lib/auth";
import { triggerAlarms } from "../lib/alarmTrigger";
import { sendDac7Aarsoppgaver } from "../lib/dac7Scheduler";

const router = Router();

router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable);
  const spaces = await db.select().from(spacesTable);
  const bookings = await db.select().from(bookingsTable);

  const totalInntekt = bookings.reduce((s, b) => s + (b.spaceliGebyr ?? 0), 0);
  const ventendePlasser = spaces.filter(s => !s.erGodkjent).length;
  const aktiveBookinger = bookings.filter(b => b.status === "confirmed").length;

  const totaltInnbetaltFraLeietakere = bookings.reduce((s, b) => s + (b.betaltAvLeietaker ?? 0), 0);
  const totaltUtbetaltTilUtleiere   = bookings.reduce((s, b) => s + (b.utbetaltTilUtleier ?? 0), 0);
  const ventendePayout = bookings
    .filter(b => b.payoutStatus === "pending" || b.payoutStatus === "retry_scheduled")
    .reduce((s, b) => s + (b.utleierBelop ?? 0), 0);

  res.json({
    totaltBrukere: users.length,
    totaltPlasser: spaces.length,
    totaltBookinger: bookings.length,
    totalInntekt,
    ventendePlasser,
    aktiveBookinger,
    totaltInnbetaltFraLeietakere,
    totaltUtbetaltTilUtleiere,
    ventendePayout,
  });
});

router.get("/admin/spaces", requireAdmin, async (req, res): Promise<void> => {
  const { status } = req.query as { status?: string };
  let spaces;
  if (status === "pending") {
    spaces = await db.select().from(spacesTable).where(eq(spacesTable.erGodkjent, false));
  } else {
    spaces = await db.select().from(spacesTable);
  }
  res.json(spaces.map(s => ({ ...s, fasiliteter: s.fasiliteter ?? [], priser: null, snittRangering: null, antallAnmeldelser: 0, eierNavn: null, opprettetDato: s.opprettetDato?.toISOString() })));
});

router.post("/admin/spaces/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [space] = await db
    .update(spacesTable)
    .set({ erGodkjent: true })
    .where(eq(spacesTable.id, id))
    .returning();

  if (!space) {
    res.status(404).json({ message: "Plass ikke funnet" });
    return;
  }

  res.json({ ok: true });

  // Trigger alarms for matching watchlists (fire-and-forget)
  void triggerAlarms({ id: space.id, tittel: space.tittel, by: space.by, type: space.type });
});

router.get("/admin/bookings", requireAdmin, async (_req, res): Promise<void> => {
  const bookings = await db.select().from(bookingsTable);
  res.json(bookings.map(b => ({
    ...b,
    startDato: b.startDato?.toISOString(),
    sluttDato: b.sluttDato?.toISOString(),
    opprettetDato: b.opprettetDato?.toISOString(),
    spaseTittel: null,
    spaseAdresse: null,
    leietakerNavn: null,
  })));
});

// ── DAC7-rapport: hent data per år ───────────────────────────────────────────
router.get("/admin/dac7/:year", requireAdmin, async (req, res): Promise<void> => {
  const year = Number(req.params.year);
  if (!year || isNaN(year)) { res.status(400).json({ message: "Ugyldig år" }); return; }

  const allUsers    = await db.select().from(usersTable);
  const allBookings = await db.select().from(bookingsTable);
  const allSpaces   = await db.select().from(spacesTable);

  const spaceOwner = new Map(allSpaces.map(s => [s.id, s.eierId]));

  type Agg = { totalInntekt: number; lediAvgift: number; antallBookinger: number };
  const agg = new Map<number, Agg>();

  for (const b of allBookings) {
    if (b.status !== "confirmed") continue;
    if (new Date(b.opprettetDato).getFullYear() !== year) continue;
    const ownerId = spaceOwner.get(b.plassId);
    if (!ownerId) continue;
    const cur = agg.get(ownerId) ?? { totalInntekt: 0, lediAvgift: 0, antallBookinger: 0 };
    cur.totalInntekt    += b.utleierBelop;
    cur.lediAvgift      += b.spaceliGebyr / 2;
    cur.antallBookinger += 1;
    agg.set(ownerId, cur);
  }

  const selgere = [];
  for (const [userId, data] of agg.entries()) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) continue;
    selgere.push({
      userId,
      navn: user.navn,
      epost: user.epost,
      personnummer: user.personnummer ?? null,
      totalInntekt: Math.round(data.totalInntekt),
      lediAvgift: Math.round(data.lediAvgift),
      antallBookinger: data.antallBookinger,
    });
  }
  selgere.sort((a, b) => b.totalInntekt - a.totalInntekt);

  const [sentRapport] = await db.select().from(dac7RapporterTable).where(eq(dac7RapporterTable.year, year)).limit(1);

  res.json({
    year,
    selgere,
    totaltInnbetalt: selgere.reduce((s, u) => s + u.totalInntekt, 0),
    totaltAvgift:    selgere.reduce((s, u) => s + u.lediAvgift, 0),
    sentAt: sentRapport?.sentAt?.toISOString() ?? null,
  });
});

// ── DAC7 XML-eksport ──────────────────────────────────────────────────────────
router.get("/admin/dac7/:year/xml", requireAdmin, async (req, res): Promise<void> => {
  const year = Number(req.params.year);
  if (!year || isNaN(year)) { res.status(400).json({ message: "Ugyldig år" }); return; }

  const allUsers    = await db.select().from(usersTable);
  const allBookings = await db.select().from(bookingsTable);
  const allSpaces   = await db.select().from(spacesTable);

  const spaceOwner = new Map(allSpaces.map(s => [s.id, s.eierId]));

  type Agg = { totalInntekt: number; lediAvgift: number; antallBookinger: number };
  const agg = new Map<number, Agg>();

  for (const b of allBookings) {
    if (b.status !== "confirmed") continue;
    if (new Date(b.opprettetDato).getFullYear() !== year) continue;
    const ownerId = spaceOwner.get(b.plassId);
    if (!ownerId) continue;
    const cur = agg.get(ownerId) ?? { totalInntekt: 0, lediAvgift: 0, antallBookinger: 0 };
    cur.totalInntekt    += b.utleierBelop;
    cur.lediAvgift      += b.spaceliGebyr / 2;
    cur.antallBookinger += 1;
    agg.set(ownerId, cur);
  }

  const now = new Date().toISOString();
  const selgerXml = [...agg.entries()].map(([userId, data]) => {
    const user = allUsers.find(u => u.id === userId);
    if (!user || data.totalInntekt <= 0) return "";
    const [fornavn, ...etternavnDeler] = user.navn.trim().split(" ");
    const etternavn = etternavnDeler.join(" ") || fornavn;
    return `
    <Selger>
      <Identitet>
        <TIN issuedBy="NO">${user.personnummer ?? "UKJENT"}</TIN>
        <Navn><Fornavn>${fornavn}</Fornavn><Etternavn>${etternavn}</Etternavn></Navn>
        <Epost>${user.epost}</Epost>
      </Identitet>
      <Aktiviteter>
        <Vederlag valutakode="NOK">${Math.round(data.totalInntekt)}</Vederlag>
        <Avgifter valutakode="NOK">${Math.round(data.lediAvgift)}</Avgifter>
        <AntallAktiviteter>${data.antallBookinger}</AntallAktiviteter>
      </Aktiviteter>
    </Selger>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<DAC7Rapport xmlns="urn:ledi:dac7:v1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <MeldingsInfo>
    <AvsenderOrgnr>937869320</AvsenderOrgnr>
    <SendingsLand>NO</SendingsLand>
    <MeldingsType>DAC7</MeldingsType>
    <MeldingsReferanse>LEDI-DAC7-${year}</MeldingsReferanse>
    <Rapporteringsperiode>${year}-12-31</Rapporteringsperiode>
    <Tidsstempel>${now}</Tidsstempel>
  </MeldingsInfo>
  <Plattformoperatør>
    <TIN issuedBy="NO">937869320</TIN>
    <Navn>Ledi (Enkeltpersonforetak)</Navn>
    <Land>NO</Land>
    <Kontakt>hei@ledi.no</Kontakt>
  </Plattformoperatør>
  <Selgere>${selgerXml}
  </Selgere>
</DAC7Rapport>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="ledi-dac7-${year}.xml"`);
  res.send(xml);
});

// ── Send årsoppgaver til alle utleiere ───────────────────────────────────────
router.post("/admin/dac7/:year/send-aarsoppgaver", requireAdmin, async (req, res): Promise<void> => {
  const year = Number(req.params.year);
  if (!year || isNaN(year)) { res.status(400).json({ message: "Ugyldig år" }); return; }

  const result = await sendDac7Aarsoppgaver(year);
  res.json({ ok: true, antallSendt: result.antallSendt });
});

export default router;
