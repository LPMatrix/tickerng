import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from "@/db";
import {
  FREE_MONTHLY_VERIFICATIONS,
  PRO_PLAN_SLUG,
  getMonthlyVerificationCount,
} from "../billing";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FREE_MONTHLY_VERIFICATIONS", () => {
  it("is 3", () => {
    expect(FREE_MONTHLY_VERIFICATIONS).toBe(3);
  });
});

describe("PRO_PLAN_SLUG", () => {
  it("is a non-empty string", () => {
    expect(typeof PRO_PLAN_SLUG).toBe("string");
    expect(PRO_PLAN_SLUG.length).toBeGreaterThan(0);
  });
});

describe("getMonthlyVerificationCount", () => {
  it("returns the count from the DB", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ count: 2 }]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await getMonthlyVerificationCount("user_123");
    expect(result).toBe(2);
  });

  it("returns 0 when no rows found", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };
    vi.mocked(db.select).mockReturnValue(chain as unknown as ReturnType<typeof db.select>);

    const result = await getMonthlyVerificationCount("user_new");
    expect(result).toBe(0);
  });
});
