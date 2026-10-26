"use server";

import { refresh } from "next/cache";

import { spendBoost, undoBoost } from "@/lib/boosts/wallet";
import { addSong, findActiveCopies, findActiveCopy, playNext, removeSong, requeue, seek, setPaused, setVote } from "@/lib/queue/data";
import { issueRealtimeTicket } from "@/lib/realtime";
import { getSession } from "@/lib/session";
import { failureLimiter } from "@/lib/rate-limit";
import { cleanDedication } from "@/lib/songs/dedication";
import { parseSongLink } from "@/lib/songs/links";
import { lookupYouTube, type SongDetails } from "@/lib/songs/lookup";
import { searchYouTube } from "@/lib/songs/search";
import { SEARCH_PER_PERSON } from "@/lib/songs/search-rules";
import { openSpaceNow, removeFromSpace, setSpaceOnBreak } from "@/lib/spaces/data";
import { approveSpeaker, revokeSpeaker } from "@/lib/speakers/data";

type Copy = NonNullable<Awaited<ReturnType<typeof findActiveCopy>>>;
export type Preview =
  | { state: "ready"; song: SongDetails }
  | { state: "duplicate"; existing: Copy }
  | { state: "error"; message: string; spotify?: boolean };

const LOOKUP_ERRORS = {
  "not-found": "We couldn't find that video. Check the link and try again.",
  "not-embeddable": "This video can only be played on YouTube. Try another upload of the song.",
  unavailable: "Couldn't reach YouTube just now. Try again in a moment.",
} as const;

// What a pasted link would add. Read-only: Add to queue looks the song up again.
export async function previewSongAction(spaceId: string, link: string): Promise<Preview | null> {
  const session = await getSession();
  if (!session) return { state: "error", message: "Your session ended. Sign in again to add songs." };
  const parsed = parseSongLink(link);
  if (!parsed) return null;
  if (parsed.kind === "spotify") {
    return { state: "error", spotify: true, message: "Spotify links are coming soon. Paste a YouTube link for now." };
  }
  if (parsed.kind === "unsupported") return { state: "error", message: "Moozer plays YouTube links. Paste a link from YouTube." };
  const existing = await findActiveCopy(spaceId, parsed.videoId, session.user.id);
  if (existing) return { state: "duplicate", existing };
  const found = await lookupYouTube(parsed.videoId);
  return found.ok ? { state: "ready", song: found.song } : { state: "error", message: LOOKUP_ERRORS[found.reason] };
}

// Every search counts toward a person's allowance (see search-rules.ts).
const searchLimit = failureLimiter(SEARCH_PER_PERSON);

const SEARCH_ERRORS = {
  "too-short": "Type at least 2 characters to search.",
  resting: "Search is resting until tomorrow (it's limited for now). Paste a YouTube link instead.",
  unavailable: "Couldn't reach YouTube just now. Try again, or paste a link.",
  "no-key": "Search isn't set up yet. Paste a YouTube link instead.",
} as const;

// Words typed into Add a song: music videos from YouTube, each marked if it's
// already in this space's queue.
export async function searchSongsAction(spaceId: string, query: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again to add songs." };
  const key = `search:${session.user.id}`;
  if (searchLimit.blocked(key)) return { ok: false as const, error: "That's a lot of searching. Wait a few minutes, or paste a link." };
  searchLimit.fail(key);
  const found = await searchYouTube(query);
  if (!found.ok) return { ok: false as const, error: SEARCH_ERRORS[found.reason] };
  const copies = await findActiveCopies(spaceId, found.songs.map((song) => song.videoId), session.user.id);
  return { ok: true as const, results: found.songs.map((song) => ({ song, existing: copies.get(song.videoId) ?? null })) };
}

export type SearchResults = Extract<Awaited<ReturnType<typeof searchSongsAction>>, { ok: true }>["results"];

export async function addSongAction(spaceId: string, videoId: string, dedication?: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again to add songs." };
  const note = cleanDedication(dedication);
  if (!note.ok) return { ok: false as const, error: note.error };
  const found = await lookupYouTube(videoId); // never trust song details from the browser
  if (!found.ok) return { ok: false as const, error: LOOKUP_ERRORS[found.reason] };
  const result = await addSong(spaceId, session.user.id, found.song, note.value);
  if (result.status === "forbidden") return { ok: false as const, error: "Songs can only be added until the space ends." };
  if (result.status === "duplicate") return { ok: false as const, error: `${result.existing.title} is already in the queue.` };
  refresh();
  return { ok: true as const };
}

// Queue actions. Each re-reads the session; the data layer checks membership.
export async function voteAction(itemId: string, voted: boolean) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again to vote." };
  if (!(await setVote(itemId, session.user.id, voted))) {
    return { ok: false as const, error: "That song isn't in the queue any more." };
  }
  refresh();
  return { ok: true as const };
}

