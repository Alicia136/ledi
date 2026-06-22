import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, bookingsTable, spacesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

// Unloc API base URL — confirmed from Unloc partner docs
const UNLOC_API_BASE = "https://api.unloc.app/v1";

/**
 * Call the real Unloc API to open a lock.
 * Requires UNLOC_API_KEY secret.
 */
async function openUnlocLock(lockId: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env["UNLOC_API_KEY"];
  if (!apiKey) {
    return { ok: false, error: "UNLOC_API_KEY er ikke konfigurert" };
  }

  try {
    const response = await fetch(`${UNLOC_API_BASE}/locks/${encodeURIComponent(lockId)}/open`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ source: "ledi-platform" }),
    });

    if (response.ok) {
      return { ok: true };
    }

    // Try to extract error message from Unloc response
    let errMsg = `Unloc svarte med status ${response.status}`;
    try {
      const body = await response.json() as { message?: string; error?: string };
      if (body.message) errMsg = body.message;
      else if (body.error) errMsg = body.error;
    } catch {
      // ignore parse error
    }

    return { ok: false, error: errMsg };
  } catch (err) {
    return { ok: false, error: "Kunne ikke nå Unloc — sjekk tilkobling" };
  }
}

router.post("/unloc/open", requireAuth, async (req, res): Promise<void> => {
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
    .select({ tittel: spacesTable.tittel, harUnloc: spacesTable.harUnloc, unlocLockId: spacesTable.unlocLockId })
    .from(spacesTable)
    .where(eq(spacesTable.id, booking.plassId))
    .limit(1);

  if (!space?.harUnloc) {
    res.status(400).json({ error: "Denne plassen har ikke smartlås" });
    return;
  }

  const lockId = space.unlocLockId;
  if (!lockId) {
    res.status(400).json({ error: "Lås-ID er ikke konfigurert for denne plassen" });
    return;
  }

  // Call real Unloc API
  const result = await openUnlocLock(lockId);

  if (!result.ok) {
    res.status(502).json({ error: result.error ?? "Smartlåsen svarte ikke" });
    return;
  }

  // Mark access as granted
  await db
    .update(bookingsTable)
    .set({ unlocTilgangGranted: true })
    .where(eq(bookingsTable.id, id));

  res.json({
    success: true,
    melding: `Låsen er åpnet! Du har tilgang til "${space.tittel}" til ${slutt.toLocaleTimeString("nb-NO", { hour: "2-digit", minute: "2-digit" })} den ${slutt.toLocaleDateString("nb-NO")}.`,
    lockId,
    tilgangUtloper: slutt.toISOString(),
  });
});

export default router;
