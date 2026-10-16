"use client";

import { Music } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { nudgeFor, type QueueSnapshot } from "@/lib/queue/nudge";

// "Your song is up next" / "Your song is playing" for guests, from the queue
// as it refreshes. Sits at the top so it never covers the vote toasts below.
export function SongNudge({ viewerId, snapshot }: { viewerId: string; snapshot: QueueSnapshot }) {
  const [message, setMessage] = useState<string | null>(null);
  const before = useRef<QueueSnapshot | null>(null);
  const key = `${snapshot.playing?.id}|${snapshot.leader?.id}|${snapshot.queuedIds.join(",")}`;

  useEffect(() => {
    const next = nudgeFor(before.current, snapshot, viewerId);
    before.current = snapshot;
    if (next) setMessage(next);
    // The key covers what the rule looks at; the object itself is new on every refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, viewerId]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div role="status" className="pointer-events-none fixed inset-x-4 top-4 z-50 flex justify-center">
      {message && (
        <p className="flex max-w-md items-center gap-3 rounded-full bg-primary px-5 py-3 text-label-md text-primary-foreground shadow-glow animate-in fade-in-0 slide-in-from-top-2">
          <Music className="size-5 shrink-0" aria-hidden />
          <span className="line-clamp-2">{message}</span>
        </p>
      )}
    </div>
  );
}
