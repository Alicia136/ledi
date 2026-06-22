import { pgTable, text, serial, timestamp, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const spacesTable = pgTable("spaces", {
  id: serial("id").primaryKey(),
  eierId: integer("eier_id").notNull(),
  tittel: text("tittel").notNull(),
  type: text("type").notNull(),
  adresse: text("adresse").notNull(),
  by: text("by").notNull(),
  postnummer: text("postnummer").notNull(),
  breddegrad: real("breddegrad").notNull(),
  lengdegrad: real("lengdegrad").notNull(),
  beskrivelse: text("beskrivelse"),
  fasiliteter: text("fasiliteter").array().notNull().default([]),
  erAktiv: boolean("er_aktiv").notNull().default(true),
  erGodkjent: boolean("er_godkjent").notNull().default(false),
  prisModell: text("pris_modell").notNull().default("fri"),
  smartPrisBydel: text("smart_pris_bydel"),
  tilbyrAbonnement: boolean("tilbyr_abonnement").notNull().default(false),
  abonnementsPris: real("abonnements_pris"),
  minBindingstid: integer("min_bindingstid"),
  bildeSti: text("bilde_sti"),
  currentStatus: text("current_status").notNull().default("available"),
  autoApproval: boolean("auto_approval").notNull().default(true),
  // Camping / bobil fields
  antallPlasser: integer("antall_plasser"),
  maksLengde: text("maks_lengde"),
  stromAmp: text("strom_amp"),
  vannTilkobling: boolean("vann_tilkobling").notNull().default(false),
  tommestasjon: boolean("tommestasjon").notNull().default(false),
  overnattingTillatt: boolean("overnatting_tillatt").notNull().default(false),
  lavsesonPris: real("lavseson_pris"),
  hoysesonPris: real("hoyseson_pris"),
  antallBilder: integer("antall_bilder").notNull().default(0),
  harUnloc: boolean("har_unloc").notNull().default(false),
  unlocLockId: text("unloc_lock_id"),
  harTelemetrics: boolean("har_telemetrics").notNull().default(false),
  telemetricsPortId: text("telemetrics_port_id"),
  // Borettslag
  borettslagId: integer("borettslag_id"),
  kunBeboere: boolean("kun_beboere").notNull().default(false),
  // Natteparkering
  erNatteparkering: boolean("er_natteparkering").notNull().default(false),
  nattPrisHelgTillegg: real("natt_pris_helg_tillegg"),
  // Helgeparkering
  helgeMode: boolean("helge_mode").notNull().default(false),
  helgePris: real("helge_pris"),
  // Arrangementsmodus
  arrangementModus: boolean("arrangement_modus").notNull().default(false),
  arrangementPris: real("arrangement_pris"),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const pricesTable = pgTable("prices", {
  id: serial("id").primaryKey(),
  plassId: integer("plass_id").notNull(),
  periode: text("periode").notNull(),
  belop: real("belop").notNull(),
});

export const insertSpaceSchema = createInsertSchema(spacesTable).omit({ id: true, opprettetDato: true });
export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type Space = typeof spacesTable.$inferSelect;

export const insertPriceSchema = createInsertSchema(pricesTable).omit({ id: true });
export type InsertPrice = z.infer<typeof insertPriceSchema>;
export type Price = typeof pricesTable.$inferSelect;
