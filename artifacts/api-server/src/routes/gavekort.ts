import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, gavekorterTable } from "@workspace/db";

const router = Router();

function genKode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let kode = "";
  for (let i = 0; i < 10; i++) {
    if (i === 4 || i === 8) kode += "-";
    else kode += chars[Math.floor(Math.random() * chars.length)];
  }
  return kode;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// POST /gavekort — kjøp et gavekort
router.post("/gavekort", async (req, res) => {
  const { belop, avsenderNavn, avsenderEpost, mottakerNavn, mottakerEpost, melding } = req.body as {
    belop?: string;
    avsenderNavn?: string;
    avsenderEpost?: string;
    mottakerNavn?: string;
    mottakerEpost?: string;
    melding?: string;
  };

  if (!["500", "1000", "2000"].includes(String(belop))) {
    res.status(400).json({ error: "Ugyldig beløp. Velg 500, 1000 eller 2000." });
    return;
  }
  if (!avsenderNavn?.trim() || !mottakerNavn?.trim()) {
    res.status(400).json({ error: "Navn på avsender og mottaker er påkrevd." });
    return;
  }
  if (!avsenderEpost || !isValidEmail(avsenderEpost)) {
    res.status(400).json({ error: "Ugyldig e-post for avsender." });
    return;
  }
  if (!mottakerEpost || !isValidEmail(mottakerEpost)) {
    res.status(400).json({ error: "Ugyldig e-post for mottaker." });
    return;
  }

  const belopNum = Number(belop);

  let kode = genKode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const existing = await db
      .select({ id: gavekorterTable.id })
      .from(gavekorterTable)
      .where(eq(gavekorterTable.kode, kode))
      .limit(1);
    if (existing.length === 0) break;
    kode = genKode();
  }

  const [gavekort] = await db
    .insert(gavekorterTable)
    .values({
      kode,
      belop: belopNum,
      avsenderNavn: avsenderNavn.trim(),
      avsenderEpost: avsenderEpost.trim(),
      mottakerNavn: mottakerNavn.trim(),
      mottakerEpost: mottakerEpost.trim(),
      melding: melding?.trim() ?? null,
    })
    .returning();

  res.status(201).json(gavekort);
});

// GET /gavekort/:kode — sjekk et gavekort
router.get("/gavekort/:kode", async (req, res) => {
  const kode = req.params.kode.toUpperCase();
  const [gavekort] = await db
    .select()
    .from(gavekorterTable)
    .where(eq(gavekorterTable.kode, kode))
    .limit(1);

  if (!gavekort) {
    res.status(404).json({ error: "Gavekort ikke funnet" });
    return;
  }
  res.json(gavekort);
});

export default router;
