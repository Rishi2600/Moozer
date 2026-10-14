import type { Metadata } from "next";
import Link from "next/link";

import { LiveSpaceCard } from "@/components/discover/live-space-card";
import { listLiveNow } from "@/lib/spaces/discover";
import { listHostedSpaces, listJoinedSpaces } from "@/lib/spaces/data";
import { requireSession } from "@/lib/session";

import { HostedSpaceCard } from "./space-card";
import { SpaceRow, SpaceSection } from "./space-list";
import { SpaceRowMenu } from "./space-row-menu";
import { JoinSpaceDialog } from "./join-space-dialog";
import { SPACE_FILTERS, type SpaceFilter } from "./filters";
import { SpacesFilter } from "./spaces-filter";
import { SpacesEmpty } from "./spaces-empty";
import { StartSpaceDialog } from "./start-space-dialog";

export const metadata: Metadata = { title: "Spaces · Moozer" };

export default async function SpacesPage({ searchParams }: PageProps<"/spaces">) {
  const { start, show } = await searchParams;
  const openStart = start === "1"; // from "Start a space" on the landing page
  const filter: SpaceFilter = SPACE_FILTERS.find((f) => f.value === show)?.value ?? "all";
  const { user } = await requireSession();
  const [allHosted, allJoined, liveNow] = await Promise.all([
    listHostedSpaces(user.id),
    listJoinedSpaces(user.id),
    filter === "all" ? listLiveNow(3) : [],
  ]);
  const shown = <T extends { status: string }>(spaces: T[]) => (filter === "all" ? spaces : spaces.filter((s) => s.status === filter));
  const hosted = shown(allHosted);
  const joined = shown(allJoined);
  // Spaces you host that haven't ended are cards; ended ones are rows.
  const active = hosted.filter((s) => s.status !== "ended").map((s) => ({ ...s, status: s.status as "live" | "paused" | "scheduled" }));
  const ended = hosted.filter((s) => s.status === "ended");
  const nothingYet = allHosted.length === 0 && allJoined.length === 0;

  return (
    <div className="flex max-w-page flex-col gap-space-lg">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-lg-mobile text-foreground md:text-headline-lg">Spaces</h1>
          <p className="text-body-md text-muted-foreground">Rooms you host and rooms you&apos;ve joined.</p>
        </div>
        <div className="flex flex-wrap gap-space-sm">
          {!nothingYet && <SpacesFilter current={filter} />}
          <JoinSpaceDialog />
          <StartSpaceDialog defaultOpen={openStart} />
        </div>
      </div>

      {nothingYet ? (
        <SpacesEmpty
          actions={
            <>
              <StartSpaceDialog />
              <JoinSpaceDialog />
            </>
          }
        />
      ) : hosted.length === 0 && joined.length === 0 ? (
        <p className="rounded-[14px] bg-card p-5 text-body-md text-muted-foreground shadow-sm">
          No {SPACE_FILTERS.find((f) => f.value === filter)?.label.toLowerCase()} spaces.{" "}
          <Link href="/spaces" className="text-primary underline-offset-4 hover:underline">Show all</Link>
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {hosted.length > 0 && (
            <section className="flex flex-col gap-3" aria-labelledby="hosted">
              <h2 id="hosted" className="flex items-center justify-between gap-2 px-1 text-label-md text-foreground">
                Hosted by you
                {active.length > 0 && (
                  <span className="text-label-sm text-faint-foreground tabular-nums">
                    {active.length} active {active.length === 1 ? "space" : "spaces"}
                  </span>
                )}
              </h2>
              {active.length > 0 && (
                <ul className="grid grid-cols-1 gap-gutter-desktop sm:grid-cols-2 xl:grid-cols-3">
                  {active.map((space) => (
                    <HostedSpaceCard key={space.id} space={space} menu={<SpaceRowMenu space={space} />} />
                  ))}
                </ul>
              )}
              {ended.length > 0 && (
                <ul className="divide-y divide-border/70 overflow-hidden rounded-[14px] bg-card shadow-sm" aria-label="Ended spaces you hosted">
                  {ended.map((space) => (
                    <SpaceRow key={space.id} space={space} actions={<SpaceRowMenu space={space} />} />
                  ))}
                </ul>
              )}
            </section>
          )}
          {joined.length > 0 && (
            <SpaceSection title="Joined recently" count={joined.length}>
              {joined.map((space) => (
                <SpaceRow key={space.id} space={space} />
              ))}
            </SpaceSection>
          )}
        </div>
      )}

      {liveNow.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="live-now">
          <div className="flex items-center justify-between px-1">
            <h2 id="live-now" className="text-title-sm text-foreground">Live right now</h2>
            <Link href="/discover" className="text-label-md text-muted-foreground hover:text-primary">Explore all</Link>
          </div>
          <ul className="flex flex-col gap-3">
            {liveNow.map((space, i) => (
              <LiveSpaceCard key={space.id} space={space} trending={i === 0 && space.upvotesPerHour > 0} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
