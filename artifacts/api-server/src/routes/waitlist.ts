import { Router } from "express";
import { eq, and, desc, count, inArray } from "drizzle-orm";
import { db, waitlistTable, spacesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

const MAX_WAITLIST = 50;

async function formatEntry(entry: typeof waitlistTable.$inferSelect, userId?: number) {
  const [space] = await db
    .select({ tittel: spacesTable.tittel, adresse: spacesTable.adresse, by: spacesTable.by, eierId: spacesTable.eierId })
    .from(spacesTable)
    .where(eq(spacesTable.id, entry.plassId))
    .limit(1);

  const [leietaker] = await db
    .select({ navn: usersTable.navn })
    .from(usersTable)
    .where(eq(usersTable.id, entry.leietakerId))
    .limit(1);

  // Count how many entries registered before this one (= queue position)
  const [{ value: ahead }] = await db
    .select({ value: count() })
    .from(waitlistTable)
    .where(
      and(
        eq(waitlistTable.plassId, entry.plassId),
        eq(waitlistTable.status, "venter"),
      )
    );

  return {
    ...entry,
    registrertDato: entry.registrertDato.toISOString(),
    varsletDato: entry.varsletDato ? entry.varsletDato.toISOString() : null,
    posisjon: Number(ahead),
    spaseTittel: space?.tittel ?? null,
    spaseAdresse: space?.adresse ?? null,
    spaseBy: space?.by ?? null,
    leietakerNavn: leietaker?.navn ?? null,
  };
}

// POST /waitlist — join
router.post("/waitlist", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const { plassId, periodeType, oensketDato, oensketSluttDato, maksPris } = req.body as {
    plassId: number;
    periodeType: string;
    oensketDato: string;
    oensketSluttDato?: string | null;
    maksPris?: number | null;
  };

  if (!plassId || !periodeType || !oensketDato) {
    res.status(400).json({ error: "Mangler påkrevde felt" });
    return;
  }

  const [space] = await db.select({ id: spacesTable.id }).from(spacesTable).where(eq(spacesTable.id, plassId)).limit(1);
  if (!space) {
    res.status(404).json({ error: "Plass ikke funnet" });
    return;
  }

  // Check already on waitlist
  const existing = await db
    .select()
    .from(waitlistTable)
    .where(and(
      eq(waitlistTable.plassId, plassId),
      eq(waitlistTable.leietakerId, authUser.userId),
      eq(waitlistTable.status, "venter"),
    ))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Du er allerede på ventelisten for denne plassen" });
    return;
  }

  // Check max capacity
  const [{ value: currentCount }] = await db
    .select({ value: count() })
    .from(waitlistTable)
    .where(and(eq(waitlistTable.plassId, plassId), eq(waitlistTable.status, "venter")));

  if (Number(currentCount) >= MAX_WAITLIST) {
    res.status(409).json({ error: "Ventelisten er full (maks 50 plasser)" });
    return;
  }

  const [created] = await db.insert(waitlistTable).values({
    plassId,
    leietakerId: authUser.userId,
    periodeType,
    oensketDato,
    oensketSluttDato: oensketSluttDato ?? null,
    maksPris: maksPris ?? null,
    status: "venter",
  }).returning();

  res.status(201).json(await formatEntry(created, authUser.userId));
});

// GET /waitlist — list entries
router.get("/waitlist", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const role = req.query.role as string | undefined;

  let entries: (typeof waitlistTable.$inferSelect)[];

  if (role === "utleier") {
    const ownedSpaces = await db
      .select({ id: spacesTable.id })
      .from(spacesTable)
      .where(eq(spacesTable.eierId, authUser.userId));

    if (ownedSpaces.length === 0) {
      res.json([]);
      return;
    }

    const spaceIds = ownedSpaces.map(s => s.id);
    entries = await db
      .select()
      .from(waitlistTable)
      .where(and(
        inArray(waitlistTable.plassId, spaceIds),
        eq(waitlistTable.status, "venter"),
      ))
      .orderBy(desc(waitlistTable.registrertDato));
  } else {
    entries = await db
      .select()
      .from(waitlistTable)
      .where(eq(waitlistTable.leietakerId, authUser.userId))
      .orderBy(desc(waitlistTable.registrertDato));
  }

  res.json(await Promise.all(entries.map(e => formatEntry(e, authUser.userId))));
});

// DELETE /waitlist/:id — leave
router.delete("/waitlist/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: "Ugyldig id" });
    return;
  }

  const [entry] = await db.select().from(waitlistTable).where(eq(waitlistTable.id, id)).limit(1);
  if (!entry) {
    res.status(404).json({ error: "Ventelisteoppføring ikke funnet" });
    return;
  }

  if (entry.leietakerId !== authUser.userId) {
    res.status(403).json({ error: "Ikke tilgang" });
    return;
  }

  await db
    .update(waitlistTable)
    .set({ status: "kansellert" })
    .where(eq(waitlistTable.id, id));

  res.json({ message: "Du er meldt av ventelisten" });
});

export default router;
