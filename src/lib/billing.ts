import { db } from "@/db";
import { report as reportTable } from "@/db/schema";
import { eq, and, gte, count } from "drizzle-orm";

export const FREE_MONTHLY_VERIFICATIONS = 3;

// Plan slug must match the slug defined in your Clerk dashboard
export const PRO_PLAN_SLUG = "pro";

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
