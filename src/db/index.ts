import { drizzle } from "drizzle-orm/libsql";
import { createClient, type Config } from "@libsql/client";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const globalForDb = globalThis as unknown as { libsqlClient?: ReturnType<typeof createClient> };

/**
 * - Production / preview: set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in Vercel.
 * - Local: omit Turso env vars; uses a file under `./data` (or `DATABASE_PATH` as a filesystem path).
 */
function createClientConfig(): Config {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();
  if (tursoUrl) {
    return {
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim(),
    };
  }
  const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "tickerng.db");
  const abs = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);
  const dir = path.dirname(abs);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return { url: `file:${abs}` };
}

function getClient(): ReturnType<typeof createClient> {
  if (!globalForDb.libsqlClient) {
    globalForDb.libsqlClient = createClient(createClientConfig());
  }
  return globalForDb.libsqlClient;
}

export const db = drizzle(getClient(), { schema });
