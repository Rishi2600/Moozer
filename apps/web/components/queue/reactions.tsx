"use client";

import { REACTIONS, type Reaction } from "@moozer/protocol/messages";
import { useEffect, useRef, useState } from "react";

import { useLive } from "@/components/space/live";
import { cn } from "@/lib/utils";

const NAMES: Record<Reaction, string> = { "🔥": "fire", "❤️": "love", "🙌": "raised hands", "💃": "dancing", "😂": "laughing", "😮": "wow" };
const MAX_ON_SCREEN = 30; // a room mashing 🔥 stays readable (and cheap)

// Tap to react to the playing song; everyone in the room sees it float up.
export function ReactionBar({ className }: { className?: string }) {
  const { status, react } = useLive();
  const disabled = status !== "live";
  return (
    <div role="group" aria-label="React to this song" className={cn("flex items-center gap-1.5", className)}>
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          disabled={disabled}
          onClick={() => react(emoji)}
          aria-label={`React with ${NAMES[emoji]}`}
          title={disabled ? "Reactions are back once you're connected" : undefined}
          className="flex size-11 items-center justify-center rounded-full bg-cream-subtle text-xl transition-transform outline-none hover:bg-cream-container focus-visible:ring-3 focus-visible:ring-primary/30 active:scale-90 disabled:opacity-40 sm:size-10"
        >
          <span aria-hidden>{emoji}</span>
        </button>
      ))}
    </div>
  );
}

type Floating = { key: number; emoji: Reaction; name: string | null; left: number; sway: number };

// Reactions rising over the video. Decorative: hidden from screen readers so
// a busy room doesn't drown out everything else.
export function ReactionLayer({ size = "md" }: { size?: "md" | "lg" }) {
  const { onReaction } = useLive();
  const [items, setItems] = useState<Floating[]>([]);
  const nextKey = useRef(0);

  useEffect(
    () =>
      onReaction(({ emoji, from }) => {
        const item: Floating = {
          key: nextKey.current++,
          emoji,
          name: from ? from.name.split(" ")[0] : null, // your own go up unlabelled
          left: 8 + Math.random() * 80,
          sway: Math.round((Math.random() - 0.5) * 60),
        };
        setItems((current) => [...current.slice(-(MAX_ON_SCREEN - 1)), item]);
      }),
    [onReaction]
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {items.map((item) => (
        // The outer span centres on its spot; the inner one animates (its transform would undo the centring).
        <span key={item.key} style={{ left: `${item.left}%` }} className="absolute bottom-[8%] -translate-x-1/2">
          <span
            onAnimationEnd={() => setItems((current) => current.filter((i) => i.key !== item.key))}
            style={{ "--sway": `${item.sway}px` } as React.CSSProperties}
            className={cn(
              "flex flex-col items-center gap-1 motion-safe:animate-reaction-rise motion-reduce:animate-reaction-fade",
              size === "lg" ? "text-7xl" : "text-4xl"
            )}
          >
            <span className="drop-shadow-md">{item.emoji}</span>
            {item.name && (
              <span className={cn("rounded-full bg-inverse-surface/80 px-2 py-0.5 text-inverse-on-surface", size === "lg" ? "text-title-sm" : "text-label-sm")}>
                {item.name}
              </span>
            )}
          </span>
        </span>
      ))}
    </div>
  );
}
