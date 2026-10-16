import "server-only";

import { Prisma, prisma, type RefundCause } from "@moozer/db";

import { BOOST_UNDO_MS } from "@/lib/queue/boost";

import { walletState } from "./state";

// The only code that reads or changes boost balances (the refund trigger in
// the database aside). Changes take a lock per person, so two tabs, in one
// space or several, can never spend the same boost.
type Db = Prisma.TransactionClient | typeof prisma;

async function lockWallet(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`wallet:${userId}`}))`;
}

async function load(db: Db, userId: string) {
  const [sum, lastFree] = await Promise.all([
    db.boostLedger.aggregate({ where: { userId }, _sum: { delta: true } }),
    db.boostLedger.findFirst({
      where: { userId, OR: [{ reason: "refill" }, { usedFree: true }] },
      orderBy: { seq: "desc" },
      select: { reason: true, createdAt: true },
    }),
  ]);
  const event = lastFree && { reason: lastFree.reason as "refill" | "spend" | "refund", at: lastFree.createdAt };
  return walletState(sum._sum.delta ?? 0, event);
}

// Read-only: what the header shows ("4 boosts · next free one at 23:40").
export async function getWallet(userId: string) {
  const { balance, nextFreeAt } = await load(prisma, userId);
  return { balance, nextFreeAt };
}

// Why boosts deleted in this transaction are refunded; the trigger records it.
// Without one, a deleted boost counts as its song being removed.
export async function setRefundCause(tx: Prisma.TransactionClient, cause: RefundCause) {
  await tx.$queryRaw`SELECT set_config('moozer.refund_cause', ${cause}, true)`;
}

// One boost (+3 votes) on a queued song in a space the person is in. Uses the
// free one first; otherwise a bought one.
export async function spendBoost(userId: string, itemId: string) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.queueItem.findFirst({
      where: { id: itemId, status: "queued", space: { status: { not: "ended" }, members: { some: { userId } } } },
      select: { id: true, spaceId: true, title: true },
    });
    if (!item) return { status: "gone" as const };
    await lockWallet(tx, userId);
    const wallet = await load(tx, userId);
    if (wallet.refillDue) await tx.boostLedger.create({ data: { userId, delta: 1, reason: "refill" } });
    if (wallet.balance < 1) return { status: "empty" as const, nextFreeAt: wallet.nextFreeAt };
    const boost = await tx.boost.create({ data: { spaceId: item.spaceId, userId, queueItemId: item.id }, select: { id: true } });
    await tx.boostLedger.create({
      data: { userId, delta: -1, reason: "spend", usedFree: wallet.freeHeld, boostId: boost.id, spaceId: item.spaceId, songTitle: item.title },
    });
    return { status: "boosted" as const, id: boost.id };
  });
}

// Adds bought or given boosts, from an order (once: the ledger refuses a
// second credit for the same order).
export async function creditWallet(
  tx: Prisma.TransactionClient,
  credit: { userId: string; boosts: number; reason: "purchase" | "grant"; orderId: string }
) {
  await lockWallet(tx, credit.userId);
  await tx.boostLedger.create({ data: { userId: credit.userId, delta: credit.boosts, reason: credit.reason, orderId: credit.orderId } });
}

// Undo from the toast: within a minute, while the song is still queued. The
// trigger puts the boost back exactly as it was spent.
export async function undoBoost(boostId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    await setRefundCause(tx, "undo");
    const { count } = await tx.boost.deleteMany({
      where: { id: boostId, userId, createdAt: { gt: new Date(Date.now() - BOOST_UNDO_MS) }, queueItem: { status: "queued" } },
    });
    return count === 1;
  });
}
