import { type NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paystack";
import { db } from "@/db";
import { userSubscription } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const rawBody = await request.text();

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { event: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event: eventType, data } = event;

  if (eventType === "charge.success") {
    const metadata = data.metadata as Record<string, unknown> | undefined;
    const userId = metadata?.userId as string | undefined;
    const customer = data.customer as { customer_code: string } | undefined;
    const subscription = data.subscription as
      | { subscription_code: string; email_token: string }
      | undefined;

    if (userId && customer) {
      await db
        .insert(userSubscription)
        .values({
          userId,
          paystackCustomerCode: customer.customer_code,
          paystackSubscriptionCode: subscription?.subscription_code ?? null,
          paystackEmailToken: subscription?.email_token ?? null,
          status: "active",
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: userSubscription.userId,
          set: {
            paystackCustomerCode: customer.customer_code,
            paystackSubscriptionCode: subscription?.subscription_code ?? null,
            paystackEmailToken: subscription?.email_token ?? null,
            status: "active",
            updatedAt: new Date(),
          },
        });
    }
  }

  if (eventType === "subscription.disable" || eventType === "subscription.not_renew") {
    const subscriptionCode = (data.subscription_code ?? (data as Record<string, unknown>).code) as string | undefined;
    if (subscriptionCode) {
      await db
        .update(userSubscription)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(userSubscription.paystackSubscriptionCode, subscriptionCode));
    }
  }

  return NextResponse.json({ received: true });
}
