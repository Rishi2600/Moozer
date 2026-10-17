import "server-only";

import { prisma } from "@moozer/db";

import { crowdFavourite, mostBoosted, nightLength, topSong, type PlayedSong } from "./recap-rules";

// Everything the end-of-night recap shows, for one member of the space.
export async function getRecap(spaceId: string, viewerId: string) {
  const [space, items, votesGiven, boostsUsed] = await Promise.all([
    prisma.space.findUniqueOrThrow({
      where: { id: spaceId },
      select: { name: true, slug: true, createdAt: true, endedAt: true, host: { select: { name: true } }, _count: { select: { members: true } } },
    }),
    prisma.queueItem.findMany({
      where: { spaceId, status: "played" },
      orderBy: { startedAt: "asc" },
      select: {
        id: true,
        sourceId: true,
        title: true,
        thumbnailUrl: true,
        finalVotes: true,
        startedAt: true,
        addedBy: { select: { id: true, name: true } },
        _count: { select: { boosts: { where: { settled: true } } } },
      },
    }),
    prisma.vote.count({ where: { userId: viewerId, queueItem: { spaceId } } }),
    prisma.boost.count({ where: { userId: viewerId, spaceId, settled: true } }),
  ]);
  const played: PlayedSong[] = items.map((item) => ({
    id: item.id,
    title: item.title,
    thumbnailUrl: item.thumbnailUrl,
    finalVotes: item.finalVotes ?? 0,
    boosts: item._count.boosts,
    startedAt: item.startedAt ?? space.createdAt,
    addedBy: item.addedBy,
  }));
  const start = played[0]?.startedAt ?? space.createdAt;
  const end = space.endedAt ?? new Date();
  return {
    space,
    length: nightLength(start.getTime(), end.getTime()),
    shortLength: nightLength(start.getTime(), end.getTime(), true),
    songsPlayed: played.length,
    people: space._count.members,
    top: topSong(played),
    favourite: crowdFavourite(played),
    boosted: mostBoosted(played),
    you: { songsPlayed: played.filter((song) => song.addedBy.id === viewerId).length, votesGiven, boostsUsed },
    songs: items.map((item) => ({ videoId: item.sourceId, title: item.title })),
  };
}

export type Recap = Awaited<ReturnType<typeof getRecap>>;
