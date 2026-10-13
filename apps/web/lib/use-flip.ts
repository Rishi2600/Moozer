"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

// Slides reordered rows from their old position to the new one (FLIP), so a
// song visibly moves up the ballot instead of jumping. Rows are found by
// [data-flip-id] inside the container. Off for people who prefer less motion.
export function useFlip(container: RefObject<HTMLElement | null>, orderKey: string) {
  const positions = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();
    for (const row of root.querySelectorAll<HTMLElement>("[data-flip-id]")) {
      const id = row.dataset.flipId!;
      const top = row.offsetTop;
      const before = positions.current.get(id);
      next.set(id, top);
      if (!reduce && before !== undefined && before !== top) {
        row.animate([{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }], {
          duration: 250,
          easing: "ease-out",
        });
      }
    }
    positions.current = next;
  }, [container, orderKey]);
}
