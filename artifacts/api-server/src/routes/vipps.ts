import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, bookingsTable, usersTable, spacesTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";
import { vippsClient } from "../lib/vipps-client";
import { logger } from "../lib/logger";
import { emitSpaceBooked } from "../lib/io";
import { sendPayoutFailedAlert } from "../lib/email";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

const RETRY_DELAYS_MS = [5 * 60 * 1000, 60 * 60 * 1000, 24 * 60 * 60 * 1000];
const MAX_PAYOUT_ATTEMPTS = 3;

function buildOrderId(bookingId: number): string {
  return `ledi-booking-${bookingId}-${Date.now()}`;
}

function extractBookingId(orderId: string): number | null {
  const match = orderId.match(/^ledi-booking-(\d+)-/);
  return match ? parseInt(match[1], 10) : null;
}

async function triggerPayout(bookingId: number): Promise<void> {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) { logger.warn({ bookingId }, "Payout: booking ikke funnet"); return; }

  const [space] = await db.select({ eierId: spacesTable.eierId, adresse: spacesTable.adresse })
    .from(spacesTable).where(eq(spacesTable.id, booking.plassId)).limit(1);
  if (!space) { logger.warn({ bookingId }, "Payout: plass ikke funnet"); return; }

  const [utleier] = await db.select({ vippsNummer: usersTable.vippsNummer })
    .from(usersTable).where(eq(usersTable.id, space.eierId)).limit(1);

  if (!utleier?.vippsNummer) {
    logger.warn({ bookingId, eierId: space.eierId }, "Payout: utleier mangler Vipps-nummer — hopper over");
    await db.update(bookingsTable)
      .set({ payoutStatus: "skipped" })
      .where(eq(bookingsTable.id, bookingId));
    return;
  }

  if (!vippsClient.isConfigured()) {
    logger.info({ bookingId }, "Vipps ikke konfigurert — payout markert som simulert");
    await db.update(bookingsTable).set({
      payoutStatus: "simulated",
      utbetaltDato: new Date(),
      utbetaltTilUtleier: booking.utleierBelop,
      lediInntekt: booking.spaceliGebyr,
      betaltAvLeietaker: booking.totalPris,
    }).where(eq(bookingsTable.id, bookingId));
    return;
  }

  const payoutRef = `ledi-payout-${bookingId}`;
  const amountOre = Math.round(booking.utleierBelop * 100);

  const result = await vippsClient.sendPayout({
    reference: payoutRef,
    description: `Ledi utbetaling – ${space.adresse ?? `booking #${bookingId}`}`,
    amountOre,
    phoneNumber: utleier.vippsNummer,
  });

  if (result.success) {
    await db.update(bookingsTable).set({
      payoutStatus: "success",
      payoutReference: payoutRef,
      utbetaltDato: new Date(),
      utbetaltTilUtleier: booking.utleierBelop,
      lediInntekt: booking.spaceliGebyr,
      betaltAvLeietaker: booking.totalPris,
    }).where(eq(bookingsTable.id, bookingId));
    logger.info({ bookingId, amountOre }, "Vipps payout sendt OK");
  } else {
    const feilCount = (booking.payoutFeilCount ?? 0) + 1;
    if (feilCount >= MAX_PAYOUT_ATTEMPTS) {
      await db.update(bookingsTable).set({
        payoutStatus: "failed",
        payoutFeilCount: feilCount,
      }).where(eq(bookingsTable.id, bookingId));
      logger.error({ bookingId, feilCount }, "Vipps payout feilet etter maks forsøk — varsler admin");
      void sendPayoutFailedAlert({
        bookingId,
        utleierVipps: utleier?.vippsNummer ?? "ukjent",
        amountKr: booking.utleierBelop ?? 0,
        feilCount,
        errorDetails: result.error,
      });
    } else {
      const delayMs = RETRY_DELAYS_MS[feilCount - 1] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1];
      const nesteForsok = new Date(Date.now() + delayMs);
      await db.update(bookingsTable).set({
        payoutStatus: "retry_scheduled",
        payoutFeilCount: feilCount,
        payoutNesteForsok: nesteForsok,
      }).where(eq(bookingsTable.id, bookingId));
      logger.warn({ bookingId, feilCount, delayMs }, "Vipps payout feilet — prøver igjen");
      setTimeout(() => void triggerPayout(bookingId), delayMs);
    }
  }
}

