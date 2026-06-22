import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subscriptionsTable = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  plassId: integer("plass_id").notNull(),
  leietakerId: integer("leietaker_id").notNull(),
  startDato: timestamp("start_dato", { withTimezone: true }).notNull(),
  bindingstid: integer("bindingstid").notNull(),
  maanedsPris: real("maaneds_pris").notNull(),
  nesteBetaling: timestamp("neste_betaling", { withTimezone: true }).notNull(),
  status: text("status").notNull().default("aktiv"),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({ id: true, opprettetDato: true });
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
