import { Router } from "express";
import { eq, desc, asc, and, or, count, sql, inArray } from "drizzle-orm";
import { db, spacesTable, pricesTable, usersTable, reviewsTable, bookingsTable, waitlistTable } from "@workspace/db";
import { requireAuth, getUser } from "../lib/auth";
import { triggerAlarms } from "../lib/alarmTrigger";

const router = Router();

type AuthReq = { user: { userId: number; rolle: string } };

// Seed demo helge/arrangement spaces if none exist
async function ensureSeedSpaces() {
  const existing = await db.select({ id: spacesTable.id })
    .from(spacesTable).where(eq(spacesTable.helgeMode, true)).limit(1);
  if (existing.length > 0) return;

  // Find the utleier demo user
  const [utleier] = await db.select({ id: usersTable.id })
    .from(usersTable).where(eq(usersTable.epost, "demo@utleier.no")).limit(1);
  const eierId = utleier?.id ?? 1;

  const seedSpaces = [
    {
      eierId, tittel: "Kontorplass ledig i helgen", type: "parking",
      adresse: "Lysaker Brygge 2", by: "Oslo", postnummer: "1366",
      breddegrad: 59.9030, lengdegrad: 10.6260,
      beskrivelse: "Kontorbygg – tomt i helger. Gratis parkering for leietakere på hverdager, tilgjengelig for alle lørdag og søndag.",
      fasiliteter: ["Utendørs", "Belysning"], prisModell: "fri" as const,
      erAktiv: true, erGodkjent: true, helgeMode: true, helgePris: 100,
      arrangementModus: false,
    },
    {
      eierId, tittel: "Næringspark helgeparkering", type: "parking",
      adresse: "Grensesvingen 9", by: "Oslo", postnummer: "0661",
      breddegrad: 59.9053, lengdegrad: 10.8014,
      beskrivelse: "Stor næringspark – tom lørdag-søndag 07-22. Smart Pris aktiv.",
      fasiliteter: ["Utendørs", "Belysning", "Port"], prisModell: "smart" as const,
      smartPrisBydel: "Oslo Sagene",
      erAktiv: true, erGodkjent: true, helgeMode: true,
      arrangementModus: false,
    },
    {
      eierId, tittel: "Parkering nær Telenor Arena", type: "parking",
      adresse: "Snarøyveien 30", by: "Oslo", postnummer: "1364",
      breddegrad: 59.9173, lengdegrad: 10.6177,
      beskrivelse: "800m fra Telenor Arena. Perfekt til konserter og arrangementer på Fornebu.",
      fasiliteter: ["Utendørs", "Belysning"], prisModell: "fri" as const,
      erAktiv: true, erGodkjent: true, helgeMode: false,
      arrangementModus: true, arrangementPris: 250,
    },
    {
      eierId, tittel: "Garasje nær Ullevaal Stadion", type: "parking",
      adresse: "Sognsveien 73", by: "Oslo", postnummer: "0855",
      breddegrad: 59.9435, lengdegrad: 10.7287,
      beskrivelse: "Innendørs garasje kun 450m fra Ullevaal Stadion. Ideell for fotballkamper.",
      fasiliteter: ["Innendørs", "Belysning", "24/7"], prisModell: "fri" as const,
      erAktiv: true, erGodkjent: true, helgeMode: false,
      arrangementModus: true, arrangementPris: 200,
    },
    {
      eierId, tittel: "Parkering nær Oslo Spektrum", type: "parking",
      adresse: "Langkaia 1", by: "Oslo", postnummer: "0150",
      breddegrad: 59.9077, lengdegrad: 10.7512,
      beskrivelse: "300m fra Oslo Spektrum. Sentral parkering for konserter og events i Oslo sentrum.",
      fasiliteter: ["Utendørs", "Overvåket"], prisModell: "fri" as const,
      erAktiv: true, erGodkjent: true, helgeMode: false,
      arrangementModus: true, arrangementPris: 280,
    },
  ];

  for (const s of seedSpaces) {
    const [space] = await db.insert(spacesTable).values(s).returning();
    const pris = s.arrangementModus ? (s.arrangementPris ?? 150) : (s.helgePris ?? 100);
    await db.insert(pricesTable).values({ plassId: space.id, periode: "time", belop: pris });
  }
}

void ensureSeedSpaces();

