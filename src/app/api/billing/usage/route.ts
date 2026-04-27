import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkVerificationQuota, FREE_MONTHLY_VERIFICATIONS } from "@/lib/billing";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const quota = await checkVerificationQuota(userId);

  return NextResponse.json({
    plan: quota.plan,
    used: quota.used,
    limit: quota.plan === "active" ? null : FREE_MONTHLY_VERIFICATIONS,
  });
}
