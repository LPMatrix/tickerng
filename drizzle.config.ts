import { defineConfig } from "drizzle-kit";
import path from "path";

const isTurso = Boolean(process.env.TURSO_DATABASE_URL?.trim());
const defaultLocal = path.join(process.cwd(), "data", "tickerng.db");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isTurso ? "turso" : "sqlite",
  dbCredentials: isTurso
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: process.env.DATABASE_PATH?.startsWith("file:")
          ? process.env.DATABASE_PATH
          : `file:${path.resolve(process.env.DATABASE_PATH ?? defaultLocal)}`,
      },
});
