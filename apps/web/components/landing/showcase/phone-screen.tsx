"use client";

import { AudioWaveform, CircleCheck, Link2, ListPlus } from "lucide-react";

import { SongThumb } from "@/components/queue/song-thumb";
import { VoteButton } from "@/components/queue/vote-button";
import { Badge, BadgeDot } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { ADDED, SPACE_NAME, type filmState } from "./scenes";

type Film = ReturnType<typeof filmState>;

// The phone: a guest's side of the story, drawn from the film's state.
export function PhoneScreen({ film, qr, messageArrived }: { film: Film; qr: string; messageArrived: boolean }) {
  const inRoom = film.phone !== "invite" && film.phone !== "scan";
  return (
    <div className="relative size-full">
      <Layer shown={film.phone === "invite"}><Messages arrived={messageArrived} /></Layer>
      <Layer shown={film.phone === "scan"}><Scanner qr={qr} scanned={film.scanned} /></Layer>
      <Layer shown={inRoom}><Room film={film} /></Layer>
    </div>
  );
}

// Every screen stays drawn and the film crossfades between them, so cuts read
// as one motion and the room's pictures are loaded before it shows.
function Layer({ shown, children }: { shown: boolean; children: React.ReactNode }) {
  return (
    <div inert={!shown} className={cn("absolute inset-0 transition-opacity duration-300 ease-out", shown ? "opacity-100" : "opacity-0")}>
      {children}
    </div>
  );
}

function Room({ film }: { film: Film }) {
  return (
    <div className="relative flex size-full flex-col gap-3 px-3 pb-3">
      <div className="flex flex-col gap-0.5 px-1">
        <span className="truncate text-title-sm text-foreground">{SPACE_NAME}</span>
        <span className="flex items-center gap-2 text-body-sm text-muted-foreground">
          <Badge variant="live" className="py-0"><BadgeDot />Live</Badge>
          <span className="tabular-nums">{film.here} here</span>
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-card p-2 shadow-sm">
        <SongThumb src={film.playing.thumb} className="w-16" sizes="64px" />
        <span className="flex min-w-0 flex-col">
          <span className="text-[10px] font-semibold tracking-wide text-primary uppercase">Now playing</span>
          <span className="truncate text-label-sm text-foreground">{film.playing.title}</span>
        </span>
      </div>
      <ol className="flex flex-col gap-1.5">
        {film.queue.slice(0, 4).map((song) => (
          <li key={song.id} className="flex items-center gap-2 rounded-xl bg-card p-1.5 shadow-sm">
            <span className={cn("w-6 text-right text-title-sm tabular-nums", song.hasVoted ? "text-primary" : "text-foreground")}>{song.votes}</span>
            <VoteButton
              voted={song.hasVoted}
              title={song.title}
              tabIndex={-1}
              aria-hidden
              className={cn("pointer-events-none size-9", film.tapVote && song.id === ADDED.id && "scale-90 ring-4 ring-primary/40")}
            />
            <span className="truncate text-label-sm text-foreground">{song.title}</span>
          </li>
        ))}
      </ol>
      {film.phone === "joined" && <Toast text="You're in. Add a song or vote." />}
      {film.phone === "sheet" && <AddSheet film={film} />}
      {film.tapVote && <Toast text="Vote added" />}
    </div>
  );
}

function Messages({ arrived }: { arrived: boolean }) {
  return (
    <div className="flex size-full flex-col gap-3 px-4 pt-2">
      <span className="text-center text-label-md text-foreground">Priya</span>
      <span className="max-w-[80%] rounded-2xl rounded-bl-sm bg-surface-container px-3 py-2 text-body-sm text-foreground">You coming to the studio tonight?</span>
      {arrived && (
        <div className="flex max-w-[85%] animate-in flex-col gap-2 rounded-2xl rounded-bl-sm bg-surface-container p-2 fade-in-0 slide-in-from-bottom-2">
          <span className="px-1 text-body-sm text-foreground">Join my space and pick the music!</span>
          <span className="flex items-center gap-2 rounded-xl bg-card p-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><AudioWaveform className="size-4" /></span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-label-sm text-foreground">{SPACE_NAME} · Moozer</span>
              <span className="truncate text-[10px] text-muted-foreground">moozer.app/s/friday-at-the-studio</span>
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

function Scanner({ qr, scanned }: { qr: string; scanned: boolean }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4 bg-inverse-surface px-6">
      <div className={cn("relative size-44 rounded-2xl bg-white p-4 transition-transform duration-300", scanned && "scale-105")}>
        <div className="size-full [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qr }} />
        {scanned ? (
          <span aria-hidden className="absolute inset-0 flex animate-in items-center justify-center rounded-2xl bg-white/75 fade-in-0 zoom-in-75">
            <CircleCheck className="size-14 text-success" />
          </span>
        ) : (
          <span aria-hidden className="absolute inset-x-3 top-1/2 h-0.5 animate-scan bg-primary shadow-glow motion-reduce:animate-none" />
        )}
        {["top-0 left-0 border-t-4 border-l-4", "top-0 right-0 border-t-4 border-r-4", "bottom-0 left-0 border-b-4 border-l-4", "right-0 bottom-0 border-r-4 border-b-4"].map((c) => (
          <span key={c} aria-hidden className={cn("absolute size-6 rounded-sm transition-colors duration-300", scanned ? "border-success" : "border-primary", c)} />
        ))}
      </div>
      <span className="text-label-md text-white/90">{scanned ? `Opening ${SPACE_NAME}…` : "Point at the QR code"}</span>
    </div>
  );
}

function AddSheet({ film }: { film: Film }) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-inverse-surface/40">
      <div className="flex flex-col gap-3 rounded-t-3xl bg-card p-4">
        <span aria-hidden className="mx-auto h-1 w-9 rounded-full bg-border-strong" />
        <span className="text-title-sm text-foreground">Add a song</span>
        <span className="flex h-10 items-center gap-2 rounded-lg border-[1.5px] border-primary px-3 text-body-sm text-foreground">
          <Link2 className="size-4 text-primary" />
          {film.pasted}
        </span>
        {film.previewReady && (
          <span className="flex animate-in items-center gap-2 rounded-xl bg-cream-subtle p-2 fade-in-0">
            <SongThumb src={ADDED.thumb} className="w-20" sizes="80px" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-label-sm text-foreground">{ADDED.title}</span>
              <span className="flex items-center gap-1 text-[11px] text-success"><CircleCheck className="size-3" />Ready</span>
            </span>
          </span>
        )}
        <span
          className={cn(
            "flex h-11 items-center justify-center gap-2 rounded-lg bg-primary text-label-md text-primary-foreground transition-transform",
            !film.previewReady && "opacity-50",
            film.tapAdd && "scale-95 bg-primary-pressed"
          )}
        >
          <ListPlus className="size-4" />
          Add to queue
        </span>
      </div>
      {film.justAdded && <Toast text="Added to queue" />}
    </div>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <span className="absolute inset-x-3 bottom-4 flex animate-in items-center gap-2 rounded-full bg-inverse-surface px-4 py-2.5 text-label-sm text-inverse-on-surface fade-in-0 slide-in-from-bottom-2">
      <CircleCheck className="size-4 text-primary" />
      {text}
    </span>
  );
}
