import { afterEach, describe, expect, it, vi } from "vitest";

import { CountWriter } from "./counts";

afterEach(() => vi.useRealTimers());

describe("CountWriter", () => {
  it("writes a burst of changes once, with the latest count per space", async () => {
    vi.useFakeTimers();
    const writes: Array<Record<string, number>> = [];
    const counts = new CountWriter(async (c) => void writes.push(Object.fromEntries(c)), 1000);
    counts.set("s1", 1);
    counts.set("s1", 2);
    counts.set("s2", 5);
    expect(writes).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(writes).toEqual([{ s1: 2, s2: 5 }]);
  });

  it("skips counts that haven't changed since the last write", async () => {
    const writes: Array<Record<string, number>> = [];
    const counts = new CountWriter(async (c) => void writes.push(Object.fromEntries(c)));
    counts.set("s1", 2);
    await counts.flush();
    counts.set("s1", 2); // another tab from someone already here
    counts.set("s2", 0); // never written, already 0 in the database
    await counts.flush();
    expect(writes).toEqual([{ s1: 2 }]);
  });

  it("tries again on the next change after a failed write", async () => {
    let fail = true;
    const writes: Array<Record<string, number>> = [];
    const counts = new CountWriter(async (c) => {
      if (fail) throw new Error("db down");
      writes.push(Object.fromEntries(c));
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    counts.set("s1", 3);
    await counts.flush();
    fail = false;
    counts.set("s1", 3);
    await counts.flush();
    expect(writes).toEqual([{ s1: 3 }]);
  });
});
