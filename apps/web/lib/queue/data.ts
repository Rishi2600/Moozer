import "server-only";

import { Prisma, prisma } from "@moozer/db";

import type { SongDetails } from "@/lib/songs/lookup";

import { leadMargin, sortQueue } from "./order";

const song = {
  id: true,
  sourceId: true,
  title: true,
  channel: true,
  thumbnailUrl: true,
  durationSeconds: true,
  addedAt: true,
  addedById: true,
  addedBy: { select: { name: true } },
} satisfies Prisma.QueueItemSelect;

// Membership (and liveness) of the caller in a space; null if not a member.
async function access(spaceId: string, userId: string) {
  const member = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
    select: { space: { select: { status: true, hostId: true } } },
  });
  if (!member) return null;
  return { live: member.space.status === "live", isHost: member.space.hostId === userId };
}

export async function getQueue(spaceId: string, userId: string) {
  const [nowPlaying, queued] = await Promise.all([
    prisma.queueItem.findFirst({ where: { spaceId, status: "playing" }, select: { ...song, startedAt: true } }),
    prisma.queueItem.findMany({
      where: { spaceId, status: "queued" },
      select: { ...song, _count: { select: { votes: true } }, votes: { where: { userId }, select: { userId: true } } },
    }),
  ]);
  const queue = sortQueue(
    queued.map(({ _count, votes, ...item }) => ({ ...item, votes: _count.votes, hasVoted: votes.length > 0 }))
  );
  return { nowPlaying, queue, leadBy: leadMargin(queue) };
}

export type QueueView = Awaited<ReturnType<typeof getQueue>>;

// The song already queued (or playing) for this video, if any.
export async function findActiveCopy(spaceId: string, videoId: string, userId?: string) {
  const item = await prisma.queueItem.findFirst({
    where: { spaceId, source: "youtube", sourceId: videoId, status: { in: ["queued", "playing"] } },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      status: true,
      _count: { select: { votes: true } },
      votes: { where: { userId: userId ?? "" }, select: { userId: true } },
    },
  });
  return (
    item && {
      id: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      playing: item.status === "playing",
      votes: item._count.votes,
      hasVoted: item.votes.length > 0,
    }
  );
}

// Adds the song with the adder's vote, unless that video is already in.
export async function addSong(spaceId: string, userId: string, details: SongDetails) {
  const who = await access(spaceId, userId);
  if (!who?.live) return { status: "forbidden" as const };
  const existing = await findActiveCopy(spaceId, details.videoId, userId);
  if (existing) return { status: "duplicate" as const, existing };
  try {
    const item = await prisma.queueItem.create({
      data: {
        spaceId,
        addedById: userId,
        sourceId: details.videoId,
        title: details.title,
        channel: details.channel,
        thumbnailUrl: details.thumbnailUrl,
        durationSeconds: details.durationSeconds,
        votes: { create: { userId } },
      },
      select: { id: true },
    });
    return { status: "added" as const, id: item.id };
  } catch (error) {
    // Someone added the same video a moment ago (partial unique index).
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const copy = await findActiveCopy(spaceId, details.videoId, userId);
      if (copy) return { status: "duplicate" as const, existing: copy };
    }
    throw error;
  }
}

// Sets (rather than toggles) the vote, so a double tap can't undo itself.
export async function setVote(itemId: string, userId: string, voted: boolean) {
  const item = await prisma.queueItem.findFirst({
    where: { id: itemId, status: "queued", space: { status: "live", members: { some: { userId } } } },
    select: { id: true },
  });
  if (!item) return false;
  if (voted) {
    await prisma.vote.upsert({
      where: { queueItemId_userId: { queueItemId: itemId, userId } },
      create: { queueItemId: itemId, userId },
      update: {},
    });
  } else {
    await prisma.vote.deleteMany({ where: { queueItemId: itemId, userId } });
  }
  return true;
}

// The host can remove any queued song; anyone can remove a song they added.
export async function removeSong(itemId: string, userId: string) {
  const { count } = await prisma.queueItem.deleteMany({
    where: {
      id: itemId,
      status: "queued",
      space: { status: "live" },
      OR: [{ addedById: userId }, { space: { hostId: userId } }],
    },
  });
  return count === 1;
}

// Host only. Moves the playing song to History and starts the chosen song
// (or the top of the queue). With nothing queued it just finishes the current one.
export async function playNext(spaceId: string, hostId: string, itemId?: string) {
  return prisma.$transaction(async (tx) => {
    const space = await tx.space.findFirst({ where: { id: spaceId, hostId, status: "live" }, select: { id: true } });
    if (!space) return false;
    const queued = await tx.queueItem.findMany({
      where: { spaceId, status: "queued", ...(itemId ? { id: itemId } : {}) },
      select: { id: true, addedAt: true, _count: { select: { votes: true } } },
    });
    const next = sortQueue(queued.map((q) => ({ id: q.id, addedAt: q.addedAt, votes: q._count.votes })))[0];
    if (itemId && !next) return false;
    await tx.queueItem.updateMany({ where: { spaceId, status: "playing" }, data: { status: "played" } });
    if (next) {
      await tx.queueItem.update({
        where: { id: next.id },
        data: { status: "playing", startedAt: new Date(), finalVotes: next.votes },
      });
    }
    return true;
  });
}

export const HISTORY_PAGE_SIZE = 8;

export async function getHistory(spaceId: string, userId: string, page: number) {
  if (!(await access(spaceId, userId))) return null;
  const where = { spaceId, status: "played" as const };
  const [items, total] = await Promise.all([
    prisma.queueItem.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * HISTORY_PAGE_SIZE,
      take: HISTORY_PAGE_SIZE,
      select: { ...song, startedAt: true, finalVotes: true },
    }),
    prisma.queueItem.count({ where }),
  ]);
  return { items, total, pages: Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE)) };
}

// "Add to queue again" from History: same song, the normal add rules.
export async function requeue(itemId: string, userId: string) {
  const played = await prisma.queueItem.findFirst({
    where: { id: itemId, status: "played" },
    select: { spaceId: true, sourceId: true, title: true, channel: true, thumbnailUrl: true, durationSeconds: true },
  });
  if (!played) return { status: "forbidden" as const };
  const { spaceId, sourceId, ...rest } = played;
  return addSong(spaceId, userId, { videoId: sourceId, ...rest });
}
