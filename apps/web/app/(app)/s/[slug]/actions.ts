"use server";

import { refresh } from "next/cache";

import { setVote } from "@/lib/queue/data";
import { getSession } from "@/lib/session";

// Queue actions. Each re-reads the session; the data layer checks membership.
export async function voteAction(itemId: string, voted: boolean) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again to vote." };
  if (!(await setVote(itemId, session.user.id, voted))) {
    return { ok: false as const, error: "That song isn't in the queue any more." };
  }
  refresh();
  return { ok: true as const };
}
