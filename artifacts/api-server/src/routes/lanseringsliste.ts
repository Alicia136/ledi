import { Router } from "express";
import { db, lanseringslisteTable } from "@workspace/db";
import { count } from "drizzle-orm";

const router = Router();

// GET /lanseringsliste/antall — public count of signups
router.get("/lanseringsliste/antall", async (_req, res): Promise<void> => {
  const [row] = await db.select({ antall: count() }).from(lanseringslisteTable);
  res.json({ antall: row?.antall ?? 0 });
});

// POST /lanseringsliste — join launch waitlist (no auth required)
router.post("/lanseringsliste", async (req, res): Promise<void> => {
  const { epost } = req.body as { epost?: string };

  if (!epost || typeof epost !== "string" || !epost.includes("@")) {
    res.status(400).json({ error: "Ugyldig e-postadresse" });
    return;
  }

  const normalized = epost.trim().toLowerCase();

  try {
    await db.insert(lanseringslisteTable).values({ epost: normalized });
    const [row] = await db.select({ antall: count() }).from(lanseringslisteTable);
    res.status(201).json({ ok: true, antall: row?.antall ?? 1 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      const [row] = await db.select({ antall: count() }).from(lanseringslisteTable);
      res.status(409).json({ error: "Allerede registrert", antall: row?.antall ?? 0 });
      return;
    }
    throw err;
  }
});

export default router;
