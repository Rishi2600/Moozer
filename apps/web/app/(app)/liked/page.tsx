import { ExternalLink, Heart } from "lucide-react";
import type { Metadata } from "next";

import { LikeButton } from "@/components/queue/like-button";
import { SongThumb } from "@/components/queue/song-thumb";
import { TakeHome } from "@/components/queue/take-home";
import { requireSession } from "@/lib/session";
import { listLiked } from "@/lib/songs/liked";
import { formatDuration } from "@/lib/songs/links";

export const metadata: Metadata = { title: "Liked songs · Moozer" };

// Songs you saved with the heart, newest first. Only you see this page.
export default async function LikedPage() {
  const { user } = await requireSession();
  const songs = await listLiked(user.id);

  return (
    <div className="flex max-w-page flex-col gap-space-lg">
      <div className="flex flex-col gap-1">
        <h1 className="flex items-baseline gap-3 text-headline-lg-mobile text-foreground md:text-headline-lg">
          Liked songs
          {songs.length > 0 && <span className="text-body-lg text-muted-foreground tabular-nums">{songs.length}</span>}
        </h1>
        <p className="text-body-md text-muted-foreground">Songs you saved with the heart. Only you can see them, and you can add them in any space.</p>
      </div>

      {songs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-card p-10 text-center shadow-sm">
          <span className="flex size-10 items-center justify-center rounded-full bg-cream-container text-primary">
            <Heart className="size-5" aria-hidden />
          </span>
          <p className="text-title-sm text-foreground">No liked songs yet</p>
          <p className="max-w-sm text-body-md text-muted-foreground">Tap the heart next to a song that&apos;s playing, or in History, to keep it here.</p>
        </div>
      ) : (
        <>
          <TakeHome songs={songs} />
          <ul className="flex flex-col divide-y divide-border/60 rounded-2xl bg-card px-5 shadow-sm">
            {songs.map((song) => (
              <li key={song.videoId} className="flex items-center gap-3 py-3">
                <SongThumb src={song.thumbnailUrl} className="w-20 shrink-0" sizes="80px" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-body-md font-semibold text-foreground">{song.title}</span>
                  <span className="truncate text-body-sm text-muted-foreground">
                    {[song.channel, song.durationSeconds !== null ? formatDuration(song.durationSeconds) : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                <a
                  href={`https://www.youtube.com/watch?v=${song.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${song.title} on YouTube`}
                  title="Open on YouTube"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-cream-subtle hover:text-foreground"
                >
                  <ExternalLink className="size-4" aria-hidden />
                </a>
                <LikeButton videoId={song.videoId} title={song.title} liked />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
