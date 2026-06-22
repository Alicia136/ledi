import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, spacesTable, bookingsTable } from "@workspace/db";
import { availabilityScheduleTable, blockedDatesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();
type AuthReq = { user: { userId: number; rolle: string } };

async function requireSpaceOwner(spaceId: number, userId: number, rolle: string): Promise<boolean> {
  if (rolle === "admin") return true;
  const [space] = await db.select({ eierId: spacesTable.eierId })
    .from(spacesTable).where(eq(spacesTable.id, spaceId)).limit(1);
  return space?.eierId === userId;
}

// GET /spaces/:id/schedule
router.get("/spaces/:id/schedule", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const rows = await db.select().from(availabilityScheduleTable)
    .where(eq(availabilityScheduleTable.plassId, id));

  // Return all 7 days, filling defaults if not set
  const schedule = Array.from({ length: 7 }, (_, dayNum) => {
    const row = rows.find(r => r.dagINummer === dayNum);
    const isWeekend = dayNum >= 5;
    return {
      dagINummer: dayNum,
      fraTid: row?.fraTid ?? "08:00",
      tilTid: row?.tilTid ?? "16:00",
      erTilgjengelig: row != null ? row.erTilgjengelig : !isWeekend,
    };
  });

  res.json(schedule);
});

// PUT /spaces/:id/schedule
router.put("/spaces/:id/schedule", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const ok = await requireSpaceOwner(id, authUser.userId, authUser.rolle);
  if (!ok) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  const days: { dagINummer: number; fraTid: string; tilTid: string; erTilgjengelig: boolean }[] = req.body;
  if (!Array.isArray(days)) { res.status(400).json({ error: "Forventet array" }); return; }

  // Delete and re-insert all schedule rows for this space
  await db.delete(availabilityScheduleTable)
    .where(eq(availabilityScheduleTable.plassId, id));

  if (days.length > 0) {
    await db.insert(availabilityScheduleTable).values(
      days.map(d => ({
        plassId: id,
        dagINummer: d.dagINummer,
        fraTid: d.fraTid,
        tilTid: d.tilTid,
        erTilgjengelig: d.erTilgjengelig,
      }))
    );
  }

  // Return updated schedule
  const updated = await db.select().from(availabilityScheduleTable)
    .where(eq(availabilityScheduleTable.plassId, id));

  const schedule = Array.from({ length: 7 }, (_, dayNum) => {
    const row = updated.find(r => r.dagINummer === dayNum);
    const isWeekend = dayNum >= 5;
    return {
      dagINummer: dayNum,
      fraTid: row?.fraTid ?? "08:00",
      tilTid: row?.tilTid ?? "16:00",
      erTilgjengelig: row != null ? row.erTilgjengelig : !isWeekend,
    };
  });

  res.json(schedule);
});

