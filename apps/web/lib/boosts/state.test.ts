import { describe, expect, it } from "vitest";

import { FREE_REFILL_MS, walletState } from "./state";

const t0 = Date.UTC(2026, 9, 16, 20, 0, 0);
const at = (ms: number) => new Date(t0 + ms);

describe("the boost wallet", () => {
  it("starts with the free boost, written on first use", () => {
    expect(walletState(0, null, t0)).toEqual({ balance: 1, freeHeld: true, refillDue: true, nextFreeAt: null });
  });

  it("holds the free boost after a refill or a refund of it", () => {
    expect(walletState(1, { reason: "refill", at: at(0) }, t0)).toMatchObject({ balance: 1, freeHeld: true, refillDue: false });
    expect(walletState(4, { reason: "refund", at: at(0) }, t0)).toMatchObject({ balance: 4, freeHeld: true });
  });

  it("brings the free boost back five and a half hours after it's used", () => {
    const spent = { reason: "spend" as const, at: at(0) };
    expect(walletState(0, spent, t0 + 60_000)).toEqual({ balance: 0, freeHeld: false, refillDue: false, nextFreeAt: at(FREE_REFILL_MS) });
    expect(walletState(0, spent, t0 + FREE_REFILL_MS)).toMatchObject({ balance: 1, freeHeld: true, refillDue: true });
  });

  it("keeps bought boosts alongside, and never piles up free ones", () => {
    const spent = { reason: "spend" as const, at: at(0) };
    expect(walletState(7, spent, t0 + 1000)).toMatchObject({ balance: 7, freeHeld: false });
    // Days later there's still just one free boost on top of the bought ones.
    expect(walletState(7, spent, t0 + 10 * FREE_REFILL_MS)).toMatchObject({ balance: 8 });
  });

  it("can be below zero after a money refund reversed spent boosts", () => {
    expect(walletState(-2, { reason: "refill", at: at(0) }, t0).balance).toBe(-2);
  });
});
