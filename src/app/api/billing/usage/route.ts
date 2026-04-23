import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMonthlyVerificationCount, FREE_MONTHLY_VERIFICATIONS, PRO_PLAN_SLUG } from "@/lib/billing";

export async function GET() {
  const { userId, has } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isPro = has({ plan: PRO_PLAN_SLUG });
  if (isPro) {
    return NextResponse.json({ plan: "pro", used: 0, limit: null });
  }

  const used = await getMonthlyVerificationCount(userId);
  return NextResponse.json({ plan: "free", used, limit: FREE_MONTHLY_VERIFICATIONS });
}
