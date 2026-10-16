import { describe, expect, it } from "vitest";

import { isPaused, positionMs, resumedAnchor, seekedState } from "./playback";

const t0 = Date.UTC(2026, 9, 14, 20, 0, 0);

describe("playback position", () => {
  it("counts up from the anchor while playing", () => {
    expect(positionMs({ anchorAt: new Date(t0), pausedAtMs: null }, t0 + 134_000)).toBe(134_000);
  });

  it("stays put while paused", () => {
    const state = { anchorAt: new Date(t0), pausedAtMs: 60_000 };
    expect(positionMs(state, t0 + 500_000)).toBe(60_000);
    expect(isPaused(state)).toBe(true);
  });

  it("carries on from the pause after resuming", () => {
    const resumeAt = t0 + 300_000;
    const anchor = resumedAnchor(60_000, resumeAt);
    expect(positionMs({ anchorAt: anchor, pausedAtMs: null }, resumeAt + 5_000)).toBe(65_000);
  });

  it("is never negative and is zero without an anchor", () => {
    expect(positionMs({ anchorAt: new Date(t0 + 10_000), pausedAtMs: null }, t0)).toBe(0);
    expect(positionMs({ anchorAt: null, pausedAtMs: null }, t0)).toBe(0);
  });
});

describe("jumping forward and back", () => {
  const playing = { anchorAt: new Date(t0), pausedAtMs: null };
  const now = t0 + 60_000;

  it("moves a playing song's anchor so every screen jumps together", () => {
    expect(positionMs(seekedState(playing, 10_000, 200, now), now)).toBe(70_000);
    expect(positionMs(seekedState(playing, -10_000, 200, now), now)).toBe(50_000);
  });

  it("moves the frozen position of a paused song and keeps it paused", () => {
    const paused = { anchorAt: new Date(t0), pausedAtMs: 60_000 };
    expect(seekedState(paused, 10_000, 200, now)).toEqual({ anchorAt: paused.anchorAt, pausedAtMs: 70_000 });
  });

  it("stops at the start", () => {
    expect(positionMs(seekedState(playing, -90_000, 200, now), now)).toBe(0);
  });

  it("stops a second before the end when the length is known", () => {
    expect(positionMs(seekedState(playing, 10_000, 65, now), now)).toBe(64_000);
    expect(positionMs(seekedState(playing, 600_000, null, now), now)).toBe(660_000);
  });
});
