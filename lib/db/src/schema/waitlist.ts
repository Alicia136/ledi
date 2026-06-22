import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const waitlistTable = pgTable("waitlist", {
  id: serial("id").primaryKey(),
  plassId: integer("plass_id").notNull(),
  leietakerId: integer("leietaker_id").notNull(),
  periodeType: varchar("periode_type", { length: 20 }).notNull(),
  oensketDato: varchar("onsket_dato", { length: 10 }).notNull(),
  oensketSluttDato: varchar("onsket_slutt_dato", { length: 10 }),
  maksPris: integer("maks_pris"),
  registrertDato: timestamp("registrert_dato", { withTimezone: true }).notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("venter"),
  varsletDato: timestamp("varslet_dato", { withTimezone: true }),
});

export const insertWaitlistSchema = createInsertSchema(waitlistTable).omit({ id: true, registrertDato: true });
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type Waitlist = typeof waitlistTable.$inferSelect;
