import "server-only";

import { Prisma, prisma } from "@moozer/db";

import { randomUUID } from "node:crypto";

import { creditWallet, reverseWallet } from "@/lib/boosts/wallet";

import { COUPON_ERRORS, isCodeShape, normalizeCode, quote } from "./coupons";
import { findPack } from "./packs";
import { createRazorpayOrder, razorpayConfig } from "./razorpay";

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
  if (!code) return { ...quote(pack, null), pack, code: null, couponId: null };
  const coupon = await findCoupon(prisma, code);
  if (!coupon) return { ok: false as const, error: COUPON_ERRORS.unknown, badCode: true };
  const result = quote(pack, coupon, await couponUse(prisma, coupon.id, userId));
  return result.ok ? { ...result, pack, code: coupon.code, couponId: coupon.id } : { ...result, badCode: true };
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

// Paying: our order and a Razorpay order for the amount, made before Checkout
// opens. Our order id doubles as Razorpay's "receipt".
export async function startPurchase(userId: string, packId: unknown, code?: unknown) {
  const config = razorpayConfig();
  if (!config) return { ok: false as const, error: "Buying boosts isn't switched on yet." };
  const price = await priceFor(userId, packId, code);
  if (!price.ok) return price;
  if (price.amountPaise === 0) return { ok: false as const, error: "That code makes it free. Use the Get … free button instead." };
  const id = randomUUID();
  const razorpay = await createRazorpayOrder(config, { amountPaise: price.amountPaise, receipt: id, notes: { pack: price.pack.id, userId } });
  await prisma.paymentOrder.create({
    data: {
      id,
      userId,
      provider: "razorpay",
      providerOrderId: razorpay.id,
      pack: price.pack.id,
      boosts: price.pack.boosts,
      amountPaise: price.amountPaise,
      couponId: price.couponId,
    },
  });
  return { ok: true as const, keyId: config.keyId, orderId: razorpay.id, amountPaise: price.amountPaise, boosts: price.pack.boosts };
}

// Locks an order row by a Razorpay id, so the browser and the webhook can't
// settle the same order at the same moment.
async function lockOrder(tx: Prisma.TransactionClient, by: { providerOrderId: string } | { providerPaymentId: string }) {
  const rows =
    "providerOrderId" in by
      ? await tx.$queryRaw<{ id: string }[]>`SELECT id FROM payment_order WHERE "providerOrderId" = ${by.providerOrderId} FOR UPDATE`
      : await tx.$queryRaw<{ id: string }[]>`SELECT id FROM payment_order WHERE "providerPaymentId" = ${by.providerPaymentId} FOR UPDATE`;
  return rows[0] ? tx.paymentOrder.findUniqueOrThrow({ where: { id: rows[0].id } }) : null;
}

// A payment went through: mark the order paid and credit the boosts, once.
// Called by the browser (after checking Checkout's signature, with its user)
// and by the webhook (with the amount Razorpay says it took), in either order.
export async function settlePaid(paid: { providerOrderId: string; providerPaymentId: string; userId?: string; amountPaise?: number; currency?: string }) {
  return prisma.$transaction(async (tx) => {
    const order = await lockOrder(tx, { providerOrderId: paid.providerOrderId });
    if (!order || order.provider !== "razorpay" || (paid.userId && order.userId !== paid.userId)) return { status: "unknown" as const };
    if (order.status === "paid" || order.status === "refunded") return { status: "already" as const, boosts: order.boosts };
    if (paid.amountPaise !== undefined && (paid.amountPaise !== order.amountPaise || paid.currency !== order.currency)) {
      return { status: "mismatch" as const };
    }
    await tx.paymentOrder.update({ where: { id: order.id }, data: { status: "paid", paidAt: new Date(), providerPaymentId: paid.providerPaymentId } });
    if (order.userId) await creditWallet(tx, { userId: order.userId, boosts: order.boosts, reason: "purchase", orderId: order.id });
    return { status: "credited" as const, boosts: order.boosts };
  });
}

// A payment attempt failed. The order stays open: Checkout lets people retry
// with another method, and a later success still settles it.
export async function settleFailed(providerOrderId: string) {
  await prisma.paymentOrder.updateMany({ where: { providerOrderId, status: "created" }, data: { status: "failed" } });
}

// Money went back (done by hand from the Razorpay dashboard). A full refund
// marks the order refunded and takes its boosts back; a partial one is left
// for a person to sort out.
export async function settleRefunded(refund: { providerPaymentId: string; amountPaise: number; refundedPaise: number }) {
  if (refund.refundedPaise < refund.amountPaise) return { status: "partial" as const };
  return prisma.$transaction(async (tx) => {
    const order = await lockOrder(tx, { providerPaymentId: refund.providerPaymentId });
    if (!order || order.status !== "paid") return { status: "skipped" as const };
    await tx.paymentOrder.update({ where: { id: order.id }, data: { status: "refunded" } });
    if (order.userId) await reverseWallet(tx, { userId: order.userId, boosts: order.boosts, orderId: order.id });
    return { status: "reversed" as const };
  });
}
