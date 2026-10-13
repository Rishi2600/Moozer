"use server";

import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { SPACE_NAME_MAX, cleanSpaceName } from "@/lib/spaces/codes";
import { createSpace } from "@/lib/spaces/data";

export type FormState = { error: string } | null;

export async function startSpace(_previous: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) return { error: "Your session ended. Sign in again to start a space." };

  const name = cleanSpaceName(formData.get("name"));
  if (!name) return { error: `Give your space a name of up to ${SPACE_NAME_MAX} characters.` };

  const { slug } = await createSpace(session.user.id, name);
  redirect(`/s/${slug}`);
}
