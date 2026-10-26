"use client";

import { Check, Volume2, VolumeX } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

import { songEndedAction } from "@/app/(app)/s/[slug]/actions";
import { useLive } from "@/components/space/live";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { clockOffset } from "@/lib/clock";
import { useNow } from "@/lib/use-now";

import { SongThumb } from "./song-thumb";
import { useSpeakerReport } from "./speaker-report";
import { YouTubePlayer } from "./youtube-player";

type Playing = { id: string; sourceId: string; thumbnailUrl: string; anchorAt: Date | null; pausedAtMs: number | null } | null;

type Speaker = {
  spaceId: string;
  hostName: string; // first name, for "Waiting for Maya…"
  approved: boolean;
  live: boolean;
  on: boolean;
  volume: number;
  revoked: boolean;
  setOn: (on: boolean) => void;
  setVolume: (volume: number) => void;
  setBlocked: (blocked: boolean) => void;
  setRevoked: (revoked: boolean) => void;
};

const SpeakerContext = createContext<Speaker | null>(null);

// A guest playing the space's music on their own device too, once the host
// approves. Wraps the Now playing card so its media (the player) and its
// speaker controls share one state.
export function GuestSpeaker({
  spaceId,
  hostName,
  approved,
  live,
  children,
}: {
  spaceId: string;
  hostName: string;
  approved: boolean;
  live: boolean;
  children: React.ReactNode;
}) {
  const [on, setOn] = useState(false);
  const [volume, setVolume] = useState(80);
  const [blocked, setBlocked] = useState(false);
  const [revoked, setRevoked] = useState(false);
  // The host turned this speaker off (or removed the approval): stop playing.
  const [wasApproved, setWasApproved] = useState(approved);
  if (approved !== wasApproved) {
    setWasApproved(approved);
    setRevoked(!approved);
    if (!approved) setOn(false);
  }
  useSpeakerReport(on && !blocked);
  const first = hostName.split(" ")[0] || hostName;
  return (
    <SpeakerContext.Provider value={{ spaceId, hostName: first, approved, live, on, volume, revoked, setOn, setVolume, setBlocked, setRevoked }}>
      {children}
    </SpeakerContext.Provider>
  );
}

// The Now playing card's media for a guest: their player while their speaker
// is on, the thumbnail otherwise.
export function GuestSpeakerMedia({ playing }: { playing: NonNullable<Playing> }) {
  const speaker = useContext(SpeakerContext);
  const [failed, setFailed] = useState<string | null>(null);
  if (!speaker?.on) return <SongThumb src={playing.thumbnailUrl} sizes="(min-width: 1024px) 720px, 100vw" className="w-full rounded-xl" />;
  return (
    <>
      <YouTubePlayer
        sync="tight"
        volume={speaker.volume}
        videoId={playing.sourceId}
        itemId={playing.id}
        anchorAt={playing.anchorAt}
        pausedAtMs={playing.pausedAtMs}
        onBlocked={speaker.setBlocked}
        onEnded={(itemId) => void songEndedAction(speaker.spaceId, itemId)}
        // Only this device couldn't play it; the host's screen decides whether to skip.
        onError={(itemId) => setFailed(itemId)}
      />
      {failed === playing.id && (
        <p className="absolute inset-x-3 bottom-3 rounded-lg bg-black/70 px-3 py-2 text-body-sm text-white">Couldn&apos;t play this song here.</p>
      )}
    </>
  );
}

// Ask, wait, the host's answer, then tap to start, volume and off.
export function GuestSpeakerControls() {
  const speaker = useContext(SpeakerContext);
  const { status, askToSpeak, speakerAnswer } = useLive();
  const [askedAt, setAskedAt] = useState<number | null>(null);
  const ask = useCallback(() => {
    if (!speaker || !askToSpeak()) return;
    setAskedAt(Date.now());
    speaker.setRevoked(false);
  }, [askToSpeak, speaker]);
  if (!speaker) return null;
  const { hostName, approved, live, on, volume, revoked } = speaker;

  if (approved) {
    if (on) {
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success" className="gap-1">
            <Volume2 className="size-3.5" aria-hidden />
            Playing here too
          </Badge>
          <label className="flex min-w-40 flex-1 items-center gap-2 text-muted-foreground">
            <span className="sr-only">Speaker volume</span>
            <Volume2 className="size-4 shrink-0" aria-hidden />
            <input
              id="speaker-volume"
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(event) => speaker.setVolume(Number(event.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <Button variant="outline" size="sm" onClick={() => speaker.setOn(false)}>
            <VolumeX aria-hidden />
            Turn off speaker
          </Button>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-2 rounded-xl bg-muted p-3">
        <span className="flex items-center gap-1.5 text-label-sm text-success">
          <Check className="size-4" aria-hidden />
          {hostName} said yes. You can play the music here.
        </span>
        {/* Browsers only play sound after a tap on the page. */}
        <Button onClick={() => speaker.setOn(true)} className="self-start">
          <Volume2 aria-hidden />
          Tap to start the music here
        </Button>
        <p className="text-body-sm text-muted-foreground">Best in another room. In the same room it may echo a little.</p>
      </div>
    );
  }

  if (!live) return null; // asking only makes sense while the music can play
  const offline = status !== "live";
  // Turned off by the host: earlier answers no longer count until they ask again.
  if (revoked) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-body-sm text-muted-foreground">{hostName} turned off your speaker.</p>
        <Button variant="secondary" onClick={ask} disabled={offline} className="self-start">
          <Volume2 aria-hidden />
          Play it on my speaker
        </Button>
      </div>
    );
  }
  const answer = speakerAnswer && (askedAt === null || speakerAnswer.at >= askedAt) ? speakerAnswer : null;
  const waiting = askedAt !== null && !answer;

  if (waiting || answer?.answer === "allowed") {
    return (
      <Button variant="secondary" disabled className="self-start">
        <span className="animate-pulse">{answer ? `${hostName} said yes…` : `Waiting for ${hostName}…`}</span>
      </Button>
    );
  }
  if (answer?.answer === "declined" && answer.retryAt) {
    return <AskAgainLater hostName={hostName} retryAt={answer.retryAt} onAsk={ask} disabled={offline} />;
  }
  return (
    <div className="flex flex-col gap-1.5">
      {answer?.answer === "expired" && <p className="text-body-sm text-muted-foreground">{hostName} didn&apos;t answer.</p>}
      <Button variant="secondary" onClick={ask} disabled={offline} className="self-start">
        <Volume2 aria-hidden />
        {answer?.answer === "expired" ? "Ask again" : "Play it on my speaker"}
      </Button>
    </div>
  );
}

// "Not now": the button comes back once the 2 minutes are up.
function AskAgainLater({ hostName, retryAt, onAsk, disabled }: { hostName: string; retryAt: number; onAsk: () => void; disabled: boolean }) {
  const now = useNow(1000);
  const left = now === null ? null : Math.ceil((retryAt - (now + (clockOffset() ?? 0))) / 1000);
  const ready = left !== null && left <= 0;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-body-sm text-muted-foreground">{hostName} said not now.</p>
      <Button variant="secondary" onClick={onAsk} disabled={disabled || !ready} className="self-start tabular-nums">
        <Volume2 aria-hidden />
        {ready || left === null ? "Ask again" : `Ask again in ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`}
      </Button>
    </div>
  );
}
