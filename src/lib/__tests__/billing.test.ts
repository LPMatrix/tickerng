import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB module before importing billing
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db";
import {
  FREE_MONTHLY_VERIFICATIONS,
  getSubscriptionStatus,
  getMonthlyVerificationCount,
  checkVerificationQuota,
} from "../billing";

// Helper to set up the drizzle fluent-query chain mock
function mockDbQuery(returnValue: unknown) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(returnValue),
  };
  vi.mocked(db.select).mockReturnValue(chain as ReturnType<typeof db.select>);
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FREE_MONTHLY_VERIFICATIONS", () => {
  it("is 3", () => {
    expect(FREE_MONTHLY_VERIFICATIONS).toBe(3);
  });
});

describe("getSubscriptionStatus", () => {
  it("returns 'active' when subscription status is active", async () => {
    mockDbQuery([{ status: "active" }]);
    const result = await getSubscriptionStatus("user_active");
    expect(result).toBe("active");
  });

  it("returns 'free' when subscription status is canceled", async () => {
    mockDbQuery([{ status: "canceled" }]);
    const result = await getSubscriptionStatus("user_canceled");
    expect(result).toBe("free");
  });

  it("returns 'free' when no subscription row exists", async () => {
    mockDbQuery([]);
    const result = await getSubscriptionStatus("user_new");
    expect(result).toBe("free");
  });
});

describe("getMonthlyVerificationCount", () => {
  it("returns the count from the DB", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ count: 2 }]),
    };
    vi.mocked(db.select).mockReturnValue(chain as ReturnType<typeof db.select>);

    const result = await getMonthlyVerificationCount("user_123");
    expect(result).toBe(2);
  });

  it("returns 0 when no rows found", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select).mockReturnValue(chain as ReturnType<typeof db.select>);

    const result = await getMonthlyVerificationCount("user_new");
    expect(result).toBe(0);
  });
});

describe("checkVerificationQuota", () => {
  it("allows unlimited use for active subscribers", async () => {
    // First call: getSubscriptionStatus → active
    const statusChain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ status: "active" }]),
    };
    vi.mocked(db.select).mockReturnValue(statusChain as ReturnType<typeof db.select>);

    const result = await checkVerificationQuota("user_pro");
    expect(result.allowed).toBe(true);
    expect(result.plan).toBe("active");
    expect(result.limit).toBe(Infinity);
  });

  it("blocks free user who has used all verifications", async () => {
    let callCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // getSubscriptionStatus
        const chain = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([{ status: "free" }]),
        };
        return chain as ReturnType<typeof db.select>;
      }
      // getMonthlyVerificationCount
      const chain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: FREE_MONTHLY_VERIFICATIONS }]),
      };
      return chain as ReturnType<typeof db.select>;
    });

    const result = await checkVerificationQuota("user_free_exhausted");
    expect(result.allowed).toBe(false);
    expect(result.used).toBe(FREE_MONTHLY_VERIFICATIONS);
    expect(result.plan).toBe("free");
  });

  it("allows free user who has not reached the limit", async () => {
    let callCount = 0;
    vi.mocked(db.select).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        const chain = {
          select: vi.fn().mockReturnThis(),
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };
        return chain as ReturnType<typeof db.select>;
      }
      const chain = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ count: 1 }]),
      };
      return chain as ReturnType<typeof db.select>;
    });

    const result = await checkVerificationQuota("user_free_partial");
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(1);
    expect(result.limit).toBe(FREE_MONTHLY_VERIFICATIONS);
  });
});
