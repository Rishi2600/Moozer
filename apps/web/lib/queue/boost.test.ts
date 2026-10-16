import { describe, expect, it } from "vitest";

import { ballotVotes, BOOST_COOLDOWN_MS, boostReadyAt } from "./boost";

const t0 = Date.UTC(2026, 9, 16, 20, 0, 0);

describe("boosts", () => {
  it("are worth three votes each", () => {
    expect(ballotVotes(2, 0)).toBe(2);
    expect(ballotVotes(2, 1)).toBe(5);
    expect(ballotVotes(0, 2)).toBe(6);
  });

  it("are ready if you haven't used one here", () => {
    expect(boostReadyAt(null, t0)).toBeNull();
  });

  it("come back five and a half hours after you use one", () => {
    const used = new Date(t0);
    expect(boostReadyAt(used, t0 + 60_000)).toEqual(new Date(t0 + 5.5 * 3600_000));
    expect(boostReadyAt(used, t0 + BOOST_COOLDOWN_MS - 1)).not.toBeNull();
    expect(boostReadyAt(used, t0 + BOOST_COOLDOWN_MS)).toBeNull();
  });
});
