import { CircleCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { JoinSpaceDialog } from "@/app/(app)/spaces/join-space-dialog";
import { openSpaceLink } from "@/app/join-actions";
import { DemoCard } from "@/components/landing/demo-card";
import { LandingHeader, START_HREF_SIGNED_OUT } from "@/components/landing/landing-header";
import { Audiences, ClosingBand, HowItWorks, LandingFooter } from "@/components/landing/sections";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "Moozer · Let the room pick the music",
  description: "Start a space, share the link, and everyone adds songs from YouTube. The song with the most votes plays next.",
};

export default async function LandingPage() {
  const signedIn = Boolean(await getSession());
  const startHref = signedIn ? "/spaces?start=1" : START_HREF_SIGNED_OUT;

  return (
    <div className="min-h-dvh bg-background">
      <LandingHeader />
      <main>
        <section className="mx-auto grid max-w-page grid-cols-1 items-center gap-space-xl px-margin py-space-xl md:px-margin-desktop lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col items-start">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-cream-subtle px-3 py-1 text-label-sm tracking-wide text-muted-foreground uppercase shadow-sm">
              <span className="size-2 animate-pulse rounded-full bg-primary" aria-hidden />
              Realtime room jukebox
            </span>
            <h1 className="mb-6 text-headline-hero-mobile text-foreground md:text-headline-hero">Let the room pick the music.</h1>
            <p className="mb-8 max-w-[52ch] text-body-lg text-muted-foreground">
              Start a space, share the link, and everyone adds songs from YouTube. The song with the most votes plays next.
            </p>
            <div className="mb-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button size="lg" asChild>
                <Link href={startHref}>Start a space</Link>
              </Button>
              <JoinSpaceDialog action={openSpaceLink} size="lg" />
            </div>
            <p className="flex items-center gap-1.5 text-body-sm text-faint-foreground">
              <CircleCheck className="size-4 text-success" aria-hidden />
              Free. Listeners don&apos;t need an app.
            </p>
          </div>
          <DemoCard />
        </section>
        <HowItWorks />
        <Audiences />
        <ClosingBand startHref={startHref} />
      </main>
      <LandingFooter />
    </div>
  );
}