const SMART_PRIS_DATA = [
  { navn: "Oslo Frogner", parkeringMin: 1800, parkeringMax: 2800 },
  { navn: "Oslo Sentrum", parkeringMin: 1400, parkeringMax: 2200 },
  { navn: "Oslo Sagene",  parkeringMin: 1000, parkeringMax: 1800 },
  { navn: "Bergen",       parkeringMin: 1000, parkeringMax: 1800 },
  { navn: "Trondheim",    parkeringMin:  900, parkeringMax: 1600 },
  { navn: "Stavanger",    parkeringMin: 1000, parkeringMax: 1800 },
  { navn: "Tromsø",       parkeringMin:  800, parkeringMax: 1400 },
  { navn: "Distrikter",   parkeringMin:  300, parkeringMax:  700 },
];

async function getSpaceWithDetails(id: number) {
  const [space] = await db.select().from(spacesTable).where(eq(spacesTable.id, id)).limit(1);
  if (!space) return null;

  const prices = await db.select().from(pricesTable).where(eq(pricesTable.plassId, id));
  const priceGrid = { natt: null as number | null, time: null as number | null, dag: null as number | null, uke: null as number | null, maaned: null as number | null };
  for (const p of prices) {
    if (p.periode === "natt") priceGrid.natt = p.belop;
    if (p.periode === "time") priceGrid.time = p.belop;
    if (p.periode === "dag") priceGrid.dag = p.belop;
    if (p.periode === "uke") priceGrid.uke = p.belop;
    if (p.periode === "maaned") priceGrid.maaned = p.belop;
  }

  // For Smart Pris spaces: inject the recommended monthly price so SpaceCard
  // and BookingModal work without special-casing. Utleier kan override.
  if (space.prisModell === "smart" && space.smartPrisBydel && priceGrid.maaned === null) {
    const d = SMART_PRIS_DATA.find(x => x.navn === space.smartPrisBydel)
      ?? SMART_PRIS_DATA.find(x => x.navn === "Distrikter")!;
    priceGrid.maaned = Math.round((d.parkeringMin + d.parkeringMax) / 2);
  }

  const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.bookingId, id));
  // Get reviews for this space via bookings
  const spaceBookings = await db.select({ id: bookingsTable.id }).from(bookingsTable).where(eq(bookingsTable.plassId, id));
  const bookingIds = spaceBookings.map(b => b.id);

  let snittRangering: number | null = null;
  let antallAnmeldelser = 0;
  if (bookingIds.length > 0) {
    const spaceReviews = await db.select().from(reviewsTable).where(
      inArray(reviewsTable.bookingId, bookingIds)
    );
    if (spaceReviews.length > 0) {
      snittRangering = spaceReviews.reduce((s, r) => s + r.rangering, 0) / spaceReviews.length;
      antallAnmeldelser = spaceReviews.length;
    }
  }

  const [owner] = await db
    .select({ navn: usersTable.navn, bankidVerifisert: usersTable.bankidVerifisert, raskSvar: usersTable.raskSvar })
    .from(usersTable)
    .where(eq(usersTable.id, space.eierId))
    .limit(1);

  const [{ value: antallVenter }] = await db
    .select({ value: count() })
    .from(waitlistTable)
    .where(and(eq(waitlistTable.plassId, id), eq(waitlistTable.status, "venter")));

  const lediVerifisert = !!(
    owner?.bankidVerifisert &&
    owner?.raskSvar &&
    (space.antallBilder ?? 0) >= 3 &&
    antallAnmeldelser >= 3 &&
    snittRangering !== null && snittRangering >= 4
  );

  return {
    ...space,
    fasiliteter: space.fasiliteter ?? [],
    priser: priceGrid,
    snittRangering,
    antallAnmeldelser,
    eierNavn: owner?.navn ?? null,
    opprettetDato: space.opprettetDato?.toISOString(),
    antallVenter: Number(antallVenter),
    lediVerifisert,
  };
}

router.get("/spaces/featured", async (req, res): Promise<void> => {
  const limit = Number(req.query.limit) || 6;
  const spaces = await db.select().from(spacesTable)
    .where(and(eq(spacesTable.erAktiv, true), eq(spacesTable.erGodkjent, true)))
    .orderBy(desc(spacesTable.opprettetDato))
    .limit(limit);

  const results = await Promise.all(spaces.map(s => getSpaceWithDetails(s.id)));
  res.json(results.filter(Boolean));
});

