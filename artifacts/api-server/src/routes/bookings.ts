import { Router } from "express";
import { eq, desc, and, or, sql } from "drizzle-orm";
import { db, bookingsTable, spacesTable, usersTable, subscriptionsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { emitSpaceBooked, emitSpaceReleased, emitSpaceReserved } from "../lib/io";
import {
  sendBookingConfirmedLeietaker,
  sendBookingConfirmedUtleier,
  sendBookingCancelledLeietaker,
} from "../lib/email.js";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

const LOCK_MINUTES = 10;

async function formatBooking(b: typeof bookingsTable.$inferSelect) {
  const [space] = await db.select({
    tittel: spacesTable.tittel,
    adresse: spacesTable.adresse,
    harUnloc: spacesTable.harUnloc,
    harTelemetrics: spacesTable.harTelemetrics,
  }).from(spacesTable).where(eq(spacesTable.id, b.plassId)).limit(1);
  const [renter] = await db.select({ navn: usersTable.navn })
    .from(usersTable).where(eq(usersTable.id, b.leietakerId)).limit(1);

  return {
    id: b.id,
    plassId: b.plassId,
    leietakerId: b.leietakerId,
    startDato: b.startDato?.toISOString(),
    sluttDato: b.sluttDato?.toISOString(),
    periodetype: b.periodetype,
    totalPris: b.totalPris,
    utleierBelop: b.utleierBelop,
    spaceliGebyr: b.spaceliGebyr,
    status: b.status,
    lockedUntil: b.lockedUntil?.toISOString() ?? null,
    confirmedAt: b.confirmedAt?.toISOString() ?? null,
    spaseTittel: space?.tittel ?? null,
    spaseAdresse: space?.adresse ?? null,
    spaseHarUnloc: space?.harUnloc ?? false,
    spaseHarTelemetrics: space?.harTelemetrics ?? false,
    unlocTilgangGranted: b.unlocTilgangGranted ?? false,
    telemetricsTilgangGranted: b.telemetricsTilgangGranted ?? false,
    tilgangskode: b.tilgangskode ?? null,
    leietakerNavn: renter?.navn ?? null,
    opprettetDato: b.opprettetDato?.toISOString(),
    payoutStatus: b.payoutStatus ?? null,
    utbetalingTidspunkt: b.utbetalingTidspunkt?.toISOString() ?? null,
  };
}

function genTilgangskode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.get("/bookings", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const { role, status } = req.query as { role?: string; status?: string };

  let where;
  if (role === "utleier") {
    const ownedSpaces = await db.select({ id: spacesTable.id }).from(spacesTable)
      .where(eq(spacesTable.eierId, authUser.userId));
    const spaceIds = ownedSpaces.map(s => s.id);
    if (spaceIds.length === 0) { res.json([]); return; }
    where = eq(bookingsTable.plassId, spaceIds[0]);
  } else {
    where = status
      ? and(eq(bookingsTable.leietakerId, authUser.userId), eq(bookingsTable.status, status))
      : eq(bookingsTable.leietakerId, authUser.userId);
  }

  const bookings = await db.select().from(bookingsTable).where(where).orderBy(desc(bookingsTable.opprettetDato));
  const results = await Promise.all(bookings.map(formatBooking));
  res.json(results);
});

router.post("/bookings", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const { plassId, startDato, sluttDato, periodetype } = req.body;

  if (!plassId || !startDato || !sluttDato || !periodetype) {
    res.status(400).json({ error: "Mangler påkrevde felt" });
    return;
  }

  const spaceId = Number(plassId);
  const startDate = new Date(startDato);
  const endDate = new Date(sluttDato);

  const [space] = await db.select().from(spacesTable).where(eq(spacesTable.id, spaceId)).limit(1);
  if (!space) { res.status(404).json({ error: "Plass ikke funnet" }); return; }

  // ── Double-booking check ──────────────────────────────────────────────────
  // Find any active (reserved or confirmed) booking that overlaps the requested window
  const overlapping = await db.select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.plassId, spaceId),
        or(
          eq(bookingsTable.status, "reserved"),
          eq(bookingsTable.status, "confirmed")
        ),
        sql`${bookingsTable.startDato} < ${endDate}`,
        sql`${bookingsTable.sluttDato} > ${startDate}`
      )
    )
    .limit(1);

  if (overlapping.length > 0) {
    res.status(409).json({
      error: "Beklager! Denne plassen ble nettopp booket av en annen. Prøv en av de andre ledige plassene.",
      code: "OVERLAP",
    });
    return;
  }

  // ── Calculate price ───────────────────────────────────────────────────────
  const { db: dbClient, pricesTable } = await import("@workspace/db");
  const prices = await dbClient.select().from(pricesTable).where(eq(pricesTable.plassId, spaceId));
  const priceRow = prices.find(p => p.periode === periodetype) ?? prices[0];
  const unitPrice = priceRow?.belop ?? 500;

  const diffMs = endDate.getTime() - startDate.getTime();
  let antall = 1;
  if (periodetype === "time")   antall = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (periodetype === "dag")    antall = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  if (periodetype === "uke")    antall = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 7)));
  if (periodetype === "maaned") antall = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24 * 30)));

  const listedPrice   = unitPrice * antall;
  const serviceavgift = Math.round(listedPrice * 0.08);
  const totalPris     = listedPrice + serviceavgift;
  const utleierBelop  = listedPrice * 0.92;
  const spaceliGebyr  = totalPris - utleierBelop;

  const lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);

  // ── Create reservation (10-min lock) ─────────────────────────────────────
  const [booking] = await db.insert(bookingsTable).values({
    plassId: spaceId,
    leietakerId: authUser.userId,
    startDato: startDate,
    sluttDato: endDate,
    periodetype,
    totalPris,
    utleierBelop,
    spaceliGebyr,
    status: space.autoApproval ? "reserved" : "pending",
    lockedUntil,
  }).returning();

  // Emit reservation event so all clients update the pin colour → yellow
  emitSpaceReserved(spaceId, lockedUntil.toISOString());

  const result = await formatBooking(booking);
  res.status(201).json(result);
});

