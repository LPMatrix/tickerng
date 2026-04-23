import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { userSubscription } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/billing";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: import("stripe").Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const now = new Date();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as import("stripe").Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId || !session.customer || !session.subscription) break;

      await db
        .insert(userSubscription)
        .values({
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          status: "active",
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: userSubscription.userId,
          set: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            status: "active",
            updatedAt: now,
          },
        });
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as import("stripe").Stripe.Subscription;
      const status = sub.status === "active" ? "active" : sub.status === "canceled" ? "canceled" : "free";
      const periodEnd = sub.billing_cycle_anchor ? new Date(sub.billing_cycle_anchor * 1000) : undefined;

      await db
        .update(userSubscription)
        .set({
          status,
          currentPeriodEnd: periodEnd,
          updatedAt: now,
        })
        .where(eq(userSubscription.stripeSubscriptionId, sub.id));
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as import("stripe").Stripe.Subscription;

      await db
        .update(userSubscription)
        .set({ status: "canceled", updatedAt: now })
        .where(eq(userSubscription.stripeSubscriptionId, sub.id));
      break;
    }
  }

  return NextResponse.json({ received: true });
}
