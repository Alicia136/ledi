import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gavekorterTable = pgTable("gavekorter", {
  id: serial("id").primaryKey(),
  kode: text("kode").notNull().unique(),
  belop: integer("belop").notNull(),
  avsenderNavn: text("avsender_navn").notNull(),
  avsenderEpost: text("avsender_epost").notNull(),
  mottakerNavn: text("mottaker_navn").notNull(),
  mottakerEpost: text("mottaker_epost").notNull(),
  melding: text("melding"),
  status: text("status").notNull().default("aktiv"),
  bruktAvBookingId: integer("brukt_av_booking_id"),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
  bruktDato: timestamp("brukt_dato", { withTimezone: true }),
});

export const insertGavekortSchema = createInsertSchema(gavekorterTable).omit({
  id: true,
  opprettetDato: true,
  status: true,
  bruktAvBookingId: true,
  bruktDato: true,
});
export type InsertGavekort = z.infer<typeof insertGavekortSchema>;
export type Gavekort = typeof gavekorterTable.$inferSelect;
