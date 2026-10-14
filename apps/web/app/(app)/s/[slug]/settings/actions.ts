"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { SPACE_DESCRIPTION_MAX, SPACE_NAME_MAX, cleanSpaceDescription, cleanSpaceName } from "@/lib/spaces/codes";
import { endSpace, resetSpaceLink, saveSpaceDetails, setSpacePublic } from "@/lib/spaces/data";

export type SettingsState = { error: string } | { saved: true } | null;

// spaceId is bound on the server page; the host check happens in the UPDATE.
export async function saveDetailsAction(spaceId: string, _previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to change this space." };
  const name = cleanSpaceName(formData.get("name"));
  if (!name) return { error: `Use a name of up to ${SPACE_NAME_MAX} characters.` };
  const description = cleanSpaceDescription(formData.get("description"));
  if (description === undefined) return { error: `Keep the description to ${SPACE_DESCRIPTION_MAX} characters.` };
  if (!(await saveSpaceDetails(spaceId, session.user.id, { name, description }))) {
    return { error: "Only the host can change a space, and only until it ends." };
  }
  refresh();
  return { saved: true };
}

export async function resetLinkAction(spaceId: string): Promise<SettingsState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to reset the link." };
  const slug = await resetSpaceLink(spaceId, session.user.id);
  if (!slug) return { error: "Only the host can reset the link, and only until the space ends." };
  redirect(`/s/${slug}/settings`); // the page's own address changed with the link
}

export async function endSpaceAction(spaceId: string): Promise<SettingsState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to end this space." };
  if (!(await endSpace(spaceId, session.user.id))) {
    return { error: "Only the host can end a space, and it may have ended already." };
  }
  refresh();
  return { saved: true };
}

// List on Discover, or keep it invite-only.
export async function setPublicAction(spaceId: string, isPublic: boolean): Promise<SettingsState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again." };
  if (!(await setSpacePublic(spaceId, session.user.id, isPublic))) {
    return { error: "Only the host can change this, and only until the space ends." };
  }
  refresh();
  return { saved: true };
}
