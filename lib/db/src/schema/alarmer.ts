import { pgTable, serial, integer, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alarmerTable = pgTable("alarmer", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bydel: text("bydel").notNull(),
  type: text("type"),
  maxPris: real("max_pris"),
  periode: text("periode"),
  aktiv: boolean("aktiv").notNull().default(true),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlarmSchema = createInsertSchema(alarmerTable).omit({ id: true, opprettetDato: true });
export type InsertAlarm = z.infer<typeof insertAlarmSchema>;
export type Alarm = typeof alarmerTable.$inferSelect;
