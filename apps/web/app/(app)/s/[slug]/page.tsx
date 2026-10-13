import type { Metadata } from "next";

import { NowPlayingCard } from "@/components/queue/now-playing";
import { QueueCard } from "@/components/queue/queue-card";
import { QueueRow } from "@/components/queue/queue-row";
import { VoteButton } from "@/components/queue/vote-button";
import { getQueue } from "@/lib/queue/data";
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
  const { nowPlaying, queue, leadBy } = await getQueue(space.id, user.id);
  const isHost = role === "host";

  return (
    <div className="grid grid-cols-1 gap-gutter-desktop lg:grid-cols-12">
      <div className="flex flex-col gap-gutter-desktop lg:col-span-8">
        <NowPlayingCard
          playing={nowPlaying}
          emptyHint={isHost ? "Press Play next to start the top song." : "The host starts the music. Add a song or vote for one meanwhile."}
        />
        <QueueCard count={queue.length}>
          {queue.map((item, index) => (
            <QueueRow
              key={item.id}
              item={item}
              leadBy={index === 0 ? leadBy : undefined}
              vote={<VoteButton voted={item.hasVoted} title={item.title} disabled />}
            />
          ))}
        </QueueCard>
      </div>
      <aside className="flex flex-col gap-gutter-desktop lg:col-span-4" aria-label="Space tools" />
    </div>
  );
}
