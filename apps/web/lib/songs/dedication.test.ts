import { describe, expect, it } from "vitest";

import { cleanDedication, DEDICATION_MAX } from "./dedication";

describe("dedications", () => {
  it("are optional", () => {
    expect(cleanDedication(undefined)).toEqual({ ok: true, value: null });
    expect(cleanDedication("   ")).toEqual({ ok: true, value: null });
  });

  it("become one tidy line", () => {
    expect(cleanDedication("  For Sam's\n\nbirthday  🎂 ")).toEqual({ ok: true, value: "For Sam's birthday 🎂" });
  });

  it("lose control and direction-changing characters", () => {
    expect(cleanDedication("hi\u202Eereht\u0007")).toEqual({ ok: true, value: "hi ereht" });
  });

  it("keep emoji built from several characters", () => {
    expect(cleanDedication("for us \u{1F469}\u200D\u{1F469}\u200D\u{1F467}")).toEqual({ ok: true, value: "for us \u{1F469}\u200D\u{1F469}\u200D\u{1F467}" });
  });

  it("count an emoji as one character, like the database", () => {
    expect(cleanDedication("🎂".repeat(DEDICATION_MAX)).ok).toBe(true);
    expect(cleanDedication("a".repeat(DEDICATION_MAX + 1)).ok).toBe(false);
  });

  it("reject anything that isn't text", () => {
    expect(cleanDedication(42).ok).toBe(false);
  });
});