export async function startPayoutRetryScheduler(): Promise<void> {
  const now = new Date();
  const pending = await db.select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(eq(bookingsTable.payoutStatus, "retry_scheduled"));

  for (const row of pending) {
    const [b] = await db.select({ payoutNesteForsok: bookingsTable.payoutNesteForsok })
      .from(bookingsTable).where(eq(bookingsTable.id, row.id)).limit(1);
    const target = b?.payoutNesteForsok ?? now;
    const delayMs = Math.max(0, target.getTime() - now.getTime());
    logger.info({ bookingId: row.id, delayMs }, "Payout retry gjenopptas");
    setTimeout(() => void triggerPayout(row.id), delayMs);
  }
}

router.post("/vipps/initiate", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const { bookingId } = req.body as { bookingId?: number };

  if (!bookingId) { res.status(400).json({ error: "Mangler bookingId" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) { res.status(404).json({ error: "Booking ikke funnet" }); return; }
  if (booking.leietakerId !== authUser.userId) { res.status(403).json({ error: "Ikke din booking" }); return; }
  if (booking.status !== "reserved") {
    res.status(400).json({ error: "Booking er ikke i reservert tilstand" }); return;
  }

  if (!vippsClient.isConfigured()) {
    res.json({ mock: true, orderId: null, redirectUrl: null });
    return;
  }

  const orderId = buildOrderId(bookingId);
  const host = req.headers.host ?? "ledi.no";
  const protocol = req.headers["x-forwarded-proto"] ?? "https";
  const baseUrl = `${protocol}://${host}`;

  const result = await vippsClient.initiatePayment({
    orderId,
    amountOre: Math.round(booking.totalPris * 100),
    callbackPrefix: `${baseUrl}/api/vipps/callback`,
    fallbackUrl: `${baseUrl}/?vipps_order=${orderId}`,
    transactionText: `Ledi booking #${bookingId}`,
  });

  await db.update(bookingsTable)
    .set({ vippsBetalingId: orderId })
    .where(eq(bookingsTable.id, bookingId));

  res.json({ mock: false, orderId: result.orderId, redirectUrl: result.url });
});

router.post("/vipps/callback", async (req, res): Promise<void> => {
  const callbackToken = process.env.VIPPS_CALLBACK_TOKEN;
  const authHeader = req.headers.authorization ?? "";

  if (callbackToken && authHeader !== callbackToken) {
    res.status(401).json({ error: "Ugyldig callback token" });
    return;
  }

  const body = req.body as { orderId?: string; transactionInfo?: { status?: string; amount?: number } };
  const { orderId, transactionInfo } = body;

  if (!orderId || !transactionInfo) {
    res.status(400).json({ error: "Mangler orderId eller transactionInfo" }); return;
  }

  const bookingId = extractBookingId(orderId);
  if (!bookingId) {
    res.status(400).json({ error: "Ugyldig orderId format" }); return;
  }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) { res.status(404).json({ error: "Booking ikke funnet" }); return; }

  if (transactionInfo.status === "SALE") {
    if (booking.status !== "confirmed") {
      const [updated] = await db.update(bookingsTable)
        .set({ status: "confirmed", confirmedAt: new Date(), lockedUntil: null, payoutStatus: "pending" })
        .where(eq(bookingsTable.id, bookingId))
        .returning();

      if (updated) emitSpaceBooked(booking.plassId);
    }

    void triggerPayout(bookingId);
  }

  res.json({ ok: true });
});

router.post("/vipps/payout/:bookingId/retry", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.bookingId) ? req.params.bookingId[0] : req.params.bookingId;
  const bookingId = parseInt(String(raw), 10);
  if (isNaN(bookingId)) { res.status(400).json({ error: "Ugyldig bookingId" }); return; }

  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) { res.status(404).json({ error: "Booking ikke funnet" }); return; }

  void triggerPayout(bookingId);
  res.json({ ok: true, message: "Payout retry startet" });
});

export default router;
