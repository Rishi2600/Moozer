"use client";

import { useSyncExternalStore } from "react";

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
