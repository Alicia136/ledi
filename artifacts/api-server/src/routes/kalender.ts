import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, spacesTable } from "@workspace/db";
import { kalenderIntegrasjonerTable } from "@workspace/db";
import { blockedDatesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

// Helper: generate mock calendar events → blocked dates for next 60 days
function generateMockBlocks(plassId: number, provider: string): { dato: string; grunn: string }[] {
  const blocks: { dato: string; grunn: string }[] = [];
  const now = new Date();

  // Pattern: weekends blocked (hjemme), one vacation week, scattered evenings
  for (let i = 0; i < 60; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const dow = d.getDay(); // 0=Sun, 6=Sat
    const iso = d.toISOString().slice(0, 10);

    // Weekends = hjemme
    if (dow === 0 || dow === 6) {
      blocks.push({ dato: iso, grunn: `${provider === "google" ? "Google Kalender" : "Outlook"}: Hjemme` });
    }
    // Days 10-17 = vacation
    if (i >= 10 && i <= 17) {
      blocks.push({ dato: iso, grunn: `${provider === "google" ? "Google Kalender" : "Outlook"}: Ferie 🌴` });
    }
    // Day 3, 7, 22 = misc events
    if ([3, 7, 22].includes(i)) {
      blocks.push({ dato: iso, grunn: `${provider === "google" ? "Google Kalender" : "Outlook"}: Hjemme (arrangement)` });
    }
  }

  // Deduplicate by dato
  const seen = new Set<string>();
  return blocks.filter(b => {
    if (seen.has(b.dato)) return false;
    seen.add(b.dato);
    return true;
  });
}

// GET /kalender/integrasjoner
router.get("/kalender/integrasjoner", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;

  const rows = await db
    .select()
    .from(kalenderIntegrasjonerTable)
    .where(eq(kalenderIntegrasjonerTable.userId, authUser.userId));

  res.json(rows.map(r => ({
    id: r.id,
    provider: r.provider,
    accountEmail: r.accountEmail,
    plassId: r.plassId,
    status: r.status,
    demoModus: r.demoModus,
    sistSynkronisert: r.sistSynkronisert?.toISOString() ?? null,
    opprettetDato: r.opprettetDato?.toISOString(),
  })));
});

// POST /kalender/koble — connect a calendar (demo mode)
router.post("/kalender/koble", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const { provider, plassId, accountEmail } = req.body as {
    provider: string;
    plassId?: number | null;
    accountEmail?: string;
  };

  if (!["google", "outlook"].includes(provider)) {
    res.status(400).json({ error: "Ugyldig provider. Bruk 'google' eller 'outlook'." });
    return;
  }

  // Check if already connected
  const existing = await db
    .select()
    .from(kalenderIntegrasjonerTable)
    .where(
      and(
        eq(kalenderIntegrasjonerTable.userId, authUser.userId),
        eq(kalenderIntegrasjonerTable.provider, provider)
      )
    );

  if (existing.length > 0) {
    res.status(409).json({ error: "Allerede koblet til denne kalenderen" });
    return;
  }

  const demoEmail = provider === "google"
    ? (accountEmail || "bruker@gmail.com")
    : (accountEmail || "bruker@outlook.com");

  const [integration] = await db
    .insert(kalenderIntegrasjonerTable)
    .values({
      userId: authUser.userId,
      plassId: plassId ?? null,
      provider,
      accountEmail: demoEmail,
      status: "aktiv",
      demoModus: true,
      sistSynkronisert: new Date(),
    })
    .returning();

  // Immediately populate blocked dates for all user's spaces (or specific space)
  const spaces = plassId
    ? [{ id: plassId }]
    : await db
        .select({ id: spacesTable.id })
        .from(spacesTable)
        .where(eq(spacesTable.eierId, authUser.userId));

  for (const space of spaces) {
    const blocks = generateMockBlocks(space.id, provider);
    // Remove existing calendar-generated blocks for this space
    const existingBlocks = await db
      .select()
      .from(blockedDatesTable)
      .where(eq(blockedDatesTable.plassId, space.id));

    const calGrunner = ["Google Kalender", "Outlook"];
    const nonCalBlocks = existingBlocks.filter(b =>
      !calGrunner.some(g => (b.grunn ?? "").includes(g))
    );

    await db.delete(blockedDatesTable).where(eq(blockedDatesTable.plassId, space.id));
    if (nonCalBlocks.length > 0) {
      await db.insert(blockedDatesTable).values(
        nonCalBlocks.map(b => ({ plassId: b.plassId, dato: b.dato, grunn: b.grunn }))
      );
    }
    if (blocks.length > 0) {
      await db.insert(blockedDatesTable).values(
        blocks.map(b => ({ plassId: space.id, dato: b.dato, grunn: b.grunn }))
      );
    }
  }

  res.status(201).json({
    id: integration.id,
    provider: integration.provider,
    accountEmail: integration.accountEmail,
    status: integration.status,
    demoModus: integration.demoModus,
    antallBlokkerteOpprettet: spaces.length * 20,
    melding: `${provider === "google" ? "Google Kalender" : "Outlook"} koblet i demo-modus. ${spaces.length} plass(er) synkronisert.`,
  });
});

