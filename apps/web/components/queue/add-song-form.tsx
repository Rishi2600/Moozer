"use client";

import { ChevronLeft, CircleCheck, Heart, Info, Link2, ListPlus, Search, ThumbsUp, X, Zap } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { addSongAction, previewSongAction, searchSongsAction, voteAction, type Preview, type SearchResults } from "@/app/(app)/s/[slug]/actions";
import { FormError } from "@/components/auth/form-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEDICATION_MAX } from "@/lib/songs/dedication";
import { formatDuration, looksLikeLink } from "@/lib/songs/links";

import { SongThumb } from "./song-thumb";

// One box for both: paste a link and its preview resolves on its own, or type
// words and press Enter to search YouTube, then pick a result. Either way the
// song gets Add to queue (or a vote for the copy already queued). onDone
// fires with the confirmation to show.
export function AddSongForm({ spaceId, onDone, autoFocus }: { spaceId: string; onDone: (message: string) => void; autoFocus?: boolean }) {
  const [link, setLink] = useState("");
  const [dedication, setDedication] = useState("");
  const dedicationId = useId();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [results, setResults] = useState<{ query: string; items: SearchResults } | null>(null);
  const [picked, setPicked] = useState<SearchResults[number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, startCheck] = useTransition();
  const [saving, startSave] = useTransition();
  const latest = useRef(0);

  useEffect(() => {
    const request = ++latest.current;
    if (!looksLikeLink(link)) return; // words wait for Enter: searching costs quota
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
    setResults(null);
    setPicked(null);
    if (!value.trim()) setPreview(null);
  }

  function search() {
    const query = link.trim();
    if (!query || looksLikeLink(query)) return;
    setError(null);
    setPicked(null);
    startCheck(async () => {
      const found = await searchSongsAction(spaceId, query);
      if (found.ok) setResults({ query, items: found.results });
      else setError(found.error);
    });
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

  const isLink = looksLikeLink(link);
  const fromSearch: Preview | null = picked && (picked.existing ? { state: "duplicate", existing: picked.existing } : { state: "ready", song: picked.song });
  const shown = !link.trim() ? null : isLink ? preview : fromSearch;
  const dedicationLength = [...dedication.trim()].length; // an emoji counts once, as on the server
  const dedicationTooLong = dedicationLength > DEDICATION_MAX;
  return (
    <div className="flex flex-col gap-space-md">
      <form
        role="search"
        className="flex gap-space-sm"
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
      >
        <div className="relative min-w-0 flex-1">
          {isLink || !link.trim() ? (
            <Link2 className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-primary" aria-hidden />
          ) : (
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-primary" aria-hidden />
          )}
          <Input
            value={link}
            onChange={(event) => change(event.target.value)}
            placeholder="Paste a YouTube link or search"
            aria-label="Song link or search"
            autoComplete="off"
            enterKeyHint="search"
            autoFocus={autoFocus}
            className="px-10"
            aria-invalid={shown?.state === "error" ? true : undefined}
          />
          {link && (
            <button type="button" onClick={() => change("")} aria-label="Clear" className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" aria-hidden />
            </button>
          )}
        </div>
        {link.trim() && !isLink && (
          <Button type="submit" variant="outline" disabled={checking} className="h-11">
            {checking ? "Searching…" : "Search"}
          </Button>
        )}
      </form>

      {checking && isLink && !shown && <p className="text-body-sm text-muted-foreground">Looking up the song…</p>}
      {link.trim() && !isLink && !results && !checking && !error && (
        <p className="text-body-sm text-muted-foreground">Press Enter to search YouTube for music.</p>
      )}

      {results && !picked && <SearchList results={results} onPick={setPicked} />}
      {picked && (
        <button type="button" onClick={() => setPicked(null)} className="flex w-fit items-center gap-1 text-label-md text-primary underline-offset-4 hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          Back to results
        </button>
      )}
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

// Search results: pick one to see it ready to add (or vote for, if it's queued).
function SearchList({ results, onPick }: { results: { query: string; items: SearchResults }; onPick: (item: SearchResults[number]) => void }) {
  if (results.items.length === 0) {
    return (
      <p className="text-body-sm text-muted-foreground">
        No music videos found for &ldquo;{results.query}&rdquo;. Try other words, or paste the song&apos;s link.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1" aria-label={`Results for ${results.query}`}>
        {results.items.map((item) => (
          <li key={item.song.videoId}>
            <button
              type="button"
              onClick={() => onPick(item)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left outline-none hover:bg-cream-subtle focus-visible:ring-3 focus-visible:ring-primary/30"
            >
              <SongThumb src={item.song.thumbnailUrl} className="w-20 shrink-0" sizes="80px" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="line-clamp-2 text-label-md text-foreground">{item.song.title}</span>
                <span className="truncate text-body-sm text-muted-foreground">
                  {[item.song.channel, item.song.durationSeconds !== null ? formatDuration(item.song.durationSeconds) : null].filter(Boolean).join(" · ")}
                </span>
                {item.existing && (
                  <span className="text-body-sm text-orange-deep">
                    {item.existing.playing ? "Playing now" : `In the queue · ${item.existing.votes} ${item.existing.votes === 1 ? "vote" : "votes"}`}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-body-sm text-faint-foreground">
        Search shows videos their uploader filed under Music, so you get songs, not reaction videos or tutorials. If a song doesn&apos;t
        show up, paste its link.
      </p>
    </div>
  );
}
