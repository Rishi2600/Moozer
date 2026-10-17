"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { likeSongAction, unlikeAction } from "@/app/(app)/liked/actions";
import { cn } from "@/lib/utils";

// The heart: saves a song to your private Liked list (or takes it off).
// Either a song in a space (itemId) or one already on the Liked page (videoId).
export function LikeButton({ liked, title, itemId, videoId, className }: { liked: boolean; title: string; itemId?: string; videoId?: string; className?: string }) {
  const [shown, setShown] = useOptimistic(liked);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={shown}
      aria-label={shown ? `Remove ${title} from your liked songs` : `Like ${title}`}
      title={shown ? "In your liked songs" : "Like"}
      onClick={() =>
        start(async () => {
          setShown(!shown);
          if (itemId) await likeSongAction(itemId, !shown);
          else if (videoId && shown) await unlikeAction(videoId);
        })
      }
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full transition-transform outline-none hover:bg-cream-subtle focus-visible:ring-3 focus-visible:ring-primary/30 active:scale-90",
        shown ? "text-primary" : "text-muted-foreground",
        className
      )}
    >
      <Heart className={cn("size-5", shown && "fill-current")} aria-hidden />
    </button>
  );
}
