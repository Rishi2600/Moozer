import { Bucket, REACTION_LIMIT } from "@moozer/protocol/limit";
import {
  CLOSE,
  SPEAKER_RULES,
  type Device,
  type Person,
  type Reaction,
  type ServerMessage,
  type Speaker,
  type SpaceStatus,
} from "@moozer/protocol/messages";

export type Member = {
  userId: string;
  name: string;
  host?: boolean; // from the ticket
  device?: Device | null; // set while this screen plays the music with sound
  send: (message: ServerMessage) => void;
  close?: (code: number, reason: string) => void;
};
type Change = { slug?: string; status?: SpaceStatus };
type Request = { person: Person; expiresAt: number; timer: ReturnType<typeof setTimeout> };
type Room = {
  members: Set<Member>;
  pending: Change | null;
  timer: ReturnType<typeof setTimeout> | null;
  requests: Map<string, Request>; // guests waiting for the host's answer
  notNowUntil: Map<string, number>; // when a guest may ask again after "Not now"
};

// Who's connected to which space, presence, batched "changed" messages, and
// guest speakers (requests, answers, who's playing).
// onCount hears every space's head count as it changes (0 when it empties).
// onSpeakersGone hears when a space has had no speaker for
// SPEAKER_RULES.emptyPauseMs (so its song can pause).
export class Rooms {
  private rooms = new Map<string, Room>();
  private buckets = new WeakMap<Member, Bucket>();
  private quiet = new Map<string, ReturnType<typeof setTimeout>>(); // spaces counting down to a pause

  constructor(
    private batchMs = 100,
    private onCount: (spaceId: string, here: number) => void = () => {},
    private onSpeakersGone: (spaceId: string) => void = () => {}
  ) {}

  join(spaceId: string, member: Member) {
    const room = this.rooms.get(spaceId) ?? { members: new Set(), pending: null, timer: null, requests: new Map(), notNowUntil: new Map() };
    this.rooms.set(spaceId, room);
    room.members.add(member);
    this.broadcastPresence(spaceId);
    if (member.host) {
      member.send(this.requestsMessage(room));
      member.send(this.speakersMessage(room));
    }
  }

  leave(spaceId: string, member: Member) {
    const room = this.rooms.get(spaceId);
    if (!room?.members.delete(member)) return;
    if (room.members.size === 0) {
      if (room.timer) clearTimeout(room.timer);
      for (const request of room.requests.values()) clearTimeout(request.timer);
      this.rooms.delete(spaceId);
      this.onCount(spaceId, 0);
      if (member.device) this.speakersChanged(spaceId);
      return;
    }
    this.broadcastPresence(spaceId);
    if (member.device) {
      this.toHost(room, this.speakersMessage(room));
      this.speakersChanged(spaceId);
    }
    // A guest who closed every screen isn't waiting any more.
    const request = room.requests.get(member.userId);
    if (request && ![...room.members].some((m) => m.userId === member.userId)) {
      clearTimeout(request.timer);
      room.requests.delete(member.userId);
      this.toHost(room, this.requestsMessage(room));
    }
  }

  // A guest asks to play the music on their device too. One open request
  // each; after "Not now" they wait. The answer goes to all their screens.
  requestSpeaker(spaceId: string, from: Member, now = Date.now()) {
    const room = this.rooms.get(spaceId);
    if (!room?.members.has(from) || from.host) return "ignored" as const;
    if (room.requests.has(from.userId)) return "pending" as const;
    const retryAt = room.notNowUntil.get(from.userId);
    if (retryAt !== undefined && retryAt > now) {
      from.send({ type: "speaker-answer", answer: "declined", retryAt });
      return "wait" as const;
    }
    room.notNowUntil.delete(from.userId);
    const expiresAt = now + SPEAKER_RULES.answerWithinMs;
    const timer = setTimeout(() => {
      if (room.requests.get(from.userId)?.expiresAt !== expiresAt) return;
      room.requests.delete(from.userId);
      this.toUser(room, from.userId, { type: "speaker-answer", answer: "expired" });
      this.toHost(room, this.requestsMessage(room));
    }, SPEAKER_RULES.answerWithinMs);
    room.requests.set(from.userId, { person: { id: from.userId, name: from.name }, expiresAt, timer });
    this.toHost(room, this.requestsMessage(room));
    return "asked" as const;
  }

  // The host's answer. Allowing is only sent once the website has stored the
  // approval, so it's relayed even if the request had already expired.
  answerSpeaker(spaceId: string, host: Member, userId: string, allow: boolean, now = Date.now()) {
    const room = this.rooms.get(spaceId);
    if (!room?.members.has(host) || !host.host || userId === host.userId) return false;
    const request = room.requests.get(userId);
    if (!request && !allow) return false;
    if (request) {
      clearTimeout(request.timer);
      room.requests.delete(userId);
    }
    if (allow) {
      this.toUser(room, userId, { type: "speaker-answer", answer: "allowed" });
    } else {
      const retryAt = now + SPEAKER_RULES.askAgainAfterMs;
      room.notNowUntil.set(userId, retryAt);
      this.toUser(room, userId, { type: "speaker-answer", answer: "declined", retryAt });
    }
    this.toHost(room, this.requestsMessage(room));
    return true;
  }

