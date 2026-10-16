// What the realtime server sends to a space's open screens.

export type Person = { id: string; name: string };

export type SpaceStatus = "live" | "paused" | "scheduled" | "ended";

// Quick reactions to the playing song. Short-lived: relayed to the room's
// open screens and never stored.
export const REACTIONS = ["🔥", "❤️", "🙌", "💃", "😂", "😮"] as const;
export type Reaction = (typeof REACTIONS)[number];
export const isReaction = (value: unknown): value is Reaction => REACTIONS.includes(value as Reaction);

export type ServerMessage =
  // Something in the space changed: re-fetch. slug/status come with changes
  // to the space itself (a reset link, a break, opening, or the space ending).
  | { type: "changed"; slug?: string; status?: SpaceStatus }
  // Who's connected right now; several tabs from one person count once.
  | { type: "presence"; here: number; people: Person[] }
  // Someone else reacted to the playing song.
  | { type: "reaction"; emoji: Reaction; from: Person };

// What a browser sends.
export type ClientMessage = { type: "react"; emoji: Reaction };

// Close codes the browser can act on.
export const CLOSE = {
  badTicket: 4001, // expired or forged: ask the website for a new one
  removed: 4003, // the host removed this person from the space
} as const;
