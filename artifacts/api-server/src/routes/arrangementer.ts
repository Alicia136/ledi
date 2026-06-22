import { Router } from "express";
import { eq, and, desc, gte } from "drizzle-orm";
import { db, spacesTable, usersTable, pricesTable, varslerTable } from "@workspace/db";
import { arrangementerTable, arrangementAktiveringerTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimerEventPris(vanligPris: number, antallSokere: number): number {
  const multiplier = antallSokere > 5000 ? 2.5 : antallSokere > 2000 ? 2.0 : 1.5;
  return Math.round(Math.max(vanligPris * multiplier, 150) / 10) * 10;
}

// Seed realistic Norwegian events if none exist
async function ensureSeedData() {
  const existing = await db.select({ id: arrangementerTable.id }).from(arrangementerTable).limit(1);
  if (existing.length > 0) return;

  const events = [
    {
      slug: "beyonce-telenor-arena-2026",
      navn: "Beyoncé – Renaissance World Tour",
      sted: "Telenor Arena",
      by: "Oslo",
      dato: "2026-06-14",
      klokkeslett: "19:30",
      breddegrad: 59.9173,
      lengdegrad: 10.6177,
      antallBilletter: 22000,
      kategori: "konsert",
      emoji: "🎵",
      kilde: "ticketmaster",
      estimertParkeringssokere: 4800,
    },
    {
      slug: "valerenga-brann-valle-hovin",
      navn: "Vålerenga vs Brann – Eliteserien",
      sted: "Intility Arena",
      by: "Oslo",
      dato: "2026-06-07",
      klokkeslett: "18:00",
      breddegrad: 59.9075,
      lengdegrad: 10.8087,
      antallBilletter: 17500,
      kategori: "fotball",
      emoji: "⚽",
      kilde: "norsk-tipping",
      estimertParkeringssokere: 3200,
    },
    {
      slug: "bergen-live-koengen-2026",
      navn: "Bergen Live – Koengen Outdoor",
      sted: "Koengen",
      by: "Bergen",
      dato: "2026-06-21",
      klokkeslett: "18:00",
      breddegrad: 60.3925,
      lengdegrad: 5.3284,
      antallBilletter: 12000,
      kategori: "festival",
      emoji: "🎸",
      kilde: "ticketmaster",
      estimertParkeringssokere: 2100,
    },
    {
      slug: "oilers-dnb-arena-playoff",
      navn: "Stavanger Oilers – Playoff finale",
      sted: "DNB Arena",
      by: "Stavanger",
      dato: "2026-06-10",
      klokkeslett: "19:00",
      breddegrad: 58.9700,
      lengdegrad: 5.7331,
      antallBilletter: 8600,
      kategori: "hockey",
      emoji: "🏒",
      kilde: "norsk-tipping",
      estimertParkeringssokere: 1850,
    },
    {
      slug: "findings-festival-oslo-2026",
      navn: "Findings Festival – Ekebergsletta",
      sted: "Ekebergsletta",
      by: "Oslo",
      dato: "2026-07-05",
      klokkeslett: "14:00",
      breddegrad: 59.8948,
      lengdegrad: 10.7631,
      antallBilletter: 9500,
      kategori: "festival",
      emoji: "🎪",
      kilde: "ticketmaster",
      estimertParkeringssokere: 2400,
    },
    {
      slug: "marcus-martinus-baerum-2026",
      navn: "Marcus & Martinus – Sommerkonsert",
      sted: "Bærum Kulturhus",
      by: "Bærum",
      dato: "2026-06-28",
      klokkeslett: "20:00",
      breddegrad: 59.8961,
      lengdegrad: 10.5276,
      antallBilletter: 5200,
      kategori: "konsert",
      emoji: "🎤",
      kilde: "ticketmaster",
      estimertParkeringssokere: 1300,
    },
  ];

  await db.insert(arrangementerTable).values(events);
}

void ensureSeedData();

// GET /arrangementer — list upcoming events
router.get("/arrangementer", async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const events = await db
    .select()
    .from(arrangementerTable)
    .where(and(eq(arrangementerTable.aktiv, true), gte(arrangementerTable.dato, today)))
    .orderBy(arrangementerTable.dato);

  res.json(events);
});

