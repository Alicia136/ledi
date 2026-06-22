import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, reviewsTable, bookingsTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

router.get("/spaces/:id/reviews", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const spaceBookings = await db.select({ id: bookingsTable.id, leietakerId: bookingsTable.leietakerId })
    .from(bookingsTable).where(eq(bookingsTable.plassId, id));

  const results = [];
  for (const booking of spaceBookings) {
    const reviews = await db.select().from(reviewsTable).where(eq(reviewsTable.bookingId, booking.id));
    const [renter] = await db.select({ navn: usersTable.navn }).from(usersTable)
      .where(eq(usersTable.id, booking.leietakerId)).limit(1);
    for (const r of reviews) {
      results.push({
        id: r.id,
        bookingId: r.bookingId,
        rangering: r.rangering,
        kommentar: r.kommentar,
        anmelderNavn: renter?.navn ?? null,
        opprettetDato: r.opprettetDato?.toISOString(),
      });
    }
  }

  res.json(results);
});

router.post("/spaces/:id/reviews", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const { bookingId, rangering, kommentar } = req.body;

  if (!bookingId || !rangering) {
    res.status(400).json({ error: "Mangler bookingId eller rangering" });
    return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, Number(bookingId))).limit(1);
  if (!booking) { res.status(404).json({ error: "Booking ikke funnet" }); return; }
  if (booking.leietakerId !== authUser.userId) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  const [review] = await db.insert(reviewsTable).values({
    bookingId: Number(bookingId),
    rangering: Number(rangering),
    kommentar: kommentar ?? null,
  }).returning();

  const [renter] = await db.select({ navn: usersTable.navn }).from(usersTable)
    .where(eq(usersTable.id, authUser.userId)).limit(1);

  res.status(201).json({
    id: review.id,
    bookingId: review.bookingId,
    rangering: review.rangering,
    kommentar: review.kommentar,
    anmelderNavn: renter?.navn ?? null,
    opprettetDato: review.opprettetDato?.toISOString(),
  });
});

export default router;
