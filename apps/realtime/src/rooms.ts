import type { Person, ServerMessage, SpaceStatus } from "@moozer/protocol/messages";

export type Member = { userId: string; name: string; send: (message: ServerMessage) => void };
type Change = { slug?: string; status?: SpaceStatus };
type Room = { members: Set<Member>; pending: Change | null; timer: ReturnType<typeof setTimeout> | null };

// Who's connected to which space, presence, and batched "changed" messages.
export class Rooms {
  private rooms = new Map<string, Room>();

  constructor(private batchMs = 100) {}

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
  }
}
