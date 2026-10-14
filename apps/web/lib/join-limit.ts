import "server-only";

import { headers } from "next/headers";

import { failureLimiter } from "./rate-limit";

// Joining by link or code: 10 misses per 10 minutes, per person (or per IP
// address when signed out). Codes are 6 of 31 characters (about 887 million
// possibilities), so guessing one is hopeless at this rate; normal typos
// never get near it.
export const joinLimit = failureLimiter({ max: 10, windowMs: 10 * 60_000 });

export const TOO_MANY_TRIES = { error: "Too many tries. Wait a few minutes, then check the code or link and try again." };

export const userKey = (userId: string) => `user:${userId}`;

// Signed out, the key is the visitor's IP address as the hosting proxy
// reports it: X-Real-IP, or the last X-Forwarded-For hop (the one the proxy
// added; earlier hops come from the browser and can be made up). With
// neither (no proxy, e.g. local dev) there's no fair key, so no limit.
export async function visitorKey() {
  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return ip ? `ip:${ip}` : null;
}
