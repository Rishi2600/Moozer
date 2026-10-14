"use server";

import { redirect } from "next/navigation";

import { TOO_MANY_TRIES, joinLimit, visitorKey } from "@/lib/join-limit";
import { parseJoinInput } from "@/lib/spaces/codes";
import { findSpaceForLink } from "@/lib/spaces/data";

import type { FormState } from "./(app)/spaces/actions";

// "Join with a link" on the landing page; works signed out (the space link
// then shows its preview, and signing in comes back to it).
export async function openSpaceLink(_previous: FormState, formData: FormData): Promise<FormState> {
  const raw = formData.get("target");
  const target = typeof raw === "string" ? parseJoinInput(raw) : null;
  if (!target) return { error: "Paste a Moozer space link, or type the 6-character code from the host's screen." };
  const key = await visitorKey();
  if (key && joinLimit.blocked(key)) return TOO_MANY_TRIES;
  const space = await findSpaceForLink(target);
  if (!space) {
    if (key) joinLimit.fail(key);
    return target.kind === "code"
      ? { error: "No space has that code. Check it and try again." }
      : { error: "That link doesn't work. The host may have reset it; ask them for the new one." };
  }
  if (space.status === "ended") return { error: "That space has ended. Ask the host for a new link." };
  redirect(`/s/${space.slug}`);
}
