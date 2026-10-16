"use client";

import { CircleCheck, Heart, Info, Link2, ListPlus, ThumbsUp, X, Zap } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { addSongAction, previewSongAction, voteAction, type Preview } from "@/app/(app)/s/[slug]/actions";
import { FormError } from "@/components/auth/form-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEDICATION_MAX } from "@/lib/songs/dedication";
import { formatDuration } from "@/lib/songs/links";

import { SongThumb } from "./song-thumb";

// Paste a link -> preview resolves on its own -> Add to queue (or vote for
// the copy already queued). onDone fires with the confirmation to show.
export function AddSongForm({ spaceId, onDone, autoFocus }: { spaceId: string; onDone: (message: string) => void; autoFocus?: boolean }) {
  const [link, setLink] = useState("");
  const [dedication, setDedication] = useState("");
  const dedicationId = useId();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();
  const [saving, startSave] = useTransition();
  const latest = useRef(0);

  useEffect(() => {
    const request = ++latest.current;
    if (!link.trim()) return;
    const timer = setTimeout(() => {
      startCheck(async () => {
        const result = await previewSongAction(spaceId, link);
        if (request === latest.current) setPreview(result);
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [link, spaceId]);

  function change(value: string) {
    setLink(value);
    setError(null);
    if (!value.trim()) setPreview(null);
  }

  function finish(message: string) {
    change("");
    setDedication("");
    onDone(message);
  }

  function add(videoId: string) {
    startSave(async () => {
      const result = await addSongAction(spaceId, videoId, dedication);
      if (result.ok) finish("Added to queue");
      else setError(result.error);
    });
  }

  function voteInstead(itemId: string) {
    startSave(async () => {
      const result = await voteAction(itemId, true);
      if (result.ok) finish("Vote added");
      else setError(result.error);
    });
  }

  const shown = link.trim() ? preview : null;
  const dedicationLength = [...dedication.trim()].length; // an emoji counts once, as on the server
  const dedicationTooLong = dedicationLength > DEDICATION_MAX;
  return (
    <div className="flex flex-col gap-space-md">
      <div className="relative">
        <Link2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-primary" aria-hidden />
        <Input
          value={link}
          onChange={(event) => change(event.target.value)}
          placeholder="Paste a YouTube link"
          aria-label="Song link"
          autoComplete="off"
          autoFocus={autoFocus}
          className="px-10"
          aria-invalid={shown?.state === "error" ? true : undefined}
        />
        {link && (
          <button type="button" onClick={() => change("")} aria-label="Clear link" className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {checking && !shown && <p className="text-body-sm text-muted-foreground">Looking up the song…</p>}
      {shown?.state === "error" && <FormError>{shown.message}</FormError>}

      {shown?.state === "ready" && (
        <>
          <SongPreview thumbnail={shown.song.thumbnailUrl} title={shown.song.title}>
            {[shown.song.channel, shown.song.durationSeconds !== null ? formatDuration(shown.song.durationSeconds) : null].filter(Boolean).join(" · ")}
            <span className="flex items-center gap-1 text-success">
              <CircleCheck className="size-3.5" aria-hidden />
              Ready
            </span>
          </SongPreview>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={dedicationId} className="text-foreground">Dedicate it <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <div className="relative">
              <Heart className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-primary" aria-hidden />
              <Input
                id={dedicationId}
                value={dedication}
                onChange={(event) => setDedication(event.target.value)}
                placeholder="For Sam's birthday 🎂"
                autoComplete="off"
                className="pl-10"
                aria-invalid={dedicationTooLong || undefined}
                aria-describedby={dedication ? `${dedicationId}-count` : undefined}
              />
            </div>
            {dedication && <p id={`${dedicationId}-count`} className={dedicationTooLong ? "text-right text-body-sm text-destructive tabular-nums" : "text-right text-body-sm text-faint-foreground tabular-nums"}>
              {dedicationLength} of {DEDICATION_MAX} characters
            </p>}
          </div>
          <Button onClick={() => add(shown.song.videoId)} disabled={saving || dedicationTooLong} className="w-full">
            <ListPlus aria-hidden />
            {saving ? "Adding…" : "Add to queue"}
          </Button>
          <p className="flex items-center justify-center gap-1 text-body-sm text-muted-foreground">
            <Zap className="size-3.5 text-amber-bright" aria-hidden />
            Your vote is added with the song.
          </p>
        </>
      )}

      {shown?.state === "duplicate" && (
        <>
          <SongPreview thumbnail={shown.existing.thumbnailUrl} title={shown.existing.title}>
            <span className="flex items-center gap-1">
              <Info className="size-3.5" aria-hidden />
              {shown.existing.playing
                ? "It's playing right now."
                : `Already in the queue with ${shown.existing.votes} ${shown.existing.votes === 1 ? "vote" : "votes"}.`}
            </span>
          </SongPreview>
          {!shown.existing.playing && (
            <Button onClick={() => voteInstead(shown.existing.id)} disabled={saving || shown.existing.hasVoted} className="w-full">
              <ThumbsUp aria-hidden />
              {shown.existing.hasVoted ? "You've voted for it" : saving ? "Voting…" : "Vote for it instead"}
            </Button>
          )}
        </>
      )}
      {error && <FormError>{error}</FormError>}
    </div>
  );
}

function SongPreview({ thumbnail, title, children }: { thumbnail: string; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-cream-subtle p-3">
      <SongThumb src={thumbnail} className="w-28" sizes="112px" />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="line-clamp-2 text-label-md text-foreground">{title}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-body-sm text-muted-foreground">
          <Badge variant="neutral" className="rounded-md">YouTube</Badge>
          {children}
        </span>
      </div>
    </div>
  );
}
