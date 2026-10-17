// Searching YouTube costs 100 of the key's 10,000 daily units (a link lookup
// costs 1), so searches are rationed. Remove these limits once Moozer has a
// higher YouTube quota.
export const SEARCH_DAILY_LIMIT = 80; // leaves 2,000 units for link lookups
export const SEARCH_PER_PERSON = { max: 20, windowMs: 10 * 60_000 };
export const SEARCH_CACHE_MS = 24 * 60 * 60_000;
export const SEARCH_RESULTS = 8;

// What to send YouTube, and the cache key: spaces squeezed, 2 to 100
// characters. Null when there's nothing worth searching for.
export function cleanQuery(input: unknown) {
  if (typeof input !== "string") return null;
  const text = input.replace(/\s+/g, " ").trim();
  if (text.length < 2 || text.length > 100) return null;
  return { text, key: text.toLowerCase() };
}

// YouTube's quota day starts at midnight Pacific time.
const pacific = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" });
export const quotaDay = (now = Date.now()) => pacific.format(now);

// Searches made against YouTube today, across the app (this server's memory).
export function dailyBudget(limit = SEARCH_DAILY_LIMIT) {
  let day = "";
  let used = 0;
  const roll = (now: number) => {
    const today = quotaDay(now);
    if (today !== day) {
      day = today;
      used = 0;
    }
  };
  return {
    // Takes one search from today's allowance; false when it's used up.
    take(now = Date.now()) {
      roll(now);
      if (used >= limit) return false;
      used += 1;
      return true;
    },
    left(now = Date.now()) {
      roll(now);
      return limit - used;
    },
  };
}
