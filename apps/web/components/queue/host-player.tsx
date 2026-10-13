"use client";

import { Pause, Play } from "lucide-react";
import { useCallback, useState, useTransition } from "react";

import { setPausedAction, songEndedAction } from "@/app/(app)/s/[slug]/actions";
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

import { YouTubePlayer } from "./youtube-player";

type Playing = { id: string; sourceId: string; title: string; anchorAt: Date | null; pausedAtMs: number | null };

// The host's player: audio plays here, songs advance when they end, and a
// video that can't play is skipped.
export function HostPlayer({ spaceId, playing }: { spaceId: string; playing: Playing }) {
  const [message, setMessage] = useState<string | null>(null);
  const dismiss = useCallback(() => setMessage(null), []);
  return (
    <>
      <YouTubePlayer
        videoId={playing.sourceId}
        itemId={playing.id}
        anchorAt={playing.anchorAt}
        pausedAtMs={playing.pausedAtMs}
        onEnded={(itemId) => void songEndedAction(spaceId, itemId)}
        onError={(itemId) => {
          setMessage(`Couldn't play ${playing.title} on YouTube, so it was skipped.`);
          void songEndedAction(spaceId, itemId);
        }}
      />
      {message && <Toast message={message} onDismiss={dismiss} />}
    </>
  );
}

export function PauseButton({ spaceId, paused }: { spaceId: string; paused: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="icon"
      disabled={pending}
      aria-label={paused ? "Play" : "Pause"}
      onClick={() => start(async () => void (await setPausedAction(spaceId, !paused)))}
    >
      {paused ? <Play aria-hidden /> : <Pause aria-hidden />}
    </Button>
  );
}
