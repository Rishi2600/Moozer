import { describe, expect, it } from "vitest";

import { ADDED, PEOPLE, SPACE_NAME, filmState } from "./scenes";

describe("the landing film's script", () => {
  it("types the space name, then the space goes live", () => {
    expect(filmState("start", 0).typed).toBe("");
    expect(filmState("start", 0.6).typed).toBe(SPACE_NAME);
    expect(filmState("start", 0.5).live).toBe(false);
    expect(filmState("start", 0.9)).toMatchObject({ live: true, dialogOpen: false });
  });

  it("fills the room while the link is shared", () => {
    expect(filmState("share", 0.1)).toMatchObject({ here: 1, phone: "scan" });
    expect(filmState("share", 1)).toMatchObject({ here: PEOPLE.length, phone: "joined" });
  });

  it("adds the phone's song partway through the add scene", () => {
    expect(filmState("add", 0.5).queue.some((s) => s.id === ADDED.id)).toBe(false);
    expect(filmState("add", 0.8).queue.some((s) => s.id === ADDED.id)).toBe(true);
  });

  it("lets the added song climb to the top during the vote", () => {
    expect(filmState("vote", 0).queue.at(-1)?.id).toBe(ADDED.id);
    expect(filmState("vote", 1).queue[0].id).toBe(ADDED.id);
  });

  it("starts the leader by itself when the song ends", () => {
    const before = filmState("play", 0.4);
    const after = filmState("play", 0.7);
    expect(before.playing.title).not.toBe(ADDED.title);
    expect(after.playing.title).toBe(ADDED.title);
    expect(after.queue.some((s) => s.id === ADDED.id)).toBe(false);
  });
});
