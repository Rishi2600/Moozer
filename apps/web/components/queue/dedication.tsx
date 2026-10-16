import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

// The adder's note on a song ("For Sam's birthday 🎂"), in quotes with a heart.
export function Dedication({ text, className }: { text: string | null; className?: string }) {
  if (!text) return null;
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5 text-orange-deep", className)}>
      <Heart className="size-[1em] shrink-0 fill-current" aria-hidden />
      <span className="truncate">
        <span className="sr-only">Dedication: </span>“{text}”
      </span>
    </span>
  );
}
