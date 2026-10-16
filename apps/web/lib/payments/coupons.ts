import type { Pack } from "./packs";

// What people type, as stored: upper case, no spaces.
export function normalizeCode(input: unknown) {
  return typeof input === "string" ? input.replace(/\s+/g, "").toUpperCase() : "";
}
export const isCodeShape = (code: string) => /^[A-Z0-9-]{3,32}$/.test(code);

export type CouponRules = {
  percentOff: number;
  appliesTo: "all" | "packs";
  active: boolean;
  expiresAt: Date | null;
  maxRedemptions: number | null;
  perUserLimit: number | null;
};
// Paid (or free) orders already made with the coupon: by everyone, and by this person.
export type CouponUse = { total: number; byUser: number };

export const COUPON_ERRORS = {
  unknown: "That code doesn't work. Check it and try again.",
  expired: "That code has expired.",
  packsOnly: "That code works on packs of 3 or 10, not a single boost.",
  usedUp: "That code has been used up.",
  usedByYou: "You've already used that code as many times as it allows.",
} as const;

// The price of a pack with a code applied (rounded to the paisa), or why the
// code can't be used. Without a coupon it's the plain price.
export function quote(pack: Pack, coupon: CouponRules | null, use: CouponUse = { total: 0, byUser: 0 }, now = Date.now()) {
  if (!coupon) return { ok: true as const, amountPaise: pack.amountPaise, discountPaise: 0 };
  if (!coupon.active) return { ok: false as const, error: COUPON_ERRORS.unknown };
  if (coupon.expiresAt && coupon.expiresAt.getTime() <= now) return { ok: false as const, error: COUPON_ERRORS.expired };
  if (coupon.appliesTo === "packs" && pack.boosts === 1) return { ok: false as const, error: COUPON_ERRORS.packsOnly };
  if (coupon.maxRedemptions !== null && use.total >= coupon.maxRedemptions) return { ok: false as const, error: COUPON_ERRORS.usedUp };
  if (coupon.perUserLimit !== null && use.byUser >= coupon.perUserLimit) return { ok: false as const, error: COUPON_ERRORS.usedByYou };
  const discountPaise = Math.round((pack.amountPaise * coupon.percentOff) / 100);
  return { ok: true as const, amountPaise: pack.amountPaise - discountPaise, discountPaise };
}
