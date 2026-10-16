import { describe, expect, it } from "vitest";

import { describeEntry } from "./describe";

const base = { cause: null, songTitle: "Despacito", space: { name: "Friday at the studio" }, order: null };

describe("boost history lines", () => {
  it("say what was bought or given", () => {
    const order = { provider: "razorpay" as const, amountPaise: 12900, boosts: 10, coupon: null };
    expect(describeEntry({ ...base, reason: "purchase", delta: 10, order })).toBe("Bought 10 boosts · ₹129");
    expect(describeEntry({ ...base, reason: "grant", delta: 3, order: { ...order, provider: "coupon", amountPaise: 0, boosts: 3, coupon: { code: "FREELOADER" } } })).toBe(
      "3 boosts with the code FREELOADER"
    );
    expect(describeEntry({ ...base, reason: "grant", delta: 1, order: null })).toBe("1 boost from Moozer");
    expect(describeEntry({ ...base, reason: "refill", delta: 1 })).toBe("Free boost added");
  });

  it("say where a boost went and why it came back", () => {
    expect(describeEntry({ ...base, reason: "spend", delta: -1 })).toBe("Boosted Despacito in Friday at the studio");
    expect(describeEntry({ ...base, reason: "refund", delta: 1, cause: "undo" })).toBe("Undid the boost on Despacito");
    expect(describeEntry({ ...base, reason: "refund", delta: 1, cause: "song_removed" })).toBe("Despacito was removed in Friday at the studio");
    expect(describeEntry({ ...base, reason: "refund", delta: 1, cause: "space_ended" })).toBe("Friday at the studio ended before Despacito played");
    expect(describeEntry({ ...base, reason: "refund", delta: 1, cause: "unplayable" })).toBe("Despacito couldn't play on YouTube");
  });

  it("cope with a space or song that's gone", () => {
    expect(describeEntry({ ...base, reason: "refund", delta: 1, cause: "space_ended", space: null, songTitle: null })).toBe("The space ended before a song played");
  });
});
