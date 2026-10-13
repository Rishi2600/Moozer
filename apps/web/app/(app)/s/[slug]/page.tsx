import type { Metadata } from "next";

import { NowPlayingCard } from "@/components/queue/now-playing";
import { AddSongCard } from "@/components/queue/add-song-card";
import { AddSongSheet } from "@/components/queue/add-song-sheet";
import { Ballot } from "@/components/queue/ballot";
import { PlayNextButton } from "@/components/queue/play-next-button";
import { EndedCard } from "@/components/space/ended-card";
import { InTheRoomCard } from "@/components/space/presence";
import { getQueue, getSpaceStats } from "@/lib/queue/data";
import { requireSession } from "@/lib/session";
import { openSpace } from "@/lib/spaces/data";

export async function generateMetadata({ params }: PageProps<"/s/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);
  return { title: opened && opened.role !== "outsider" ? `${opened.space.name} · Moozer` : "Moozer" };
}

export default async function SpaceQueuePage({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const { user } = await requireSession();
  const opened = await openSpace(slug, user.id);
  if (!opened || opened.role === "outsider") return null; // the layout shows why
  const { space, role } = opened;
  const isHost = role === "host";
  if (space.status === "ended") {
    return <EndedCard space={space} isHost={isHost} stats={await getSpaceStats(space.id)} />;
  }
  const { nowPlaying, queue } = await getQueue(space.id, user.id);

  return (
    <div className="grid grid-cols-1 gap-gutter-desktop max-lg:pb-20 lg:grid-cols-12">
      <div className="flex flex-col gap-gutter-desktop lg:col-span-8">
        <NowPlayingCard
          playing={nowPlaying}
          controls={
            isHost && space.status === "live" ? (
              <PlayNextButton spaceId={space.id} playing={nowPlaying !== null} queued={queue.length} />
            ) : undefined
          }
          emptyHint={isHost ? "Press Play next to start the top song." : "The host starts the music. Add a song or vote for one meanwhile."}
        />
        <Ballot items={queue} canVote={space.status === "live"} viewer={{ userId: user.id, isHost, spaceId: space.id }} />
      </div>
      <aside className="flex flex-col gap-gutter-desktop lg:col-span-4" aria-label="Space tools">
        {space.status === "live" && <InTheRoomCard />}
        {space.status === "live" && <AddSongCard spaceId={space.id} />}
      </aside>
      {space.status === "live" && <AddSongSheet spaceId={space.id} />}
    </div>
  );
}
