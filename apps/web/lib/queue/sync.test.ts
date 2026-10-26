import { describe, expect, it } from "vitest";

import { afterJump, initialSync, median, SYNC, syncTick, type SyncState } from "./sync";

function run(state: SyncState, errors: number[], start = 10_000) {
  let s = state;
  let seeks = 0;
  errors.forEach((error, i) => {
    const tick = syncTick(s, error, start + i * SYNC.sampleMs);
    s = tick.state;
    if (tick.seek) seeks++;
  });
  return { state: s, seeks };
}

describe("sync", () => {
  it("takes the middle reading", () => {
    expect(median([0.1, 2, -0.3])).toBe(0.1);
    expect(median([1, 3])).toBe(2);
  });

  it("leaves a player that's close enough alone", () => {
    expect(run(initialSync(), [0.2, -0.3, 0.4, 0.1]).seeks).toBe(0);
  });

  it("ignores one stray reading", () => {
    expect(run(initialSync(), [0.1, 2.5, 0.2]).seeks).toBe(0);
  });

  it("seeks once it's steadily more than half a second off", () => {
    const { state, seeks } = run(initialSync(), [-0.8, -0.9, -0.7]);
    expect(seeks).toBe(1);
    expect(state.justSeeked).toBe(true);
    expect(state.samples).toEqual([]);
  });

  it("waits for buffering to settle after a seek", () => {
    const seeked = run(initialSync(), [-1, -1, -1], 0).state;
    const during = syncTick(seeked, -2, 2000); // still inside the cooldown
    expect(during.seek).toBe(false);
    expect(during.state).toBe(seeked);
  });

  it("learns to aim ahead when seeks land behind", () => {
    let state = run(initialSync(), [-1, -1, -1], 0).state; // seek 1
    state = run(state, [-0.6, -0.6, -0.6], 5000).state; // after the cooldown: landed 0.6 s behind, seek 2, lead grows
    expect(state.lead).toBeCloseTo(0.3);
    state = run(state, [-0.3, -0.3, -0.3], 10_000).state; // closer: within threshold, lead grows a little more
    expect(state.lead).toBeCloseTo(0.45);
    expect(state.justSeeked).toBe(false);
  });

  it("never aims further ahead than the cap", () => {
    let state: SyncState = { ...initialSync(), lead: 1.4, justSeeked: true };
    state = syncTick(syncTick(syncTick(state, -3, 0).state, -3, 1000).state, -3, 2000).state;
    expect(state.lead).toBe(SYNC.maxLead);
  });

  it("starts afresh after a jump", () => {
    const state = afterJump({ samples: [0.1, 0.2], lead: 0.4, justSeeked: false, cooldownUntil: 0 }, 5000);
    expect(state).toEqual({ samples: [], lead: 0.4, justSeeked: true, cooldownUntil: 5000 + SYNC.cooldownMs });
  });

  it("doesn't learn the lead from loading a new song", () => {
    let state = afterJump(initialSync(), 0, false);
    state = run(state, [-1.2, -1.2, -1.2], 3000).state; // start-up delay, then a corrective seek
    expect(state.lead).toBe(0);
  });
});
