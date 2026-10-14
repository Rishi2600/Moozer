// Counts failed attempts per key (a user or an IP address) in a sliding
// window, in this server's memory. Moozer runs one long-lived web process,
// so that's enough; several instances would each keep their own count.
export function failureLimiter({ max, windowMs }: { max: number; windowMs: number }) {
  const failures = new Map<string, number[]>();

  const recent = (key: string, now: number) => {
    const kept = (failures.get(key) ?? []).filter((at) => now - at < windowMs);
    if (kept.length > 0) failures.set(key, kept);
    else failures.delete(key);
    return kept;
  };

  return {
    // Whether this key has used up its failures for now.
    blocked(key: string, now = Date.now()) {
      return recent(key, now).length >= max;
    },
    fail(key: string, now = Date.now()) {
      failures.set(key, [...recent(key, now), now]);
      // Forget idle keys now and then, so the map can't grow without bound.
      if (failures.size > 10_000) for (const k of failures.keys()) recent(k, now);
    },
  };
}
