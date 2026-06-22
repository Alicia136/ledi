import { pgTable, text, serial, timestamp, boolean, real, integer } from "drizzle-orm/pg-core";

export const partnereTable = pgTable("partnere", {
  id: serial("id").primaryKey(),
  partnerId: text("partner_id").notNull().unique(),
  navn: text("navn").notNull(),
  type: text("type").notNull().default("restaurant"),
  kontaktEpost: text("kontakt_epost"),
  nettside: text("nettside"),
  provisionProsent: real("provision_prosent").notNull().default(2),
  erAktiv: boolean("er_aktiv").notNull().default(false),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const widgetKlikkTable = pgTable("widget_klikk", {
  id: serial("id").primaryKey(),
  partnerId: text("partner_id").notNull(),
  bookingId: integer("booking_id"),
  userAgent: text("user_agent"),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export type Partner = typeof partnereTable.$inferSelect;
export type WidgetKlikk = typeof widgetKlikkTable.$inferSelect;
