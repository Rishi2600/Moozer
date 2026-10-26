import type { Metadata } from "next";

import { NowPlayingCard } from "@/components/queue/now-playing";
import { AddSongCard } from "@/components/queue/add-song-card";
import { AddSongSheet } from "@/components/queue/add-song-sheet";
import { GuestSpeaker, GuestSpeakerControls, GuestSpeakerMedia } from "@/components/queue/guest-speaker";
import { Ballot } from "@/components/queue/ballot";
import { HostPlayer, PauseButton, SeekButton } from "@/components/queue/host-player";
import { HostShortcuts } from "@/components/queue/host-shortcuts";
import { PlayNextButton } from "@/components/queue/play-next-button";
import { ReactionBar, ReactionLayer } from "@/components/queue/reactions";
import { SongNudge } from "@/components/queue/song-nudge";
import { RecapCard } from "@/components/space/recap-card";
import { InviteCard } from "@/components/space/invite-card";
import { InTheRoomCard } from "@/components/space/presence";
import { SpeakerRequests, SpeakersCard } from "@/components/space/speakers";
import { LikeButton } from "@/components/queue/like-button";
import { getWallet } from "@/lib/boosts/wallet";
import { likedVideoIds, listLiked } from "@/lib/songs/liked";
import { getQueue } from "@/lib/queue/data";
import { getOrigin } from "@/lib/origin";
import { requireSession } from "@/lib/session";
import { formatJoinCode } from "@/lib/spaces/codes";
import { inSpace, openSpace } from "@/lib/spaces/data";
import { getRecap } from "@/lib/spaces/recap";
import { isSpeaker, listSpeakers } from "@/lib/speakers/data";

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
    return <RecapCard recap={await getRecap(space.id, user.id)} isHost={isHost} />;
  }
  const [{ nowPlaying, queue }, wallet, recentLikes, approvedSpeaker, speakers] = await Promise.all([
    getQueue(space.id, user.id),
    getWallet(user.id),
    listLiked(user.id, 6),
    isHost ? false : isSpeaker(space.id, user.id),
    isHost ? listSpeakers(space.id) : [],
  ]);
  const liked = await likedVideoIds(user.id, nowPlaying ? [nowPlaying.sourceId] : []);
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

  // A guest's media is their own player once their speaker is on (guest-speaker.tsx).
  const media = nowPlaying ? isHost ? <HostPlayer spaceId={space.id} playing={nowPlaying} /> : <GuestSpeakerMedia playing={nowPlaying} /> : undefined;
  const nowPlayingCard = (
    <NowPlayingCard
      playing={nowPlaying}
      media={media}
      speaker={isHost ? undefined : <GuestSpeakerControls />}
      overlay={live ? <ReactionLayer /> : undefined}
      reactions={live ? <ReactionBar /> : undefined}
      like={nowPlaying ? <LikeButton itemId={nowPlaying.id} title={nowPlaying.title} liked={liked.has(nowPlaying.sourceId)} className="-my-2" /> : undefined}
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
            <HostShortcuts spaceId={space.id} playing={nowPlaying !== null} paused={nowPlaying?.pausedAtMs != null} queued={queue.length} />
          </div>
        ) : undefined
      }
      emptyHint={emptyHint}
    />
  );

  return (
    <div className="grid grid-cols-1 gap-gutter-desktop max-lg:pb-20 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="flex min-w-0 flex-col gap-gutter-desktop">
        {isHost ? (
          nowPlayingCard
        ) : (
          <GuestSpeaker spaceId={space.id} hostName={space.host.name} approved={approvedSpeaker} live={live}>
            {nowPlayingCard}
          </GuestSpeaker>
        )}
        <Ballot
          items={queue}
          canVote
          viewer={{ userId: user.id, name: user.name, isHost, spaceId: space.id, live, wallet }}
        />
      </div>
      <aside className="flex flex-col gap-gutter-desktop" aria-label="Space tools">
        <InviteCard link={`${await getOrigin()}/s/${space.slug}`} code={formatJoinCode(space.joinCode)} />
        <InTheRoomCard host={isHost ? { spaceId: space.id, userId: user.id } : undefined} />
        {isHost && <SpeakersCard spaceId={space.id} approved={speakers} />}
        <AddSongCard spaceId={space.id} liked={recentLikes} />
      </aside>
      <AddSongSheet spaceId={space.id} liked={recentLikes} />
      {isHost && <SpeakerRequests spaceId={space.id} />}
      {!isHost && (
        <SongNudge
          viewerId={user.id}
          snapshot={{ playing: nowPlaying && pick(nowPlaying), leader: queue[0] ? pick(queue[0]) : null, queuedIds: queue.map((item) => item.id) }}
        />
      )}
    </div>
  );
}

const pick = ({ id, addedById, title }: { id: string; addedById: string; title: string }) => ({ id, addedById, title });
