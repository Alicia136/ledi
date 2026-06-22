import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const availabilityScheduleTable = pgTable("availability_schedule", {
  id: serial("id").primaryKey(),
  plassId: integer("plass_id").notNull(),
  dagINummer: integer("dag_i_nummer").notNull(), // 0=Man, 1=Tir, ..., 6=Søn
  fraTid: text("fra_tid").notNull().default("08:00"),   // "08:00"
  tilTid: text("til_tid").notNull().default("16:00"),   // "16:00"
  erTilgjengelig: boolean("er_tilgjengelig").notNull().default(true),
});

export const blockedDatesTable = pgTable("blocked_dates", {
  id: serial("id").primaryKey(),
  plassId: integer("plass_id").notNull(),
  dato: text("dato").notNull(), // "2026-06-14"
  grunn: text("grunn"),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAvailabilitySchema = createInsertSchema(availabilityScheduleTable).omit({ id: true });
export const insertBlockedDateSchema = createInsertSchema(blockedDatesTable).omit({ id: true, opprettetDato: true });

export type AvailabilitySchedule = typeof availabilityScheduleTable.$inferSelect;
export type BlockedDate = typeof blockedDatesTable.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type InsertBlockedDate = z.infer<typeof insertBlockedDateSchema>;
