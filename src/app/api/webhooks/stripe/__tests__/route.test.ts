import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB
vi.mock("@/db", () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock billing (getStripe)
vi.mock("@/lib/billing", () => ({
  getStripe: vi.fn(),
}));

import { db } from "@/db";
import { getStripe } from "@/lib/billing";
import { POST } from "../route";

function makeRequest(body: string, signature: string): NextRequest {
  return new NextRequest("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
  });
}

function makeStripeMock(event: object) {
  const insertChain = { values: vi.fn().mockReturnThis(), onConflictDoUpdate: vi.fn().mockResolvedValue(undefined) };
  const updateChain = { set: vi.fn().mockReturnThis(), where: vi.fn().mockResolvedValue(undefined) };
  vi.mocked(db.insert).mockReturnValue(insertChain as ReturnType<typeof db.insert>);
  vi.mocked(db.update).mockReturnValue(updateChain as ReturnType<typeof db.update>);

  vi.mocked(getStripe).mockReturnValue({
    webhooks: {
      constructEvent: vi.fn().mockReturnValue(event),
    },
  } as ReturnType<typeof getStripe>);

  return { insertChain, updateChain };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
});

describe("POST /api/webhooks/stripe", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/stripe", {
      method: "POST",
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when STRIPE_WEBHOOK_SECRET is missing", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const req = makeRequest("{}", "sig_test");
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    vi.mocked(getStripe).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => {
          throw new Error("Signature mismatch");
        }),
      },
    } as ReturnType<typeof getStripe>);

    const req = makeRequest("{}", "bad_sig");
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid signature");
  });

  it("upserts subscription on checkout.session.completed", async () => {
    const { insertChain } = makeStripeMock({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { userId: "user_123" },
          customer: "cus_abc",
          subscription: "sub_xyz",
        },
      },
    });

    const req = makeRequest("{}", "sig_ok");
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(db.insert).toHaveBeenCalled();
    expect(insertChain.onConflictDoUpdate).toHaveBeenCalled();
  });

  it("skips upsert on checkout.session.completed when userId is missing", async () => {
    makeStripeMock({
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {},
          customer: "cus_abc",
          subscription: "sub_xyz",
        },
      },
    });

    const req = makeRequest("{}", "sig_ok");
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("updates status on customer.subscription.updated", async () => {
    const { updateChain } = makeStripeMock({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_xyz",
          status: "active",
          billing_cycle_anchor: 1700000000,
        },
      },
    });

    const req = makeRequest("{}", "sig_ok");
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "active" })
    );
  });

  it("marks subscription canceled on customer.subscription.deleted", async () => {
    const { updateChain } = makeStripeMock({
      type: "customer.subscription.deleted",
      data: {
        object: { id: "sub_xyz", status: "canceled" },
      },
    });

    const req = makeRequest("{}", "sig_ok");
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(db.update).toHaveBeenCalled();
    expect(updateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "canceled" })
    );
  });

  it("returns 200 for unhandled event types without touching DB", async () => {
    makeStripeMock({
      type: "payment_intent.created",
      data: { object: {} },
    });

    const req = makeRequest("{}", "sig_ok");
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });
});
