"use server";

import { prisma } from "@moozer/db";
import { refresh } from "next/cache";

import { getSession } from "@/lib/session";
import { likeQueueItem, unlikeVideo } from "@/lib/songs/liked";

// The heart on a song in a space (Now playing, History).
export async function likeSongAction(itemId: string, liked: boolean) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (liked) {
    if (!(await likeQueueItem(session.user.id, itemId))) return { ok: false as const, error: "That song isn't in a space you're in." };
  } else {
    const item = await prisma.queueItem.findUnique({ where: { id: itemId }, select: { sourceId: true } });
    if (item) await unlikeVideo(session.user.id, item.sourceId);
  }
  refresh();
  return { ok: true as const };
}

// Removing a song from the Liked page.
export async function unlikeAction(videoId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  await unlikeVideo(session.user.id, videoId);
  refresh();
  return { ok: true as const };
}
