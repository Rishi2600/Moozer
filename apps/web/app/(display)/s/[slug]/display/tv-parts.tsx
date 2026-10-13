"use client";

import { ProgressBar } from "@/components/queue/progress-bar";
import { YouTubePlayer } from "@/components/queue/youtube-player";
import { HereCount } from "@/components/space/presence";

type Playing = { id: string; sourceId: string; title: string; anchorAt: Date | null; pausedAtMs: number | null; durationSeconds: number | null };

// The TV follows the host's player silently; audio plays on the host view.
export function TvPlayer({ playing }: { playing: Playing }) {
  return (
    <div className="flex flex-col gap-4">
      <YouTubePlayer videoId={playing.sourceId} itemId={playing.id} anchorAt={playing.anchorAt} pausedAtMs={playing.pausedAtMs} muted />
      <ProgressBar anchorAt={playing.anchorAt} pausedAtMs={playing.pausedAtMs} durationSeconds={playing.durationSeconds} size="lg" />
    </div>
  );
}

export { HereCount };
