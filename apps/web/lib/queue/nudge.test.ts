import { describe, expect, it } from "vitest";

import { nudgeFor, type QueueSnapshot } from "./nudge";

const mine = { id: "a", addedById: "me", title: "Golden Hour" };
const theirs = { id: "b", addedById: "sam", title: "Midnight City" };
const snap = (playing: QueueSnapshot["playing"], leader: QueueSnapshot["leader"], queuedIds: string[]) => ({ playing, leader, queuedIds });

describe("up next nudges", () => {
  it("stay quiet on the first look", () => {
    expect(nudgeFor(null, snap(null, mine, ["a"]), "me")).toBeNull();
  });

  it("tell you when your song climbs into Plays next", () => {
    expect(nudgeFor(snap(null, theirs, ["b", "a"]), snap(null, mine, ["a", "b"]), "me")).toBe("Your song is up next: Golden Hour");
  });

  it("don't repeat while your song stays on top", () => {
    expect(nudgeFor(snap(null, mine, ["a"]), snap(null, mine, ["a", "b"]), "me")).toBeNull();
  });

  it("leave a song you just added to the Added to queue toast", () => {
    expect(nudgeFor(snap(null, null, []), snap(null, mine, ["a"]), "me")).toBeNull();
  });

  it("tell you when your song starts playing", () => {
    expect(nudgeFor(snap(theirs, mine, ["a"]), snap(mine, null, []), "me")).toBe("Your song is playing: Golden Hour");
  });

  it("ignore other people's songs", () => {
    expect(nudgeFor(snap(null, mine, ["a", "b"]), snap(theirs, null, ["a"]), "me")).toBeNull();
  });
});
