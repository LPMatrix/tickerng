import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "equiscan.db");
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

export const sqlite = new Database(dbPath);

// Create tables if they don't exist (so app works without running drizzle-kit push)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    emailVerified INTEGER,
    image TEXT,
    password TEXT
  );
  CREATE TABLE IF NOT EXISTS account (
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT
  );
  CREATE TABLE IF NOT EXISTS session (
    sessionToken TEXT PRIMARY KEY NOT NULL,
    userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
    expires INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS verificationToken (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires INTEGER NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
