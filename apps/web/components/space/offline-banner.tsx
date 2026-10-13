"use client";

import { WifiOff } from "lucide-react";

import { useLive } from "./live";

// Shown while the live connection is down (after a short grace period).
export function OfflineBanner() {
  const { status, reconnect } = useLive();
  if (status !== "offline") return null;
  return (
    <div role="alert" className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-label-md text-on-error-container">
      <WifiOff className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">Connection lost. Votes will update when you&apos;re back online.</span>
      <button type="button" onClick={reconnect} className="text-label-md text-destructive underline-offset-4 hover:underline">
        Retry
      </button>
    </div>
  );
}
