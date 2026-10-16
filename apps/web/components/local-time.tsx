"use client";

import { useSyncExternalStore } from "react";

import { formatOpensAt } from "@/lib/spaces/schedule";

const noop = () => () => {};
const format = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

// "10:14 pm" in the viewer's time zone. The server can't know it, so the
// server render is blank and the browser fills it in.
export function LocalTime({ date }: { date: Date }) {
  const text = useSyncExternalStore(noop, () => format.format(date).toLowerCase(), () => "");
  return (
    <time dateTime={date.toISOString()} className="tabular-nums">
      {text}
    </time>
  );
}

const dateTime = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// "17 Oct, 12:09 am" in the viewer's time zone, for histories.
export function LocalDateTime({ date }: { date: Date }) {
  const text = useSyncExternalStore(noop, () => dateTime.format(date).replace(/\b(AM|PM)\b/, (m) => m.toLowerCase()), () => "");
  return (
    <time dateTime={date.toISOString()} className="tabular-nums">
      {text}
    </time>
  );
}

// "Tomorrow 20:00": when a scheduled space opens, in the viewer's time zone.
export function OpensAt({ date }: { date: Date }) {
  const text = useSyncExternalStore(noop, () => formatOpensAt(date), () => "");
  return (
    <time dateTime={date.toISOString()} className="tabular-nums">
      {text}
    </time>
  );
}