// ── Confirm booking (simulates Vipps payment confirmation) ────────────────────
router.post("/bookings/:id/confirm", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const id = parseInt(String(req.params["id"] ?? ""), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) { res.status(404).json({ error: "Booking ikke funnet" }); return; }
  if (booking.leietakerId !== authUser.userId) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  if (booking.status !== "reserved") {
    res.status(400).json({ error: "Booking er allerede bekreftet eller utløpt" });
    return;
  }

  // Check lock hasn't expired
  if (booking.lockedUntil && booking.lockedUntil < new Date()) {
    await db.update(bookingsTable).set({ status: "expired" }).where(eq(bookingsTable.id, id));
    emitSpaceReleased(booking.plassId);
    res.status(410).json({ error: "Reservasjonen utløp. Prøv å booke på nytt.", code: "EXPIRED" });
    return;
  }

  const now = new Date();
  const hoursToStart = (booking.startDato.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isLastMinute = hoursToStart < 24;
  const utbetalingTidspunkt = isLastMinute
    ? now
    : new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(bookingsTable)
    .set({
      status: "confirmed",
      confirmedAt: now,
      lockedUntil: null,
      tilgangskode: genTilgangskode(),
      payoutStatus: "venter",
      utbetalingTidspunkt,
    })
    .where(eq(bookingsTable.id, id))
    .returning();

  // Emit booked event so all clients update pin → red
  emitSpaceBooked(booking.plassId);

  const result = await formatBooking(updated);

  // Send confirmation emails (fire and forget — never block the response)
  (async () => {
    try {
      const [leietaker] = await db.select({ epost: usersTable.epost, navn: usersTable.navn })
        .from(usersTable).where(eq(usersTable.id, booking.leietakerId)).limit(1);
      const [space] = await db.select({ eierId: spacesTable.eierId })
        .from(spacesTable).where(eq(spacesTable.id, booking.plassId)).limit(1);
      const [utleier] = space
        ? await db.select({ epost: usersTable.epost, navn: usersTable.navn })
            .from(usersTable).where(eq(usersTable.id, space.eierId)).limit(1)
        : [null];

      const listedPrice = (result.totalPris ?? 0) - (result.spaceliGebyr ?? 0);
      if (leietaker) {
        await sendBookingConfirmedLeietaker({
          to: leietaker.epost,
          navn: leietaker.navn,
          tittel: result.spaseTittel ?? "",
          adresse: result.spaseAdresse ?? "",
          startDato: result.startDato ?? null,
          sluttDato: result.sluttDato ?? null,
          periodetype: result.periodetype ?? "",
          totalPris: result.totalPris ?? 0,
          listedPrice,
          spaceliGebyr: result.spaceliGebyr ?? 0,
          tilgangskode: result.tilgangskode ?? null,
          bookingId: result.id,
        });
      }
      if (utleier) {
        await sendBookingConfirmedUtleier({
          to: utleier.epost,
          navn: utleier.navn,
          tittel: result.spaseTittel ?? "",
          leietakerNavn: result.leietakerNavn ?? "Leietaker",
          startDato: result.startDato ?? null,
          sluttDato: result.sluttDato ?? null,
          listedPrice,
          spaceliGebyr: result.spaceliGebyr ?? 0,
          utleierBelop: result.utleierBelop ?? 0,
          bookingId: result.id,
        });
      }
    } catch { /* ignore email errors */ }
  })();

  res.json(result);
});

router.get("/bookings/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) { res.status(404).json({ error: "Booking ikke funnet" }); return; }

  const result = await formatBooking(booking);
  res.json(result);
});

