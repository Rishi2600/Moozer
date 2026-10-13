import { Music, QrCode } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Logo } from "@/components/logo";
import { SongThumb } from "@/components/queue/song-thumb";
import { SpaceLive } from "@/components/space/live";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { getOrigin } from "@/lib/origin";
import { qrSvg } from "@/lib/qr";
import { getQueue } from "@/lib/queue/data";
import { issueRealtimeTicket } from "@/lib/realtime";
import { requireSession } from "@/lib/session";
import { formatJoinCode } from "@/lib/spaces/codes";
import { openSpace } from "@/lib/spaces/data";

import { HereCount, TvPlayer } from "./tv-parts";

export const metadata: Metadata = { title: "TV display · Moozer" };

// Full-screen view for a TV or projector, readable from across the room.
// Host only: the host signs in on the TV's browser.
export default async function TvDisplayPage({ params }: PageProps<"/s/[slug]/display">) {
  const { slug } = await params;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);
  if (!opened || opened.role !== "host" || opened.space.status !== "live") redirect(`/s/${slug}`);
  const { space } = opened;
  const [{ nowPlaying, queue, leadBy }, ticket, origin] = await Promise.all([
    getQueue(space.id, user.id),
    issueRealtimeTicket(user, space.id),
    getOrigin(),
  ]);
  const link = `${origin}/s/${space.slug}`;
  const qr = await qrSvg(link);

  return (
    <SpaceLive spaceId={space.id} slug={space.slug} ticket={ticket}>
      <div className="flex h-dvh flex-col gap-6 overflow-hidden bg-background p-8 xl:p-10">
        <header className="flex items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-5">
            <Badge variant="live" className="px-4 py-1.5 text-title-sm"><BadgeDot pulse />Live</Badge>
            <h1 className="truncate text-headline-lg text-foreground">{space.name}</h1>
            <span className="text-headline-md text-muted-foreground"><HereCount joined={space._count.members} /></span>
          </div>
          <Logo />
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,65fr)_minmax(0,35fr)] gap-8">
          <section className="flex min-h-0 flex-col gap-5 rounded-3xl bg-card p-6 shadow-sm">
            {nowPlaying ? (
              <>
                <TvPlayer playing={nowPlaying} />
                <div className="flex flex-col gap-1">
                  <span className="text-title-sm tracking-wide text-primary">Now playing</span>
                  <p className="line-clamp-2 text-[2.5rem] leading-tight font-extrabold text-foreground">{nowPlaying.title}</p>
                  <p className="text-headline-md text-muted-foreground">Queued by {nowPlaying.addedBy.name}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <Music className="size-16 text-primary" aria-hidden />
                <p className="text-headline-lg text-foreground">Nothing playing yet</p>
                <p className="text-headline-md text-muted-foreground">Scan the code to add the first song.</p>
              </div>
            )}
          </section>

          <div className="flex min-h-0 flex-col gap-6">
            <section className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden rounded-3xl bg-card p-6 shadow-sm">
              <h2 className="text-headline-lg text-foreground">Up next</h2>
              {queue.length === 0 && <p className="text-headline-md text-muted-foreground">No songs yet.</p>}
              <ol className="flex flex-col gap-3">
                {queue.slice(0, 5).map((item, index) => (
                  <li key={item.id} className="flex items-center gap-4">
                    <span className="flex w-16 shrink-0 flex-col items-center">
                      <span className={index === 0 ? "text-counter-display text-primary tabular-nums" : "text-counter-display text-foreground tabular-nums"}>{item.votes}</span>
                      <span className="text-label-sm text-muted-foreground uppercase">votes</span>
                    </span>
                    <SongThumb src={item.thumbnailUrl} className="w-28" sizes="112px" />
                    <div className="flex min-w-0 flex-col">
                      {index === 0 && (
                        <span className="flex items-center gap-2">
                          <Badge variant="next" className="bg-primary text-primary-foreground">Plays next</Badge>
                          {leadBy && <span className="text-body-md text-muted-foreground">Leads by {leadBy}</span>}
                        </span>
                      )}
                      <span className="truncate text-title-sm text-foreground xl:text-headline-md">{item.title}</span>
                      <span className="truncate text-body-md text-muted-foreground">Added by {item.addedBy.name}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="flex items-center gap-6 rounded-3xl bg-card p-6 shadow-sunlit">
              <div aria-label={`QR code for ${link}`} role="img" className="size-48 shrink-0 rounded-2xl border border-border/60 bg-white p-3 xl:size-60 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
              <div className="flex min-w-0 flex-col gap-2">
                <span className="flex items-center gap-2 text-label-md tracking-wide text-primary uppercase"><QrCode className="size-4" aria-hidden />Join the jukebox</span>
                <p className="text-headline-lg text-foreground">Scan to add songs and vote</p>
                <p className="truncate rounded-xl bg-cream-subtle px-3 py-2 text-title-sm text-foreground">{link.replace(/^https?:\/\//, "")}</p>
                <p className="text-body-lg text-muted-foreground">or enter code <span className="font-bold tracking-widest text-foreground">{formatJoinCode(space.joinCode)}</span></p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </SpaceLive>
  );
}
