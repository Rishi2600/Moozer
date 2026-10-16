"use server";

import { refresh } from "next/cache";

import { TOO_MANY_TRIES, userKey } from "@/lib/join-limit";
import { priceFor, redeemFree, settlePaid, startPurchase } from "@/lib/payments/orders";
import { razorpayConfig } from "@/lib/payments/razorpay";
import { checkoutSignatureValid } from "@/lib/payments/signatures";
import { failureLimiter } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";

// Guessing codes: 10 wrong ones per 10 minutes per person.
const codeLimit = failureLimiter({ max: 10, windowMs: 10 * 60_000 });

// What a pack costs, with a code if one was typed ("Apply").
export async function priceAction(packId: string, code?: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  const key = userKey(session.user.id);
  if (code && codeLimit.blocked(key)) return { ok: false as const, ...TOO_MANY_TRIES };
  const price = await priceFor(session.user.id, packId, code);
  if (!price.ok) {
    if ("badCode" in price) codeLimit.fail(key);
    return { ok: false as const, error: price.error };
  }
  return { ok: true as const, amountPaise: price.amountPaise, discountPaise: price.discountPaise, code: price.code };
}

// Get a pack for free with a 100% code.
export async function redeemAction(packId: string, code: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  const key = userKey(session.user.id);
  if (codeLimit.blocked(key)) return { ok: false as const, ...TOO_MANY_TRIES };
  const result = await redeemFree(session.user.id, packId, code);
  if (!result.ok) {
    if ("badCode" in result) codeLimit.fail(key);
    return { ok: false as const, error: result.error };
  }
  refresh();
  return { ok: true as const, boosts: result.boosts };
}

// Paying: makes the order and returns what Checkout needs to open.
export async function startPurchaseAction(packId: string, code?: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  try {
    const started = await startPurchase(session.user.id, packId, code);
    if (!started.ok) return { ok: false as const, error: started.error };
    return { ...started, name: session.user.name, email: session.user.email };
  } catch (error) {
    console.error("razorpay: couldn't start a purchase", error);
    return { ok: false as const, error: "Couldn't reach the payment service. Try again in a moment." };
  }
}

// Checkout's success callback: check Razorpay's signature, then credit. If
// this never arrives (closed tab, dropped page), the webhook does the same.
export async function confirmPurchaseAction(paid: { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string }) {
  const session = await getSession();
  const config = razorpayConfig();
  const later = "We couldn't confirm the payment here. If money was taken, your boosts will appear by themselves within a few minutes.";
  if (!session || !config || !paid.razorpay_order_id || !paid.razorpay_payment_id) return { ok: false as const, error: later };
  if (!checkoutSignatureValid(paid.razorpay_order_id, paid.razorpay_payment_id, paid.razorpay_signature, config.keySecret)) {
    console.warn("razorpay: checkout signature didn't match", paid.razorpay_order_id);
    return { ok: false as const, error: later };
  }
  const result = await settlePaid({ providerOrderId: paid.razorpay_order_id, providerPaymentId: paid.razorpay_payment_id, userId: session.user.id });
  if (result.status === "unknown") return { ok: false as const, error: later };
  refresh();
  return { ok: true as const, boosts: result.boosts };
}