router.post("/bookings/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id)).limit(1);
  if (!booking) { res.status(404).json({ error: "Booking ikke funnet" }); return; }
  if (booking.leietakerId !== authUser.userId && authUser.rolle !== "admin") {
    res.status(403).json({ error: "Ikke tilgang" }); return;
  }

  // Enforce 24h cancellation policy (skip for admin)
  if (booking.status === "confirmed" && authUser.rolle !== "admin") {
    if (booking.payoutStatus === "utbetalt") {
      res.status(400).json({ error: "Kan ikke avbestille – utleier har allerede mottatt betaling.", code: "PAYOUT_DONE" });
      return;
    }
    const nowTs = new Date();
    const cancelDeadline = booking.utbetalingTidspunkt ?? new Date(0);
    if (cancelDeadline <= nowTs) {
      res.status(400).json({ error: "Kan ikke avbestille – avbestillingsfristen har gått ut.", code: "CANCEL_EXPIRED" });
      return;
    }
  }

  const [updated] = await db
    .update(bookingsTable)
    .set({ status: "cancelled", cancelledAt: new Date(), payoutStatus: "refundert" })
    .where(eq(bookingsTable.id, id))
    .returning();

  // If it was confirmed, emit release so map goes green again
  if (booking.status === "confirmed" || booking.status === "reserved") {
    emitSpaceReleased(booking.plassId);
  }

  const result = await formatBooking(updated);

  // Send cancellation email (fire and forget)
  (async () => {
    try {
      const [leietaker] = await db.select({ epost: usersTable.epost, navn: usersTable.navn })
        .from(usersTable).where(eq(usersTable.id, booking.leietakerId)).limit(1);
      if (leietaker) {
        await sendBookingCancelledLeietaker({
          to: leietaker.epost,
          navn: leietaker.navn,
          tittel: result.spaseTittel ?? "",
          startDato: result.startDato ?? null,
          bookingId: result.id,
        });
      }
    } catch { /* ignore email errors */ }
  })();

  res.json(result);
});

router.get("/dashboard/owner", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;

  const ownedSpaces = await db.select().from(spacesTable).where(eq(spacesTable.eierId, authUser.userId));
  const spaceIds = ownedSpaces.map(s => s.id);

  let sisteBookinger: Awaited<ReturnType<typeof formatBooking>>[] = [];
  let totalInntekt = 0;
  let maanedsInntekt = 0;
  let aktiveBookinger = 0;
  let liveStatus: { spaceId: number; tittel: string; status: string; booking?: { leietakerNavn: string | null; sluttDato: string; totalPris: number } }[] = [];

  if (spaceIds.length > 0) {
    const allBookings = await db.select().from(bookingsTable)
      .where(eq(bookingsTable.plassId, spaceIds[0]))
      .orderBy(desc(bookingsTable.opprettetDato))
      .limit(10);

    totalInntekt    = allBookings.reduce((s, b) => s + (b.utleierBelop ?? 0), 0);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    maanedsInntekt  = allBookings.filter(b => b.opprettetDato >= startOfMonth).reduce((s, b) => s + (b.utleierBelop ?? 0), 0);
    aktiveBookinger = allBookings.filter(b => b.status === "confirmed").length;
    sisteBookinger  = await Promise.all(allBookings.slice(0, 5).map(formatBooking));

    // Live status per space
    for (const space of ownedSpaces) {
      const now2 = new Date();
      const active = await db.select().from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.plassId, space.id),
            or(eq(bookingsTable.status, "confirmed"), eq(bookingsTable.status, "reserved")),
            sql`${bookingsTable.sluttDato} > ${now2}`
          )
        )
        .orderBy(bookingsTable.startDato)
        .limit(1);

      const b = active[0];
      if (b) {
        const [renter] = await db.select({ navn: usersTable.navn }).from(usersTable).where(eq(usersTable.id, b.leietakerId)).limit(1);
        liveStatus.push({
          spaceId: space.id,
          tittel:  space.tittel,
          status:  b.status === "reserved" ? "reserved" : "booked",
          booking: {
            leietakerNavn: renter?.navn ?? null,
            sluttDato: b.sluttDato.toISOString(),
            totalPris: b.totalPris,
          },
        });
      } else {
        liveStatus.push({ spaceId: space.id, tittel: space.tittel, status: "available" });
      }
    }
  }

  const aktiveAbonnenter = spaceIds.length > 0
    ? await db
        .select({ id: subscriptionsTable.id })
        .from(subscriptionsTable)
        .where(and(eq(subscriptionsTable.plassId, spaceIds[0]), eq(subscriptionsTable.status, "aktiv")))
        .then(r => r.length)
    : 0;

  res.json({
    totalInntekt,
    maanedsInntekt,
    aktiveBookinger,
    totaltPlasser: ownedSpaces.length,
    beleggsprosent: spaceIds.length > 0 ? Math.round((aktiveBookinger / spaceIds.length) * 100) : 0,
    aktiveAbonnenter,
    sisteBookinger,
    liveStatus,
  });
});

export default router;