router.get("/spaces/my", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const spaces = await db.select().from(spacesTable).where(eq(spacesTable.eierId, authUser.userId));
  const results = await Promise.all(spaces.map(s => getSpaceWithDetails(s.id)));
  res.json(results.filter(Boolean));
});

router.get("/spaces", async (req, res): Promise<void> => {
  const { type, city, sort, limit: lim, offset: off } = req.query as Record<string, string | undefined>;
  const smartPris = req.query.smartPris === "true";
  const natteparkering = req.query.natteparkering === "true";
  const helge = req.query.helge === "true";
  const arrangement = req.query.arrangement === "true";

  const KONTOR_TYPES  = ["hot_desk", "cellekontor", "moterom", "kreativt_studio", "verksted"];
  const SELSKAP_TYPES = ["festsal", "laave", "hytteanneks", "takterrasse"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let conditions: any[] = [eq(spacesTable.erGodkjent, true), eq(spacesTable.erAktiv, true)];
  if (type) {
    if (type === "kontor") {
      conditions.push(inArray(spacesTable.type, KONTOR_TYPES));
    } else if (type === "selskap") {
      conditions.push(inArray(spacesTable.type, SELSKAP_TYPES));
    } else {
      conditions.push(eq(spacesTable.type, type));
    }
  }
  if (city) conditions.push(eq(spacesTable.by, city));
  if (smartPris) conditions.push(eq(spacesTable.prisModell, "smart"));
  if (natteparkering) conditions.push(eq(spacesTable.erNatteparkering, true));
  if (helge) conditions.push(eq(spacesTable.helgeMode, true));
  if (arrangement) conditions.push(eq(spacesTable.arrangementModus, true));

  const orderBy = sort === "billigst"
    ? asc(spacesTable.opprettetDato)
    : desc(spacesTable.opprettetDato);

  const limit = Number(lim) || 20;
  const offset = Number(off) || 0;

  const spaces = await db.select().from(spacesTable)
    .where(conditions.length === 1 ? conditions[0] : and(...conditions as Parameters<typeof and>))
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);

  const total = spaces.length;
  const results = await Promise.all(spaces.map(s => getSpaceWithDetails(s.id)));
  res.json({ spaces: results.filter(Boolean), total });
});

router.get("/spaces/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const space = await getSpaceWithDetails(id);
  if (!space) { res.status(404).json({ error: "Plass ikke funnet" }); return; }

  const bookings = await db.select({ id: bookingsTable.id }).from(bookingsTable).where(eq(bookingsTable.plassId, id));
  const bookingIds = bookings.map(b => b.id);
  
  let reviews: Record<string, unknown>[] = [];
  for (const bid of bookingIds) {
    const bReviews = await db.select().from(reviewsTable).where(eq(reviewsTable.bookingId, bid));
    for (const r of bReviews) {
      reviews.push({
        id: r.id,
        bookingId: r.bookingId,
        rangering: r.rangering,
        kommentar: r.kommentar,
        anmelderNavn: null,
        opprettetDato: r.opprettetDato?.toISOString(),
      });
    }
  }

  res.json({ space, reviews });
});