// Host only (checked in the transaction). With an itemId this is "Play now".
export async function playNextAction(spaceId: string, itemId?: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!(await playNext(spaceId, session.user.id, itemId))) {
    return { ok: false as const, error: "Only the host can change what's playing, and only while the space is live." };
  }
  refresh();
  return { ok: true as const };
}

// Anyone in the space: spend your boost (+3 votes) on a queued song.
export async function boostAction(itemId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again to boost." };
  const result = await spendBoost(session.user.id, itemId);
  if (result.status === "gone") return { ok: false as const, error: "That song isn't in the queue any more." };
  if (result.status === "empty") return { ok: false as const, error: "You're out of boosts. Your free one comes back 5.5 hours after you use it." };
  refresh();
  return { ok: true as const, boostId: result.id };
}

export async function undoBoostAction(boostId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!(await undoBoost(boostId, session.user.id))) {
    return { ok: false as const, error: "That boost can't be undone any more." };
  }
  refresh();
  return { ok: true as const };
}

// The host, or whoever added the song.
export async function removeSongAction(itemId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!(await removeSong(itemId, session.user.id))) {
    return { ok: false as const, error: "Only the host or whoever added a song can remove it." };
  }
  refresh();
  return { ok: true as const };
}

export async function requeueAction(itemId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  const result = await requeue(itemId, session.user.id);
  if (result.status === "forbidden") return { ok: false as const, error: "Songs can only be added until the space ends." };
  if (result.status === "duplicate") return { ok: false as const, error: "That song is already in the queue." };
  refresh();
  return { ok: true as const };
}

// A fresh realtime ticket when the browser reconnects.
export async function realtimeTicketAction(spaceId: string) {
  const session = await getSession();
  return session ? issueRealtimeTicket(session.user, spaceId) : null;
}

// Host only: pause or resume the playing song for everyone.
export async function setPausedAction(spaceId: string, paused: boolean) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!(await setPaused(spaceId, session.user.id, paused))) {
    return { ok: false as const, error: "Only the host can pause or play, and only while a song is playing." };
  }
  refresh();
  return { ok: true as const };
}

// Host only: jump the playing song forward or back (the buttons and arrow keys use 10s).
export async function seekAction(spaceId: string, seconds: number) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!Number.isFinite(seconds) || Math.abs(seconds) > 60) return { ok: false as const, error: "Jumps can be up to a minute." };
  if (!(await seek(spaceId, session.user.id, seconds * 1000))) {
    return { ok: false as const, error: "Only the host can skip around a song, and only while it's playing." };
  }
  refresh();
  return { ok: true as const };
}

// A player reports that a song finished (or, the host's only, that YouTube
// couldn't play it): start the next one. Approved guest speakers report too.
export async function songEndedAction(spaceId: string, itemId: string, unplayable = false) {
  const session = await getSession();
  if (!session) return { ok: false as const };
  const ok = await playNext(spaceId, session.user.id, undefined, { itemId, unplayable: unplayable === true });
  if (ok) refresh();
  return { ok };
}

// Host only: take a break (the music stops where it is) or come back.
export async function setBreakAction(spaceId: string, onBreak: boolean) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!(await setSpaceOnBreak(spaceId, session.user.id, onBreak))) {
    return { ok: false as const, error: onBreak ? "Only the host can take a break, and only while the space is live." : "Only the host can resume this space." };
  }
  refresh();
  return { ok: true as const };
}

// Host only: open a scheduled space before its time.
export async function openNowAction(spaceId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!(await openSpaceNow(spaceId, session.user.id))) {
    return { ok: false as const, error: "Only the host can open this space, and it may be open already." };
  }
  refresh();
  return { ok: true as const };
}

// Host only: remove someone for good (their queued songs and votes go too).
export async function removePersonAction(spaceId: string, userId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!(await removeFromSpace(spaceId, session.user.id, userId))) {
    return { ok: false as const, error: "Only the host can remove people, and not themselves." };
  }
  refresh();
  return { ok: true as const };
}

// Host only: let a guest play the music on their own device too. The host's
// screen then tells the guest over realtime.
export async function approveSpeakerAction(spaceId: string, userId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!(await approveSpeaker(spaceId, session.user.id, userId))) {
    return { ok: false as const, error: "Couldn't allow that speaker. They may have left the space." };
  }
  return { ok: true as const };
}

// Host only: turn a guest's speaker off; they'd have to ask again.
export async function revokeSpeakerAction(spaceId: string, userId: string) {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Your session ended. Sign in again." };
  if (!(await revokeSpeaker(spaceId, session.user.id, userId))) {
    return { ok: false as const, error: "Only the host can turn speakers off." };
  }
  refresh();
  return { ok: true as const };
}
