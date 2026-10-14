import "server-only";

import { Prisma, prisma } from "@moozer/db";

import { openDueSpaces } from "./data";

export type LiveSpace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  listeners: number;
  hostName: string;
  upvotesPerHour: number;
  playing: string | null;
};

// Public spaces playing right now with someone in the room, ranked by votes
// cast in the last hour ("upvotes/hr"), then by how many are listening.
// Timestamps are stored as UTC without a zone, hence `now() AT TIME ZONE 'UTC'`.
export async function listLiveNow(limit: number) {
  await openDueSpaces();
  return prisma.$queryRaw<LiveSpace[]>(Prisma.sql`
    SELECT s.id, s.name, s.slug, s.description, s.listeners, u.name AS "hostName",
      (SELECT count(*)::int FROM vote v JOIN queue_item q ON q.id = v."queueItemId"
        WHERE q."spaceId" = s.id AND v."createdAt" > (now() AT TIME ZONE 'UTC') - interval '1 hour') AS "upvotesPerHour",
      (SELECT q.title FROM queue_item q WHERE q."spaceId" = s.id AND q.status = 'playing') AS playing
    FROM space s JOIN "user" u ON u.id = s."hostId"
    WHERE s."isPublic" AND s.status = 'live' AND s.listeners > 0
    ORDER BY "upvotesPerHour" DESC, s.listeners DESC, s."createdAt" DESC
    LIMIT ${limit}
  `);
}

// Public spaces that open later, soonest first.
export async function listUpcoming(limit: number) {
  await openDueSpaces();
  return prisma.space.findMany({
    where: { isPublic: true, status: "scheduled" },
    orderBy: { scheduledFor: "asc" },
    take: limit,
    select: { id: true, name: true, slug: true, description: true, scheduledFor: true, host: { select: { name: true } } },
  });
}
