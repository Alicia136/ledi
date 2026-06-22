import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";

export const lanseringslisteTable = pgTable("lanseringsliste", {
  id: serial("id").primaryKey(),
  epost: varchar("epost", { length: 255 }).notNull().unique(),
  opprettetDato: timestamp("opprettet_dato", { withTimezone: true }).notNull().defaultNow(),
});

export type Lanseringsliste = typeof lanseringslisteTable.$inferSelect;
