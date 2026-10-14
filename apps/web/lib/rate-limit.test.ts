import { describe, expect, it } from "vitest";

import { failureLimiter } from "./rate-limit";

describe("failureLimiter", () => {
  it("blocks a key after max failures inside the window, then lets it go", () => {
    const limit = failureLimiter({ max: 3, windowMs: 1000 });
    limit.fail("maya", 0);
    limit.fail("maya", 100);
    expect(limit.blocked("maya", 200)).toBe(false);
    limit.fail("maya", 200);
    expect(limit.blocked("maya", 300)).toBe(true);
    expect(limit.blocked("leo", 300)).toBe(false); // keys are separate
    expect(limit.blocked("maya", 1150)).toBe(false); // the first two have aged out
  });
});
