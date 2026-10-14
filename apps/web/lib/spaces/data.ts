import "server-only";

import { Prisma, prisma } from "@moozer/db";
import { cache } from "react";

import { FINISHED, setPlayback } from "@/lib/queue/data";
import { sortQueue } from "@/lib/queue/order";

import { generateJoinCode, generateSlug, type JoinTarget } from "./codes";

// Slugs and join codes are random; retry on the rare unique-constraint clash.
async function withFreshLink<T>(name: string, run: (link: { slug: string; joinCode: string }) => Promise<T>) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await run({ slug: generateSlug(name), joinCode: generateJoinCode() });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  throw new Error("Couldn't generate a unique link for the space");
}

// Open now, or scheduled to open at `opensAt`.
export async function createSpace(hostId: string, name: string, opensAt?: Date) {
  const schedule = opensAt ? { status: "scheduled" as const, scheduledFor: opensAt } : {};
  return withFreshLink(name, (link) =>
    prisma.space.create({
      data: { name, ...link, ...schedule, hostId, members: { create: { userId: hostId } } },
      select: { slug: true },
    })
  );
}

// Scheduled spaces open by themselves at their time. There's no background
// job: reads that care open any due spaces first (a cheap, indexed UPDATE),
// and the space trigger tells their open screens. cache(): once per request.
export const openDueSpaces = cache(async () => {
  await prisma.space.updateMany({
    where: { status: "scheduled", scheduledFor: { lte: new Date() } },
    data: { status: "live", scheduledFor: null },
  });
});

// Any status but ended: people can join, add songs and vote.
const OPEN = { not: "ended" } as const;

const summary = {
  id: true,
  name: true,
  description: true,
  slug: true,
  status: true,
  isPublic: true,
  listeners: true,
  createdAt: true,
  endedAt: true,
  pausedAt: true,
  scheduledFor: true,
  _count: { select: { members: true } },
  queue: { where: { status: "playing" }, select: { title: true }, take: 1 },
} satisfies Prisma.SpaceSelect;

// Live first, then paused, scheduled and ended (enum order); newest first within each.
export async function listHostedSpaces(userId: string) {
  await openDueSpaces();
  return prisma.space.findMany({
    where: { hostId: userId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: summary,
    take: 50,
  });
}

export async function listJoinedSpaces(userId: string) {
  await openDueSpaces();
  const rows = await prisma.spaceMember.findMany({
    where: { userId, space: { hostId: { not: userId } } },
    orderBy: { lastSeenAt: "desc" },
    select: { space: { select: { ...summary, host: { select: { name: true } } } } },
    take: 20,
  });
  return rows.map((row) => row.space);
}

// Opening /s/<slug>. The slug is the invite, so opening a space that hasn't
// ended joins it; an ended space only opens for people who were already in
// it, and someone the host removed can't get back in.
// cache(): the space layout and its pages share one lookup (and one upsert) per request.
export const openSpace = cache(async (slug: string, userId: string) => {
  await openDueSpaces();
  const space = await prisma.space.findUnique({
    where: { slug },
    select: { ...summary, joinCode: true, hostId: true, host: { select: { name: true } } },
  });
  if (!space) return null;

  const key = { spaceId_userId: { spaceId: space.id, userId } };
  const [member, removed] = await Promise.all([
    prisma.spaceMember.findUnique({ where: key, select: { userId: true } }),
    prisma.spaceRemoval.findUnique({ where: key, select: { userId: true } }),
  ]);
  if (removed) return { space, role: "removed" as const };
  if (!member && space.status === "ended") return { space, role: "outsider" as const };

  await prisma.spaceMember.upsert({ where: key, create: { spaceId: space.id, userId }, update: { lastSeenAt: new Date() } });
  return { space, role: space.hostId === userId ? ("host" as const) : ("member" as const) };
});

type Opened = NonNullable<Awaited<ReturnType<typeof openSpace>>>;

// The host or a member: someone who may see inside the space (not an
// outsider to an ended space, nor someone the host removed).
export function inSpace(opened: Opened | null): opened is Opened & { role: "host" | "member" } {
  return opened?.role === "host" || opened?.role === "member";
}

// Where "Join with a link" should go, and whether it can: a space that hasn't
// ended, or an ended one the person was already in; never one they were removed from.
export async function resolveJoinTarget(target: JoinTarget, userId: string) {
  const space = await prisma.space.findUnique({
    where: target.kind === "slug" ? { slug: target.slug } : { joinCode: target.code },
    select: {
      slug: true,
      status: true,
      members: { where: { userId }, select: { userId: true } },
      removed: { where: { userId }, select: { userId: true } },
    },
  });
  if (!space) return { ok: false as const, reason: "not-found" as const };
  if (space.removed.length > 0) return { ok: false as const, reason: "removed" as const };
  if (space.status === "ended" && space.members.length === 0) return { ok: false as const, reason: "ended" as const };
  return { ok: true as const, slug: space.slug };
}

// Host-only changes: the ownership and status checks are part of the WHERE, so
// a request for someone else's (or an ended) space changes nothing.
export async function saveSpaceDetails(spaceId: string, hostId: string, details: { name: string; description: string | null }) {
  const { count } = await prisma.space.updateMany({ where: { id: spaceId, hostId, status: OPEN }, data: details });
  return count === 1;
}

// List on Discover, or keep it invite-only.
export async function setSpacePublic(spaceId: string, hostId: string, isPublic: boolean) {
  const { count } = await prisma.space.updateMany({ where: { id: spaceId, hostId, status: OPEN }, data: { isPublic } });
  return count === 1;
}

// Take a break: the music stops where it is (people can still add and vote)
// until the host resumes, which carries on from the same spot.
export async function setSpaceOnBreak(spaceId: string, hostId: string, onBreak: boolean) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.space.updateMany({
      where: { id: spaceId, hostId, status: onBreak ? "live" : "paused" },
      data: onBreak ? { status: "paused", pausedAt: new Date() } : { status: "live", pausedAt: null },
    });
    if (count !== 1) return false;
    await setPlayback(tx, spaceId, onBreak);
    return true;
  });
}

