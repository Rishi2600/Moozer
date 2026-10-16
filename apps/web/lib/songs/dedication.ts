export const DEDICATION_MAX = 60;

// Control characters, zero-width marks and the characters that flip text
// direction (which could disguise what a dedication says). The zero-width
// joiner stays: emoji like 👩‍👩‍👧 are built with it.
const UNSAFE = /(?!\u200D)[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu;

// A dedication as stored: one line, unsafe characters gone, spaces squeezed,
// null when empty. Too long is an error rather than a silent cut.
// Length counts characters the way Postgres does (an emoji is one).
export function cleanDedication(input: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (input === undefined || input === null) return { ok: true, value: null };
  if (typeof input !== "string") return { ok: false, error: "That dedication can't be used." };
  const value = input.replace(UNSAFE, " ").replace(/\s+/g, " ").trim();
  if (!value) return { ok: true, value: null };
  if ([...value].length > DEDICATION_MAX) return { ok: false, error: `Keep the dedication to ${DEDICATION_MAX} characters.` };
  return { ok: true, value };
}
