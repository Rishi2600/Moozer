"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { positionMs } from "@/lib/queue/playback";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
  }
}

// YouTube's IFrame API, loaded once per page.
let apiReady: Promise<void> | null = null;
function loadYouTubeApi() {
  apiReady ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve();
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return apiReady;
}

type Props = {
  videoId: string;
  itemId: string;
  anchorAt: Date | null;
  pausedAtMs: number | null;
  muted?: boolean; // the TV display follows along silently
  onEnded?: (itemId: string) => void;
  onError?: (itemId: string) => void;
};

// Plays the space's current song at the shared position and follows pause,
// resume and song changes. Corrects drift over 3 seconds.
export function YouTubePlayer({ videoId, itemId, anchorAt, pausedAtMs, muted = false, onEnded, onError }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const player = useRef<YT.Player | null>(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const latest = useRef({ videoId, itemId, anchorAt, pausedAtMs, muted, onEnded, onError });
  useEffect(() => {
    latest.current = { videoId, itemId, anchorAt, pausedAtMs, muted, onEnded, onError };
  });
  const anchorMs = anchorAt?.getTime() ?? null;

  // Create the player once. YouTube replaces the element it's given, so give
  // it one React doesn't own.
  useEffect(() => {
    let cancelled = false;
    const mount = document.createElement("div");
    box.current?.appendChild(mount);
    loadYouTubeApi().then(() => {
      if (cancelled) return;
      const start = latest.current;
      player.current = new YT.Player(mount, {
        width: "100%",
        height: "100%",
        videoId: start.videoId,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, playsinline: 1, rel: 0, start: Math.floor(positionMs(start) / 1000) },
        events: {
          onReady: (event) => {
            if (latest.current.muted) event.target.mute();
            setReady(true);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) setBlocked(false);
            if (event.data === YT.PlayerState.ENDED) latest.current.onEnded?.(latest.current.itemId);
          },
          onError: () => latest.current.onError?.(latest.current.itemId),
        },
      });
    });
    return () => {
      cancelled = true;
      player.current?.destroy();
      player.current = null;
      mount.remove();
    };
  }, []);

  // Follow the shared state.
  useEffect(() => {
    const p = player.current;
    if (!ready || !p) return;
    const target = positionMs({ anchorAt: anchorMs === null ? null : new Date(anchorMs), pausedAtMs }) / 1000;
    if (p.getVideoData().video_id !== videoId) p.loadVideoById({ videoId, startSeconds: target });
    else if (Math.abs(p.getCurrentTime() - target) > 3) p.seekTo(target, true);
    if (pausedAtMs !== null) {
      p.pauseVideo();
      return;
    }
    p.playVideo();
    // Browsers block sound until someone clicks; offer a button if it didn't start.
    const check = setTimeout(() => {
      const state = p.getPlayerState();
      if (state !== YT.PlayerState.PLAYING && state !== YT.PlayerState.BUFFERING) setBlocked(true);
    }, 2000);
    return () => clearTimeout(check);
  }, [ready, videoId, anchorMs, pausedAtMs]);

  // Gentle drift correction while playing.
  useEffect(() => {
    if (!ready || pausedAtMs !== null) return;
    const id = setInterval(() => {
      const p = player.current;
      const target = positionMs({ anchorAt: anchorMs === null ? null : new Date(anchorMs), pausedAtMs: null }) / 1000;
      if (p && p.getPlayerState() === YT.PlayerState.PLAYING && Math.abs(p.getCurrentTime() - target) > 3) p.seekTo(target, true);
    }, 5000);
    return () => clearInterval(id);
  }, [ready, anchorMs, pausedAtMs]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      <div ref={box} className="absolute inset-0 [&>iframe]:size-full" />
      {blocked && (
        <button
          type="button"
          onClick={() => {
            player.current?.playVideo();
            setBlocked(false);
          }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55 text-white"
        >
          <span className="flex size-16 items-center justify-center rounded-full bg-primary shadow-glow">
            <Play className="size-7 fill-current" aria-hidden />
          </span>
          <span className="text-title-sm">Start playback</span>
        </button>
      )}
    </div>
  );
}
