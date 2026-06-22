import { Router } from "express";
import { eq, and, desc, gte, lt } from "drizzle-orm";
import {
  db, usersTable, spacesTable, pricesTable, bookingsTable,
  borettslagTable, borettslagMedlemmerTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";
import bcrypt from "bcryptjs";
import { signToken } from "../lib/auth";

const router = Router();

type AuthReq = { user: { userId: number; rolle: string } };

// ── GET /borettslag/mine — get current user's borettslag (as styreleder) ──
router.get("/borettslag/mine", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const [bl] = await db
    .select()
    .from(borettslagTable)
    .where(eq(borettslagTable.styrelederUserId, userId))
    .limit(1);
  if (!bl) { res.status(404).json({ error: "Ingen borettslag funnet" }); return; }
  res.json({ ...bl, opprettetDato: bl.opprettetDato?.toISOString() });
});

// ── POST /borettslag — create new borettslag (registers styreleder account) ──
router.post("/borettslag", async (req, res): Promise<void> => {
  const {
    styreleiderNavn, styreleiderEpost, passord,
    navn, orgnummer, kontaktEpost, bankkontonummer,
    adresse, postnummer, by, antallLeiligheter,
  } = req.body as {
    styreleiderNavn: string; styreleiderEpost: string; passord: string;
    navn: string; orgnummer?: string; kontaktEpost: string; bankkontonummer?: string;
    adresse: string; postnummer: string; by: string; antallLeiligheter?: number;
  };

  if (!styreleiderNavn || !styreleiderEpost || !passord || !navn || !kontaktEpost || !adresse || !postnummer || !by) {
    res.status(400).json({ error: "Mangler påkrevde felt" });
    return;
  }

  // Check if user already exists
  const existing = await db.select().from(usersTable).where(eq(usersTable.epost, styreleiderEpost)).limit(1);
  let styrelederUserId: number;

  if (existing.length > 0) {
    // Use existing user, update role to utleier if needed
    styrelederUserId = existing[0].id;
    await db.update(usersTable).set({ rolle: "utleier" }).where(eq(usersTable.id, styrelederUserId));
  } else {
    // Create new user account for styreleder
    const hash = await bcrypt.hash(passord, 10);
    const [user] = await db.insert(usersTable).values({
      navn: styreleiderNavn,
      epost: styreleiderEpost,
      passordHash: hash,
      rolle: "utleier",
    }).returning();
    styrelederUserId = user.id;
  }

  // Create borettslag
  const [bl] = await db.insert(borettslagTable).values({
    navn, orgnummer, kontaktEpost, bankkontonummer,
    adresse, postnummer, by,
    antallLeiligheter: antallLeiligheter ?? null,
    styrelederUserId,
  }).returning();

  const token = signToken({ userId: styrelederUserId, rolle: "utleier" });
  const user = await db.select().from(usersTable).where(eq(usersTable.id, styrelederUserId)).limit(1);

  res.status(201).json({
    borettslag: { ...bl, opprettetDato: bl.opprettetDato?.toISOString() },
    token,
    bruker: { id: user[0].id, navn: user[0].navn, epost: user[0].epost, rolle: user[0].rolle },
  });
});

// ── GET /borettslag/:id — get borettslag details ──
router.get("/borettslag/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  const [bl] = await db.select().from(borettslagTable).where(eq(borettslagTable.id, id)).limit(1);
  if (!bl) { res.status(404).json({ error: "Ikke funnet" }); return; }
  res.json({ ...bl, opprettetDato: bl.opprettetDato?.toISOString() });
});

// ── POST /borettslag/:id/plasser — bulk register spaces ──
router.post("/borettslag/:id/plasser", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const borettslagId = parseInt(rawId, 10);

  const [bl] = await db.select().from(borettslagTable).where(
    and(eq(borettslagTable.id, borettslagId), eq(borettslagTable.styrelederUserId, userId))
  ).limit(1);
  if (!bl) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  const { plasser, kunBeboere = true } = req.body as {
    plasser: Array<{
      tittel: string; type: string; prisPerMaaned?: number;
      prisPerDag?: number; prisPerTime?: number;
    }>;
    kunBeboere: boolean;
  };

  if (!Array.isArray(plasser) || plasser.length === 0) {
    res.status(400).json({ error: "Ingen plasser oppgitt" });
    return;
  }

  const created = [];
  for (const p of plasser) {
    const [space] = await db.insert(spacesTable).values({
      eierId: userId,
      tittel: p.tittel,
      type: p.type ?? "parking",
      adresse: bl.adresse,
      by: bl.by,
      postnummer: bl.postnummer,
      breddegrad: 59.9139 + (Math.random() - 0.5) * 0.02,
      lengdegrad: 10.7522 + (Math.random() - 0.5) * 0.02,
      erGodkjent: true,
      borettslagId,
      kunBeboere,
      prisModell: "fri",
    }).returning();

    // Insert prices
    const priceEntries = [];
    if (p.prisPerMaaned) priceEntries.push({ plassId: space.id, periode: "maaned", belop: p.prisPerMaaned });
    if (p.prisPerDag) priceEntries.push({ plassId: space.id, periode: "dag", belop: p.prisPerDag });
    if (p.prisPerTime) priceEntries.push({ plassId: space.id, periode: "time", belop: p.prisPerTime });
    if (priceEntries.length > 0) await db.insert(pricesTable).values(priceEntries);

    created.push(space);
  }

  res.status(201).json({ opprettet: created.length, plasser: created.map(s => s.id) });
});