router.post("/spaces", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const {
    tittel, type, adresse, by, postnummer, breddegrad, lengdegrad, beskrivelse,
    fasiliteter, prisModell, smartPrisBydel, priser,
    antallPlasser, maksLengde, stromAmp, vannTilkobling, tommestasjon,
    overnattingTillatt, lavsesonPris, hoysesonPris,
    harUnloc, unlocLockId,
    erNatteparkering, nattPrisHelgTillegg,
    helgeMode, helgePris, arrangementModus, arrangementPris,
  } = req.body;

  if (!tittel || !type || !adresse || !by || !postnummer || !breddegrad || !lengdegrad || !prisModell) {
    res.status(400).json({ error: "Mangler påkrevde felt" });
    return;
  }

  const [space] = await db.insert(spacesTable).values({
    eierId: authUser.userId,
    tittel, type, adresse, by, postnummer,
    breddegrad: Number(breddegrad),
    lengdegrad: Number(lengdegrad),
    beskrivelse: beskrivelse ?? null,
    fasiliteter: fasiliteter ?? [],
    prisModell,
    smartPrisBydel: smartPrisBydel ?? null,
    erAktiv: true,
    erGodkjent: false,
    antallPlasser: antallPlasser ? Number(antallPlasser) : null,
    maksLengde: maksLengde ?? null,
    stromAmp: stromAmp ?? null,
    vannTilkobling: !!vannTilkobling,
    tommestasjon: !!tommestasjon,
    overnattingTillatt: !!overnattingTillatt,
    lavsesonPris: lavsesonPris ? Number(lavsesonPris) : null,
    hoysesonPris: hoysesonPris ? Number(hoysesonPris) : null,
    harUnloc: !!harUnloc,
    unlocLockId: harUnloc && unlocLockId ? String(unlocLockId) : null,
    erNatteparkering: !!erNatteparkering,
    nattPrisHelgTillegg: nattPrisHelgTillegg ? Number(nattPrisHelgTillegg) : null,
    helgeMode: !!helgeMode,
    helgePris: helgePris ? Number(helgePris) : null,
    arrangementModus: !!arrangementModus,
    arrangementPris: arrangementPris ? Number(arrangementPris) : null,
  }).returning();

  if (priser) {
    const entries = [
      { periode: "natt",   belop: priser.natt },
      { periode: "time",   belop: priser.time },
      { periode: "dag",    belop: priser.dag },
      { periode: "uke",    belop: priser.uke },
      { periode: "maaned", belop: priser.maaned },
    ].filter(e => e.belop != null);

    if (entries.length > 0) {
      await db.insert(pricesTable).values(entries.map(e => ({ plassId: space.id, periode: e.periode, belop: Number(e.belop) })));
    }
  }

  const result = await getSpaceWithDetails(space.id);
  res.status(201).json(result);

  // Trigger alarms for matching watchlists (fire-and-forget)
  void triggerAlarms({ id: space.id, tittel: space.tittel, by: space.by, type: space.type });
});

router.patch("/spaces/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const [existing] = await db.select().from(spacesTable).where(eq(spacesTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Plass ikke funnet" }); return; }
  if (existing.eierId !== authUser.userId && authUser.rolle !== "admin") {
    res.status(403).json({ error: "Ikke tilgang" }); return;
  }

  const {
    tittel, beskrivelse, fasiliteter, erAktiv, prisModell, smartPrisBydel, priser,
    antallPlasser, maksLengde, stromAmp, vannTilkobling, tommestasjon,
    overnattingTillatt, lavsesonPris, hoysesonPris,
  } = req.body;
  const updates: Partial<typeof existing> = {};
  if (tittel !== undefined) updates.tittel = tittel;
  if (beskrivelse !== undefined) updates.beskrivelse = beskrivelse;
  if (fasiliteter !== undefined) updates.fasiliteter = fasiliteter;
  if (erAktiv !== undefined) updates.erAktiv = erAktiv;
  if (prisModell !== undefined) updates.prisModell = prisModell;
  if (smartPrisBydel !== undefined) updates.smartPrisBydel = smartPrisBydel;
  if (antallPlasser !== undefined) updates.antallPlasser = antallPlasser ? Number(antallPlasser) : null;
  if (maksLengde !== undefined) updates.maksLengde = maksLengde ?? null;
  if (stromAmp !== undefined) updates.stromAmp = stromAmp ?? null;
  if (vannTilkobling !== undefined) updates.vannTilkobling = !!vannTilkobling;
  if (tommestasjon !== undefined) updates.tommestasjon = !!tommestasjon;
  if (overnattingTillatt !== undefined) updates.overnattingTillatt = !!overnattingTillatt;
  if (lavsesonPris !== undefined) updates.lavsesonPris = lavsesonPris ? Number(lavsesonPris) : null;
  if (hoysesonPris !== undefined) updates.hoysesonPris = hoysesonPris ? Number(hoysesonPris) : null;

  if (Object.keys(updates).length > 0) {
    await db.update(spacesTable).set(updates).where(eq(spacesTable.id, id));
  }

  if (priser) {
    await db.delete(pricesTable).where(eq(pricesTable.plassId, id));
    const entries = [
      { periode: "natt",   belop: priser.natt },
      { periode: "time",   belop: priser.time },
      { periode: "dag",    belop: priser.dag },
      { periode: "uke",    belop: priser.uke },
      { periode: "maaned", belop: priser.maaned },
    ].filter(e => e.belop != null);
    if (entries.length > 0) {
      await db.insert(pricesTable).values(entries.map(e => ({ plassId: id, periode: e.periode, belop: Number(e.belop) })));
    }
  } else if (prisModell === "smart") {
    // Switching to smart: clear manual prices so the injected recommended price takes over
    await db.delete(pricesTable).where(eq(pricesTable.plassId, id));
  }

  const result = await getSpaceWithDetails(id);
  res.json(result);
});

