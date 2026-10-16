"use client";

import { ProgressBar } from "@/components/queue/progress-bar";
import { YouTubePlayer } from "@/components/queue/youtube-player";
import { HereCount } from "@/components/space/presence";

type Playing = { id: string; sourceId: string; title: string; anchorAt: Date | null; pausedAtMs: number | null; durationSeconds: number | null };

// The TV follows the host's player silently; audio plays on the host view.
// The video shrinks on shorter screens (720p) so the title stays on the card.
export function TvPlayer({ playing }: { playing: Playing }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex min-h-0 flex-1 justify-center">
        <YouTubePlayer videoId={playing.sourceId} itemId={playing.id} anchorAt={playing.anchorAt} pausedAtMs={playing.pausedAtMs} muted className="h-full w-auto max-w-full" />
      </div>
      <ProgressBar anchorAt={playing.anchorAt} pausedAtMs={playing.pausedAtMs} durationSeconds={playing.durationSeconds} size="lg" />
    </div>
  );
}

export { HereCount };
