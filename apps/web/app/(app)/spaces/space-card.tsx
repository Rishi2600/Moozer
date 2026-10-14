import type { SpaceStatus } from "@moozer/protocol/messages";
import { AudioWaveform, CalendarClock, Clock, Globe, Music, Radio, Users } from "lucide-react";
import Link from "next/link";

import { OpensAt } from "@/components/local-time";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { ResumeButton } from "./resume-button";

type Card = {
  id: string;
  name: string;
  slug: string;
  status: SpaceStatus;
  description: string | null;
  isPublic: boolean;
  listeners: number;
  scheduledFor: Date | null;
  queue: { title: string }[]; // the song playing, if any
};

const LOOK = {
  live: { label: "Broadcasting", icon: AudioWaveform, tile: "bg-cream-subtle text-primary" },
  paused: { label: "Paused", icon: Radio, tile: "bg-surface-container-low text-muted-foreground" },
  scheduled: { label: "Scheduled", icon: Clock, tile: "bg-cream-subtle text-amber-bright" },
} as const;

const linkClass = "text-label-md text-primary underline-offset-4 hover:underline";

// A space you host that hasn't ended, as a card (ended ones are rows below).
export function HostedSpaceCard({ space, menu }: { space: Card & { status: "live" | "paused" | "scheduled" }; menu: React.ReactNode }) {
  const look = LOOK[space.status];
  const Icon = look.icon;
  const subtitle = space.description ?? (space.status === "live" ? space.queue[0]?.title : null);
  return (
    <li className="flex min-h-44 flex-col justify-between gap-4 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          {space.status === "live" ? (
            <Badge variant="live" className="mb-1 w-fit">
              <BadgeDot pulse />
              {look.label}
            </Badge>
          ) : (
            <Badge variant="neutral" className="mb-1 w-fit">{look.label}</Badge>
          )}
          <h3 className="truncate text-title-sm text-foreground">
            <Link href={`/s/${space.slug}`} prefetch={false} className="hover:text-primary">
              {space.name}
            </Link>
          </h3>
          {subtitle && (
            <p className="flex min-w-0 items-center gap-1 text-body-sm text-muted-foreground">
              {!space.description && <Music className="size-3.5 shrink-0 text-primary" aria-hidden />}
              <span className="truncate">{subtitle}</span>
            </p>
          )}
        </div>
        <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", look.tile)} aria-hidden>
          <Icon className="size-4" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-3 text-body-sm text-muted-foreground">
          {space.status === "scheduled" && space.scheduledFor ? (
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-4 text-faint-foreground" aria-hidden />
              <OpensAt date={space.scheduledFor} />
            </span>
          ) : (
            <span className="flex items-center gap-1.5 tabular-nums">
              <Users className="size-4 text-faint-foreground" aria-hidden />
              {space.listeners === 0 ? "No one here" : `${space.listeners} ${space.listeners === 1 ? "listener" : "listeners"}`}
            </span>
          )}
          {space.isPublic && (
            <span className="flex items-center gap-1" title="Listed on Discover">
              <Globe className="size-3.5 text-faint-foreground" aria-hidden />
              <span className="max-md:sr-only">Public</span>
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1">
          {space.status === "paused" ? (
            <ResumeButton spaceId={space.id} slug={space.slug} className={linkClass} />
          ) : (
            <Link href={`/s/${space.slug}`} prefetch={false} className={linkClass}>
              {space.status === "live" ? "Open" : "Details"}
            </Link>
          )}
          {menu}
        </span>
      </div>
    </li>
  );
}
