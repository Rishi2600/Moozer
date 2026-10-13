"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { SPACE_NAME_MAX, cleanSpaceName, parseJoinInput } from "@/lib/spaces/codes";
import { createSpace, resolveJoinTarget } from "@/lib/spaces/data";

export type FormState = { error: string } | null;

export async function startSpace(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to start a space." };

  const name = cleanSpaceName(formData.get("name"));
  if (!name) return { error: `Give your space a name of up to ${SPACE_NAME_MAX} characters.` };

  const { slug } = await createSpace(session.user.id, name);
  redirect(`/s/${slug}`);
}

export async function joinSpace(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to join a space." };

  const raw = formData.get("target");
  const target = typeof raw === "string" ? parseJoinInput(raw) : null;
  if (!target) return { error: "Paste a Moozer space link, or type the 6-character code from the host's screen." };

  const result = await resolveJoinTarget(target, session.user.id);
  if (!result.ok) {
    if (result.reason === "ended") return { error: "That space has ended. Ask the host for a new link." };
    return target.kind === "code"
      ? { error: "No space has that code. Check it and try again." }
      : { error: "That link doesn't work. The host may have reset it; ask them for the new one." };
  }
  redirect(`/s/${result.slug}`);
}
