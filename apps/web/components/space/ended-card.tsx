import { History, RadioTower } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/relative-time";

type Props = {
  space: { name: string; slug: string; endedAt: Date | null; host: { name: string } };
  isHost: boolean;
  stats: { played: number; voters: number };
};

// What everyone in a space sees once it ends (live, as soon as the host ends it).
export function EndedCard({ space, isHost, stats }: Props) {
  const when = space.endedAt ? ` ${timeAgo(space.endedAt)}` : "";
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl bg-card p-8 text-center shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-full bg-cream-container text-primary">
        <RadioTower className="size-5" aria-hidden />
      </span>
      <h2 className="text-title-sm text-foreground">This space has ended</h2>
      <p className="max-w-md text-body-md text-muted-foreground">
        {isHost
          ? `You ended ${space.name}${when}. Nobody can add songs or vote any more.`
          : `${space.host.name} ended ${space.name}. Ask the host for a new link, or start your own space.`}
      </p>
      <p className="text-label-md text-foreground tabular-nums">
        {stats.played} {stats.played === 1 ? "song" : "songs"} played · {stats.voters} {stats.voters === 1 ? "voter" : "voters"}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-space-sm">
        <Button asChild variant="secondary">
          <Link href={`/s/${space.slug}/history`}>
            <History aria-hidden />
            See what played
          </Link>
        </Button>
        <Button asChild>
          <Link href="/spaces">Go to Spaces</Link>
        </Button>
      </div>
    </section>
  );
}
