"use server";

import { redirect } from "next/navigation";

import { TOO_MANY_TRIES, joinLimit, userKey } from "@/lib/join-limit";
import { getSession } from "@/lib/session";
import { SPACE_NAME_MAX, cleanSpaceName, parseJoinInput } from "@/lib/spaces/codes";
import { parseScheduledFor } from "@/lib/spaces/schedule";
import { createSpace, resolveJoinTarget } from "@/lib/spaces/data";

export type FormState = { error: string } | null;

export async function startSpace(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to start a space." };

  const name = cleanSpaceName(formData.get("name"));
  if (!name) return { error: `Give your space a name of up to ${SPACE_NAME_MAX} characters.` };

  // Present only when "Schedule for later" is on.
  let opensAt: Date | undefined;
  if (formData.has("scheduledFor")) {
    const parsed = parseScheduledFor(formData.get("scheduledFor"));
    if (!parsed.ok) return { error: parsed.error };
    opensAt = parsed.date;
  }

  const { slug } = await createSpace(session.user.id, name, opensAt);
  redirect(`/s/${slug}`);
}

export async function joinSpace(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to join a space." };

  const raw = formData.get("target");
  const target = typeof raw === "string" ? parseJoinInput(raw) : null;
  if (!target) return { error: "Paste a Moozer space link, or type the 6-character code from the host's screen." };

  const key = userKey(session.user.id);
  if (joinLimit.blocked(key)) return TOO_MANY_TRIES;
  const result = await resolveJoinTarget(target, session.user.id);
  if (!result.ok && result.reason === "not-found") joinLimit.fail(key);
  if (!result.ok) {
    if (result.reason === "ended") return { error: "That space has ended. Ask the host for a new link." };
    if (result.reason === "removed") return { error: "The host removed you from that space, so you can't rejoin it." };
    return target.kind === "code"
      ? { error: "No space has that code. Check it and try again." }
      : { error: "That link doesn't work. The host may have reset it; ask them for the new one." };
  }
  redirect(`/s/${result.slug}`);
}
