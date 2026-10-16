import { describe, expect, it } from "vitest";

import { COUPON_ERRORS, isCodeShape, normalizeCode, quote, type CouponRules } from "./coupons";
import { findPack, formatRupees } from "./packs";

const single = findPack("single")!;
const ten = findPack("ten")!;
const team: CouponRules = { percentOff: 100, appliesTo: "all", active: true, expiresAt: null, maxRedemptions: null, perUserLimit: null };
const creator: CouponRules = { ...team, percentOff: 30, appliesTo: "packs" };

describe("prices", () => {
  it("are the plan's prices without a code", () => {
    expect(quote(single, null)).toEqual({ ok: true, amountPaise: 2900, discountPaise: 0 });
    expect(formatRupees(findPack("trio")!.amountPaise)).toBe("₹49");
    expect(formatRupees(ten.amountPaise)).toBe("₹129");
  });

  it("make anything free with a 100% code", () => {
    expect(quote(ten, team)).toEqual({ ok: true, amountPaise: 0, discountPaise: 12900 });
    expect(quote(single, team)).toMatchObject({ ok: true, amountPaise: 0 });
  });

  it("take 30% off packs, rounded to the paisa", () => {
    expect(quote(findPack("trio")!, creator)).toEqual({ ok: true, amountPaise: 3430, discountPaise: 1470 });
    expect(formatRupees(3430)).toBe("₹34.30");
    expect(quote(single, creator)).toEqual({ ok: false, error: COUPON_ERRORS.packsOnly });
  });
});

describe("codes", () => {
  it("are read without spaces, in upper case", () => {
    expect(normalizeCode(" free loader ")).toBe("FREELOADER");
    expect(normalizeCode(42)).toBe("");
    expect(isCodeShape("FREELOADER")).toBe(true);
    expect(isCodeShape("NO")).toBe(false);
    expect(isCodeShape("DROP;TABLE")).toBe(false);
  });

  it("stop working when off, expired or used up", () => {
    const now = Date.UTC(2026, 9, 16);
    expect(quote(ten, { ...team, active: false })).toEqual({ ok: false, error: COUPON_ERRORS.unknown });
    expect(quote(ten, { ...team, expiresAt: new Date(now - 1) }, undefined, now)).toEqual({ ok: false, error: COUPON_ERRORS.expired });
    expect(quote(ten, { ...team, maxRedemptions: 5 }, { total: 5, byUser: 0 })).toEqual({ ok: false, error: COUPON_ERRORS.usedUp });
    expect(quote(ten, { ...team, perUserLimit: 1 }, { total: 1, byUser: 1 })).toEqual({ ok: false, error: COUPON_ERRORS.usedByYou });
    expect(quote(ten, { ...team, perUserLimit: 2 }, { total: 9, byUser: 1 })).toMatchObject({ ok: true });
  });
});
