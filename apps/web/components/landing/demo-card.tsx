"use client";

import { useEffect, useRef, useState } from "react";

import { SongThumb } from "@/components/queue/song-thumb";
import { VoteButton } from "@/components/queue/vote-button";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { leadMargin, sortQueue } from "@/lib/queue/order";
import { formatDuration } from "@/lib/songs/links";
import { useFlip } from "@/lib/use-flip";
import { useNow } from "@/lib/use-now";

const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
const minute = (m: number) => new Date(2026, 0, 1, 20, m);

// Sample room for the landing page. Real thumbnails, made-up votes.
const START = [
  { id: "dreams", title: "Fleetwood Mac – Dreams", by: "Arjun Mehta", votes: 12, thumb: thumb("mrZRURcb1cM"), addedAt: minute(1) },
  { id: "mgmt", title: "MGMT – Electric Feel", by: "Maya Chen", votes: 9, thumb: thumb("MmZexg8sxyk"), addedAt: minute(2) },
  { id: "daft", title: "Daft Punk – Get Lucky", by: "Leo Okafor", votes: 7, thumb: thumb("5NV6Rdv1a3I"), addedAt: minute(3) },
  { id: "m83", title: "M83 – Midnight City", by: "Priya Raman", votes: 7, thumb: thumb("dX3k_QDnzHE"), addedAt: minute(4) },
];
const SONG_LENGTH = 359; // seconds, for the looping progress bar

// The hero's product card: every few seconds a vote lands and the ballot
// re-sorts with the real reorder animation. Still for reduced motion.
export function DemoCard() {
  const [queue, setQueue] = useState(START);
  const [flash, setFlash] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);
  useFlip(list, queue.map((s) => s.id).join(","));
  const now = useNow(1000);
  const latest = useRef(queue);
  useEffect(() => {
    latest.current = queue;
  }, [queue]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const current = latest.current;
      // A song that's behind gets the vote, so the order actually changes.
      const pick = current[1 + Math.floor(Math.random() * (current.length - 1))];
      setFlash(pick.id);
      setQueue(sortQueue(current.map((s) => (s.id === pick.id ? { ...s, votes: s.votes + 1 } : s))));
    }, 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(id);
  }, [flash]);

  // A demo: the bar loops with the clock.
  const elapsed = now === null ? 161 : (now / 1000) % SONG_LENGTH;
  const leadBy = leadMargin(queue);

  return (
    <div aria-label="Example of a live space" className="flex w-full flex-col gap-5 rounded-[14px] bg-card p-5 shadow-sunlit md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-headline-md text-foreground">Friday at the studio</h2>
          <Badge variant="live"><BadgeDot pulse />Live</Badge>
        </div>
        <span className="text-body-sm text-muted-foreground tabular-nums">18 here</span>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-cream-subtle p-3.5">
        <div className="flex items-center gap-3.5">
          <SongThumb src={thumb("fJ9rUzIMcZQ")} className="w-[120px]" sizes="120px" />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-title-sm text-foreground">Queen – Bohemian Rhapsody</span>
            <span className="truncate text-body-sm text-muted-foreground">Added by Maya Chen</span>
            <span className="mt-2 text-label-sm tabular-nums">
              <span className="text-orange-deep">{formatDuration(elapsed)}</span>
              <span className="text-faint-foreground"> / {formatDuration(SONG_LENGTH)}</span>
            </span>
          </div>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-cream-container">
          <div className="h-full rounded-full bg-gradient-to-r from-secondary-container to-primary" style={{ width: `${(elapsed / SONG_LENGTH) * 100}%` }} />
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1 text-label-sm">
          <span className="tracking-wider text-faint-foreground uppercase">Next in room</span>
          <span className="text-muted-foreground">4 songs queued</span>
        </div>
        <ol ref={list} className="flex flex-col gap-2">
          {queue.map((song, index) => (
            <li key={song.id} data-flip-id={song.id} className="flex items-center gap-3 rounded-[10px] bg-surface p-2.5">
              <span className={`w-9 text-center text-counter-ballot tabular-nums ${flash === song.id ? "text-primary" : "text-foreground"}`}>
                {song.votes}
              </span>
              <VoteButton voted={flash === song.id} title={song.title} tabIndex={-1} aria-hidden className="pointer-events-none" />
              <SongThumb src={song.thumb} className="w-16" sizes="64px" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-label-md text-foreground">{song.title}</span>
                <span className="truncate text-body-sm text-muted-foreground">Added by {song.by}</span>
              </div>
              {index === 0 && (
                <span className="hidden flex-col items-end gap-0.5 sm:flex">
                  <Badge variant="next" className="border border-border bg-cream-container text-orange-deep">Plays next</Badge>
                  {leadBy && <span className="text-body-sm whitespace-nowrap text-muted-foreground">Leads by {leadBy}</span>}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
