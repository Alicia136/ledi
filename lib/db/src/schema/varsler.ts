import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const varslerTable = pgTable("varsler", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  alarmId: integer("alarm_id"),
  plassId: integer("plass_id"),
  tittel: text("tittel").notNull(),
  melding: text("melding").notNull(),
  lest: boolean("lest").notNull().default(false),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVarselSchema = createInsertSchema(varslerTable).omit({ id: true, opprettetDato: true });
export type InsertVarsel = z.infer<typeof insertVarselSchema>;
export type Varsel = typeof varslerTable.$inferSelect;