// POST /kalender/synk/:id — re-sync
router.post("/kalender/synk/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId, 10);

  const [integration] = await db
    .select()
    .from(kalenderIntegrasjonerTable)
    .where(
      and(
        eq(kalenderIntegrasjonerTable.id, id),
        eq(kalenderIntegrasjonerTable.userId, authUser.userId)
      )
    )
    .limit(1);

  if (!integration) {
    res.status(404).json({ error: "Integrasjon ikke funnet" });
    return;
  }

  const spaces = integration.plassId
    ? [{ id: integration.plassId }]
    : await db
        .select({ id: spacesTable.id })
        .from(spacesTable)
        .where(eq(spacesTable.eierId, authUser.userId));

  for (const space of spaces) {
    const blocks = generateMockBlocks(space.id, integration.provider);
    const existingBlocks = await db
      .select()
      .from(blockedDatesTable)
      .where(eq(blockedDatesTable.plassId, space.id));

    const calGrunner = ["Google Kalender", "Outlook"];
    const nonCalBlocks = existingBlocks.filter(b =>
      !calGrunner.some(g => (b.grunn ?? "").includes(g))
    );

    await db.delete(blockedDatesTable).where(eq(blockedDatesTable.plassId, space.id));
    if (nonCalBlocks.length > 0) {
      await db.insert(blockedDatesTable).values(
        nonCalBlocks.map(b => ({ plassId: b.plassId, dato: b.dato, grunn: b.grunn }))
      );
    }
    if (blocks.length > 0) {
      await db.insert(blockedDatesTable).values(
        blocks.map(b => ({ plassId: space.id, dato: b.dato, grunn: b.grunn }))
      );
    }
  }

  await db
    .update(kalenderIntegrasjonerTable)
    .set({ sistSynkronisert: new Date() })
    .where(eq(kalenderIntegrasjonerTable.id, id));

  res.json({ ok: true, antallBlokkerteOppdatert: spaces.length * 20 });
});

// DELETE /kalender/integrasjoner/:id
router.delete("/kalender/integrasjoner/:id", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const rawId2 = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(rawId2, 10);

  const [integration] = await db
    .select()
    .from(kalenderIntegrasjonerTable)
    .where(
      and(
        eq(kalenderIntegrasjonerTable.id, id),
        eq(kalenderIntegrasjonerTable.userId, authUser.userId)
      )
    )
    .limit(1);

  if (!integration) {
    res.status(404).json({ error: "Integrasjon ikke funnet" }); return;
  }

  // Remove calendar-generated blocked dates for user's spaces
  const spaces = integration.plassId
    ? [{ id: integration.plassId }]
    : await db
        .select({ id: spacesTable.id })
        .from(spacesTable)
        .where(eq(spacesTable.eierId, authUser.userId));

  const calLabel = integration.provider === "google" ? "Google Kalender" : "Outlook";
  for (const space of spaces) {
    const existingBlocks = await db
      .select()
      .from(blockedDatesTable)
      .where(eq(blockedDatesTable.plassId, space.id));

    const nonCalBlocks = existingBlocks.filter(b => !(b.grunn ?? "").includes(calLabel));
    await db.delete(blockedDatesTable).where(eq(blockedDatesTable.plassId, space.id));
    if (nonCalBlocks.length > 0) {
      await db.insert(blockedDatesTable).values(
        nonCalBlocks.map(b => ({ plassId: b.plassId, dato: b.dato, grunn: b.grunn }))
      );
    }
  }

  await db
    .delete(kalenderIntegrasjonerTable)
    .where(eq(kalenderIntegrasjonerTable.id, id));

  res.json({ ok: true });
});

// GET /kalender/forhåndsvisning — upcoming calendar-generated blocked dates
router.get("/kalender/forhåndsvisning", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;

  const spaces = await db
    .select({ id: spacesTable.id })
    .from(spacesTable)
    .where(eq(spacesTable.eierId, authUser.userId));

  const allBlocks: { dato: string; grunn: string; plassId: number }[] = [];
  for (const space of spaces) {
    const blocks = await db
      .select()
      .from(blockedDatesTable)
      .where(eq(blockedDatesTable.plassId, space.id));

    const calBlocks = blocks.filter(b =>
      (b.grunn ?? "").includes("Google Kalender") || (b.grunn ?? "").includes("Outlook")
    );
    allBlocks.push(...calBlocks.map(b => ({ dato: b.dato, grunn: b.grunn ?? "", plassId: b.plassId })));
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = allBlocks
    .filter(b => b.dato >= today)
    .sort((a, b) => a.dato.localeCompare(b.dato))
    .slice(0, 60);

  res.json(upcoming);
});

export default router;
