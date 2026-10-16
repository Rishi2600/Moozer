"use server";

import { refresh } from "next/cache";

import { TOO_MANY_TRIES, userKey } from "@/lib/join-limit";
import { priceFor, redeemFree } from "@/lib/payments/orders";
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
