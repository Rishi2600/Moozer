import { ArrowLeft, Users } from "lucide-react";
import Link from "next/link";

import { SpaceDeadEnd } from "@/components/space/dead-end";
import { SpaceLive } from "@/components/space/live";
import { ShareButton } from "@/components/space/share-button";
import { SpaceTabs } from "@/components/space/space-tabs";
import { Badge, BadgeDot } from "@/components/ui/badge";
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
  if (role === "outsider") {
    return (
      <SpaceDeadEnd
        title="This space has ended"
        description={`${space.host.name} ended ${space.name}. Ask the host for a new link, or start your own space.`}
      />
    );
  }

  const members = space._count.members;
  const ticket = space.status === "live" ? await issueRealtimeTicket(user, space.id) : null;
  return (
    <SpaceLive spaceId={space.id} slug={space.slug} ticket={ticket}>
      <div className="flex max-w-page flex-col gap-space-lg">
        <header className="flex flex-col gap-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/spaces"
                aria-label="Back to Spaces"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <h1 className="truncate text-headline-md text-foreground">{space.name}</h1>
                  {space.status === "live" ? (
                    <Badge variant="live">
                      <BadgeDot pulse />
                      Live
                    </Badge>
                  ) : (
                    <Badge variant="ended">Ended</Badge>
                  )}
                </div>
                <p className="flex items-center gap-3 text-body-sm text-muted-foreground">
                  {role === "member" && <span>Hosted by {space.host.name}</span>}
                  <span className="flex items-center gap-1 tabular-nums">
                    <Users className="size-3.5 text-faint-foreground" aria-hidden />
                    {members === 1 ? "Just you" : `${members} joined`}
                  </span>
                  {space.endedAt && <span>Ended {timeAgo(space.endedAt)}</span>}
                </p>
              </div>
            </div>
            {space.status === "live" && <ShareButton slug={space.slug} />}
          </div>
          <SpaceTabs slug={space.slug} isHost={role === "host"} />
        </header>
        {children}
      </div>
    </SpaceLive>
  );
}
