import type { Metadata } from "next";

import { NowPlayingCard } from "@/components/queue/now-playing";
import { AddSongCard } from "@/components/queue/add-song-card";
import { AddSongSheet } from "@/components/queue/add-song-sheet";
import { Ballot } from "@/components/queue/ballot";
import { HostPlayer, PauseButton, SeekButton } from "@/components/queue/host-player";
import { PlayNextButton } from "@/components/queue/play-next-button";
import { EndedCard } from "@/components/space/ended-card";
import { InviteCard } from "@/components/space/invite-card";
import { InTheRoomCard } from "@/components/space/presence";
import { getQueue, getSpaceStats } from "@/lib/queue/data";
import { getOrigin } from "@/lib/origin";
import { requireSession } from "@/lib/session";
import { formatJoinCode } from "@/lib/spaces/codes";
import { inSpace, openSpace } from "@/lib/spaces/data";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);
  return { title: inSpace(opened) ? `${opened.space.name} · Moozer` : "Moozer" };
}

export default async function SpaceQueuePage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);
  if (!inSpace(opened)) return null; // the layout shows why
  const { space, role } = opened;
  const isHost = role === "host";
  if (space.status === "ended") {
    return <EndedCard space={space} isHost={isHost} stats={await getSpaceStats(space.id)} />;
  }
  const { nowPlaying, queue } = await getQueue(space.id, user.id);
  const live = space.status === "live"; // paused and scheduled spaces don't play
  const emptyHint =
    space.status === "scheduled"
      ? "The music starts once the space opens. Add songs and vote meanwhile."
      : space.status === "paused"
        ? isHost
          ? "After you resume, Play next starts the top song."
          : "Add a song or vote for one meanwhile."
        : isHost
          ? "Press Play next to start the top song."
          : "The host starts the music. Add a song or vote for one meanwhile.";

  return (
    <div className="grid grid-cols-1 gap-gutter-desktop max-lg:pb-20 lg:grid-cols-12">
      <div className="flex flex-col gap-gutter-desktop lg:col-span-8">
        <NowPlayingCard
          playing={nowPlaying}
          media={isHost && nowPlaying ? <HostPlayer spaceId={space.id} playing={nowPlaying} /> : undefined}
          controls={
            isHost && live ? (
              <div className="flex items-center gap-2">
                {nowPlaying && (
                  <>
                    <SeekButton spaceId={space.id} seconds={-10} />
                    <PauseButton spaceId={space.id} paused={nowPlaying.pausedAtMs !== null} />
                    <SeekButton spaceId={space.id} seconds={10} />
                  </>
                )}
                <PlayNextButton spaceId={space.id} playing={nowPlaying !== null} queued={queue.length} />
              </div>
            ) : undefined
          }
          emptyHint={emptyHint}
        />
        <Ballot items={queue} canVote viewer={{ userId: user.id, isHost, spaceId: space.id, live }} />
      </div>
      <aside className="flex flex-col gap-gutter-desktop lg:col-span-4" aria-label="Space tools">
        <InviteCard link={`${await getOrigin()}/s/${space.slug}`} code={formatJoinCode(space.joinCode)} />
        <InTheRoomCard host={isHost ? { spaceId: space.id, userId: user.id } : undefined} />
        <AddSongCard spaceId={space.id} />
      </aside>
      <AddSongSheet spaceId={space.id} />
    </div>
  );
}
