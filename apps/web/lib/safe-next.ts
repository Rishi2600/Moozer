// Where to send someone after signing in. Only same-site paths are allowed,
// so a crafted ?next= link can't bounce people to another site.
export function safeNext(next: string | string[] | undefined, fallback = "/account") {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
