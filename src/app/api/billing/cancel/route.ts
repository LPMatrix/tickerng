import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userSubscription } from "@/db/schema";
import { eq } from "drizzle-orm";
import { disableSubscription } from "@/lib/paystack";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(userSubscription)
    .where(eq(userSubscription.userId, userId))
    .limit(1);

  if (!sub || sub.status !== "active") {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  if (!sub.paystackSubscriptionCode || !sub.paystackEmailToken) {
    return NextResponse.json({ error: "Subscription details missing" }, { status: 400 });
  }

  try {
    await disableSubscription(sub.paystackSubscriptionCode, sub.paystackEmailToken);

    await db
      .update(userSubscription)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(userSubscription.userId, userId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[billing/cancel]", err);
    return NextResponse.json(
      { error: "We couldn't cancel the subscription right now. Please try again or contact support." },
      { status: 500 }
    );
  }
}
