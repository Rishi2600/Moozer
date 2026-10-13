import "server-only";

import { Prisma, prisma } from "@moozer/db";

import { generateJoinCode, generateSlug } from "./codes";

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

export async function createSpace(hostId: string, name: string) {
  return withFreshLink(name, (link) =>
    prisma.space.create({
      data: { name, ...link, hostId, members: { create: { userId: hostId } } },
      select: { slug: true },
    })
  );
}

const summary = {
  id: true,
  name: true,
  slug: true,
  status: true,
  createdAt: true,
  endedAt: true,
  _count: { select: { members: true } },
} satisfies Prisma.SpaceSelect;

// Live first (enum order), then newest.
export async function listHostedSpaces(userId: string) {
  return prisma.space.findMany({
    where: { hostId: userId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    select: summary,
    take: 50,
  });
}

export async function listJoinedSpaces(userId: string) {
  const rows = await prisma.spaceMember.findMany({
    where: { userId, space: { hostId: { not: userId } } },
    orderBy: { lastSeenAt: "desc" },
    select: { space: { select: { ...summary, host: { select: { name: true } } } } },
    take: 20,
  });
  return rows.map((row) => row.space);
}

// Opening /s/<slug>. The slug is the invite, so opening a live space joins it;
// an ended space only opens for people who were already in it.
export async function openSpace(slug: string, userId: string) {
  const space = await prisma.space.findUnique({
    where: { slug },
    select: { ...summary, joinCode: true, hostId: true, host: { select: { name: true } } },
  });
  if (!space) return null;

  const key = { spaceId_userId: { spaceId: space.id, userId } };
  const member = await prisma.spaceMember.findUnique({ where: key, select: { userId: true } });
  if (!member && space.status === "ended") return { space, role: "outsider" as const };

  await prisma.spaceMember.upsert({ where: key, create: { spaceId: space.id, userId }, update: { lastSeenAt: new Date() } });
  return { space, role: space.hostId === userId ? ("host" as const) : ("member" as const) };
}

export async function findSpaceByCode(joinCode: string) {
  return prisma.space.findUnique({ where: { joinCode }, select: { slug: true, status: true } });
}

// Host-only changes: the ownership and live checks are part of the WHERE, so a
// request for someone else's (or an ended) space changes nothing.
export async function renameSpace(spaceId: string, hostId: string, name: string) {
  const { count } = await prisma.space.updateMany({ where: { id: spaceId, hostId, status: "live" }, data: { name } });
  return count === 1;
}

export async function endSpace(spaceId: string, hostId: string) {
  const { count } = await prisma.space.updateMany({
    where: { id: spaceId, hostId, status: "live" },
    data: { status: "ended", endedAt: new Date() },
  });
  return count === 1;
}

// New slug and join code together; the old link and code stop working.
export async function resetSpaceLink(spaceId: string, hostId: string) {
  const space = await prisma.space.findFirst({ where: { id: spaceId, hostId, status: "live" }, select: { name: true } });
  if (!space) return null;
  return withFreshLink(space.name, async (link) => {
    const { count } = await prisma.space.updateMany({ where: { id: spaceId, hostId, status: "live" }, data: link });
    return count === 1 ? link.slug : null;
  });
}
