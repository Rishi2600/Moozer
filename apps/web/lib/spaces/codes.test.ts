import { describe, expect, it } from "vitest";

import {
  JOIN_CODE_ALPHABET,
  formatJoinCode,
  generateJoinCode,
  generateSlug,
  normalizeJoinCode,
  parseJoinInput,
  slugify,
} from "./codes";

describe("join codes", () => {
  it("are 6 characters from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateJoinCode();
      expect(code).toHaveLength(6);
      expect([...code].every((c) => JOIN_CODE_ALPHABET.includes(c))).toBe(true);
    }
  });

  it("never use look-alike characters", () => {
    expect(JOIN_CODE_ALPHABET).not.toMatch(/[01OIL]/);
  });

  it("format as XXX-XXX and normalize back from what people type", () => {
    expect(formatJoinCode("K7M2QX")).toBe("K7M-2QX");
    expect(normalizeJoinCode("k7m-2qx")).toBe("K7M2QX");
    expect(normalizeJoinCode(" K7M 2QX ")).toBe("K7M2QX");
  });

  it("reject the wrong length or look-alike characters", () => {
    expect(normalizeJoinCode("K7M2Q")).toBeNull();
    expect(normalizeJoinCode("K7M2QXX")).toBeNull();
    expect(normalizeJoinCode("K0M2QX")).toBeNull();
  });
});

describe("slugs", () => {
  it("turn a name into lowercase words joined by hyphens", () => {
    expect(slugify("Friday at the Studio!")).toBe("friday-at-the-studio");
    expect(slugify("  Café   Noël  ")).toBe("cafe-noel");
  });

  it("fall back to 'space' when nothing usable is left", () => {
    expect(slugify("🎉🎉")).toBe("space");
  });

  it("stay short without a trailing hyphen", () => {
    const slug = slugify("a".repeat(39) + " bcdef");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("end in a random 6-character part", () => {
    expect(generateSlug("Friday at the studio")).toMatch(/^friday-at-the-studio-[a-z2-9]{6}$/);
  });
});

describe("parseJoinInput", () => {
  it("reads a full link, a bare host link, or a path", () => {
    const slug = { kind: "slug", slug: "friday-at-the-studio-k7m2qx" };
    expect(parseJoinInput("https://moozer.app/s/friday-at-the-studio-k7m2qx")).toEqual(slug);
    expect(parseJoinInput("localhost:3000/s/Friday-At-The-Studio-K7M2QX/")).toEqual(slug);
    expect(parseJoinInput("/s/friday-at-the-studio-k7m2qx?from=qr")).toEqual(slug);
  });

  it("reads a join code", () => {
    expect(parseJoinInput("k7m-2qx")).toEqual({ kind: "code", code: "K7M2QX" });
  });

  it("returns null for anything else", () => {
    expect(parseJoinInput("")).toBeNull();
    expect(parseJoinInput("https://youtube.com/watch?v=abc")).toBeNull();
    expect(parseJoinInput("hello")).toBeNull();
  });
});