  // A screen started (device) or stopped (null) playing with sound. Guests
  // must be approved; the caller checks that before turning one on.
  setSpeaker(spaceId: string, member: Member, device: Device | null) {
    const room = this.rooms.get(spaceId);
    if (!room?.members.has(member) || (member.device ?? null) === device) return false;
    member.device = device;
    this.toHost(room, this.speakersMessage(room));
    this.speakersChanged(spaceId);
    return true;
  }

  // Screens playing the music with sound right now.
  speakerCount(spaceId: string) {
    let n = 0;
    for (const m of this.rooms.get(spaceId)?.members ?? []) if (m.device) n++;
    return n;
  }

  // A burst of changes (votes landing together) becomes one message.
  changed(spaceId: string, change: Change = {}) {
    const room = this.rooms.get(spaceId);
    if (!room) return;
    room.pending = { ...room.pending, ...change };
    room.timer ??= setTimeout(() => {
      const message: ServerMessage = { type: "changed", ...room.pending };
      room.pending = null;
      room.timer = null;
      for (const member of room.members) member.send(message);
    }, this.batchMs);
  }

  // A reaction goes straight to everyone else's screens (the sender shows
  // their own at once). Over the rate limit it's dropped. Returns whether it went out.
  react(spaceId: string, from: Member, emoji: Reaction, now = Date.now()) {
    const room = this.rooms.get(spaceId);
    if (!room?.members.has(from)) return false;
    let bucket = this.buckets.get(from);
    if (!bucket) this.buckets.set(from, (bucket = new Bucket(REACTION_LIMIT.burst, REACTION_LIMIT.perSecond, now)));
    if (!bucket.take(now)) return false;
    const message: ServerMessage = { type: "reaction", emoji, from: { id: from.userId, name: from.name } };
    for (const member of room.members) if (member !== from) member.send(message);
    return true;
  }

  // The host removed someone: close every screen they have open here.
  remove(spaceId: string, userId: string) {
    for (const member of [...(this.rooms.get(spaceId)?.members ?? [])]) {
      if (member.userId !== userId) continue;
      member.close?.(CLOSE.removed, "removed from the space");
      this.leave(spaceId, member);
    }
  }

  // Unique people, in the order they arrived; several tabs count once.
  people(spaceId: string): Person[] {
    const seen = new Map<string, Person>();
    for (const m of this.rooms.get(spaceId)?.members ?? []) {
      if (!seen.has(m.userId)) seen.set(m.userId, { id: m.userId, name: m.name });
    }
    return [...seen.values()];
  }

  stats() {
    let connections = 0;
    for (const room of this.rooms.values()) connections += room.members.size;
    return { spaces: this.rooms.size, connections };
  }

  // The last speaker going quiet starts the countdown to a pause; any
  // speaker coming back cancels it.
  private speakersChanged(spaceId: string) {
    const count = this.speakerCount(spaceId);
    const timer = this.quiet.get(spaceId);
    if (count > 0) {
      if (timer) clearTimeout(timer);
      this.quiet.delete(spaceId);
    } else if (!timer) {
      this.quiet.set(
        spaceId,
        setTimeout(() => {
          this.quiet.delete(spaceId);
          if (this.speakerCount(spaceId) === 0) this.onSpeakersGone(spaceId);
        }, SPEAKER_RULES.emptyPauseMs)
      );
    }
  }

  // Per screen, so the host sees "Maya's laptop" and "TV" separately; the same
  // person on the same kind of device twice shows once.
  private speakersMessage(room: Room): ServerMessage {
    const seen = new Map<string, Speaker>();
    for (const m of room.members) {
      if (!m.device) continue;
      const key = `${m.userId}:${m.device}`;
      if (!seen.has(key)) seen.set(key, { id: m.userId, name: m.name, device: m.device, host: m.host === true });
    }
    return { type: "speakers", speakers: [...seen.values()] };
  }

  private requestsMessage(room: Room): ServerMessage {
    const requests = [...room.requests.values()].sort((a, b) => a.expiresAt - b.expiresAt);
    return { type: "speaker-requests", requests: requests.map((r) => ({ ...r.person, expiresAt: r.expiresAt })) };
  }

  private toHost(room: Room, message: ServerMessage) {
    for (const m of room.members) if (m.host) m.send(message);
  }

  private toUser(room: Room, userId: string, message: ServerMessage) {
    for (const m of room.members) if (m.userId === userId) m.send(message);
  }

  private broadcastPresence(spaceId: string) {
    const people = this.people(spaceId);
    const message: ServerMessage = { type: "presence", here: people.length, people };
    for (const member of this.rooms.get(spaceId)?.members ?? []) member.send(message);
    this.onCount(spaceId, people.length);
  }
}
