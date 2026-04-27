import { db } from "@/db";
import { report as reportTable, userSubscription as subscriptionTable } from "@/db/schema";
import { eq, and, gte, count } from "drizzle-orm";

export const FREE_MONTHLY_VERIFICATIONS = 3;

export async function getSubscriptionStatus(userId: string): Promise<"free" | "active"> {
  const [sub] = await db
    .select({ status: subscriptionTable.status })
    .from(subscriptionTable)
    .where(eq(subscriptionTable.userId, userId))
    .limit(1);
  return sub?.status === "active" ? "active" : "free";
}

export async function getMonthlyVerificationCount(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ count: count() })
    .from(reportTable)
    .where(
      and(
        eq(reportTable.userId, userId),
        eq(reportTable.mode, "verification"),
        gte(reportTable.createdAt, startOfMonth)
      )
    );
  return row?.count ?? 0;
}

export async function checkVerificationQuota(
  userId: string
): Promise<{ allowed: boolean; used: number; limit: number; plan: "free" | "active" }> {
  const plan = await getSubscriptionStatus(userId);
  if (plan === "active") {
    return { allowed: true, used: 0, limit: Infinity, plan };
  }
  const used = await getMonthlyVerificationCount(userId);
  return {
    allowed: used < FREE_MONTHLY_VERIFICATIONS,
    used,
    limit: FREE_MONTHLY_VERIFICATIONS,
    plan,
  };
}
