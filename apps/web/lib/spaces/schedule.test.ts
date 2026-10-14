import { describe, expect, it } from "vitest";

import { SCHEDULE_MAX_DAYS, formatOpensAt, parseScheduledFor, toLocalInputValue } from "./schedule";

const now = new Date(2026, 9, 15, 18, 30).getTime(); // Thu 15 Oct 2026, 18:30 local

describe("parseScheduledFor", () => {
  it("accepts a time ahead, within the limit", () => {
    const at = new Date(now + 2 * 3600_000);
    expect(parseScheduledFor(at.toISOString(), now)).toEqual({ ok: true, date: at });
  });

  it("rejects missing, unreadable, past and too-far times", () => {
    expect(parseScheduledFor(null, now)).toMatchObject({ ok: false });
    expect(parseScheduledFor("", now)).toMatchObject({ ok: false });
    expect(parseScheduledFor("next friday", now)).toMatchObject({ ok: false });
    expect(parseScheduledFor(new Date(now - 60_000).toISOString(), now)).toEqual({ ok: false, error: "Pick a time in the future." });
    expect(parseScheduledFor(new Date(now + 30_000).toISOString(), now)).toMatchObject({ ok: false }); // under a minute
    const tooFar = new Date(now + (SCHEDULE_MAX_DAYS + 1) * 86_400_000);
    expect(parseScheduledFor(tooFar.toISOString(), now)).toMatchObject({ ok: false, error: expect.stringContaining("90 days") });
  });
});

describe("formatOpensAt", () => {
  const today = new Date(now);
  it("says today and tomorrow by name", () => {
    expect(formatOpensAt(new Date(2026, 9, 15, 20, 0), today, "en-GB")).toBe("Today 20:00");
    expect(formatOpensAt(new Date(2026, 9, 16, 9, 5), today, "en-GB")).toBe("Tomorrow 09:05");
  });

  it("gives the date further out", () => {
    expect(formatOpensAt(new Date(2026, 9, 17, 20, 0), today, "en-GB")).toBe("Sat 17 Oct, 20:00");
  });
});

it("formats a date for a datetime-local input", () => {
  expect(toLocalInputValue(new Date(2026, 0, 5, 7, 3))).toBe("2026-01-05T07:03");
});
