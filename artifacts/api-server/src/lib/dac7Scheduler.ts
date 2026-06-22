import { eq } from "drizzle-orm";
import { db, usersTable, bookingsTable, dac7RapporterTable } from "@workspace/db";
import { sendAarsoppgaveUtleier } from "./email";
import { logger } from "./logger";

export async function sendDac7Aarsoppgaver(year: number): Promise<{ antallSendt: number }> {
  const allUsers   = await db.select().from(usersTable);
  const allBookings = await db.select().from(bookingsTable);

  const utleierIds = new Set(
    allUsers.filter(u => u.rolle === "utleier").map(u => u.id)
  );

  // Map utleier → spaces
  const spaces = await db.query.spacesTable.findMany();
  const spaceOwner = new Map(spaces.map(s => [s.id, s.eierId]));

  // Aggregate per utleier for the given year
  type UtleierAgg = { totalInntekt: number; lediAvgift: number; antallBookinger: number };
  const agg = new Map<number, UtleierAgg>();

  for (const b of allBookings) {
    if (b.status !== "confirmed") continue;
    const bookYear = new Date(b.opprettetDato).getFullYear();
    if (bookYear !== year) continue;

    const ownerId = spaceOwner.get(b.plassId);
    if (!ownerId || !utleierIds.has(ownerId)) continue;

    const cur = agg.get(ownerId) ?? { totalInntekt: 0, lediAvgift: 0, antallBookinger: 0 };
    cur.totalInntekt    += b.utleierBelop;
    cur.lediAvgift      += b.spaceliGebyr / 2; // utleier's half of fee
    cur.antallBookinger += 1;
    agg.set(ownerId, cur);
  }

  let antallSendt = 0;

  for (const [userId, data] of agg.entries()) {
    if (data.totalInntekt <= 0) continue;
    const user = allUsers.find(u => u.id === userId);
    if (!user) continue;

    try {
      await sendAarsoppgaveUtleier({
        to: user.epost,
        navn: user.navn,
        year,
        totalInntekt: data.totalInntekt,
        lediAvgift: data.lediAvgift,
        antallBookinger: data.antallBookinger,
      });
      antallSendt++;
    } catch (err) {
      logger.error({ err, userId, year }, "Feil ved sending av årsoppgave");
    }
  }

  // Mark year as sent (upsert)
  await db
    .insert(dac7RapporterTable)
    .values({ year, antallUtleiere: antallSendt })
    .onConflictDoUpdate({ target: dac7RapporterTable.year, set: { antallUtleiere: antallSendt, sentAt: new Date() } });

  logger.info({ year, antallSendt }, "DAC7 årsoppgaver sendt");
  return { antallSendt };
}

export function startDac7Scheduler(): void {
  // Check every 24 h whether today is 1 Feb and this year's report hasn't been sent yet
  const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1_000;

  async function maybeRun() {
    const now = new Date();
    if (now.getMonth() !== 1 || now.getDate() !== 1) return; // not Feb 1

    const reportingYear = now.getFullYear() - 1;
    const [existing] = await db
      .select()
      .from(dac7RapporterTable)
      .where(eq(dac7RapporterTable.year, reportingYear))
      .limit(1);

    if (existing) {
      logger.info({ reportingYear }, "DAC7 årsoppgave allerede sendt for dette året");
      return;
    }

    logger.info({ reportingYear }, "Starter automatisk DAC7-sending (1. februar)");
    await sendDac7Aarsoppgaver(reportingYear);
  }

  setInterval(() => { void maybeRun(); }, CHECK_INTERVAL_MS);
  // Run once shortly after start in case server was down on Feb 1
  setTimeout(() => { void maybeRun(); }, 10_000);
}
