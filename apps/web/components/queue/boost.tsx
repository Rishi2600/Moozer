"use client";

import { Zap } from "lucide-react";
import { useEffect, useState } from "react";

import { LocalTime } from "@/components/local-time";
import { BOOST_VOTES } from "@/lib/queue/boost";
import { cn } from "@/lib/utils";

// True once the boost is back; flips by itself at readyAt.
export function useBoostReady(readyAt: Date | null) {
  const at = readyAt?.getTime() ?? null;
  const [passed, setPassed] = useState<number | null>(null); // the readyAt that has gone by
  useEffect(() => {
    if (at === null) return;
    const timer = setTimeout(() => setPassed(at), Math.max(0, at - Date.now()));
    return () => clearTimeout(timer);
  }, [at]);
  return at === null || passed === at;
}

export function BoostButton({ title, className, ...props }: React.ComponentProps<"button"> & { title: string }) {
  return (
    <button
      type="button"
      aria-label={`Boost ${title} (+${BOOST_VOTES} votes)`}
      title={`Boost: +${BOOST_VOTES} votes`}
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-xl border border-amber-bright/50 bg-amber-bright/15 text-on-secondary-container transition-transform hover:bg-amber-bright/30 active:scale-[0.94] disabled:opacity-50",
        className
      )}
      {...props}
    >
      <Zap className="size-4 fill-current" aria-hidden />
    </button>
  );
}

// "⚡ +3 Sam" on a boosted song. Re-pops whenever another boost lands.
export function BoostChip({ names, className }: { names: string[]; className?: string }) {
  if (names.length === 0) return null;
  const firstNames = names.map((n) => n.split(" ")[0]);
  const who = firstNames.length > 2 ? `${firstNames.slice(0, 2).join(", ")} +${firstNames.length - 2}` : firstNames.join(" & ");
  return (
    <span
      key={names.length}
      title={`Boosted by ${names.join(", ")}`}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-bright/20 px-2 py-0.5 text-label-sm whitespace-nowrap text-on-secondary-container tabular-nums animate-in zoom-in-50 duration-500",
        className
      )}
    >
      <Zap className="size-3 fill-current" aria-hidden />+{names.length * BOOST_VOTES}
      <span className="sr-only">votes from boosts by</span>
      <span className="max-sm:sr-only">{who}</span>
    </span>
  );
}

// Queue header: whether your boost is ready, or when it's back.
export function BoostStatus({ ready, readyAt }: { ready: boolean; readyAt: Date | null }) {
  return (
    <span className="flex items-center gap-1 text-body-sm text-muted-foreground">
      <Zap className={cn("size-4", ready ? "fill-amber-bright text-amber-bright" : "text-faint-foreground")} aria-hidden />
      {ready || !readyAt ? (
        <span>
          Boost ready <span className="max-sm:hidden">· +{BOOST_VOTES} votes</span>
        </span>
      ) : (
        <span>
          Boost back at <LocalTime date={readyAt} />
        </span>
      )}
    </span>
  );
}
