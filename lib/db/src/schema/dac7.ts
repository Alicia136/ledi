import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const dac7RapporterTable = pgTable("dac7_rapporter", {
  id: serial("id").primaryKey(),
  year: integer("year").notNull().unique(),
  antallUtleiere: integer("antall_utleiere").notNull(),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Dac7Rapport = typeof dac7RapporterTable.$inferSelect;
