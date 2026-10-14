import type { SpaceStatus } from "@moozer/protocol/messages";
import { Music, Users } from "lucide-react";
import Link from "next/link";

import { OpensAt } from "@/components/local-time";
import { SpaceStatusBadge } from "@/components/space/status-badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/relative-time";

type SpaceSummary = {
  id: string;
  name: string;
  slug: string;
  status: SpaceStatus;
  endedAt: Date | null;
  scheduledFor: Date | null;
  listeners: number;
  _count: { members: number };
  host?: { name: string };
  queue: { title: string }[]; // the song playing, if any
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
          <SpaceStatusBadge status={space.status} />
        </div>
        <div className="flex items-center gap-3 text-body-sm text-muted-foreground">
          {space.host && <span className="truncate">Hosted by {space.host.name}</span>}
          {space.status === "ended" ? (
            space.endedAt && <span>Ended {timeAgo(space.endedAt)}</span>
          ) : space.status === "scheduled" && space.scheduledFor ? (
            <span>
              Opens <OpensAt date={space.scheduledFor} />
            </span>
          ) : (
            <span className="flex items-center gap-1 tabular-nums">
              <Users className="size-3.5 text-faint-foreground" aria-hidden />
              {space.listeners > 0 ? `${space.listeners} here` : members === 1 ? "Just you" : `${members} joined`}
            </span>
          )}
          {space.status === "live" && space.queue[0] && (
            <span className="hidden min-w-0 items-center gap-1 md:flex">
              <Music className="size-3.5 shrink-0 text-primary" aria-hidden />
              <span className="max-w-[260px] truncate">{space.queue[0].title}</span>
            </span>
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