// GET /arrangementer/mine-varsler — nearby events for landlord's spaces
router.get("/arrangementer/mine-varsler", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;

  const today = new Date().toISOString().slice(0, 10);
  const mySpaces = await db
    .select()
    .from(spacesTable)
    .where(and(eq(spacesTable.eierId, authUser.userId), eq(spacesTable.erAktiv, true)));

  if (mySpaces.length === 0) {
    res.json([]);
    return;
  }

  const events = await db
    .select()
    .from(arrangementerTable)
    .where(and(eq(arrangementerTable.aktiv, true), gte(arrangementerTable.dato, today)))
    .orderBy(arrangementerTable.dato);

  const myActivations = await db
    .select()
    .from(arrangementAktiveringerTable)
    .where(eq(arrangementAktiveringerTable.userId, authUser.userId));

  const activatedEventIds = new Set(myActivations.map(a => a.arrangementId));

  const varsler: Record<string, unknown>[] = [];

  for (const event of events) {
    const nearbySpaces = mySpaces
      .map(space => {
        const distM = haversineMeters(space.breddegrad, space.lengdegrad, event.breddegrad, event.lengdegrad);
        return { ...space, distM };
      })
      .filter(s => s.distM <= 3000)
      .sort((a, b) => a.distM - b.distM);

    if (nearbySpaces.length === 0) continue;

    const closestSpace = nearbySpaces[0];
    const prices = await db.select().from(pricesTable).where(eq(pricesTable.plassId, closestSpace.id));
    const dagPris = prices.find(p => p.periode === "dag")?.belop ?? 200;
    const eventPris = estimerEventPris(dagPris, event.estimertParkeringssokere);
    const estimertInntekt = Math.round(eventPris * 0.92);

    varsler.push({
      event: {
        id: event.id,
        slug: event.slug,
        navn: event.navn,
        sted: event.sted,
        by: event.by,
        dato: event.dato,
        klokkeslett: event.klokkeslett,
        kategori: event.kategori,
        emoji: event.emoji,
        antallBilletter: event.antallBilletter,
        estimertParkeringssokere: event.estimertParkeringssokere,
      },
      nearbySpaces: nearbySpaces.map(s => ({
        id: s.id,
        tittel: s.tittel,
        adresse: s.adresse,
        distM: Math.round(s.distM),
      })),
      eventPris,
      estimertInntekt,
      alleredeAktivert: activatedEventIds.has(event.id),
    });
  }

  res.json(varsler);
});

// GET /arrangementer/:slug — event landing page
router.get("/arrangementer/:slug", async (req, res): Promise<void> => {
  const { slug } = req.params;
  const [event] = await db
    .select()
    .from(arrangementerTable)
    .where(eq(arrangementerTable.slug, slug))
    .limit(1);

  if (!event) {
    res.status(404).json({ error: "Arrangement ikke funnet" });
    return;
  }

  // Find all spaces activated for this event
  const aktiveringer = await db
    .select({
      aktivering: arrangementAktiveringerTable,
      space: spacesTable,
    })
    .from(arrangementAktiveringerTable)
    .innerJoin(spacesTable, eq(arrangementAktiveringerTable.plassId, spacesTable.id))
    .where(eq(arrangementAktiveringerTable.arrangementId, event.id));

  // Also find nearby approved spaces within 2km
  const nearbyRaw = await db
    .select()
    .from(spacesTable)
    .where(and(eq(spacesTable.erGodkjent, true), eq(spacesTable.erAktiv, true)));

  const nearbySpaces = nearbyRaw
    .map(s => ({
      ...s,
      distM: haversineMeters(s.breddegrad, s.lengdegrad, event.breddegrad, event.lengdegrad),
    }))
    .filter(s => s.distM <= 2500)
    .sort((a, b) => a.distM - b.distM)
    .slice(0, 12)
    .map(s => ({
      id: s.id,
      tittel: s.tittel,
      adresse: s.adresse,
      by: s.by,
      type: s.type,
      distM: Math.round(s.distM),
      erAktivForEvent: aktiveringer.some(a => a.space.id === s.id),
      eventPris: aktiveringer.find(a => a.space.id === s.id)?.aktivering.eventPris ?? null,
    }));

  res.json({
    event,
    tilgjengeligePlasser: nearbySpaces,
    antallAktivert: aktiveringer.length,
  });
});

