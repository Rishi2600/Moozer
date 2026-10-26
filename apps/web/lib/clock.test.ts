import { describe, expect, it } from "vitest";

import { bestSample, clockSample, nextOffset } from "./clock";

describe("clock", () => {
  it("works out the offset from one ping", () => {
    // Sent at 1000, back at 1100: the server read 3050 halfway, at 1050.
    expect(clockSample(1000, 3050, 1100)).toEqual({ offset: 2000, rtt: 100 });
  });

  it("trusts the quickest round trip", () => {
    const samples = [clockSample(0, 500, 400), clockSample(0, 60, 40), clockSample(0, 300, 200)];
    expect(bestSample(samples)).toEqual({ offset: 40, rtt: 40 });
    expect(bestSample([])).toBeNull();
  });

  it("smooths small changes and takes big jumps at once", () => {
    expect(nextOffset(null, { offset: 120.4, rtt: 30 })).toBe(120);
    expect(nextOffset(100, { offset: 200, rtt: 30 })).toBe(120);
    expect(nextOffset(100, { offset: 3100, rtt: 30 })).toBe(3100);
  });
});
