import { Router } from "express";
import { eq, and, desc, inArray } from "drizzle-orm";
import { db, subscriptionsTable, spacesTable, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

async function formatSubscription(sub: typeof subscriptionsTable.$inferSelect) {
  const [space] = await db
    .select({ tittel: spacesTable.tittel, adresse: spacesTable.adresse, by: spacesTable.by, eierId: spacesTable.eierId })
    .from(spacesTable)
    .where(eq(spacesTable.id, sub.plassId))
    .limit(1);
  const [leietaker] = await db
    .select({ navn: usersTable.navn })
    .from(usersTable)
    .where(eq(usersTable.id, sub.leietakerId))
    .limit(1);
  const eierNavn = space
    ? await db.select({ navn: usersTable.navn }).from(usersTable).where(eq(usersTable.id, space.eierId)).limit(1).then(r => r[0]?.navn ?? null)
    : null;

  return {
    ...sub,
    startDato: sub.startDato.toISOString(),
    nesteBetaling: sub.nesteBetaling.toISOString(),
    opprettetDato: sub.opprettetDato.toISOString(),
    spaseTittel: space?.tittel ?? null,
    spaseAdresse: space?.adresse ?? null,
    spaseBy: space?.by ?? null,
    leietakerNavn: leietaker?.navn ?? null,
    eierNavn,
  };
}

router.post("/subscriptions", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const { plassId, startDato, bindingstid } = req.body as { plassId: number; startDato: string; bindingstid: number };

  if (!plassId || !startDato || !bindingstid) {
    res.status(400).json({ error: "Mangler påkrevde felt" });
    return;
  }

  const [space] = await db.select().from(spacesTable).where(eq(spacesTable.id, plassId)).limit(1);
  if (!space) { res.status(404).json({ error: "Plass ikke funnet" }); return; }
  if (!space.tilbyrAbonnement || !space.abonnementsPris) {
    res.status(400).json({ error: "Denne plassen tilbyr ikke abonnement" });
    return;
  }

  const existing = await db
    .select()
    .from(subscriptionsTable)
    .where(and(eq(subscriptionsTable.plassId, plassId), eq(subscriptionsTable.status, "aktiv")))
    .limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Plassen har allerede et aktivt abonnement" });
    return;
  }

  const start = new Date(startDato);
  const nesteBetaling = new Date(start);
  nesteBetaling.setMonth(nesteBetaling.getMonth() + 1);

  const [created] = await db.insert(subscriptionsTable).values({
    plassId,
    leietakerId: authUser.userId,
    startDato: start,
    bindingstid,
    maanedsPris: space.abonnementsPris,
    nesteBetaling,
    status: "aktiv",
  }).returning();

  res.status(201).json(await formatSubscription(created));
});

router.get("/subscriptions", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const role = req.query.role as string | undefined;

  let subs: (typeof subscriptionsTable.$inferSelect)[];

  if (role === "utleier") {
    const ownedSpaces = await db
      .select({ id: spacesTable.id })
      .from(spacesTable)
      .where(eq(spacesTable.eierId, authUser.userId));
    if (ownedSpaces.length === 0) { res.json([]); return; }
    const spaceIds = ownedSpaces.map(s => s.id);
    subs = await db
      .select()
      .from(subscriptionsTable)
      .where(inArray(subscriptionsTable.plassId, spaceIds))
      .orderBy(desc(subscriptionsTable.opprettetDato));
  } else {
    subs = await db
      .select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.leietakerId, authUser.userId))
      .orderBy(desc(subscriptionsTable.opprettetDato));
  }

  res.json(await Promise.all(subs.map(formatSubscription)));
});

router.get("/subscriptions/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, id)).limit(1);
  if (!sub) { res.status(404).json({ error: "Abonnement ikke funnet" }); return; }

  const [space] = await db.select({ eierId: spacesTable.eierId }).from(spacesTable).where(eq(spacesTable.id, sub.plassId)).limit(1);
  if (sub.leietakerId !== authUser.userId && space?.eierId !== authUser.userId) {
    res.status(403).json({ error: "Ikke tilgang" });
    return;
  }

  res.json(await formatSubscription(sub));
});

router.post("/subscriptions/:id/cancel", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const [sub] = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, id)).limit(1);
  if (!sub) { res.status(404).json({ error: "Abonnement ikke funnet" }); return; }
  if (sub.leietakerId !== authUser.userId) {
    res.status(403).json({ error: "Kun leietaker kan si opp abonnement" });
    return;
  }

  const [updated] = await db
    .update(subscriptionsTable)
    .set({ status: "avsluttet" })
    .where(eq(subscriptionsTable.id, id))
    .returning();

  res.json(await formatSubscription(updated));
});

export default router;
