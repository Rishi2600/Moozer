"use client";

import { useSyncExternalStore } from "react";

// The current time, re-rendering every `intervalMs`. Null during the server
// render (it can't know the viewer's "now"), so callers show a placeholder.
export function useNow(intervalMs = 500) {
  return useSyncExternalStore(
    (notify) => {
      const id = setInterval(notify, intervalMs);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null
  );
}
