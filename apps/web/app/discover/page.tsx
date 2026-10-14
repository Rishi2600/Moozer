import { Compass, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/app-shell/app-shell";
import { LiveSpaceCard, UpcomingSpaceCard } from "@/components/discover/live-space-card";
import { LandingHeader, START_HREF_SIGNED_OUT } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/sections";
import { Button } from "@/components/ui/button";
import { listLiveNow, listUpcoming } from "@/lib/spaces/discover";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Discover · Moozer",
  description: "Public Moozer spaces you can tune in to: vote on what plays next.",
};

// Public spaces anyone can browse, signed in or not. Tuning in to one while
// signed out shows its preview, and signing in comes back to it.
export default async function DiscoverPage() {
  const session = await getSession();
  const [live, upcoming] = await Promise.all([listLiveNow(30), listUpcoming(12)]);
  const startHref = session ? "/spaces?start=1" : START_HREF_SIGNED_OUT;

  const content = (
    <div className="flex max-w-page flex-col gap-space-lg">
      <div className="flex flex-col gap-1">
        <h1 className="text-headline-lg-mobile text-foreground md:text-headline-lg">Discover</h1>
        <p className="text-body-md text-muted-foreground">Public spaces playing right now. Tune in, add a song, vote for what plays next.</p>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="live-now">
        <h2 id="live-now" className="px-1 text-title-sm text-foreground">Live right now</h2>
        {live.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {live.map((space, i) => (
              <LiveSpaceCard key={space.id} space={space} trending={i === 0 && space.upvotesPerHour > 0} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-10 text-center shadow-sm">
            <span className="flex size-12 items-center justify-center rounded-full bg-cream-container text-primary">
              <Compass className="size-6" aria-hidden />
            </span>
            <p className="text-title-sm text-foreground">No public spaces are live right now</p>
            <p className="max-w-sm text-body-md text-muted-foreground">Start one and turn on List on Discover in its settings, so anyone can tune in.</p>
            <Button asChild className="mt-1">
              <Link href={startHref}>
                <Plus aria-hidden />
                Start a space
              </Link>
            </Button>
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="upcoming">
          <h2 id="upcoming" className="px-1 text-title-sm text-foreground">Upcoming</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((space) => (
              <UpcomingSpaceCard key={space.id} space={space} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  if (session) return <AppShell user={{ name: session.user.name, email: session.user.email }}>{content}</AppShell>;
  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader />
      <main className="mx-auto max-w-page px-margin py-space-lg md:px-margin-desktop md:py-space-xl">{content}</main>
      <LandingFooter />
    </div>
  );
}