// POST /spaces/:id/bilde — save uploaded image path to space (owner only)
router.post("/spaces/:id/bilde", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const { objectPath } = req.body as { objectPath?: string };
  if (!objectPath || typeof objectPath !== "string") {
    res.status(400).json({ error: "objectPath mangler" }); return;
  }

  const [space] = await db.select().from(spacesTable).where(eq(spacesTable.id, id)).limit(1);
  if (!space) { res.status(404).json({ error: "Plass ikke funnet" }); return; }
  if (space.eierId !== authUser.userId && authUser.rolle !== "admin") {
    res.status(403).json({ error: "Ikke tilgang" }); return;
  }

  // Store path as /api/storage + objectPath so it's a complete serving URL
  const bildeSti = `/api/storage${objectPath}`;
  await db.update(spacesTable)
    .set({ bildeSti, antallBilder: (space.antallBilder ?? 0) + 1 })
    .where(eq(spacesTable.id, id));

  res.json({ ok: true, bildeSti });
});

router.delete("/spaces/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const [existing] = await db.select().from(spacesTable).where(eq(spacesTable.id, id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Plass ikke funnet" }); return; }
  if (existing.eierId !== authUser.userId && authUser.rolle !== "admin") {
    res.status(403).json({ error: "Ikke tilgang" }); return;
  }

  await db.delete(pricesTable).where(eq(pricesTable.plassId, id));
  await db.delete(spacesTable).where(eq(spacesTable.id, id));
  res.json({ message: "Plass slettet" });
});

router.post("/spaces/:id/approve", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  if (authUser.rolle !== "admin") { res.status(403).json({ error: "Krever admin" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  await db.update(spacesTable).set({ erGodkjent: true }).where(eq(spacesTable.id, id));
  const result = await getSpaceWithDetails(id);
  res.json(result);
});

// ── Live status for a single space ───────────────────────────────────────────
router.get("/spaces/:id/status", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const [space] = await db.select({ id: spacesTable.id, erAktiv: spacesTable.erAktiv }).from(spacesTable).where(eq(spacesTable.id, id)).limit(1);
  if (!space) { res.status(404).json({ error: "Plass ikke funnet" }); return; }
  if (!space.erAktiv) {
    res.json({ spaceId: id, status: "closed", currentBooking: null, nextBooking: null });
    return;
  }

  const now = new Date();

  // Active booking right now
  const [activeRaw] = await db.select().from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.plassId, id),
        or(eq(bookingsTable.status, "confirmed"), eq(bookingsTable.status, "reserved")),
        sql`${bookingsTable.startDato} <= ${now}`,
        sql`${bookingsTable.sluttDato} > ${now}`
      )
    )
    .orderBy(bookingsTable.startDato)
    .limit(1);

  // Next upcoming booking
  const [nextRaw] = await db.select().from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.plassId, id),
        or(eq(bookingsTable.status, "confirmed"), eq(bookingsTable.status, "reserved")),
        sql`${bookingsTable.startDato} > ${now}`
      )
    )
    .orderBy(bookingsTable.startDato)
    .limit(1);

  const status =
    activeRaw?.status === "reserved" ? "reserved"
    : activeRaw?.status === "confirmed" ? "booked"
    : nextRaw ? "available"
    : "available";

  res.json({
    spaceId: id,
    status,
    currentBooking: activeRaw
      ? {
          id: activeRaw.id,
          startDato: activeRaw.startDato.toISOString(),
          sluttDato: activeRaw.sluttDato.toISOString(),
          lockedUntil: activeRaw.lockedUntil?.toISOString() ?? null,
        }
      : null,
    nextBooking: nextRaw
      ? {
          id: nextRaw.id,
          startDato: nextRaw.startDato.toISOString(),
          sluttDato: nextRaw.sluttDato.toISOString(),
        }
      : null,
  });
});

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const spaces = await db.select().from(spacesTable).where(eq(spacesTable.erGodkjent, true));
  const cities = new Set(spaces.map(s => s.postnummer));
  res.json({
    antallPlasser: spaces.length,
    antallKommuner: cities.size || 356,
    snittRangering: 4.8,
    bankidVerifisert: true,
    forsikret: true,
  });
});

export default router;