// POST /arrangementer/:id/aktiver — landlord activates a space for event
router.post("/arrangementer/:id/aktiver", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const arrangementId = parseInt(String(req.params.id), 10);
  const { plassId } = req.body as { plassId: number };

  const [event] = await db
    .select()
    .from(arrangementerTable)
    .where(eq(arrangementerTable.id, arrangementId))
    .limit(1);

  if (!event) {
    res.status(404).json({ error: "Arrangement ikke funnet" });
    return;
  }

  // Verify space ownership
  const [space] = await db
    .select()
    .from(spacesTable)
    .where(and(eq(spacesTable.id, plassId), eq(spacesTable.eierId, authUser.userId)))
    .limit(1);

  if (!space) {
    res.status(403).json({ error: "Plass ikke funnet eller ikke din" });
    return;
  }

  // Check if already activated
  const existing = await db
    .select()
    .from(arrangementAktiveringerTable)
    .where(
      and(
        eq(arrangementAktiveringerTable.arrangementId, arrangementId),
        eq(arrangementAktiveringerTable.plassId, plassId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Allerede aktivert for dette arrangementet" });
    return;
  }

  const prices = await db.select().from(pricesTable).where(eq(pricesTable.plassId, plassId));
  const dagPris = prices.find(p => p.periode === "dag")?.belop ?? 200;
  const eventPris = estimerEventPris(dagPris, event.estimertParkeringssokere);

  await db.insert(arrangementAktiveringerTable).values({
    arrangementId,
    plassId,
    userId: authUser.userId,
    eventPris,
  });

  // Send confirmation varsel
  await db.insert(varslerTable).values({
    userId: authUser.userId,
    plassId,
    tittel: `${event.emoji} Plass aktivert for ${event.navn}!`,
    melding: `"${space.tittel}" er nå tilgjengelig ${event.dato} til event-pris ${eventPris} kr. Vi sender deg booking-varsel.`,
    lest: false,
  });

  res.status(201).json({
    ok: true,
    eventPris,
    estimertInntekt: Math.round(eventPris * 0.92),
    melding: `Plass aktivert til ${eventPris} kr for ${event.navn} den ${event.dato}!`,
  });
});

// ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────

// GET /arrangementer/admin/alle — list all events (incl past), admin only
router.get("/arrangementer/admin/alle", requireAdmin, async (req, res): Promise<void> => {
  const events = await db
    .select()
    .from(arrangementerTable)
    .orderBy(desc(arrangementerTable.dato));
  res.json(events);
});

// POST /arrangementer/admin — create event manually, admin only
router.post("/arrangementer/admin", requireAdmin, async (req, res): Promise<void> => {
  const {
    navn, sted, by, dato, klokkeslett, kategori, emoji,
    breddegrad, lengdegrad, antallBilletter, estimertParkeringssokere,
  } = req.body as Record<string, string | number>;

  if (!navn || !sted || !by || !dato || !breddegrad || !lengdegrad) {
    res.status(400).json({ error: "Mangler påkrevde felt" });
    return;
  }

  const slug = String(navn)
    .toLowerCase()
    .replace(/[æ]/g, "ae").replace(/[ø]/g, "oe").replace(/[å]/g, "aa")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + String(dato).replace(/-/g, "");

  const [event] = await db.insert(arrangementerTable).values({
    slug,
    navn: String(navn),
    sted: String(sted),
    by: String(by),
    dato: String(dato),
    klokkeslett: klokkeslett ? String(klokkeslett) : "20:00",
    kategori: kategori ? String(kategori) : "annet",
    emoji: emoji ? String(emoji) : "🎪",
    breddegrad: Number(breddegrad),
    lengdegrad: Number(lengdegrad),
    antallBilletter: antallBilletter ? Number(antallBilletter) : 5000,
    estimertParkeringssokere: estimertParkeringssokere ? Number(estimertParkeringssokere) : 1000,
    kilde: "manuell",
    aktiv: true,
  }).returning();

  res.status(201).json(event);
});

// DELETE /arrangementer/admin/:id — delete event, admin only
router.delete("/arrangementer/admin/:id", requireAdmin, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  await db.delete(arrangementerTable).where(eq(arrangementerTable.id, id));
  res.json({ ok: true });
});

