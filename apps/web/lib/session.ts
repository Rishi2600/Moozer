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

// Better Auth's default freshAge: some actions (like deleting an account
// without a password) need a sign-in from the last day.
const FRESH_AGE_MS = 24 * 60 * 60 * 1000;

export function isSessionFresh(createdAt: Date | string) {
  return Date.now() - new Date(createdAt).getTime() < FRESH_AGE_MS;
}
