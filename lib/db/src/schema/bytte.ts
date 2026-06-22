import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const bytteprofilerTable = pgTable("bytteprofiler", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  nåværendeBydel: text("navarende_bydel").notNull(),
  ønsketBydel: text("onsket_bydel").notNull(),
  type: text("type").notNull().default("parkering"),
  beskrivelse: text("beskrivelse"),
  aktiv: boolean("aktiv").notNull().default(true),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const bytteForespørslerTable = pgTable("bytte_foresporsel", {
  id: serial("id").primaryKey(),
  fraUserId: integer("fra_user_id").notNull(),
  tilUserId: integer("til_user_id").notNull(),
  status: text("status").notNull().default("venter"), // venter | akseptert | avslatt
  melding: text("melding"),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
  behandletDato: timestamp("behandlet_dato", { withTimezone: true }),
});

export type BytteProfil = typeof bytteprofilerTable.$inferSelect;
export type BytteForespørsel = typeof bytteForespørslerTable.$inferSelect;
