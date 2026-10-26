"use client";

import { Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { serverNow } from "@/lib/clock";
import { positionMs, type PlaybackState } from "@/lib/queue/playback";
import { afterJump, initialSync, SYNC, syncTick } from "@/lib/queue/sync";
import { cn } from "@/lib/utils";

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
  // tight: players people hear stay within about 0.5 s of the shared clock
  // (docs/SYNC.md, B3). loose: silent copies correct only past 3 s.
  sync?: "tight" | "loose";
  volume?: number; // 0-100
  className?: string;
  onEnded?: (itemId: string) => void;
  onError?: (itemId: string) => void;
  onBlocked?: (blocked: boolean) => void; // the browser held back sound until a tap
};

// Seconds into the song right now, by the server's clock.
const sharedSeconds = (state: PlaybackState) => positionMs(state, serverNow()) / 1000;

// localStorage "moozer:sync-log" = "1" prints one line per check (docs/SYNC.md, B6).
function syncLogOn() {
  try {
    return window.localStorage.getItem("moozer:sync-log") === "1";
  } catch {
    return false;
  }
}

// Plays the space's current song at the shared position and follows pause,
// resume and song changes, correcting drift.
export function YouTubePlayer({ videoId, itemId, anchorAt, pausedAtMs, muted = false, sync = "loose", volume, className, onEnded, onError, onBlocked }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const player = useRef<YT.Player | null>(null);
  const [ready, setReady] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const latest = useRef({ videoId, itemId, anchorAt, pausedAtMs, muted, onEnded, onError, onBlocked });
  useEffect(() => {
    latest.current = { videoId, itemId, anchorAt, pausedAtMs, muted, onEnded, onError, onBlocked };
  });
  const syncState = useRef(initialSync());
  const tight = sync === "tight";
  const anchorMs = anchorAt?.getTime() ?? null;

  useEffect(() => {
    latest.current.onBlocked?.(blocked);
  }, [blocked]);

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
        // `start` takes whole seconds; the follow effect fine-tunes once ready.
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, playsinline: 1, rel: 0, start: Math.floor(sharedSeconds(start)) },
        events: {
          onReady: (event) => {
            // Keep focus (and so the keyboard shortcuts) on the page, not in the video.
            event.target.getIframe().tabIndex = -1;
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
    const target = sharedSeconds({ anchorAt: anchorMs === null ? null : new Date(anchorMs), pausedAtMs });
    // Playing players aim a little ahead to make up for buffering; a paused one lands exactly.
    const lead = tight && pausedAtMs === null ? syncState.current.lead : 0;
    if (p.getVideoData().video_id !== videoId) {
      p.loadVideoById({ videoId, startSeconds: target + lead });
      syncState.current = afterJump(syncState.current, Date.now());
    } else if (Math.abs(p.getCurrentTime() - target) > (tight ? SYNC.threshold : 3)) {
      p.seekTo(target + lead, true);
      syncState.current = afterJump(syncState.current, Date.now());
    }
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
  }, [ready, videoId, anchorMs, pausedAtMs, tight]);

  // Drift correction while playing: a check a second for players people hear,
  // every 5 s past 3 s for silent copies.
  useEffect(() => {
    if (!ready || pausedAtMs !== null) return;
    const log = tight && syncLogOn();
    const id = setInterval(
      () => {
        const p = player.current;
        if (!p || p.getPlayerState() !== YT.PlayerState.PLAYING) return;
        const target = sharedSeconds({ anchorAt: anchorMs === null ? null : new Date(anchorMs), pausedAtMs: null });
        const error = p.getCurrentTime() - target;
        if (!tight) {
          if (Math.abs(error) > 3) p.seekTo(target, true);
          return;
        }
        const tick = syncTick(syncState.current, error, Date.now());
        syncState.current = tick.state;
        if (tick.seek) p.seekTo(target + tick.state.lead, true);
        if (log) console.debug("[sync]", { error: +error.toFixed(3), median: tick.median, lead: +tick.state.lead.toFixed(3), seek: tick.seek });
      },
      tight ? SYNC.sampleMs : 5000
    );
    return () => clearInterval(id);
  }, [ready, anchorMs, pausedAtMs, tight]);

  useEffect(() => {
    if (ready && volume !== undefined) player.current?.setVolume(Math.round(Math.min(100, Math.max(0, volume))));
  }, [ready, volume]);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden rounded-xl bg-black", className)}>
      {/* A click in the video would pause it here only, out of step with everyone. */}
      <div ref={box} className="pointer-events-none absolute inset-0 [&>iframe]:size-full" />
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
