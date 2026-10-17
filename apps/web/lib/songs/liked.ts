import "server-only";

import { prisma } from "@moozer/db";

// The heart: a private list of songs someone liked, copied from the queue so
// it outlives the space.

// Like a song from a space you're in (queued, playing or already played).
export async function likeQueueItem(userId: string, itemId: string) {
  const item = await prisma.queueItem.findFirst({
    where: { id: itemId, space: { members: { some: { userId } } } },
    select: { source: true, sourceId: true, title: true, channel: true, thumbnailUrl: true, durationSeconds: true },
  });
  if (!item) return false;
  const { source, sourceId, ...details } = item;
  await prisma.likedSong.upsert({
    where: { userId_source_sourceId: { userId, source, sourceId } },
    create: { userId, source, sourceId, ...details },
    update: {},
  });
  return true;
}

export async function unlikeVideo(userId: string, videoId: string) {
  await prisma.likedSong.deleteMany({ where: { userId, source: "youtube", sourceId: videoId } });
}

// Which of these videos the person has liked, to fill in the hearts.
export async function likedVideoIds(userId: string, videoIds: string[]) {
  if (videoIds.length === 0) return new Set<string>();
  const rows = await prisma.likedSong.findMany({ where: { userId, source: "youtube", sourceId: { in: videoIds } }, select: { sourceId: true } });
  return new Set(rows.map((row) => row.sourceId));
}

export async function listLiked(userId: string, take = 200) {
  const rows = await prisma.likedSong.findMany({
    where: { userId, source: "youtube" },
    orderBy: { likedAt: "desc" },
    take,
    select: { sourceId: true, title: true, channel: true, thumbnailUrl: true, durationSeconds: true, likedAt: true },
  });
  return rows.map(({ sourceId, ...song }) => ({ videoId: sourceId, ...song }));
}

export type LikedSongView = Awaited<ReturnType<typeof listLiked>>[number];
