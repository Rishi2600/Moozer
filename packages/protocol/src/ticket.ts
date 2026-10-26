import { createHmac, timingSafeEqual } from "node:crypto";

// A short-lived pass the website hands the browser so the realtime server
// knows who is connecting to which space without sharing cookies.
// Format: base64url(json).base64url(hmac-sha256).
export type Ticket = { userId: string; name: string; spaceId: string; host?: boolean; exp: number };

const sign = (body: string, secret: string) => createHmac("sha256", secret).update(body).digest("base64url");

export function signTicket(claims: Omit<Ticket, "exp">, secret: string, ttlSeconds = 60, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ ...claims, exp: Math.floor(now / 1000) + ttlSeconds })).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function verifyTicket(token: string, secret: string, now = Date.now()): Ticket | null {
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const ticket = JSON.parse(Buffer.from(body, "base64url").toString()) as Ticket;
    if (typeof ticket.exp !== "number" || ticket.exp * 1000 < now) return null;
    if (!ticket.userId || !ticket.spaceId || typeof ticket.name !== "string") return null;
    return ticket;
  } catch {
    return null;
  }
}
