import { Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { ProgressBar } from "@/components/queue/progress-bar";
import { SongThumb } from "@/components/queue/song-thumb";
import { VoteButton } from "@/components/queue/vote-button";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { getSpacePreview } from "@/lib/spaces/data";

import { JoinActions } from "./join-actions";

export async function generateMetadata({ params }: PageProps<"/join/[slug]">): Promise<Metadata> {
  const preview = await getSpacePreview((await params).slug);
  return { title: preview ? `${preview.space.name} · Moozer` : "Moozer" };
}

// What a space link shows to someone who isn't signed in (the proxy serves it
// at /s/<slug>). Signed-in visitors go straight into the space.
export default async function JoinPage({ params }: PageProps<"/join/[slug]">) {
  const { slug } = await params;
  if (await getSession()) redirect(`/s/${slug}`);
  const preview = await getSpacePreview(slug);

  if (!preview || preview.space.status === "ended") {
    return (
      <Shell>
        <section className="flex flex-col items-center gap-3 rounded-2xl bg-card p-8 text-center shadow-sm">
          <h1 className="text-title-sm text-foreground">{preview ? "This space has ended" : "This link doesn't work anymore"}</h1>
          <p className="text-body-md text-muted-foreground">
            {preview
              ? `${preview.space.host.name} ended ${preview.space.name}. Ask the host for a new link, or start your own space.`
              : "The host may have reset it. Ask them for the new link, or start your own space."}
          </p>
          <Button asChild className="mt-2">
            <Link href="/">Go to Moozer</Link>
          </Button>
        </section>
      </Shell>
    );
  }

  const { space, nowPlaying, queue, total } = preview;
  return (
    <Shell live>
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-3 text-body-sm text-muted-foreground">
          <Badge variant="live"><BadgeDot pulse />Live</Badge>
          <span className="flex items-center gap-1 tabular-nums">
            <Users className="size-3.5" aria-hidden />
            {space._count.members} joined
          </span>
        </span>
        <h1 className="text-headline-lg-mobile text-foreground">{space.name}</h1>
        <p className="text-body-md text-muted-foreground">Hosted by {space.host.name}</p>
      </div>

      {nowPlaying && (
        <section className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-sm">
          <span className="text-label-sm tracking-wide text-primary">Now playing</span>
          <div className="flex items-center gap-3">
            <SongThumb src={nowPlaying.thumbnailUrl} className="w-28" sizes="112px" />
            <div className="flex min-w-0 flex-col">
              <span className="line-clamp-2 text-title-sm text-foreground">{nowPlaying.title}</span>
              <span className="text-body-sm text-muted-foreground">Added by {nowPlaying.addedBy.name}</span>
            </div>
          </div>
          <ProgressBar anchorAt={nowPlaying.anchorAt} pausedAtMs={nowPlaying.pausedAtMs} durationSeconds={nowPlaying.durationSeconds} />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="flex items-center gap-2 text-title-sm text-foreground">
            Up next <span className="text-body-sm text-muted-foreground tabular-nums">{total} {total === 1 ? "song" : "songs"}</span>
          </h2>
          <span className="text-body-sm text-muted-foreground">Sign in to vote</span>
        </div>
        {queue.slice(0, 3).map((item, index) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm">
            <span className="w-7 text-right text-counter-ballot text-foreground tabular-nums">{item.votes}</span>
            <VoteButton voted={false} title={item.title} size="lg" disabled />
            <SongThumb src={item.thumbnailUrl} className="w-20" sizes="80px" />
            <div className="flex min-w-0 flex-col">
              {index === 0 && <Badge variant="next" className="w-fit border border-border bg-cream-container text-orange-deep">Plays next</Badge>}
              <span className="truncate text-body-md font-semibold text-foreground">{item.title}</span>
              <span className="truncate text-body-sm text-muted-foreground">Added by {item.addedBy.name}</span>
            </div>
          </div>
        ))}
      </section>

      <JoinActions slug={space.slug} />
    </Shell>
  );
}

function Shell({ live = false, children }: { live?: boolean; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="mx-auto flex max-w-md items-center justify-between px-margin pt-space-lg">
        <Link href="/" aria-label="Moozer home">
          <Logo showTagline={false} />
        </Link>
        {live && <Badge variant="live"><BadgeDot />Live space</Badge>}
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-space-lg px-margin py-space-lg">{children}</main>
    </div>
  );
}