// A scheduled space, opened before its time.
export async function openSpaceNow(spaceId: string, hostId: string) {
  const { count } = await prisma.space.updateMany({
    where: { id: spaceId, hostId, status: "scheduled" },
    data: { status: "live", scheduledFor: null },
  });
  return count === 1;
}

// Takes someone out of a space for good: their membership, their votes and
// the songs they queued go, and they can't rejoin from the link or code.
export async function removeFromSpace(spaceId: string, hostId: string, userId: string) {
  if (userId === hostId) return false;
  return prisma.$transaction(async (tx) => {
    const space = await tx.space.findFirst({ where: { id: spaceId, hostId, status: OPEN }, select: { id: true } });
    if (!space) return false;
    await tx.vote.deleteMany({ where: { userId, queueItem: { spaceId, status: "queued" } } });
    await tx.queueItem.deleteMany({ where: { spaceId, addedById: userId, status: "queued" } });
    await tx.spaceMember.deleteMany({ where: { spaceId, userId } });
    // Last, so the notification it sends comes after everything above.
    await tx.spaceRemoval.upsert({ where: { spaceId_userId: { spaceId, userId } }, create: { spaceId, userId }, update: {} });
    return true;
  });
}

// Ending also closes out the song that was playing, from any status.
export async function endSpace(spaceId: string, hostId: string) {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.space.updateMany({
      where: { id: spaceId, hostId, status: OPEN },
      data: { status: "ended", endedAt: new Date(), pausedAt: null, scheduledFor: null },
    });
    if (count !== 1) return false;
    await tx.queueItem.updateMany({ where: { spaceId, status: "playing" }, data: FINISHED });
    return true;
  });
}

// New slug and join code together; the old link and code stop working.
export async function resetSpaceLink(spaceId: string, hostId: string) {
  const space = await prisma.space.findFirst({ where: { id: spaceId, hostId, status: OPEN }, select: { name: true } });
  if (!space) return null;
  return withFreshLink(space.name, async (link) => {
    const { count } = await prisma.space.updateMany({ where: { id: spaceId, hostId, status: OPEN }, data: link });
    return count === 1 ? link.slug : null;
  });
}

// Signed-out preview of a space from its link: only what the room itself
// shows (nothing personal, no joining).
export async function getSpacePreview(slug: string) {
  await openDueSpaces();
  const space = await prisma.space.findUnique({
    where: { slug },
    select: { id: true, name: true, description: true, slug: true, status: true, scheduledFor: true, host: { select: { name: true } }, _count: { select: { members: true } } },
  });
  if (!space) return null;
  const [nowPlaying, queued] = await Promise.all([
    prisma.queueItem.findFirst({
      where: { spaceId: space.id, status: "playing" },
      select: { title: true, thumbnailUrl: true, durationSeconds: true, anchorAt: true, pausedAtMs: true, addedBy: { select: { name: true } } },
    }),
    prisma.queueItem.findMany({
      where: { spaceId: space.id, status: "queued" },
      select: { id: true, title: true, thumbnailUrl: true, addedAt: true, addedBy: { select: { name: true } }, _count: { select: { votes: true } } },
    }),
  ]);
  const queue = sortQueue(queued.map(({ _count, ...q }) => ({ ...q, votes: _count.votes })));
  return { space, nowPlaying, queue, total: queue.length };
}

// Public: where a pasted link or code leads, for the landing page's join box.
export async function findSpaceForLink(target: JoinTarget) {
  await openDueSpaces();
  return prisma.space.findUnique({
    where: target.kind === "slug" ? { slug: target.slug } : { joinCode: target.code },
    select: { slug: true, status: true },
  });
}
