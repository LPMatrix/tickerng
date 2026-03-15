import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Auth.js tables for Drizzle SQLite adapter.
 * Optional password column on user for Credentials provider.
 */
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
  password: text("password"), // hashed; for credentials provider only
});

export const account = sqliteTable("account", {
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const session = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationToken = sqliteTable("verificationToken", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

/** Persisted research reports (streamed content saved after completion). */
export const report = sqliteTable("report", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  mode: text("mode").notNull(), // "discovery" | "verification"
  query: text("query").notNull(),
  content: text("content").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});