// GET /spaces/:id/available-times?date=YYYY-MM-DD
router.get("/spaces/:id/available-times", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const dateStr = req.query.date as string;
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    res.status(400).json({ error: "Ugyldig dato (bruk YYYY-MM-DD)" }); return;
  }

  const date = new Date(dateStr);
  // Convert JS day (0=Sun) to our numbering (0=Mon ... 6=Sun)
  const jsDay = date.getDay();
  const dagINummer = jsDay === 0 ? 6 : jsDay - 1;

  // Check if date is blocked
  const [blocked] = await db.select().from(blockedDatesTable)
    .where(and(eq(blockedDatesTable.plassId, id), eq(blockedDatesTable.dato, dateStr)))
    .limit(1);

  if (blocked) {
    res.json({
      date: dateStr,
      isBlocked: true,
      scheduleFrom: null,
      scheduleTo: null,
      scheduleActive: false,
      availableHours: [],
      occupiedHours: [],
    });
    return;
  }

  // Get schedule for that weekday
  const [schedRow] = await db.select().from(availabilityScheduleTable)
    .where(and(
      eq(availabilityScheduleTable.plassId, id),
      eq(availabilityScheduleTable.dagINummer, dagINummer)
    ))
    .limit(1);

  const isWeekend = dagINummer >= 5;
  const scheduleActive = schedRow != null ? schedRow.erTilgjengelig : !isWeekend;
  const fromTime = schedRow?.fraTid ?? "08:00";
  const toTime   = schedRow?.tilTid ?? "16:00";

  if (!scheduleActive) {
    res.json({
      date: dateStr,
      isBlocked: false,
      scheduleFrom: fromTime,
      scheduleTo: toTime,
      scheduleActive: false,
      availableHours: [],
      occupiedHours: [],
    });
    return;
  }

  const fromH = parseInt(fromTime.split(":")[0], 10);
  const toH   = parseInt(toTime.split(":")[0], 10);
  const scheduleHours = Array.from({ length: toH - fromH }, (_, i) => fromH + i);

  // Find existing bookings that overlap with this date
  const dayStart = new Date(`${dateStr}T00:00:00`);
  const dayEnd   = new Date(`${dateStr}T23:59:59`);

  const existingBookings = await db.select({
    startDato: bookingsTable.startDato,
    sluttDato: bookingsTable.sluttDato,
    periodetype: bookingsTable.periodetype,
    status: bookingsTable.status,
  }).from(bookingsTable)
    .where(and(
      eq(bookingsTable.plassId, id),
      eq(bookingsTable.status, "confirmed")
    ));

  const occupiedHours = new Set<number>();
  for (const booking of existingBookings) {
    if (!booking.startDato || !booking.sluttDato) continue;
    const bStart = new Date(booking.startDato);
    const bEnd   = new Date(booking.sluttDato);
    if (bEnd <= dayStart || bStart >= dayEnd) continue;

    if (booking.periodetype === "time") {
      const startH = bStart.getHours();
      const endH   = bEnd.getHours();
      for (let h = startH; h < endH; h++) occupiedHours.add(h);
    } else {
      // Day/week/month booking blocks all scheduled hours
      scheduleHours.forEach(h => occupiedHours.add(h));
    }
  }

  const availableHours = scheduleHours.filter(h => !occupiedHours.has(h));

  res.json({
    date: dateStr,
    isBlocked: false,
    scheduleFrom: fromTime,
    scheduleTo: toTime,
    scheduleActive: true,
    availableHours,
    occupiedHours: [...occupiedHours].filter(h => scheduleHours.includes(h)),
  });
});

// GET /spaces/:id/blocked-dates
router.get("/spaces/:id/blocked-dates", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const rows = await db.select().from(blockedDatesTable)
    .where(eq(blockedDatesTable.plassId, id));

  res.json(rows.map(r => ({
    id: r.id,
    plassId: r.plassId,
    dato: r.dato,
    grunn: r.grunn,
    opprettetDato: r.opprettetDato?.toISOString(),
  })));
});

// POST /spaces/:id/blocked-dates
router.post("/spaces/:id/blocked-dates", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const ok = await requireSpaceOwner(id, authUser.userId, authUser.rolle);
  if (!ok) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  const { dato, grunn } = req.body;
  if (!dato || !/^\d{4}-\d{2}-\d{2}$/.test(dato)) {
    res.status(400).json({ error: "Ugyldig dato (bruk YYYY-MM-DD)" }); return;
  }

  const [row] = await db.insert(blockedDatesTable)
    .values({ plassId: id, dato, grunn: grunn ?? null })
    .returning();

  res.status(201).json({
    id: row.id,
    plassId: row.plassId,
    dato: row.dato,
    grunn: row.grunn,
    opprettetDato: row.opprettetDato?.toISOString(),
  });
});

// DELETE /spaces/:id/blocked-dates/:dateId
router.delete("/spaces/:id/blocked-dates/:dateId", requireAuth, async (req, res): Promise<void> => {
  const authUser = (req as unknown as AuthReq).user;
  const id     = parseInt(Array.isArray(req.params.id)     ? req.params.id[0]     : req.params.id,     10);
  const dateId = parseInt(Array.isArray(req.params.dateId) ? req.params.dateId[0] : req.params.dateId, 10);
  if (isNaN(id) || isNaN(dateId)) { res.status(400).json({ error: "Ugyldig id" }); return; }

  const ok = await requireSpaceOwner(id, authUser.userId, authUser.rolle);
  if (!ok) { res.status(403).json({ error: "Ikke tilgang" }); return; }

  await db.delete(blockedDatesTable)
    .where(and(eq(blockedDatesTable.id, dateId), eq(blockedDatesTable.plassId, id)));

  res.json({ message: "Slettet" });
});

export default router;
