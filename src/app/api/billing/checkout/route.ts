import { type NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { initializeTransaction } from "@/lib/paystack";

const PLAN_CODE = process.env.PAYSTACK_PLAN_CODE;
// 10,000 NGN in kobo
const AMOUNT = 1_000_000;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!PLAN_CODE) {
    console.error("[billing/checkout] Paystack plan code is not configured");
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please try again later or contact support." },
      { status: 503 }
    );
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json({ error: "No email address on account" }, { status: 400 });
    }

    const callbackUrl = new URL("/api/billing/callback", request.nextUrl.origin).toString();

    const tx = await initializeTransaction({
      email,
      amount: AMOUNT,
      plan: PLAN_CODE,
      callback_url: callbackUrl,
      metadata: { userId },
    });

    return NextResponse.json({ url: tx.authorization_url });
  } catch (err) {
    console.error("[billing/checkout]", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again. If it keeps happening, contact support." },
      { status: 500 }
    );
  }
}
