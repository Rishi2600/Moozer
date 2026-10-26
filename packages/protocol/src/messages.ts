// What the realtime server sends to a space's open screens.

export type Person = { id: string; name: string };

export type SpaceStatus = "live" | "paused" | "scheduled" | "ended";

// Quick reactions to the playing song. Short-lived: relayed to the room's
// open screens and never stored.
export const REACTIONS = ["🔥", "❤️", "🙌", "💃", "😂", "😮"] as const;
export type Reaction = (typeof REACTIONS)[number];
export const isReaction = (value: unknown): value is Reaction => REACTIONS.includes(value as Reaction);

// Guest speakers: guests the host approved play the music on their own device
// too. Asking and answering go through here; approvals themselves are stored
// by the website (space_speaker).
export const SPEAKER_RULES = {
  answerWithinMs: 60_000, // an unanswered request expires
  askAgainAfterMs: 120_000, // after "Not now"
  emptyPauseMs: 20_000, // the song pauses when no speaker is left this long
} as const;
export const DEVICES = ["phone", "laptop", "tv"] as const;
export type Device = (typeof DEVICES)[number];
export const isDevice = (value: unknown): value is Device => DEVICES.includes(value as Device);
export type SpeakerRequest = Person & { expiresAt: number }; // server time, ms
export type Speaker = Person & { device: Device; host: boolean };
export type SpeakerAnswer = "allowed" | "declined" | "expired";

export type ServerMessage =
  // Something in the space changed: re-fetch. slug/status come with changes
  // to the space itself (a reset link, a break, opening, or the space ending).
  | { type: "changed"; slug?: string; status?: SpaceStatus }
  // Who's connected right now; several tabs from one person count once.
  | { type: "presence"; here: number; people: Person[] }
  // Someone else reacted to the playing song.
  | { type: "reaction"; emoji: Reaction; from: Person }
  // The server's clock, answering a "time" ping (see docs on clock offset).
  | { type: "time"; t0: number; server: number }
  // To the host's screens: guests waiting for an answer, oldest first.
  | { type: "speaker-requests"; requests: SpeakerRequest[] }
  // To the host's screens: every screen playing the music right now.
  | { type: "speakers"; speakers: Speaker[] }
  // To the guest who asked. retryAt (server time) after "Not now".
  | { type: "speaker-answer"; answer: SpeakerAnswer; retryAt?: number };

// What a browser sends.
export type ClientMessage =
  | { type: "react"; emoji: Reaction }
  // Clock ping: t0 is the browser's Date.now() when sent.
  | { type: "time"; t0: number }
  // A guest asks to play the music on their device too.
  | { type: "speaker-request" }
  // The host answers. Allowing also needs the website to store the approval.
  | { type: "speaker-answer"; userId: string; allow: boolean }
  // This screen started (device) or stopped (null) playing with sound.
  | { type: "speaker"; device: Device | null };

// Close codes the browser can act on.
export const CLOSE = {
  badTicket: 4001, // expired or forged: ask the website for a new one
  removed: 4003, // the host removed this person from the space
} as const;
