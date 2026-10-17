import { describe, expect, it } from "vitest";

import { cleanQuery, dailyBudget, quotaDay } from "./search-rules";

describe("search queries", () => {
  it("are tidied and keyed case-insensitively", () => {
    expect(cleanQuery("  Despacito   Remix ")).toEqual({ text: "Despacito Remix", key: "despacito remix" });
  });

  it("must be 2 to 100 characters", () => {
    expect(cleanQuery("a")).toBeNull();
    expect(cleanQuery("x".repeat(101))).toBeNull();
    expect(cleanQuery(42)).toBeNull();
  });
});

describe("the daily search budget", () => {
  // 2026-10-17 at 06:59 UTC is 23:59 on the 16th in California (PDT, UTC-7).
  const lateOn16th = Date.UTC(2026, 9, 17, 6, 59);
  const earlyOn17th = Date.UTC(2026, 9, 17, 7, 1);

  it("counts by YouTube's day, which starts at midnight Pacific", () => {
    expect(quotaDay(lateOn16th)).toBe("2026-10-16");
    expect(quotaDay(earlyOn17th)).toBe("2026-10-17");
  });

  it("stops at the limit and starts again the next Pacific day", () => {
    const budget = dailyBudget(2);
    expect([budget.take(lateOn16th), budget.take(lateOn16th), budget.take(lateOn16th)]).toEqual([true, true, false]);
    expect(budget.left(lateOn16th)).toBe(0);
    expect(budget.take(earlyOn17th)).toBe(true);
    expect(budget.left(earlyOn17th)).toBe(1);
  });
});
