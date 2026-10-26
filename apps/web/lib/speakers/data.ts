import "server-only";

import { prisma } from "@moozer/db";

// Guest speakers: guests the host approved to play the space's music on their
// own device too. Approval lasts for the space; the host can take it back.

const OPEN = { not: "ended" } as const;

// Host only, while the space is open: approve a member (not the host) as a
// speaker. Approving twice is fine.
export async function approveSpeaker(spaceId: string, hostId: string, userId: string) {
  if (userId === hostId) return false;
  const member = await prisma.spaceMember.findFirst({
    where: { spaceId, userId, space: { hostId, status: OPEN } },
    select: { userId: true },
  });
  if (!member) return false;
  await prisma.spaceSpeaker.upsert({
    where: { spaceId_userId: { spaceId, userId } },
    create: { spaceId, userId },
    update: {},
  });
  return true;
}

// Host only: turn a guest's speaker off and take the approval away, so they'd
// have to ask again.
export async function revokeSpeaker(spaceId: string, hostId: string, userId: string) {
  const space = await prisma.space.findFirst({ where: { id: spaceId, hostId }, select: { id: true } });
  if (!space) return false;
  await prisma.spaceSpeaker.deleteMany({ where: { spaceId, userId } });
  return true;
}

export async function isSpeaker(spaceId: string, userId: string) {
  const row = await prisma.spaceSpeaker.findUnique({ where: { spaceId_userId: { spaceId, userId } }, select: { userId: true } });
  return row !== null;
}

// The approved guests, for the host's Speakers card.
export async function listSpeakers(spaceId: string) {
  const rows = await prisma.spaceSpeaker.findMany({
    where: { spaceId },
    orderBy: { grantedAt: "asc" },
    select: { user: { select: { id: true, name: true } } },
  });
  return rows.map((row) => row.user);
}
