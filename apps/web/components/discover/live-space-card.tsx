import { CalendarClock, Headphones, Music, Users } from "lucide-react";
import Link from "next/link";

import { OpensAt } from "@/components/local-time";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LiveSpace } from "@/lib/spaces/discover";

// "Live right now": a public space with its votes in the last hour. The
// first one gets the Trending pill once anyone has voted.
export function LiveSpaceCard({ space, trending }: { space: LiveSpace; trending: boolean }) {
  return (
    <li className="flex flex-col gap-4 rounded-2xl bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:gap-6 sm:p-6">
      <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-6">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-cream-container text-primary sm:size-20" aria-hidden>
          <Headphones className="size-8 sm:size-9" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
            <Badge variant="live">
              <BadgeDot pulse={trending} />
              {trending ? "Trending" : "Live"}
            </Badge>
            <span className="truncate">Hosted by {space.hostName}</span>
            <span className="flex items-center gap-1 tabular-nums">
              <Users className="size-3.5 text-faint-foreground" aria-hidden />
              {space.listeners} listening
            </span>
          </div>
          <h3 className="truncate text-title-sm text-foreground sm:text-headline-md">{space.name}</h3>
          {space.description ? (
            <p className="line-clamp-2 text-body-sm text-muted-foreground">{space.description}</p>
          ) : (
            space.playing && (
              <p className="flex min-w-0 items-center gap-1 text-body-sm text-muted-foreground">
                <Music className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="truncate">{space.playing}</span>
              </p>
            )
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-6 sm:justify-end">
        <div className="text-right">
          <div className="text-counter-ballot text-foreground tabular-nums">{space.upvotesPerHour}</div>
          <div className="text-label-sm text-faint-foreground">upvotes/hr</div>
        </div>
        <Button variant="secondary" asChild>
          <Link href={`/s/${space.slug}`} prefetch={false}>
            Tune in
          </Link>
        </Button>
      </div>
    </li>
  );
}

type Upcoming = { id: string; name: string; slug: string; description: string | null; scheduledFor: Date | null; host: { name: string } };

// A public space that opens later.
export function UpcomingSpaceCard({ space }: { space: Upcoming }) {
  return (
    <li className="flex flex-col justify-between gap-4 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <Badge variant="neutral" className="w-fit">Scheduled</Badge>
        <h3 className="mt-1 truncate text-title-sm text-foreground">{space.name}</h3>
        <p className="truncate text-body-sm text-muted-foreground">{space.description ?? `Hosted by ${space.host.name}`}</p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-body-sm text-muted-foreground">
          <CalendarClock className="size-4 text-amber-bright" aria-hidden />
          {space.scheduledFor && <OpensAt date={space.scheduledFor} />}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/s/${space.slug}`} prefetch={false}>
            Details
          </Link>
        </Button>
      </div>
    </li>
  );
}
