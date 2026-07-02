import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  plassId: integer("plass_id").notNull(),
  leietakerId: integer("leietaker_id").notNull(),
  startDato: timestamp("start_dato", { withTimezone: true }).notNull(),
  sluttDato: timestamp("slutt_dato", { withTimezone: true }).notNull(),
  periodetype: text("periode_type").notNull(),
  totalPris: real("total_pris").notNull(),
  utleierBelop: real("utleier_belop").notNull(),
  spaceliGebyr: real("spaceli_gebyr").notNull(),
  status: text("status").notNull().default("pending"),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  vippsBetalingId: text("vipps_betaling_id"),
  betaltAvLeietaker: real("betalt_av_leietaker"),
  utbetaltTilUtleier: real("utbetalt_til_utleier"),
  lediInntekt: real("ledi_inntekt"),
  utbetaltDato: timestamp("utbetalt_dato", { withTimezone: true }),
  payoutStatus: text("payout_status"),
  payoutReference: text("payout_reference"),
  payoutFeilCount: integer("payout_feil_count").notNull().default(0),
  payoutNesteForsok: timestamp("payout_neste_forsok", { withTimezone: true }),
  utbetalingTidspunkt: timestamp("utbetaling_tidspunkt", { withTimezone: true }),
  unlocTilgangGranted: boolean("unloc_tilgang_granted").notNull().default(false),
  tilgangskode: text("tilgangskode"),
  telemetricsTilgangGranted: boolean("telemetrics_tilgang_granted").notNull().default(false),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, opprettetDato: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
