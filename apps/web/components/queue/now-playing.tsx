import { Disc3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/songs/links";

import { SongThumb } from "./song-thumb";

type Playing = {
  title: string;
  thumbnailUrl: string;
  durationSeconds: number | null;
  addedBy: { name: string };
} | null;

// Large on the host's screen; the controls slot holds Play next.
// Progress and pause arrive with the player in Stage 5.
export function NowPlayingCard({ playing, controls, emptyHint }: { playing: Playing; controls?: React.ReactNode; emptyHint: string }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
      {playing ? (
        <>
          <div className="relative">
            <SongThumb src={playing.thumbnailUrl} sizes="(min-width: 1024px) 720px, 100vw" className="w-full rounded-xl" />
            <Badge variant="live" className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm">Now playing</Badge>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-title-sm text-foreground">{playing.title}</span>
                <Badge variant="neutral" className="rounded-md">YouTube</Badge>
              </span>
              <span className="text-body-sm text-muted-foreground">
                Added by {playing.addedBy.name}
                {playing.durationSeconds !== null && <> · <span className="tabular-nums">{formatDuration(playing.durationSeconds)}</span></>}
              </span>
            </div>
            {controls}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-cream-container text-primary">
            <Disc3 className="size-5" aria-hidden />
          </span>
          <p className="text-title-sm text-foreground">Nothing playing yet</p>
          <p className="max-w-sm text-body-md text-muted-foreground">{emptyHint}</p>
          {controls}
        </div>
      )}
    </section>
  );
}
