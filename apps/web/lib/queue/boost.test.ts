import { describe, expect, it } from "vitest";

import { ballotVotes } from "./boost";

describe("boosts", () => {
  it("are worth three votes each", () => {
    expect(ballotVotes(2, 0)).toBe(2);
    expect(ballotVotes(2, 1)).toBe(5);
    expect(ballotVotes(0, 2)).toBe(6);
  });
});
