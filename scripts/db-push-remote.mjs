#!/usr/bin/env node
/**
 * Runs `drizzle-kit push` against Turso using the same env loading as Next.js
 * (.env.local, .env). Plain `npm run db:push` does not load .env.local, so without
 * this script Drizzle often targets local SQLite instead of remote.
 */
import nextEnv from "@next/env";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

nextEnv.loadEnvConfig(root, true);

if (!process.env.TURSO_DATABASE_URL?.trim()) {
  console.error(
    "[db:push:remote] TURSO_DATABASE_URL is missing. Add it (and TURSO_AUTH_TOKEN) to .env.local, then run:\n  npm run db:push:remote"
  );
  process.exit(1);
}

const child = spawn("npx", ["drizzle-kit", "push"], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env },
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});
