import { pgTable, text, serial, timestamp, boolean, real, integer } from "drizzle-orm/pg-core";

export const arrangementerTable = pgTable("arrangementer", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  navn: text("navn").notNull(),
  sted: text("sted").notNull(),
  by: text("by").notNull(),
  dato: text("dato").notNull(),
  klokkeslett: text("klokkeslett").notNull().default("20:00"),
  breddegrad: real("breddegrad").notNull(),
  lengdegrad: real("lengdegrad").notNull(),
  antallBilletter: integer("antall_billetter").notNull().default(5000),
  kategori: text("kategori").notNull().default("konsert"),
  emoji: text("emoji").notNull().default("🎵"),
  kilde: text("kilde").notNull().default("ticketmaster"),
  bildeUrl: text("bilde_url"),
  estimertParkeringssokere: integer("estimert_parkeringssokere").notNull().default(1200),
  aktiv: boolean("aktiv").notNull().default(true),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const arrangementAktiveringerTable = pgTable("arrangement_aktiveringer", {
  id: serial("id").primaryKey(),
  arrangementId: integer("arrangement_id").notNull(),
  plassId: integer("plass_id").notNull(),
  userId: integer("user_id").notNull(),
  eventPris: real("event_pris").notNull(),
  aktivertDato: timestamp("aktivert_dato", { withTimezone: true }).notNull().defaultNow(),
});

export type Arrangement = typeof arrangementerTable.$inferSelect;
export type ArrangementAktivering = typeof arrangementAktiveringerTable.$inferSelect;
