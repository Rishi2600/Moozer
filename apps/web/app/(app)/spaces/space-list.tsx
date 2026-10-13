import { Users } from "lucide-react";
import Link from "next/link";

import { Badge, BadgeDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/relative-time";

type SpaceSummary = {
  id: string;
  name: string;
  slug: string;
  status: "live" | "ended";
  endedAt: Date | null;
  _count: { members: number };
  host?: { name: string };
};

export function SpaceSection({ title, children, count }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 px-1 text-label-md text-foreground">
        {title}
        <span className="text-body-sm text-faint-foreground tabular-nums">{count}</span>
      </h2>
      <ul className="divide-y divide-border/70 overflow-hidden rounded-[14px] bg-card shadow-sm">{children}</ul>
    </section>
  );
}

export function SpaceRow({ space, actions }: { space: SpaceSummary; actions?: React.ReactNode }) {
  const members = space._count.members;
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3 transition-colors hover:bg-cream-surface/70 sm:h-16 sm:py-0">
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-title-sm text-foreground">{space.name}</span>
          {space.status === "live" ? (
            <Badge variant="live">
              <BadgeDot pulse />
              Live
            </Badge>
          ) : (
            <Badge variant="ended">Ended</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-body-sm text-muted-foreground">
          {space.host && <span className="truncate">Hosted by {space.host.name}</span>}
          {space.status === "live" ? (
            <span className="flex items-center gap-1 tabular-nums">
              <Users className="size-3.5 text-faint-foreground" aria-hidden />
              {members === 1 ? "Just you" : `${members} joined`}
            </span>
          ) : (
            space.endedAt && <span>Ended {timeAgo(space.endedAt)}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button variant="secondary" size="sm" asChild>
          <Link href={`/s/${space.slug}`} prefetch={false}>
            Open
          </Link>
        </Button>
        {actions}
      </div>
    </li>
  );
}
