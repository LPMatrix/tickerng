import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/** Research reports saved after stream completion. userId is a Clerk user ID. */
export const report = sqliteTable("report", {
  id: text("id").primaryKey(),
  userId: text("userId").notNull(),
  mode: text("mode").notNull(), // "discovery" | "verification"
  query: text("query").notNull(),
  content: text("content").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  /** Set when the user deletes a report (row retained for audit / quota accuracy). */
  deletedAt: integer("deletedAt", { mode: "timestamp_ms" }),
});

/** Paystack subscription record keyed by Clerk user ID. */
export const userSubscription = sqliteTable("userSubscription", {
  userId: text("userId").primaryKey(),
  paystackCustomerCode: text("paystackCustomerCode"),
  paystackSubscriptionCode: text("paystackSubscriptionCode"),
  paystackEmailToken: text("paystackEmailToken"),
  status: text("status").notNull().default("free"), // "free" | "active" | "cancelled"
  currentPeriodEnd: integer("currentPeriodEnd", { mode: "timestamp_ms" }),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

/** Share tokens for read-only report links. Token is secret; optional expiry and revocable. */
export const reportShare = sqliteTable("reportShare", {
  id: text("id").primaryKey(),
  reportId: text("reportId")
    .notNull()
    .references(() => report.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expiresAt", { mode: "timestamp_ms" }),
  revoked: integer("revoked", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});
