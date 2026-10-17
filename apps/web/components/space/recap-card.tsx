import { History, RadioTower, Star, Trophy, Zap } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/avatar";
import { SongThumb } from "@/components/queue/song-thumb";
import { TakeHome } from "@/components/queue/take-home";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/relative-time";
import type { Recap } from "@/lib/spaces/recap";

import { ShareRecapButton } from "./share-recap-button";

// What everyone in a space sees once it ends (live, as soon as the host ends
// it): the night in numbers, its highlights, your part in it, and ways to
// share it or take the songs home.
export function RecapCard({ recap, isHost }: { recap: Recap; isHost: boolean }) {
  const { space } = recap;
  const when = space.endedAt ? ` ${timeAgo(space.endedAt)}` : "";
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  return (
    <section className="flex flex-col gap-space-lg rounded-2xl bg-card p-6 shadow-sm md:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-cream-container text-primary">
          <RadioTower className="size-5" aria-hidden />
        </span>
        <h2 className="text-title-sm text-foreground">That&apos;s a wrap</h2>
        <p className="max-w-md text-body-md text-muted-foreground">
          {isHost
            ? `You ended ${space.name}${when}. Nobody can add songs or vote any more.`
            : `${space.host.name} ended ${space.name}. Ask the host for a new link, or start your own space.`}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-space-sm text-center">
        {[
          [recap.length, "of music"],
          [String(recap.songsPlayed), recap.songsPlayed === 1 ? "song played" : "songs played"],
          [String(recap.people), recap.people === 1 ? "person" : "people"],
        ].map(([value, label]) => (
          <div key={label} className="flex flex-col rounded-xl bg-cream-subtle px-2 py-3">
            <dt className="order-2 text-body-sm text-muted-foreground">{label}</dt>
            <dd className="text-title-sm text-foreground tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {(recap.top || recap.favourite || recap.boosted) && (
        <ul className="flex flex-col gap-space-sm">
          {recap.top && (
            <li className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
              <SongThumb src={recap.top.thumbnailUrl} className="w-24 shrink-0" sizes="96px" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-1 text-label-sm text-primary">
                  <Trophy className="size-3.5" aria-hidden />
                  Top song of the night
                </span>
                <span className="line-clamp-2 text-label-md text-foreground">{recap.top.title}</span>
                <span className="text-body-sm text-muted-foreground">
                  {plural(recap.top.finalVotes, "vote", "votes")} · added by {recap.top.addedBy.name}
                </span>
              </span>
            </li>
          )}
          {recap.favourite && (
            <li className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
              <Avatar name={recap.favourite.name} className="size-12 text-title-sm" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="flex items-center gap-1 text-label-sm text-primary">
                  <Star className="size-3.5" aria-hidden />
                  Crowd favourite
                </span>
                <span className="truncate text-label-md text-foreground">{recap.favourite.name}</span>
                <span className="text-body-sm text-muted-foreground">
                  {plural(recap.favourite.votes, "vote", "votes")} across {plural(recap.favourite.songs, "song", "songs")}
                </span>
              </span>
            </li>
          )}
          {recap.boosted && (
            <li className="flex items-center gap-3 rounded-xl border border-border/60 p-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-bright/20 text-on-secondary-container">
                <Zap className="size-5 fill-current" aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-label-sm text-primary">Most boosted</span>
                <span className="line-clamp-2 text-label-md text-foreground">{recap.boosted.title}</span>
                <span className="text-body-sm text-muted-foreground">Boosted {plural(recap.boosted.boosts, "time", "times")}</span>
              </span>
            </li>
          )}
        </ul>
      )}

      <p className="rounded-xl bg-cream-subtle px-4 py-3 text-center text-body-md text-foreground">
        <span className="font-semibold">Your night: </span>
        {plural(recap.you.songsPlayed, "of your songs played", "of your songs played")}, {plural(recap.you.votesGiven, "vote", "votes")} given
        {recap.you.boostsUsed > 0 && `, ${plural(recap.you.boostsUsed, "boost", "boosts")} used`}.
      </p>

      <div className="flex flex-col items-center gap-space-md">
        {recap.songsPlayed > 0 && <ShareRecapButton slug={space.slug} spaceName={space.name} />}
        <TakeHome songs={recap.songs} />
        <div className="flex flex-wrap justify-center gap-space-sm">
          <Button asChild variant="ghost">
            <Link href={`/s/${space.slug}/history`}>
              <History aria-hidden />
              See what played
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/spaces">Go to Spaces</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
