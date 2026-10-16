import { Bucket, REACTION_LIMIT } from "@moozer/protocol/limit";
import { CLOSE, type Person, type Reaction, type ServerMessage, type SpaceStatus } from "@moozer/protocol/messages";

export type Member = {
  userId: string;
  name: string;
  send: (message: ServerMessage) => void;
  close?: (code: number, reason: string) => void;
};
type Change = { slug?: string; status?: SpaceStatus };
type Room = { members: Set<Member>; pending: Change | null; timer: ReturnType<typeof setTimeout> | null };

// Who's connected to which space, presence, and batched "changed" messages.
// onCount hears every space's head count as it changes (0 when it empties).
export class Rooms {
  private rooms = new Map<string, Room>();
  private buckets = new WeakMap<Member, Bucket>();

  constructor(
    private batchMs = 100,
    private onCount: (spaceId: string, here: number) => void = () => {}
  ) {}

  join(spaceId: string, member: Member) {
    const room = this.rooms.get(spaceId) ?? { members: new Set(), pending: null, timer: null };
    this.rooms.set(spaceId, room);
    room.members.add(member);
    this.broadcastPresence(spaceId);
  }

  leave(spaceId: string, member: Member) {
    const room = this.rooms.get(spaceId);
    if (!room?.members.delete(member)) return;
    if (room.members.size === 0) {
      if (room.timer) clearTimeout(room.timer);
      this.rooms.delete(spaceId);
      this.onCount(spaceId, 0);
    } else {
      this.broadcastPresence(spaceId);
    }
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

  private broadcastPresence(spaceId: string) {
    const people = this.people(spaceId);
    const message: ServerMessage = { type: "presence", here: people.length, people };
    for (const member of this.rooms.get(spaceId)?.members ?? []) member.send(message);
    this.onCount(spaceId, people.length);
  }
}
