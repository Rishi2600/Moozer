import "server-only";

import { Prisma, prisma } from "@moozer/db";

import type { SongDetails } from "@/lib/songs/lookup";

import { leadMargin, sortQueue } from "./order";
import { positionMs, resumedAnchor, seekedState } from "./playback";

// A song that has stopped playing loses its playback position (CHECK constraint).
export const FINISHED = { status: "played" as const, anchorAt: null, pausedAtMs: null };

const song = {
  id: true,
  sourceId: true,
  title: true,
  channel: true,
  thumbnailUrl: true,
  durationSeconds: true,
  dedication: true,
  addedAt: true,
  addedById: true,
  addedBy: { select: { name: true } },
} satisfies Prisma.QueueItemSelect;

// Songs can be added, voted on and removed in any space that hasn't ended:
// live, paused (the host's on a break) or scheduled (not open yet). Only a
// live space plays music.
const OPEN = { not: "ended" } as const;

// Membership of the caller in a space; null if not a member.
async function access(spaceId: string, userId: string) {
  const member = await prisma.spaceMember.findUnique({
    where: { spaceId_userId: { spaceId, userId } },
    select: { space: { select: { status: true, hostId: true } } },
  });
  if (!member) return null;
  return { open: member.space.status !== "ended", isHost: member.space.hostId === userId };
}

export async function getQueue(spaceId: string, userId: string) {
  const [nowPlaying, queued] = await Promise.all([
    prisma.queueItem.findFirst({
      where: { spaceId, status: "playing" },
      select: { ...song, startedAt: true, anchorAt: true, pausedAtMs: true },
    }),
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
export async function addSong(spaceId: string, userId: string, details: SongDetails, dedication: string | null = null) {
  const who = await access(spaceId, userId);
  if (!who?.open) return { status: "forbidden" as const };
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
        dedication,
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
    where: { id: itemId, status: "queued", space: { status: OPEN, members: { some: { userId } } } },
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
      space: { status: OPEN },
      OR: [{ addedById: userId }, { space: { hostId: userId } }],
    },
  });
  return count === 1;
}

// Host only. Moves the playing song to History and starts the chosen song
// (or the top of the queue). With nothing queued it just finishes the current one.
// endedItemId (auto-advance): only advance if that song is still the one playing,
// so two host tabs reporting the same ending can't skip two songs.
export async function playNext(spaceId: string, hostId: string, itemId?: string, endedItemId?: string) {
  return prisma.$transaction(async (tx) => {
    const space = await tx.space.findFirst({ where: { id: spaceId, hostId, status: "live" }, select: { id: true } });
    if (!space) return false;
    if (endedItemId) {
      const current = await tx.queueItem.findFirst({ where: { spaceId, status: "playing" }, select: { id: true } });
      if (current?.id !== endedItemId) return true; // already moved on
    }
    const queued = await tx.queueItem.findMany({
      where: { spaceId, status: "queued", ...(itemId ? { id: itemId } : {}) },
      select: { id: true, addedAt: true, _count: { select: { votes: true } } },
    });
    const next = sortQueue(queued.map((q) => ({ id: q.id, addedAt: q.addedAt, votes: q._count.votes })))[0];
    if (itemId && !next) return false;
    await tx.queueItem.updateMany({ where: { spaceId, status: "playing" }, data: FINISHED });
    if (next) {
      const now = new Date();
      await tx.queueItem.update({
        where: { id: next.id },
        data: { status: "playing", startedAt: now, finalVotes: next.votes, anchorAt: now, pausedAtMs: null },
      });
    }
    return true;
  });
}

// Pausing freezes the playing song's position; resuming moves its anchor
// forward so it carries on from there. Shared by Pause and Take a break.
export async function setPlayback(tx: Prisma.TransactionClient, spaceId: string, paused: boolean) {
  const playing = await tx.queueItem.findFirst({
    where: { spaceId, status: "playing" },
    select: { id: true, anchorAt: true, pausedAtMs: true },
  });
  if (!playing) return;
  const now = Date.now();
  if (paused && playing.pausedAtMs === null) {
    await tx.queueItem.update({ where: { id: playing.id }, data: { pausedAtMs: Math.round(positionMs(playing, now)) } });
  } else if (!paused && playing.pausedAtMs !== null) {
    await tx.queueItem.update({
      where: { id: playing.id },
      data: { anchorAt: resumedAnchor(playing.pausedAtMs, now), pausedAtMs: null },
    });
  }
}

// Host only, while live and a song is playing.
export async function setPaused(spaceId: string, hostId: string, paused: boolean) {
  return prisma.$transaction(async (tx) => {
    const playing = await tx.queueItem.findFirst({
      where: { spaceId, status: "playing", space: { hostId, status: "live" } },
      select: { id: true },
    });
    if (!playing) return false;
    await setPlayback(tx, spaceId, paused);
    return true;
  });
}

// Host only, while live: jump the playing song forward or back (paused or not).
export async function seek(spaceId: string, hostId: string, deltaMs: number) {
  return prisma.$transaction(async (tx) => {
    const playing = await tx.queueItem.findFirst({
      where: { spaceId, status: "playing", space: { hostId, status: "live" } },
      select: { id: true, anchorAt: true, pausedAtMs: true, durationSeconds: true },
    });
    if (!playing) return false;
    await tx.queueItem.update({ where: { id: playing.id }, data: seekedState(playing, deltaMs, playing.durationSeconds) });
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

// For the "This space has ended" card.
export async function getSpaceStats(spaceId: string) {
  const [played, voters] = await Promise.all([
    prisma.queueItem.count({ where: { spaceId, status: "played" } }),
    prisma.vote.groupBy({ by: ["userId"], where: { queueItem: { spaceId } } }),
  ]);
  return { played, voters: voters.length };
}
