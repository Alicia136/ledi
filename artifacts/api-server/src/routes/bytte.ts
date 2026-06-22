import { Router } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { bytteprofilerTable, bytteForespørslerTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

// GET /api/bytte/profil — get own profile
router.get("/bytte/profil", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const [profil] = await db
    .select()
    .from(bytteprofilerTable)
    .where(and(eq(bytteprofilerTable.userId, authUser.userId), eq(bytteprofilerTable.aktiv, true)))
    .limit(1);
  res.json(profil ?? null);
});

// POST /api/bytte/profil — create or update profile
router.post("/bytte/profil", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const { nåværendeBydel, ønsketBydel, type, beskrivelse } = req.body as {
    nåværendeBydel: string;
    ønsketBydel: string;
    type?: string;
    beskrivelse?: string;
  };

  if (!nåværendeBydel || !ønsketBydel) {
    res.status(400).json({ error: "nåværendeBydel og ønsketBydel er påkrevd" });
    return;
  }

  // Deactivate old profile
  await db
    .update(bytteprofilerTable)
    .set({ aktiv: false })
    .where(and(eq(bytteprofilerTable.userId, authUser.userId), eq(bytteprofilerTable.aktiv, true)));

  // Create new
  const [ny] = await db
    .insert(bytteprofilerTable)
    .values({
      userId: authUser.userId,
      nåværendeBydel,
      ønsketBydel,
      type: type ?? "parkering",
      beskrivelse: beskrivelse ?? null,
      aktiv: true,
    })
    .returning();

  res.json(ny);
});

// DELETE /api/bytte/profil — deactivate
router.delete("/bytte/profil", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  await db
    .update(bytteprofilerTable)
    .set({ aktiv: false })
    .where(and(eq(bytteprofilerTable.userId, authUser.userId), eq(bytteprofilerTable.aktiv, true)));
  res.json({ ok: true });
});

// GET /api/bytte/matcher — find mutual swap matches
router.get("/bytte/matcher", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;

  // Get own profile
  const [minProfil] = await db
    .select()
    .from(bytteprofilerTable)
    .where(and(eq(bytteprofilerTable.userId, authUser.userId), eq(bytteprofilerTable.aktiv, true)))
    .limit(1);

  if (!minProfil) {
    res.json([]);
    return;
  }

  // Find others where: their nåværende = my ønsket AND their ønsket = my nåværende
  const matcher = await db
    .select()
    .from(bytteprofilerTable)
    .where(
      and(
        eq(bytteprofilerTable.aktiv, true),
        eq(bytteprofilerTable.nåværendeBydel, minProfil.ønsketBydel),
        eq(bytteprofilerTable.ønsketBydel, minProfil.nåværendeBydel),
        ne(bytteprofilerTable.userId, authUser.userId)
      )
    );

  // Enrich with user name
  const enriched = await Promise.all(
    matcher.map(async (m) => {
      const [user] = await db
        .select({ navn: usersTable.navn })
        .from(usersTable)
        .where(eq(usersTable.id, m.userId))
        .limit(1);

      // Check existing request
      const [existingReq] = await db
        .select()
        .from(bytteForespørslerTable)
        .where(
          and(
            eq(bytteForespørslerTable.fraUserId, authUser.userId),
            eq(bytteForespørslerTable.tilUserId, m.userId)
          )
        )
        .limit(1);

      // Estimate savings (synthetic: 10–20% price diff between bydels)
      const sparBeløp = Math.round((Math.random() * 200 + 200) / 50) * 50;

      return {
        profilId: m.id,
        userId: m.userId,
        navn: user?.navn ?? "Anonym",
        nåværendeBydel: m.nåværendeBydel,
        ønsketBydel: m.ønsketBydel,
        type: m.type,
        beskrivelse: m.beskrivelse,
        sparBeløp,
        forespørselStatus: existingReq?.status ?? null,
      };
    })
  );

  res.json(enriched);
});

// POST /api/bytte/forespor/:tilUserId — send swap request
router.post("/bytte/forespor/:tilUserId", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const tilUserId = Number(req.params.tilUserId);
  const { melding } = req.body as { melding?: string };

  if (tilUserId === authUser.userId) {
    res.status(400).json({ error: "Kan ikke sende forespørsel til deg selv" });
    return;
  }

  // Check for duplicate
  const [existing] = await db
    .select()
    .from(bytteForespørslerTable)
    .where(
      and(
        eq(bytteForespørslerTable.fraUserId, authUser.userId),
        eq(bytteForespørslerTable.tilUserId, tilUserId)
      )
    )
    .limit(1);

  if (existing) {
    res.json(existing);
    return;
  }

  const [ny] = await db
    .insert(bytteForespørslerTable)
    .values({
      fraUserId: authUser.userId,
      tilUserId,
      melding: melding ?? null,
      status: "venter",
    })
    .returning();

  res.json(ny);
});

// GET /api/bytte/innkommende — incoming swap requests
router.get("/bytte/innkommende", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;

  const foresporsel = await db
    .select()
    .from(bytteForespørslerTable)
    .where(
      and(
        eq(bytteForespørslerTable.tilUserId, authUser.userId),
        eq(bytteForespørslerTable.status, "venter")
      )
    );

  const enriched = await Promise.all(
    foresporsel.map(async (f) => {
      const [user] = await db
        .select({ navn: usersTable.navn })
        .from(usersTable)
        .where(eq(usersTable.id, f.fraUserId))
        .limit(1);
      const [profil] = await db
        .select()
        .from(bytteprofilerTable)
        .where(and(eq(bytteprofilerTable.userId, f.fraUserId), eq(bytteprofilerTable.aktiv, true)))
        .limit(1);
      return { ...f, fraNavnv: user?.navn ?? "Anonym", fraProfil: profil ?? null };
    })
  );

  res.json(enriched);
});

// POST /api/bytte/svar/:forespørselId — accept/decline
router.post("/bytte/svar/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const id = Number(req.params.id);
  const { svar } = req.body as { svar: "akseptert" | "avslatt" };

  const [oppdatert] = await db
    .update(bytteForespørslerTable)
    .set({ status: svar, behandletDato: new Date() })
    .where(
      and(
        eq(bytteForespørslerTable.id, id),
        eq(bytteForespørslerTable.tilUserId, authUser.userId)
      )
    )
    .returning();

  if (!oppdatert) {
    res.status(404).json({ error: "Forespørsel ikke funnet" });
    return;
  }

  res.json(oppdatert);
});

export default router;
