import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "./auth";

// One session lookup per render pass.
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

// For signed-in pages and actions: returns the session or sends the visitor to sign in.
export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session;
}
