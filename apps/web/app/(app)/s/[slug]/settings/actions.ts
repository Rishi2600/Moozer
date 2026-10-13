"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { SPACE_NAME_MAX, cleanSpaceName } from "@/lib/spaces/codes";
import { renameSpace, resetSpaceLink } from "@/lib/spaces/data";

export type SettingsState = { error: string } | { saved: true } | null;

// spaceId is bound on the server page; the host check happens in the UPDATE.
export async function renameSpaceAction(spaceId: string, _previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to rename this space." };
  const name = cleanSpaceName(formData.get("name"));
  if (!name) return { error: `Use a name of up to ${SPACE_NAME_MAX} characters.` };
  if (!(await renameSpace(spaceId, session.user.id, name))) {
    return { error: "Only the host can rename a space, and only while it's live." };
  }
  refresh();
  return { saved: true };
}

export async function resetLinkAction(spaceId: string): Promise<SettingsState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to reset the link." };
  const slug = await resetSpaceLink(spaceId, session.user.id);
  if (!slug) return { error: "Only the host can reset the link, and only while the space is live." };
  redirect(`/s/${slug}/settings`); // the page's own address changed with the link
}
