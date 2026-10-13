import { describe, expect, it } from "vitest";

import { leadMargin, sortQueue } from "./order";

const at = (minute: number) => new Date(2026, 9, 13, 20, minute);

describe("sortQueue", () => {
  it("puts the most votes first", () => {
    const sorted = sortQueue([
      { id: "a", votes: 2, addedAt: at(1) },
      { id: "b", votes: 12, addedAt: at(2) },
      { id: "c", votes: 9, addedAt: at(3) },
    ]);
    expect(sorted.map((s) => s.id)).toEqual(["b", "c", "a"]);
  });

  it("breaks ties by whichever song was added first", () => {
    const sorted = sortQueue([
      { id: "later", votes: 7, addedAt: at(9) },
      { id: "earlier", votes: 7, addedAt: at(4) },
    ]);
    expect(sorted.map((s) => s.id)).toEqual(["earlier", "later"]);
  });

  it("doesn't change the input array", () => {
    const items = [{ votes: 1, addedAt: at(1) }, { votes: 5, addedAt: at(2) }];
    sortQueue(items);
    expect(items[0].votes).toBe(1);
  });
});

describe("leadMargin", () => {
  it("is the gap between first and second", () => {
    expect(leadMargin([{ votes: 12 }, { votes: 9 }])).toBe(3);
  });

  it("counts a lone song's votes as its lead", () => {
    expect(leadMargin([{ votes: 4 }])).toBe(4);
  });

  it("is null when tied, empty, or nobody has voted", () => {
    expect(leadMargin([{ votes: 7 }, { votes: 7 }])).toBeNull();
    expect(leadMargin([])).toBeNull();
    expect(leadMargin([{ votes: 0 }])).toBeNull();
  });
});
