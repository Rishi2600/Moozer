import { ArrowLeft, Tv, Users } from "lucide-react";
import Link from "next/link";

import { BreakButton } from "@/components/space/break-button";
import { SpaceDeadEnd } from "@/components/space/dead-end";
import { SpaceLive } from "@/components/space/live";
import { OfflineBanner } from "@/components/space/offline-banner";
import { HereCount, PeoplePile } from "@/components/space/presence";
import { ShareButton } from "@/components/space/share-button";
import { SpaceTabs } from "@/components/space/space-tabs";
import { SpaceStatusBadge } from "@/components/space/status-badge";
import { StatusBanner } from "@/components/space/status-banner";
import { Button } from "@/components/ui/button";
import { issueRealtimeTicket } from "@/lib/realtime";
import { timeAgo } from "@/lib/relative-time";
import { requireSession } from "@/lib/session";
import { openSpace } from "@/lib/spaces/data";

export default async function SpaceLayout({ children, params }: LayoutProps<"/s/[slug]">) {
  const { slug } = await params;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);

  if (!opened) {
    return (
      <SpaceDeadEnd
        title="This link doesn't work anymore"
        description="The host may have reset it. Ask them for the new link, or start your own space."
      />
    );
  }
  const { space, role } = opened;
  if (role === "removed") {
    return (
      <SpaceDeadEnd
        title="You were removed from this space"
        description={`${space.host.name} removed you from ${space.name}, so you can't rejoin it. You can still start your own space.`}
      />
    );
  }
  if (role === "outsider") {
    return (
      <SpaceDeadEnd
        title="This space has ended"
        description={`${space.host.name} ended ${space.name}. Ask the host for a new link, or start your own space.`}
      />
    );
  }

  const members = space._count.members;
  const open = space.status !== "ended"; // live, on a break, or not open yet
  const ticket = open ? await issueRealtimeTicket(user, space.id) : null;
  return (
    <SpaceLive spaceId={space.id} slug={space.slug} ticket={ticket}>
      <div className="flex max-w-page flex-col gap-space-lg">
        <header className="flex flex-col gap-3 border-b border-border">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/spaces"
                aria-label="Back to Spaces"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
              <h1 className="truncate text-headline-md text-foreground">{space.name}</h1>
              <SpaceStatusBadge status={space.status} />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {space.status === "live" && role === "host" && <BreakButton spaceId={space.id} />}
              {(space.status === "live" || space.status === "paused") && role === "host" && (
                <Button variant="outline" size="sm" asChild className="max-sm:hidden">
                  <a href={`/s/${space.slug}/display`} target="_blank" rel="noopener">
                    <Tv aria-hidden />
                    TV display
                  </a>
                </Button>
              )}
              {open && <ShareButton slug={space.slug} />}
            </div>
          </div>
          <div className="flex items-center gap-3 pl-12 text-body-sm text-muted-foreground">
            {role === "member" && <span className="truncate">Hosted by {space.host.name}</span>}
            {open ? (
              <HereCount joined={members} />
            ) : (
              <span className="flex items-center gap-1 tabular-nums">
                <Users className="size-3.5 text-faint-foreground" aria-hidden />
                {members === 1 ? "Just you" : `${members} joined`}
              </span>
            )}
            {space.endedAt && <span>Ended {timeAgo(space.endedAt)}</span>}
            {open && <PeoplePile max={3} className="ml-auto lg:hidden" />}
          </div>
          <SpaceTabs slug={space.slug} isHost={role === "host"} />
        </header>
        <StatusBanner spaceId={space.id} status={space.status} isHost={role === "host"} hostName={space.host.name} scheduledFor={space.scheduledFor} />
        <OfflineBanner />
        {children}
      </div>
    </SpaceLive>
  );
}
