import { describe, expect, it } from "vitest";

import { isPaused, positionMs, resumedAnchor } from "./playback";

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
