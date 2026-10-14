const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
export const SCHEDULE_MAX_DAYS = 90;

type Parsed = { ok: true; date: Date } | { ok: false; error: string };

// The opening time a host picked. The browser sends it as an ISO string,
// since only the browser knows the host's time zone. It must be at least a
// minute ahead and within SCHEDULE_MAX_DAYS.
export function parseScheduledFor(raw: unknown, now = Date.now()): Parsed {
  const date = typeof raw === "string" && raw !== "" ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return { ok: false, error: "Pick a date and time for the space to open." };
  if (date.getTime() < now + MINUTE) return { ok: false, error: "Pick a time in the future." };
  if (date.getTime() > now + SCHEDULE_MAX_DAYS * DAY) {
    return { ok: false, error: `Pick a time within the next ${SCHEDULE_MAX_DAYS} days.` };
  }
  return { ok: true, date };
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

// "Today 20:00", "Tomorrow 20:00", or "Sat 18 Oct, 20:00", in the time zone
// of whoever runs it (so call it in the browser).
export function formatOpensAt(date: Date, now = new Date(), locale?: string) {
  const time = date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
  // Rounded, so a day with a daylight-saving change (23 or 25 hours) still counts as one.
  const days = Math.round((startOfDay(date) - startOfDay(now)) / DAY);
  if (days === 0) return `Today ${time}`;
  if (days === 1) return `Tomorrow ${time}`;
  return `${date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}, ${time}`;
}

// The value for <input type="datetime-local"> (local time, no zone).
export function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
