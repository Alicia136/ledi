import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  navn: text("navn").notNull(),
  epost: text("epost").notNull().unique(),
  passordHash: text("passord_hash").notNull(),
  rolle: text("rolle").notNull().default("leietaker"),
  bankidVerifisert: boolean("bankid_verifisert").notNull().default(false),
  raskSvar: boolean("rask_svar").notNull().default(false),
  vippsNummer: text("vipps_nummer"),
  emailVerifisert: boolean("email_verifisert").notNull().default(false),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  personnummer: text("personnummer"),
  kontonummer: text("kontonummer"),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, opprettetDato: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