// ── GET /borettslag/:id/plasser — list spaces for borettslag ──
router.get("/borettslag/:id/plasser", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const borettslagId = parseInt(rawId, 10);

  const [bl] = await db.select().from(borettslagTable).where(
    and(eq(borettslagTable.id, borettslagId), eq(borettslagTable.styrelederUserId, userId))
  ).limit(1);
  if (!bl) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  const spaces = await db.select().from(spacesTable).where(eq(spacesTable.borettslagId, borettslagId));
  const spaceIds = spaces.map(s => s.id);

  // Get prices for all spaces
  const allPrices = spaceIds.length > 0
    ? await db.select().from(pricesTable).where(
        spaceIds.reduce((acc, id, i) => i === 0
          ? eq(pricesTable.plassId, id)
          : acc, eq(pricesTable.plassId, spaceIds[0]))
      )
    : [];

  res.json(spaces.map(s => ({
    ...s,
    opprettetDato: s.opprettetDato?.toISOString(),
    priser: allPrices.filter(p => p.plassId === s.id),
  })));
});

// ── GET /borettslag/:id/rapport — monthly earnings report ──
router.get("/borettslag/:id/rapport", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const borettslagId = parseInt(rawId, 10);

  const [bl] = await db.select().from(borettslagTable).where(
    and(eq(borettslagTable.id, borettslagId), eq(borettslagTable.styrelederUserId, userId))
  ).limit(1);
  if (!bl) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  // Get all spaces for this borettslag
  const spaces = await db.select().from(spacesTable).where(eq(spacesTable.borettslagId, borettslagId));
  const spaceIds = spaces.map(s => s.id);

  if (spaceIds.length === 0) {
    res.json({ maaneder: [], totalt: 0, antallPlasser: 0 });
    return;
  }

  // Get bookings for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const bookings = await db.select().from(bookingsTable).where(
    and(
      gte(bookingsTable.opprettetDato, sixMonthsAgo),
    )
  );

  // Filter bookings to only this borettslag's spaces
  const relevantBookings = bookings.filter(b => spaceIds.includes(b.plassId));

  // Group by month
  const byMonth: Record<string, { inntekt: number; bookinger: number }> = {};
  for (const b of relevantBookings) {
    if (b.status !== "confirmed") continue;
    const key = b.opprettetDato!.toISOString().slice(0, 7); // YYYY-MM
    if (!byMonth[key]) byMonth[key] = { inntekt: 0, bookinger: 0 };
    const utleierInntekt = (b.totalPris ?? 0) * 0.84; // 16% fee taken out
    byMonth[key].inntekt += utleierInntekt;
    byMonth[key].bookinger += 1;
  }

  const maaneder = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([maaned, data]) => ({ maaned, ...data }));

  const totalt = maaneder.reduce((s, m) => s + m.inntekt, 0);

  res.json({
    borettslagNavn: bl.navn,
    antallPlasser: spaces.length,
    maaneder,
    totalt: Math.round(totalt),
    sisteManedInntekt: maaneder.length > 0 ? Math.round(maaneder[maaneder.length - 1].inntekt) : 0,
  });
});

// ── GET /borettslag/:id/beboere — list residents ──
router.get("/borettslag/:id/beboere", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const borettslagId = parseInt(rawId, 10);

  const [bl] = await db.select().from(borettslagTable).where(
    and(eq(borettslagTable.id, borettslagId), eq(borettslagTable.styrelederUserId, userId))
  ).limit(1);
  if (!bl) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  const beboere = await db.select().from(borettslagMedlemmerTable)
    .where(and(eq(borettslagMedlemmerTable.borettslagId, borettslagId), eq(borettslagMedlemmerTable.erAktiv, true)))
    .orderBy(borettslagMedlemmerTable.leilighetsnummer);

  res.json(beboere.map(b => ({ ...b, lagtTilDato: b.lagtTilDato?.toISOString() })));
});

// ── POST /borettslag/:id/beboere — add resident ──
router.post("/borettslag/:id/beboere", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const borettslagId = parseInt(rawId, 10);

  const [bl] = await db.select().from(borettslagTable).where(
    and(eq(borettslagTable.id, borettslagId), eq(borettslagTable.styrelederUserId, userId))
  ).limit(1);
  if (!bl) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  const { epost, leilighetsnummer } = req.body as { epost: string; leilighetsnummer?: string };
  if (!epost) { res.status(400).json({ error: "Epost er påkrevd" }); return; }

  // Check if existing user
  const [existingUser] = await db.select().from(usersTable).where(eq(usersTable.epost, epost)).limit(1);

  const [beboer] = await db.insert(borettslagMedlemmerTable).values({
    borettslagId,
    userId: existingUser?.id ?? null,
    epost,
    leilighetsnummer: leilighetsnummer ?? null,
    erAktiv: true,
  }).returning();

  res.status(201).json({ ...beboer, lagtTilDato: beboer.lagtTilDato?.toISOString() });
});

// ── DELETE /borettslag/:id/beboere/:beboerId — remove resident ──
router.delete("/borettslag/:id/beboere/:beboerId", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const borettslagId = parseInt(rawId, 10);
  const rawBeboerId = Array.isArray(req.params.beboerId) ? req.params.beboerId[0] : req.params.beboerId;
  const beboerId = parseInt(rawBeboerId, 10);

  const [bl] = await db.select().from(borettslagTable).where(
    and(eq(borettslagTable.id, borettslagId), eq(borettslagTable.styrelederUserId, userId))
  ).limit(1);
  if (!bl) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  await db.update(borettslagMedlemmerTable).set({ erAktiv: false }).where(
    and(eq(borettslagMedlemmerTable.id, beboerId), eq(borettslagMedlemmerTable.borettslagId, borettslagId))
  );

  res.json({ ok: true });
});

export default router;
