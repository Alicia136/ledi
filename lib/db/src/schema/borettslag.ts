import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const borettslagTable = pgTable("borettslag", {
  id: serial("id").primaryKey(),
  navn: text("navn").notNull(),
  orgnummer: text("orgnummer"),
  kontaktEpost: text("kontakt_epost").notNull(),
  bankkontonummer: text("bankkontonummer"),
  adresse: text("adresse").notNull(),
  postnummer: text("postnummer").notNull(),
  by: text("by").notNull(),
  styrelederUserId: integer("styreleder_user_id").notNull(),
  antallLeiligheter: integer("antall_leiligheter"),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const borettslagMedlemmerTable = pgTable("borettslag_medlemmer", {
  id: serial("id").primaryKey(),
  borettslagId: integer("borettslag_id").notNull(),
  userId: integer("user_id"),
  epost: text("epost").notNull(),
  leilighetsnummer: text("leilighetsnummer"),
  erAktiv: boolean("er_aktiv").notNull().default(true),
  lagtTilDato: timestamp("lagt_til_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBorettslagSchema = createInsertSchema(borettslagTable).omit({ id: true, opprettetDato: true });
export type InsertBorettslag = z.infer<typeof insertBorettslagSchema>;
export type Borettslag = typeof borettslagTable.$inferSelect;

export const insertMedlemSchema = createInsertSchema(borettslagMedlemmerTable).omit({ id: true, lagtTilDato: true });
export type InsertMedlem = z.infer<typeof insertMedlemSchema>;
export type BorettslagMedlem = typeof borettslagMedlemmerTable.$inferSelect;
