import { type NextRequest, NextResponse } from "next/server";
import { verifyTransaction } from "@/lib/paystack";
import { db } from "@/db";
import { userSubscription } from "@/db/schema";

export async function GET(request: NextRequest) {
  const reference = request.nextUrl.searchParams.get("reference");
  const origin = request.nextUrl.origin;

  if (!reference) {
    return NextResponse.redirect(new URL("/research", origin));
  }

  try {
    const tx = await verifyTransaction(reference);
    const userId = tx.metadata?.userId as string | undefined;

    if (tx.status === "success" && userId) {
      await db
        .insert(userSubscription)
        .values({
          userId,
          paystackCustomerCode: tx.customer.customer_code,
          paystackSubscriptionCode: tx.subscription?.subscription_code ?? null,
          paystackEmailToken: tx.subscription?.email_token ?? null,
          status: "active",
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userSubscription.userId,
          set: {
            paystackCustomerCode: tx.customer.customer_code,
            paystackSubscriptionCode: tx.subscription?.subscription_code ?? null,
            paystackEmailToken: tx.subscription?.email_token ?? null,
            status: "active",
            updatedAt: new Date(),
          },
        });
    }
  } catch (err) {
    console.error("[billing/callback] verify failed:", err);
  }

  return NextResponse.redirect(new URL("/research", origin));
}
