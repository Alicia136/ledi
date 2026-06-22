import { eq } from "drizzle-orm";
import { db, alarmerTable, varslerTable, pricesTable } from "@workspace/db";
import { emitVarselToUser } from "./io";
import { logger } from "./logger";

interface SpaceForAlarm {
  id: number;
  tittel: string;
  by: string;
  type: string;
}

const TYPE_LABELS: Record<string, string> = {
  parking: "parkering", storage: "lagerplass", ev: "elbil",
  camping: "camping", bobil: "bobil", baatplass: "båtplass", henger: "henger",
};

export async function triggerAlarms(space: SpaceForAlarm): Promise<void> {
  try {
    const alarmer = await db.select().from(alarmerTable).where(eq(alarmerTable.aktiv, true));
    if (alarmer.length === 0) return;

    const prices = await db.select().from(pricesTable).where(eq(pricesTable.plassId, space.id));
    const cheapest = prices.length > 0 ? Math.min(...prices.map(p => p.belop)) : null;

    for (const alarm of alarmer) {
      const byMatch = space.by.toLowerCase().includes(alarm.bydel.toLowerCase()) ||
                      alarm.bydel.toLowerCase().includes(space.by.toLowerCase());
      if (!byMatch) continue;

      if (alarm.type && alarm.type !== space.type) continue;

      if (alarm.maxPris !== null && alarm.maxPris !== undefined && cheapest !== null) {
        if (cheapest > alarm.maxPris) continue;
      }

      if (alarm.periode && prices.length > 0) {
        const hasPeriode = prices.some(p => p.periode === alarm.periode);
        if (!hasPeriode) continue;
      }

      const typeLabel = TYPE_LABELS[space.type] ?? space.type;
      const prisText = cheapest !== null
        ? ` – ${cheapest.toLocaleString("nb-NO")} kr`
        : "";

      const [varsel] = await db.insert(varslerTable).values({
        userId: alarm.userId,
        alarmId: alarm.id,
        plassId: space.id,
        tittel: `🔔 Ny ${typeLabel} i ${alarm.bydel}`,
        melding: `${space.tittel}${prisText}. Du har 30 minutter til å booke!`,
        lest: false,
      }).returning();

      emitVarselToUser(alarm.userId, {
        id: varsel.id,
        tittel: varsel.tittel,
        melding: varsel.melding,
        plassId: varsel.plassId,
        opprettetDato: varsel.opprettetDato?.toISOString() ?? new Date().toISOString(),
      });
    }
  } catch (err) {
    logger.error({ err }, "Error triggering alarms");
  }
}
