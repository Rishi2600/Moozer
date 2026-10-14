import { randomInt } from "node:crypto";

// Join codes are read off a TV and typed on a phone, so leave out
// look-alikes: no 0/O, 1/I/L.
export const JOIN_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const JOIN_CODE_LENGTH = 6;
const SLUG_SUFFIX_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function randomString(alphabet: string, length: number) {
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[randomInt(alphabet.length)];
  return out;
}

export function generateJoinCode() {
  return randomString(JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH);
}

// "K7M2QX" -> "K7M-2QX"
export function formatJoinCode(code: string) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

// Accepts "k7m-2qx", "K7M 2QX", etc. Returns the stored form or null.
export function normalizeJoinCode(input: string) {
  const code = input.toUpperCase().replace(/[\s-]/g, "");
  if (code.length !== JOIN_CODE_LENGTH) return null;
  return [...code].every((c) => JOIN_CODE_ALPHABET.includes(c)) ? code : null;
}

// "Friday at the Studio!" -> "friday-at-the-studio"
export function slugify(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug || "space";
}

// The slug is the invite link, so it ends in a random part people can't guess.
export function generateSlug(name: string) {
  return `${slugify(name)}-${randomString(SLUG_SUFFIX_ALPHABET, 6)}`;
}

export const SPACE_NAME_MAX = 60;

// Trimmed, single-spaced, 1–60 characters; null if it doesn't fit.
export function cleanSpaceName(raw: unknown) {
  if (typeof raw !== "string") return null;
  const name = raw.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= SPACE_NAME_MAX ? name : null;
}

export const SPACE_DESCRIPTION_MAX = 80;

// The optional one-liner under a space's name ("Warm house & melodic grooves").
// Blank means none (null); undefined means it doesn't fit.
export function cleanSpaceDescription(raw: unknown) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "string") return undefined;
  const text = raw.trim().replace(/\s+/g, " ");
  if (!text) return null;
  return text.length <= SPACE_DESCRIPTION_MAX ? text : undefined;
}

export type JoinTarget = { kind: "slug"; slug: string } | { kind: "code"; code: string };

// What someone pasted into "Join with a link": a full link, a /s/ path, or a code.
export function parseJoinInput(input: string): JoinTarget | null {
  const value = input.trim();
  if (!value) return null;
  const path = value.match(/(?:^|\/)s\/([a-z0-9-]+)\/?(?:[?#].*)?$/i);
  if (path) return { kind: "slug", slug: path[1].toLowerCase() };
  const code = normalizeJoinCode(value);
  return code ? { kind: "code", code } : null;
}