// POST /arrangementer/admin/sync-predicthq — fetch from PredictHQ, admin only
router.post("/arrangementer/admin/sync-predicthq", requireAdmin, async (req, res): Promise<void> => {
  const token = process.env.PREDICTHQ_TOKEN;
  if (!token) {
    res.status(400).json({
      error: "PREDICTHQ_TOKEN ikke satt",
      instruksjon: "Registrer gratis på predicthq.com, hent API-nøkkel, og legg til PREDICTHQ_TOKEN i Secrets",
    });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const future = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const resp = await fetch(
    `https://api.predicthq.com/v1/events/?country=NO&start.gte=${today}&start.lte=${future}&sort=start&limit=100&category=concerts,sports,festivals,community,conferences`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
  );

  if (!resp.ok) {
    res.status(502).json({ error: "PredictHQ returnerte feil", status: resp.status });
    return;
  }

  const data = await resp.json() as { results: Record<string, unknown>[] };
  const KATEGORI_MAP: Record<string, { kategori: string; emoji: string }> = {
    concerts:      { kategori: "konsert",  emoji: "🎵" },
    sports:        { kategori: "sport",    emoji: "⚽" },
    festivals:     { kategori: "festival", emoji: "🎪" },
    community:     { kategori: "annet",    emoji: "🏙️" },
    conferences:   { kategori: "annet",    emoji: "🎤" },
  };

  let inserted = 0;
  for (const e of data.results ?? []) {
    try {
      const category = String(e.category ?? "community");
      const cfg = KATEGORI_MAP[category] ?? { kategori: "annet", emoji: "🎪" };
      const loc = e.location as [number, number] | undefined;
      if (!loc) continue;

      const slug = String(e.id ?? Math.random());
      const existing = await db.select({ id: arrangementerTable.id })
        .from(arrangementerTable).where(eq(arrangementerTable.slug, slug)).limit(1);
      if (existing.length > 0) continue;

      await db.insert(arrangementerTable).values({
        slug,
        navn: String(e.title ?? "Ukjent arrangement"),
        sted: String((e.entities as Record<string,unknown>[])?.[0]?.name ?? String(e.title)),
        by: String(e.country ?? "NO"),
        dato: String(e.start ?? today).slice(0, 10),
        klokkeslett: String(e.start ?? "").slice(11, 16) || "20:00",
        kategori: cfg.kategori,
        emoji: cfg.emoji,
        breddegrad: loc[1],
        lengdegrad: loc[0],
        antallBilletter: Number(e.phq_attendance ?? 5000),
        estimertParkeringssokere: Math.round(Number(e.phq_attendance ?? 2000) * 0.25),
        kilde: "predicthq",
        aktiv: true,
      });
      inserted++;
    } catch {
      // skip invalid events
    }
  }

  res.json({ ok: true, inserted, total: data.results?.length ?? 0 });
});

export default router;
