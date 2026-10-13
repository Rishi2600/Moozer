// What the realtime server sends to a space's open screens.

export type Person = { id: string; name: string };

export type ServerMessage =
  // Something in the space changed: re-fetch. slug/status come with changes
  // to the space itself (a reset link, or the space ending).
  | { type: "changed"; slug?: string; status?: "live" | "ended" }
  // Who's connected right now; several tabs from one person count once.
  | { type: "presence"; here: number; people: Person[] };

// Close codes the browser can act on.
export const CLOSE = {
  badTicket: 4001, // expired or forged: ask the website for a new one
} as const;
