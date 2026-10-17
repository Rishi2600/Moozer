import { describe, expect, it } from "vitest";

import { crowdFavourite, mostBoosted, nightLength, topSong, type PlayedSong } from "./recap-rules";

const t0 = Date.UTC(2026, 9, 17, 20, 0, 0);
const maya = { id: "maya", name: "Maya Chen" };
const sam = { id: "sam", name: "Sam Lee" };
const song = (id: string, finalVotes: number, minute: number, addedBy = maya, boosts = 0): PlayedSong => ({
  id,
  title: id,
  thumbnailUrl: "",
  finalVotes,
  boosts,
  startedAt: new Date(t0 + minute * 60_000),
  addedBy,
});

describe("the recap", () => {
  it("picks the top song, earliest on a tie", () => {
    expect(topSong([song("a", 3, 0), song("b", 7, 5), song("c", 7, 9)])?.id).toBe("b");
    expect(topSong([])).toBeNull();
  });

  it("adds up votes per person for the crowd favourite", () => {
    const played = [song("a", 4, 0, maya), song("b", 3, 5, sam), song("c", 3, 9, sam)];
    expect(crowdFavourite(played)).toMatchObject({ name: "Sam Lee", votes: 6, songs: 2 });
  });

  it("has no crowd favourite when nothing got a vote", () => {
    expect(crowdFavourite([song("a", 0, 0)])).toBeNull();
  });

  it("names the most boosted song only if something was boosted", () => {
    expect(mostBoosted([song("a", 1, 0, maya, 0), song("b", 1, 5, sam, 2)])?.id).toBe("b");
    expect(mostBoosted([song("a", 1, 0)])).toBeNull();
  });

  it("says how long the night ran", () => {
    expect(nightLength(t0, t0 + 192 * 60_000)).toBe("3h 12m");
    expect(nightLength(t0, t0 + 45 * 60_000)).toBe("45m");
    expect(nightLength(t0, t0 + 20_000)).toBe("Under a minute");
    expect(nightLength(t0, t0 + 20_000, true)).toBe("<1m");
  });
});
