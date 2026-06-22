import { Router } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, alarmerTable, varslerTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

router.get("/alarmer", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const alarmer = await db
    .select()
    .from(alarmerTable)
    .where(and(eq(alarmerTable.userId, userId), eq(alarmerTable.aktiv, true)))
    .orderBy(desc(alarmerTable.opprettetDato));
  res.json(alarmer);
});

router.post("/alarmer", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const { bydel, type, maxPris, periode } = req.body as {
    bydel?: string; type?: string; maxPris?: number; periode?: string;
  };
  if (!bydel) { res.status(400).json({ error: "Bydel er påkrevd" }); return; }

  const [alarm] = await db.insert(alarmerTable).values({
    userId,
    bydel: String(bydel),
    type: type ?? null,
    maxPris: maxPris ? Number(maxPris) : null,
    periode: periode ?? null,
    aktiv: true,
  }).returning();
  res.status(201).json(alarm);
});

router.delete("/alarmer/:id", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const [alarm] = await db.select().from(alarmerTable).where(eq(alarmerTable.id, id)).limit(1);
  if (!alarm) { res.status(404).json({ error: "Alarm ikke funnet" }); return; }
  if (alarm.userId !== userId) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  await db.update(alarmerTable).set({ aktiv: false }).where(eq(alarmerTable.id, id));
  res.json({ ok: true });
});

router.get("/varsler", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const varsler = await db
    .select()
    .from(varslerTable)
    .where(eq(varslerTable.userId, userId))
    .orderBy(desc(varslerTable.opprettetDato))
    .limit(30);
  res.json(varsler.map(v => ({ ...v, opprettetDato: v.opprettetDato?.toISOString() })));
});

router.post("/varsler/:id/les", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  const rawId2 = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId2, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }
  await db.update(varslerTable).set({ lest: true }).where(
    and(eq(varslerTable.id, id), eq(varslerTable.userId, userId))
  );
  res.json({ ok: true });
});

router.post("/varsler/les-alle", requireAuth, async (req, res): Promise<void> => {
  const { userId } = (req as unknown as AuthReq).user;
  await db.update(varslerTable).set({ lest: true }).where(eq(varslerTable.userId, userId));
  res.json({ ok: true });
});

export default router;
