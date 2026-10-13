"use client";

import { positionMs } from "@/lib/queue/playback";
import { formatDuration } from "@/lib/songs/links";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

type Props = {
  anchorAt: Date | null;
  pausedAtMs: number | null;
  durationSeconds: number | null;
  size?: "md" | "lg";
  tone?: "light" | "dark";
};

// DESIGN.md live progress bar: 6px track, amber-to-orange fill, tabular times.
export function ProgressBar({ anchorAt, pausedAtMs, durationSeconds, size = "md", tone = "light" }: Props) {
  const now = useNow();
  const elapsed = now === null ? 0 : positionMs({ anchorAt, pausedAtMs }, now) / 1000;
  const total = durationSeconds ?? null;
  const shown = total !== null ? Math.min(elapsed, total) : elapsed;
  const percent = total ? Math.min(100, (shown / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      {total !== null && (
        <div className={cn("w-full overflow-hidden rounded-full", size === "lg" ? "h-2" : "h-1.5", tone === "dark" ? "bg-white/20" : "bg-cream-container")}>
          <div
            className="h-full rounded-full bg-gradient-to-r from-secondary-container to-primary transition-[width] duration-500 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      <div className={cn("flex justify-between tabular-nums", size === "lg" ? "text-headline-md" : "text-body-sm", tone === "dark" ? "text-white/80" : "text-muted-foreground")}>
        <span className="text-primary">{now === null ? "–:––" : formatDuration(shown)}</span>
        {total !== null && <span>{formatDuration(total)}</span>}
      </div>
    </div>
  );
}
