"use client";

import { ArrowLeft } from "lucide-react";
import { useRef } from "react";

import { Avatar } from "@/components/avatar";
import { SongThumb } from "@/components/queue/song-thumb";
import { VoteButton } from "@/components/queue/vote-button";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { leadMargin } from "@/lib/queue/order";
import { formatDuration } from "@/lib/songs/links";
import { useFlip } from "@/lib/use-flip";
import { cn } from "@/lib/utils";

import { ADDED, SPACE_NAME, type filmState } from "./scenes";

type Film = ReturnType<typeof filmState>;

// The laptop: the host's view of the space, drawn from the film's state.
export function HostScreen({ film, qr, sharing }: { film: Film; qr: string; sharing: boolean }) {
  const list = useRef<HTMLOListElement>(null);
  useFlip(list, film.queue.map((s) => s.id).join(","));
  const leadBy = leadMargin(film.queue);

  return (
    <div className="flex size-full flex-col gap-4 p-5">
      <header className="flex items-center gap-3 border-b border-border/60 pb-3">
        <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground"><ArrowLeft className="size-4" /></span>
        <span className="text-headline-md text-foreground">{film.live ? SPACE_NAME : "Spaces"}</span>
        {film.live && <Badge variant="live"><BadgeDot pulse />Live</Badge>}
        {film.live && <span className="text-body-sm text-muted-foreground tabular-nums">{film.here} here</span>}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_260px] gap-4">
        <div className="flex min-h-0 flex-col gap-3">
          <section className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm">
            <SongThumb src={film.playing.thumb} className="w-44" sizes="176px" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-label-sm tracking-wide text-primary uppercase">Now playing</span>
              <span className="truncate text-title-sm text-foreground">{film.playing.title}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-cream-container">
                <div className="h-full rounded-full bg-gradient-to-r from-secondary-container to-primary" style={{ width: `${(film.elapsed / film.playing.seconds) * 100}%` }} />
              </div>
              <span className="flex justify-between text-body-sm text-muted-foreground tabular-nums">
                <span className="text-primary">{formatDuration(film.elapsed)}</span>
                <span>{formatDuration(film.playing.seconds)}</span>
              </span>
            </div>
          </section>
          <section className="flex min-h-0 flex-1 flex-col rounded-2xl bg-card p-4 shadow-sm">
            <h3 className="mb-2 text-label-md text-foreground">Up next <span className="text-muted-foreground tabular-nums">· {film.queue.length} songs</span></h3>
            <ol ref={list} className="flex flex-col gap-1.5">
              {film.queue.map((song, i) => (
                <li
                  key={song.id}
                  data-flip-id={song.id}
                  className={cn("flex items-center gap-3 rounded-xl p-1.5 transition-colors duration-700", film.justAdded && song.id === ADDED.id ? "bg-cream-container" : "bg-card")}
                >
                  <span className={cn("w-7 text-right text-counter-ballot tabular-nums", song.hasVoted ? "text-primary" : "text-foreground")}>{song.votes}</span>
                  <VoteButton voted={song.hasVoted} title={song.title} tabIndex={-1} aria-hidden className="pointer-events-none" />
                  <SongThumb src={song.thumb} className="w-14" sizes="56px" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-label-md text-foreground">{song.title}</span>
                    <span className="truncate text-body-sm text-muted-foreground">Added by {song.by}</span>
                  </span>
                  {i === 0 && leadBy && (
                    <span className="flex flex-col items-end">
                      <Badge variant="next" className="border border-border bg-cream-container text-orange-deep">Plays next</Badge>
                      <span className="text-body-sm text-muted-foreground">Leads by {leadBy}</span>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-3">
          <section className={cn("flex flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-sm transition-shadow", sharing && "ring-4 ring-primary/40")}>
            <span className="self-start text-label-md text-foreground">Invite people</span>
            <div className="w-32 rounded-xl border border-border/60 bg-white p-2 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
            <span className="text-body-sm text-muted-foreground">Code <b className="tracking-wider text-foreground">K7M-2QX</b></span>
          </section>
          <section className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm">
            <span className="flex justify-between text-label-md text-foreground">In the room <span className="text-primary tabular-nums">{film.here} here</span></span>
            <ul className="flex -space-x-2">
              {film.people.map((name) => (
                <li key={name} className="animate-in fade-in-0 zoom-in-50 duration-300"><Avatar name={name} className="border-2 border-card" /></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {film.dialogOpen && (
        <div className="absolute inset-0 flex items-center justify-center bg-inverse-surface/35">
          <div className="flex w-[400px] flex-col gap-3 rounded-2xl bg-card p-6 shadow-sunlit">
            <span className="text-title-sm text-foreground">Start a space</span>
            <span className="text-body-md text-muted-foreground">Give it a name people will recognise.</span>
            <span className="flex h-11 items-center rounded-lg border-[1.5px] border-primary px-4 text-body-md text-foreground ring-3 ring-primary/15">
              {film.typed}
              <span className="ml-0.5 h-5 w-px animate-pulse bg-foreground" />
            </span>
            <span className="self-end rounded-lg bg-primary px-4 py-2 text-label-md text-primary-foreground">Start space</span>
          </div>
        </div>
      )}
    </div>
  );
}
