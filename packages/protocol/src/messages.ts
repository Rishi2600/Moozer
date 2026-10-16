// What the realtime server sends to a space's open screens.

export type Person = { id: string; name: string };

export type SpaceStatus = "live" | "paused" | "scheduled" | "ended";

export type ServerMessage =
  // Something in the space changed: re-fetch. slug/status come with changes
  // to the space itself (a reset link, a break, opening, or the space ending).
  | { type: "changed"; slug?: string; status?: SpaceStatus }
  // Who's connected right now; several tabs from one person count once.
  | { type: "presence"; here: number; people: Person[] };

// Close codes the browser can act on.
export const CLOSE = {
  badTicket: 4001, // expired or forged: ask the website for a new one
  removed: 4003, // the host removed this person from the space
} as const;
