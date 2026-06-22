import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, bookingsTable, spacesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

/**
 * POST /api/telemetrics/open
 * Sends an open command to a Telemetrics-controlled gate/port.
 * Mock implementation — real integration requires Telemetrics API credentials.
 */
router.post("/telemetrics/open", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const { bookingId } = req.body;

  if (!bookingId) {
    res.status(400).json({ error: "Mangler bookingId" });
    return;
  }

  const id = Number(bookingId);

  const [booking] = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, id), eq(bookingsTable.leietakerId, authUser.userId)))
    .limit(1);

  if (!booking) {
    res.status(404).json({ error: "Booking ikke funnet" });
    return;
  }

  if (booking.status !== "confirmed") {
    res.status(400).json({ error: "Booking er ikke bekreftet", kode: "IKKE_BEKREFTET" });
    return;
  }

  const now = new Date();
  const start = new Date(booking.startDato);
  const slutt = new Date(booking.sluttDato);

  if (now < start) {
    const diff = Math.round((start.getTime() - now.getTime()) / 60000);
    res.status(400).json({
      error: `Tilgangen starter om ${diff < 60 ? `${diff} min` : `${Math.round(diff / 60)} t`}`,
      kode: "FOR_TIDLIG",
    });
    return;
  }

  if (now > slutt) {
    res.status(400).json({ error: "Bookingen er utløpt", kode: "UTLOPT" });
    return;
  }

  const [space] = await db
    .select({ tittel: spacesTable.tittel, harTelemetrics: spacesTable.harTelemetrics, telemetricsPortId: spacesTable.telemetricsPortId })
    .from(spacesTable)
    .where(eq(spacesTable.id, booking.plassId))
    .limit(1);

  if (!space?.harTelemetrics) {
    res.status(400).json({ error: "Denne plassen har ikke Telemetrics port-styring" });
    return;
  }

  await db
    .update(bookingsTable)
    .set({ telemetricsTilgangGranted: true })
    .where(eq(bookingsTable.id, id));

  // Simulate Telemetrics API — sends BLE/GSM open command to the gate controller
  res.json({
    success: true,
    melding: `Porten åpnes! Kjør frem innen 30 sekunder. Tilgang til "${space.tittel}" utløper ${slutt.toLocaleDateString("nb-NO")}.`,
    portId: space.telemetricsPortId ?? `TLM-${booking.plassId}`,
    apnesIMs: 800,
    tilgangUtloper: slutt.toISOString(),
  });
});

export default router;
