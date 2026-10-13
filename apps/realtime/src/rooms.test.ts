import type { ServerMessage } from "@moozer/protocol/messages";
import { describe, expect, it, vi } from "vitest";

import { Rooms, type Member } from "./rooms";

function member(userId: string, name = userId) {
  const inbox: ServerMessage[] = [];
  const m: Member = { userId, name, send: (msg) => inbox.push(msg) };
  return { m, inbox };
}

describe("Rooms", () => {
  it("counts people, not tabs", () => {
    const rooms = new Rooms();
    const a1 = member("maya"), a2 = member("maya"), b = member("leo");
    rooms.join("s1", a1.m);
    rooms.join("s1", a2.m);
    rooms.join("s1", b.m);
    expect(b.inbox.at(-1)).toEqual({ type: "presence", here: 2, people: [{ id: "maya", name: "maya" }, { id: "leo", name: "leo" }] });
    rooms.leave("s1", a1.m);
    expect(b.inbox.at(-1)).toMatchObject({ here: 2 }); // Maya still has a tab open
    rooms.leave("s1", a2.m);
    expect(b.inbox.at(-1)).toMatchObject({ here: 1 });
  });

  it("keeps spaces separate", () => {
    const rooms = new Rooms();
    const a = member("maya"), b = member("leo");
    rooms.join("s1", a.m);
    rooms.join("s2", b.m);
    expect(a.inbox.at(-1)).toMatchObject({ here: 1 });
    expect(rooms.stats()).toEqual({ spaces: 2, connections: 2 });
  });

  it("batches a burst of changes into one message per screen", () => {
    vi.useFakeTimers();
    const rooms = new Rooms(100);
    const a = member("maya");
    rooms.join("s1", a.m);
    a.inbox.length = 0;
    rooms.changed("s1");
    rooms.changed("s1");
    rooms.changed("s1", { slug: "new-slug", status: "live" });
    expect(a.inbox).toHaveLength(0);
    vi.advanceTimersByTime(100);
    expect(a.inbox).toEqual([{ type: "changed", slug: "new-slug", status: "live" }]);
    vi.useRealTimers();
  });

  it("ignores changes for spaces nobody has open and forgets empty rooms", () => {
    const rooms = new Rooms();
    rooms.changed("nobody-here");
    const a = member("maya");
    rooms.join("s1", a.m);
    rooms.leave("s1", a.m);
    expect(rooms.stats()).toEqual({ spaces: 0, connections: 0 });
  });
});
