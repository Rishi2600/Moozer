import "server-only";

import { Prisma, prisma } from "@moozer/db";

import { creditWallet } from "@/lib/boosts/wallet";

import { COUPON_ERRORS, isCodeShape, normalizeCode, quote } from "./coupons";
import { findPack } from "./packs";

type Db = Prisma.TransactionClient | typeof prisma;

async function findCoupon(db: Db, input: unknown) {
  const code = normalizeCode(input);
  if (!isCodeShape(code)) return null;
  return db.coupon.findUnique({ where: { code } });
}

// Orders that count against a coupon's limits: every completed one.
async function couponUse(db: Db, couponId: string, userId: string) {
  const counted = { couponId, status: { in: ["paid", "refunded"] as ("paid" | "refunded")[] } };
  const [total, byUser] = await Promise.all([
    db.paymentOrder.count({ where: counted }),
    db.paymentOrder.count({ where: { ...counted, userId } }),
  ]);
  return { total, byUser };
}

// The price a person would pay for a pack, with an optional code.
export async function priceFor(userId: string, packId: unknown, code?: unknown) {
  const pack = findPack(packId);
  if (!pack) return { ok: false as const, error: "Pick one of the options." };
  if (!code) return { ...quote(pack, null), pack, code: null };
  const coupon = await findCoupon(prisma, code);
  if (!coupon) return { ok: false as const, error: COUPON_ERRORS.unknown, badCode: true };
  const result = quote(pack, coupon, await couponUse(prisma, coupon.id, userId));
  return result.ok ? { ...result, pack, code: coupon.code } : { ...result, badCode: true };
}

// A code that makes the pack free: no payment, just a ₹0 order (a record
// like any purchase) and the boosts. Locks the coupon so its limits hold
// even when several people redeem at once.
export async function redeemFree(userId: string, packId: unknown, code: unknown) {
  const pack = findPack(packId);
  if (!pack) return { ok: false as const, error: "Pick one of the options." };
  return prisma.$transaction(async (tx) => {
    const found = await findCoupon(tx, code);
    if (!found) return { ok: false as const, error: COUPON_ERRORS.unknown, badCode: true };
    await tx.$queryRaw`SELECT 1 FROM coupon WHERE id = ${found.id} FOR UPDATE`;
    const coupon = await tx.coupon.findUniqueOrThrow({ where: { id: found.id } }); // as of the lock
    const price = quote(pack, coupon, await couponUse(tx, coupon.id, userId));
    if (!price.ok) return { ...price, badCode: true };
    if (price.amountPaise > 0) return { ok: false as const, error: "This code takes money off, but the rest still needs paying." };
    const order = await tx.paymentOrder.create({
      data: { userId, provider: "coupon", pack: pack.id, boosts: pack.boosts, amountPaise: 0, couponId: coupon.id, status: "paid", paidAt: new Date() },
      select: { id: true },
    });
    await creditWallet(tx, { userId, boosts: pack.boosts, reason: "grant", orderId: order.id });
    return { ok: true as const, boosts: pack.boosts };
  });
}
