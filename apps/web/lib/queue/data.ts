import "server-only";

import { Prisma, prisma } from "@moozer/db";

import type { SongDetails } from "@/lib/songs/lookup";

import { setRefundCause } from "@/lib/boosts/wallet";

import { ballotVotes } from "./boost";
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
      select: {
        ...song,
        _count: { select: { votes: true } },
        votes: { where: { userId }, select: { userId: true } },
        boosts: { orderBy: { createdAt: "asc" }, select: { user: { select: { name: true } } } },
      },
    }),
  ]);
  const queue = sortQueue(
    queued.map(({ _count, votes, boosts, ...item }) => ({
      ...item,
      votes: ballotVotes(_count.votes, boosts.length),
      hasVoted: votes.length > 0,
      boostedBy: boosts.map((b) => b.user.name),
    }))
  );
  return { nowPlaying, queue, leadBy: leadMargin(queue) };
}

// The song already queued (or playing) for this video, if any.
export async function findActiveCopy(spaceId: string, videoId: string, userId?: string) {
  const item = await prisma.queueItem.findFirst({
    where: { spaceId, source: "youtube", sourceId: videoId, status: { in: ["queued", "playing"] } },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      status: true,
      _count: { select: { votes: true, boosts: true } },
      votes: { where: { userId: userId ?? "" }, select: { userId: true } },
    },
  });
  return (
    item && {
      id: item.id,
      title: item.title,
      thumbnailUrl: item.thumbnailUrl,
      playing: item.status === "playing",
      votes: ballotVotes(item._count.votes, item._count.boosts),
      hasVoted: item.votes.length > 0,
    }
  );
}

// Which of these videos are already queued (or playing) here, for search results.
export async function findActiveCopies(spaceId: string, videoIds: string[], userId: string) {
  if (videoIds.length === 0) return new Map<string, NonNullable<Awaited<ReturnType<typeof findActiveCopy>>>>();
  const items = await prisma.queueItem.findMany({
    where: { spaceId, source: "youtube", sourceId: { in: videoIds }, status: { in: ["queued", "playing"] } },
    select: {
      id: true,
      sourceId: true,
      title: true,
      thumbnailUrl: true,
      status: true,
      _count: { select: { votes: true, boosts: true } },
      votes: { where: { userId }, select: { userId: true } },
    },
  });
  return new Map(
    items.map((item) => [
      item.sourceId,
      {
        id: item.id,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        playing: item.status === "playing",
        votes: ballotVotes(item._count.votes, item._count.boosts),
        hasVoted: item.votes.length > 0,
      },
    ])
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

// A song YouTube couldn't play gets its boosts refunded, but only if it failed
// this soon after starting: the report comes from the host's browser, and a
// song that has really played shouldn't hand its boosts back.
export const UNPLAYABLE_WINDOW_MS = 15_000;

// Moves the playing song to History and starts the chosen song (or the top of
// the queue). With nothing queued it just finishes the current one.
// Play next / Play now are host only. ended (auto-advance) can also come from
// an approved guest speaker; it only advances if that song is still the one
// playing, so several speakers reporting the same ending can't skip two songs.
// Only the host's player can call a song unplayable: one guest's device failing
// shouldn't skip it for the room or refund its boosts.
export async function playNext(spaceId: string, userId: string, itemId?: string, ended?: { itemId: string; unplayable: boolean }) {
  return prisma.$transaction(async (tx) => {
    const who = ended ? { OR: [{ hostId: userId }, { speakers: { some: { userId } } }] } : { hostId: userId };
    const space = await tx.space.findFirst({ where: { id: spaceId, status: "live", ...who }, select: { hostId: true } });
    if (!space) return false;
    if (ended) {
      if (ended.unplayable && space.hostId !== userId) return false;
      const current = await tx.queueItem.findFirst({ where: { spaceId, status: "playing" }, select: { id: true, startedAt: true } });
      if (current?.id !== ended.itemId) return true; // already moved on
      if (ended.unplayable && current.startedAt && Date.now() - current.startedAt.getTime() < UNPLAYABLE_WINDOW_MS) {
        await setRefundCause(tx, "unplayable");
        await tx.boost.deleteMany({ where: { queueItemId: current.id } });
      }
    }
    const queued = await tx.queueItem.findMany({
      where: { spaceId, status: "queued", ...(itemId ? { id: itemId } : {}) },
      select: { id: true, addedAt: true, _count: { select: { votes: true, boosts: true } } },
    });
    const next = sortQueue(queued.map((q) => ({ id: q.id, addedAt: q.addedAt, votes: ballotVotes(q._count.votes, q._count.boosts) })))[0];
    if (itemId && !next) return false;
    await tx.queueItem.updateMany({ where: { spaceId, status: "playing" }, data: FINISHED });
    if (next) {
      const now = new Date();
      await tx.queueItem.update({
        where: { id: next.id },
        data: { status: "playing", startedAt: now, finalVotes: next.votes, anchorAt: now, pausedAtMs: null },
      });
      await tx.boost.updateMany({ where: { queueItemId: next.id }, data: { settled: true } }); // spent for good
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

// Everything that played, in the order it played (for the playlist link).
export async function getPlayedSongs(spaceId: string) {
  const items = await prisma.queueItem.findMany({
    where: { spaceId, status: "played", source: "youtube" },
    orderBy: { startedAt: "asc" },
    select: { sourceId: true, title: true },
  });
  return items.map((item) => ({ videoId: item.sourceId, title: item.title }));
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
