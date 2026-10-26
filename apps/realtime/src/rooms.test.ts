import type { ServerMessage } from "@moozer/protocol/messages";
import { describe, expect, it, vi } from "vitest";

import { Rooms, type Member } from "./rooms";

function member(userId: string, name = userId, host = false) {
  const inbox: ServerMessage[] = [];
  const m: Member = { userId, name, host, send: (msg) => inbox.push(msg) };
  return { m, inbox };
}

const last = (inbox: ServerMessage[], type: ServerMessage["type"]) => inbox.filter((msg) => msg.type === type).at(-1);

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

  it("reports head counts, including 0 when a space empties", () => {
    const counts: Array<[string, number]> = [];
    const rooms = new Rooms(100, (id, here) => counts.push([id, here]));
    const a1 = member("maya"), a2 = member("maya");
    rooms.join("s1", a1.m);
    rooms.join("s1", a2.m);
    rooms.leave("s1", a1.m);
    rooms.leave("s1", a2.m);
    expect(counts).toEqual([["s1", 1], ["s1", 1], ["s1", 1], ["s1", 0]]);
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

describe("Reactions", () => {
  it("go to everyone else in the space, with who sent them", () => {
    const rooms = new Rooms();
    const maya = member("maya", "Maya"), leo = member("leo", "Leo"), other = member("zed");
    rooms.join("s1", maya.m);
    rooms.join("s1", leo.m);
    rooms.join("s2", other.m);
    for (const x of [maya, leo, other]) x.inbox.length = 0;
    expect(rooms.react("s1", maya.m, "🔥")).toBe(true);
    expect(leo.inbox).toEqual([{ type: "reaction", emoji: "🔥", from: { id: "maya", name: "Maya" } }]);
    expect(maya.inbox).toEqual([]);
    expect(other.inbox).toEqual([]);
  });

  it("are dropped from someone not in the room", () => {
    const rooms = new Rooms();
    const leo = member("leo");
    rooms.join("s1", leo.m);
    expect(rooms.react("s1", member("maya").m, "🔥")).toBe(false);
  });

  it("are rate limited per screen", () => {
    const rooms = new Rooms();
    const maya = member("maya"), leo = member("leo");
    rooms.join("s1", maya.m);
    rooms.join("s1", leo.m);
    const sent = Array.from({ length: 10 }, () => rooms.react("s1", maya.m, "🙌", 1000));
    expect(sent.filter(Boolean)).toHaveLength(6);
    expect(rooms.react("s1", maya.m, "🙌", 2000)).toBe(true); // refilled a second later
  });
});

describe("Removing someone", () => {
  it("closes their screens and updates presence", () => {
    const rooms = new Rooms();
    const closed: number[] = [];
    const maya = member("maya");
    const leo1 = member("leo"), leo2 = member("leo");
    leo1.m.close = (code) => closed.push(code);
    leo2.m.close = (code) => closed.push(code);
    rooms.join("s1", maya.m);
    rooms.join("s1", leo1.m);
    rooms.join("s1", leo2.m);
    rooms.remove("s1", "leo");
    expect(closed).toEqual([4003, 4003]);
    expect(maya.inbox.at(-1)).toMatchObject({ here: 1 });
    expect(rooms.react("s1", leo1.m, "🔥")).toBe(false);
  });

  describe("speakers", () => {
    function room() {
      const rooms = new Rooms();
      const host = member("maya", "Maya", true), sam = member("sam", "Sam"), leo = member("leo", "Leo");
      for (const p of [host, sam, leo]) rooms.join("s1", p.m);
      return { rooms, host, sam, leo };
    }

    it("shows a guest's request on the host's screens only", () => {
      const { rooms, host, sam, leo } = room();
      expect(rooms.requestSpeaker("s1", sam.m, 1000)).toBe("asked");
      expect(last(host.inbox, "speaker-requests")).toEqual({ type: "speaker-requests", requests: [{ id: "sam", name: "Sam", expiresAt: 61_000 }] });
      expect(last(leo.inbox, "speaker-requests")).toBeUndefined();
      expect(rooms.requestSpeaker("s1", sam.m, 2000)).toBe("pending"); // one open request each
    });

    it("ignores requests from the host", () => {
      const { rooms, host } = room();
      expect(rooms.requestSpeaker("s1", host.m)).toBe("ignored");
    });

    it("tells every screen of the guest when the host allows", () => {
      const { rooms, host, sam } = room();
      const samPhone = member("sam", "Sam");
      rooms.join("s1", samPhone.m);
      rooms.requestSpeaker("s1", sam.m);
      expect(rooms.answerSpeaker("s1", host.m, "sam", true)).toBe(true);
      expect(last(sam.inbox, "speaker-answer")).toEqual({ type: "speaker-answer", answer: "allowed" });
      expect(last(samPhone.inbox, "speaker-answer")).toEqual({ type: "speaker-answer", answer: "allowed" });
      expect(last(host.inbox, "speaker-requests")).toMatchObject({ requests: [] });
    });

    it("makes a guest wait 2 minutes after Not now", () => {
      const { rooms, host, sam } = room();
      rooms.requestSpeaker("s1", sam.m, 0);
      rooms.answerSpeaker("s1", host.m, "sam", false, 1000);
      expect(last(sam.inbox, "speaker-answer")).toEqual({ type: "speaker-answer", answer: "declined", retryAt: 121_000 });
      expect(rooms.requestSpeaker("s1", sam.m, 60_000)).toBe("wait");
      expect(rooms.requestSpeaker("s1", sam.m, 121_000)).toBe("asked");
    });

    it("only lets the host answer", () => {
      const { rooms, sam, leo } = room();
      rooms.requestSpeaker("s1", sam.m);
      expect(rooms.answerSpeaker("s1", leo.m, "sam", true)).toBe(false);
      expect(last(sam.inbox, "speaker-answer")).toBeUndefined();
    });

    it("expires an unanswered request after a minute", () => {
      vi.useFakeTimers();
      const { rooms, host, sam } = room();
      rooms.requestSpeaker("s1", sam.m);
      vi.advanceTimersByTime(60_000);
      expect(last(sam.inbox, "speaker-answer")).toEqual({ type: "speaker-answer", answer: "expired" });
      expect(last(host.inbox, "speaker-requests")).toMatchObject({ requests: [] });
      vi.useRealTimers();
    });

    it("drops a request when the guest closes every screen", () => {
      const { rooms, host, sam } = room();
      rooms.requestSpeaker("s1", sam.m);
      rooms.leave("s1", sam.m);
      expect(last(host.inbox, "speaker-requests")).toMatchObject({ requests: [] });
    });

    it("lists who's playing for the host and counts screens", () => {
      const { rooms, host, sam } = room();
      const tv = member("maya", "Maya", true);
      rooms.join("s1", tv.m);
      rooms.setSpeaker("s1", host.m, "laptop");
      rooms.setSpeaker("s1", tv.m, "tv");
      rooms.setSpeaker("s1", sam.m, "phone");
      expect(last(host.inbox, "speakers")).toEqual({
        type: "speakers",
        speakers: [
          { id: "maya", name: "Maya", device: "laptop", host: true },
          { id: "sam", name: "Sam", device: "phone", host: false },
          { id: "maya", name: "Maya", device: "tv", host: true },
        ],
      });
      expect(rooms.speakerCount("s1")).toBe(3);
      rooms.leave("s1", sam.m);
      expect(rooms.speakerCount("s1")).toBe(2);
      expect(last(host.inbox, "speakers")).toMatchObject({ speakers: [{ device: "laptop" }, { device: "tv" }] });
    });

    it("sends a host who opens a screen the current requests and speakers", () => {
      const { rooms, sam } = room();
      rooms.requestSpeaker("s1", sam.m, 0);
      const late = member("maya", "Maya", true);
      rooms.join("s1", late.m);
      expect(last(late.inbox, "speaker-requests")).toMatchObject({ requests: [{ id: "sam" }] });
      expect(last(late.inbox, "speakers")).toEqual({ type: "speakers", speakers: [] });
    });

    it("pauses after 20 s with no speaker, unless one comes back", () => {
      vi.useFakeTimers();
      const gone: string[] = [];
      const rooms = new Rooms(100, () => {}, (spaceId) => gone.push(spaceId));
      const host = member("maya", "Maya", true), sam = member("sam", "Sam");
      rooms.join("s1", host.m);
      rooms.join("s1", sam.m);
      rooms.setSpeaker("s1", host.m, "laptop");
      rooms.setSpeaker("s1", sam.m, "phone");
      rooms.leave("s1", host.m);
      vi.advanceTimersByTime(30_000);
      expect(gone).toEqual([]); // Sam's still playing
      rooms.setSpeaker("s1", sam.m, null);
      vi.advanceTimersByTime(10_000);
      rooms.setSpeaker("s1", sam.m, "phone"); // back in time
      vi.advanceTimersByTime(30_000);
      expect(gone).toEqual([]);
      rooms.leave("s1", sam.m); // the room is empty now
      vi.advanceTimersByTime(19_000);
      expect(gone).toEqual([]);
      vi.advanceTimersByTime(1000);
      expect(gone).toEqual(["s1"]);
      vi.useRealTimers();
    });

    it("doesn't count down in a space that never had a speaker", () => {
      vi.useFakeTimers();
      const gone: string[] = [];
      const rooms = new Rooms(100, () => {}, (spaceId) => gone.push(spaceId));
      const leo = member("leo");
      rooms.join("s1", leo.m);
      rooms.leave("s1", leo.m);
      vi.advanceTimersByTime(60_000);
      expect(gone).toEqual([]);
      vi.useRealTimers();
    });
  });
});
