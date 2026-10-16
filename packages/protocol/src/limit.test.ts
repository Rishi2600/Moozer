import { describe, expect, it } from "vitest";

import { Bucket } from "./limit";

describe("Bucket", () => {
  it("allows a burst, then refills steadily", () => {
    const bucket = new Bucket(3, 2, 0);
    expect([bucket.take(0), bucket.take(0), bucket.take(0), bucket.take(0)]).toEqual([true, true, true, false]);
    expect(bucket.take(250)).toBe(false); // half a token back
    expect(bucket.take(500)).toBe(true);
  });

  it("never saves up more than the burst", () => {
    const bucket = new Bucket(2, 1, 0);
    const later = 60_000;
    expect([bucket.take(later), bucket.take(later), bucket.take(later)]).toEqual([true, true, false]);
  });
});
