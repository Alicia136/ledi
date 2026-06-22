import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const kalenderIntegrasjonerTable = pgTable("kalender_integrasjoner", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  plassId: integer("plass_id"),
  provider: text("provider").notNull(),
  accountEmail: text("account_email"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  sistSynkronisert: timestamp("sist_synkronisert", { withTimezone: true }),
  status: text("status").notNull().default("aktiv"),
  demoModus: boolean("demo_modus").notNull().default(true),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export type KalenderIntegrasjon = typeof kalenderIntegrasjonerTable.$inferSelect;
