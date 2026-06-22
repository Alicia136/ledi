import { Router } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, partnereTable, widgetKlikkTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "../lib/auth";
import { randomBytes } from "crypto";

const router = Router();

type AuthReq = { user: { userId: number; rolle: string } };

function genPartnerId(navn: string): string {
  const slug = navn.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 20);
  const suffix = randomBytes(3).toString("hex");
  return `${slug}-${suffix}`;
}

router.get("/widget/:partnerId", async (req, res): Promise<void> => {
  const { partnerId } = req.params;
  const [partner] = await db
    .select()
    .from(partnereTable)
    .where(eq(partnereTable.partnerId, partnerId))
    .limit(1);

  if (!partner) {
    res.status(404).json({ error: "Partner ikke funnet" });
    return;
  }
  if (!partner.erAktiv) {
    res.status(403).json({ error: "Partner ikke aktiv" });
    return;
  }

  res.json({
    navn: partner.navn,
    type: partner.type,
    provisionProsent: partner.provisionProsent,
  });
});

router.post("/widget/:partnerId/klikk", async (req, res): Promise<void> => {
  const { partnerId } = req.params;
  const userAgent = req.headers["user-agent"] ?? null;

  await db.insert(widgetKlikkTable).values({
    partnerId,
    userAgent,
    bookingId: null,
  });

  res.json({ ok: true });
});

router.post("/widget/registrer", async (req, res): Promise<void> => {
  const { navn, type, kontaktEpost, nettside } = req.body as {
    navn: string;
    type: string;
    kontaktEpost: string;
    nettside?: string;
  };

  if (!navn || !type || !kontaktEpost) {
    res.status(400).json({ error: "Navn, type og e-post er påkrevd" });
    return;
  }

  const partnerId = genPartnerId(navn);

  const [partner] = await db.insert(partnereTable).values({
    partnerId,
    navn,
    type,
    kontaktEpost,
    nettside: nettside ?? null,
    provisionProsent: 2,
    erAktiv: false,
  }).returning();

  res.status(201).json({
    partnerId: partner.partnerId,
    message: "Søknad mottatt. Vi aktiverer kontoen din innen 24 timer.",
  });
});

router.get("/widget/admin/partnere", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  if (authUser.rolle !== "admin") {
    res.status(403).json({ error: "Ikke tilgang" });
    return;
  }

  const partnere = await db.select().from(partnereTable).orderBy(desc(partnereTable.opprettetDato));

  const withStats = await Promise.all(partnere.map(async (p) => {
    const [{ value: klikk }] = await db
      .select({ value: count() })
      .from(widgetKlikkTable)
      .where(eq(widgetKlikkTable.partnerId, p.partnerId));

    return { ...p, antallKlikk: Number(klikk) };
  }));

  res.json(withStats);
});

router.patch("/widget/admin/partnere/:partnerId/aktiver", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  if (authUser.rolle !== "admin") {
    res.status(403).json({ error: "Ikke tilgang" });
    return;
  }

  const rawPartnerId = req.params.partnerId;
  const partnerId = Array.isArray(rawPartnerId) ? rawPartnerId[0] : rawPartnerId;
  await db.update(partnereTable).set({ erAktiv: true }).where(eq(partnereTable.partnerId, partnerId));
  res.json({ ok: true });
});

export default router;
