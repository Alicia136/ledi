import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export async function runMigrations(): Promise<void> {
  // When bundled into artifacts/api-server/dist/index.mjs, __dirname is
  // .../artifacts/api-server/dist — go up 3 levels to reach workspace root.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const migrationsFolder = path.resolve(__dirname, "../../../lib/db/migrations");
  try {
    await migrate(db, { migrationsFolder });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("already exists")) return;
    throw err;
  }
}

export * from "./schema";
