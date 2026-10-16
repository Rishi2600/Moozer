// The free boost comes back 5.5 hours after it's used. Only one is ever held.
export const FREE_REFILL_MS = 5.5 * 60 * 60 * 1000;

// The latest wallet row that touched the free boost: a refill (it's back), a
// spend that used it, or the refund of such a spend (it's back again).
export type FreeEvent = { reason: "refill" | "spend" | "refund"; at: Date };

// A person's boosts from their ledger: the sum of every row, plus the free
// one if it's due but not written yet (refillDue: the next spend writes it).
// nextFreeAt is when the free one returns, while it's out.
export function walletState(sum: number, lastFree: FreeEvent | null, now = Date.now()) {
  if (lastFree && lastFree.reason !== "spend") return { balance: sum, freeHeld: true, refillDue: false, nextFreeAt: null };
  const backAt = lastFree ? lastFree.at.getTime() + FREE_REFILL_MS : now; // a new wallet starts with one
  if (backAt <= now) return { balance: sum + 1, freeHeld: true, refillDue: true, nextFreeAt: null };
  return { balance: sum, freeHeld: false, refillDue: false, nextFreeAt: new Date(backAt) };
}
